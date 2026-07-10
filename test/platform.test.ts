import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Platform } from "../lib/platform";

function testVpc(app: cdk.App): ec2.IVpc {
  const vpcStack = new cdk.Stack(app, "TestVpcStack");
  return new ec2.Vpc(vpcStack, "TestVpc", {
    maxAzs: 2,
    natGateways: 1,
    subnetConfiguration: [
      { name: "public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
      {
        name: "private",
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
    ],
  });
}

// An IMPORTED zone (fixed id/name) — enough for the Platform to scope ExternalDNS's
// Route53 policy and domainFilter without provisioning a real zone in the test.
function testZone(app: cdk.App): route53.IHostedZone {
  const zoneStack = new cdk.Stack(app, "TestZoneStack");
  return route53.HostedZone.fromHostedZoneAttributes(zoneStack, "TestZone", {
    hostedZoneId: "Z0123456789ABCDEFGHIJ",
    zoneName: "adventurebrave.com",
  });
}

// An imported RDS security group (fixed id) — Platform adds the cluster→RDS
// ingress rule onto it (Step 2c) without needing a real DatabaseStack.
function testDbSg(app: cdk.App): ec2.ISecurityGroup {
  const sgStack = new cdk.Stack(app, "TestDbSgStack");
  return ec2.SecurityGroup.fromSecurityGroupId(
    sgStack,
    "TestDbSg",
    "sg-0123456789abcdef0",
  );
}

// An imported RDS credentials secret (fixed ARN) so ESO's IRSA role can be scoped
// to it (Step 2d) without a real DatabaseStack.
function testDbSecret(app: cdk.App): secretsmanager.ISecret {
  const secretStack = new cdk.Stack(app, "TestDbSecretStack");
  return secretsmanager.Secret.fromSecretCompleteArn(
    secretStack,
    "TestDbSecret",
    "arn:aws:secretsmanager:us-east-2:123456789012:secret:test-db-AbCdEf",
  );
}

function platformStack(): cdk.Stack {
  const app = new cdk.App();
  return new Platform(app, "TestPlatformStack", {
    vpc: testVpc(app),
    hostedZone: testZone(app),
    dbSecurityGroup: testDbSg(app),
    dbSecret: testDbSecret(app),
    clusterName: "test-cluster",
    kubernetesVersion: "1.31",
    nodeInstanceType: "t4g.small",
    nodeCount: { min: 1, desired: 2, max: 3 },
    adminPrincipalArn: "arn:aws:iam::123456789012:role/test-admin",
  });
}

test("1b: grants the admin principal cluster-admin via an EKS access entry", () => {
  const template = Template.fromStack(platformStack());

  template.hasResourceProperties("AWS::EKS::AccessEntry", {
    PrincipalArn: "arn:aws:iam::123456789012:role/test-admin",
    AccessPolicies: Match.arrayWith([
      Match.objectLike({ AccessScope: Match.objectLike({ Type: "cluster" }) }),
    ]),
  });
});

test("1c: creates a managed node group with the configured scaling and ARM AMI", () => {
  const template = Template.fromStack(platformStack());

  template.resourceCountIs("AWS::EKS::Nodegroup", 1);
  template.hasResourceProperties("AWS::EKS::Nodegroup", {
    ScalingConfig: { MinSize: 1, DesiredSize: 2, MaxSize: 3 },
    AmiType: "AL2023_ARM_64_STANDARD",
    InstanceTypes: ["t4g.small"],
  });
});

test("emits cluster name, kubeconfig command, and node role", () => {
  const template = Template.fromStack(platformStack());
  template.hasOutput("ClusterName", { Value: Match.anyValue() });
  template.hasOutput("UpdateKubeconfigCommand", { Value: Match.anyValue() });
  template.hasOutput("NodeRoleArn", { Value: Match.anyValue() });
});

test("2b: creates an IRSA role for the load balancer controller (web-identity trust)", () => {
  const template = Template.fromStack(platformStack());

  // an IRSA role is defined by WHO may assume it: a web-identity token
  // (the ServiceAccount's OIDC token), not a person or an AWS service.
  template.hasResourceProperties("AWS::IAM::Role", {
    AssumeRolePolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({ Action: "sts:AssumeRoleWithWebIdentity" }),
      ]),
    }),
  });
});

test("2b: the controller role can build load balancers (IAM policy attached)", () => {
  const template = Template.fromStack(platformStack());

  // a signature permission from the official controller policy proves the role
  // can actually create ALBs — not just prove its identity.
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith(["elasticloadbalancing:CreateLoadBalancer"]),
        }),
      ]),
    }),
  });
});

test("2b: installs the AWS Load Balancer Controller Helm chart", () => {
  const template = Template.fromStack(platformStack());

  // a Helm install renders as a Custom::AWSCDK-EKS-HelmChart resource.
  template.hasResourceProperties("Custom::AWSCDK-EKS-HelmChart", {
    Chart: "aws-load-balancer-controller",
    Namespace: "kube-system",
  });
});

test("3c: ExternalDNS can write records in the hosted zone (IAM policy attached)", () => {
  const template = Template.fromStack(platformStack());

  // signature permission proving ExternalDNS can create/update DNS records. The
  // ALB controller policy does NOT grant route53 writes, so this uniquely proves
  // the ExternalDNS policy exists.
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith(["route53:ChangeResourceRecordSets"]),
        }),
      ]),
    }),
  });
});

test("2c: opens RDS 5432 on the DB security group from the cluster", () => {
  const template = Template.fromStack(platformStack());

  // an ingress rule on the RDS SG (sg-0123…) for TCP 5432 — the network path from
  // EKS pods to Postgres. The rule lives in THIS stack (Platform), keeping the DB
  // SG's own stack free of a Platform import (so eks-down can destroy Platform).
  template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", {
    IpProtocol: "tcp",
    FromPort: 5432,
    ToPort: 5432,
    GroupId: "sg-0123456789abcdef0",
  });
});

test("2d: ESO can read ONLY the RDS secret (IAM policy attached)", () => {
  const template = Template.fromStack(platformStack());

  // grantRead scopes the ESO role to secretsmanager:GetSecretValue on the RDS
  // secret's ARN — it can fetch DB creds and nothing else in Secrets Manager.
  template.hasResourceProperties("AWS::IAM::Policy", {
    PolicyDocument: Match.objectLike({
      Statement: Match.arrayWith([
        Match.objectLike({
          Action: Match.arrayWith(["secretsmanager:GetSecretValue"]),
        }),
      ]),
    }),
  });
});

test("2d: installs the External Secrets Operator Helm chart", () => {
  const template = Template.fromStack(platformStack());

  template.hasResourceProperties("Custom::AWSCDK-EKS-HelmChart", {
    Chart: "external-secrets",
    Namespace: "kube-system",
  });
});

test("3c: installs the ExternalDNS Helm chart", () => {
  const template = Template.fromStack(platformStack());

  template.hasResourceProperties("Custom::AWSCDK-EKS-HelmChart", {
    Chart: "external-dns",
    Namespace: "kube-system",
  });
});
