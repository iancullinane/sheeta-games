import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
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

function platformStack(): cdk.Stack {
  const app = new cdk.App();
  return new Platform(app, "TestPlatformStack", {
    vpc: testVpc(app),
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
