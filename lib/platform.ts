import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";
import { KubectlV31Layer } from "@aws-cdk/lambda-layer-kubectl-v31";

export interface NodeCount {
  min: number;
  desired: number;
  max: number;
}

export interface PlatformConfig {
  clusterName: string;
  kubernetesVersion: string;
  nodeInstanceType: string;
  nodeCount: NodeCount;
  adminPrincipalArn: string;
}

export interface PlatformProps extends StackProps, PlatformConfig {
  vpc: ec2.IVpc;
}

export class Platform extends Stack {
  public readonly cluster: eks.Cluster;

  constructor(scope: Construct, id: string, props: PlatformProps) {
    super(scope, id, props);

    // `defaultCapacity: 0` skips the construct's built-in node group so we add
    // one explicitly below (Step 1c) — clearer about instance type, scaling, and
    // subnets. The stable `eks.Cluster` construct creates the cluster through a
    // Lambda-backed custom resource (the KubectlProvider), which is why
    // cluster-level changes flow through CloudFormation.
    //
    // Learning note: `kubectlLayer` must match `kubernetesVersion`. The two move
    // in lockstep — bumping the cluster to 1.32 means a KubectlV32Layer here.
    this.cluster = new eks.Cluster(this, "Cluster", {
      clusterName: props.clusterName,
      version: eks.KubernetesVersion.of(props.kubernetesVersion),
      kubectlLayer: new KubectlV31Layer(this, "KubectlLayer"),
      vpc: props.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0,
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      authenticationMode: eks.AuthenticationMode.API_AND_CONFIG_MAP,
    });

    // Grant the operator principal (from config) cluster-admin via an EKS
    // access entry — the modern replacement for editing the aws-auth ConfigMap.
    this.cluster.grantAccess("AdminAccess", props.adminPrincipalArn, [
      eks.AccessPolicy.fromAccessPolicyName("AmazonEKSClusterAdminPolicy", {
        accessScopeType: eks.AccessScopeType.CLUSTER,
      }),
    ]);

    // Step 1c: managed node group — the EC2 capacity pods actually run on.
    // addNodegroupCapacity auto-creates a node IAM role with three AWS-managed
    // policies: AmazonEKSWorkerNodePolicy, AmazonEKS_CNI_Policy, and
    // AmazonEC2ContainerRegistryReadOnly. That last one grants ECR read on ALL
    // repos in this account (Resource: *) — an identity-based grant — so nodes can
    // pull the prisoner image in M2 with no per-repo wiring or ECR repo policy.
    const nodegroup = this.cluster.addNodegroupCapacity("Nodes", {
      instanceTypes: [new ec2.InstanceType(props.nodeInstanceType)],
      amiType: eks.NodegroupAmiType.AL2023_ARM_64_STANDARD,
      minSize: props.nodeCount.min,
      desiredSize: props.nodeCount.desired,
      maxSize: props.nodeCount.max,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // --- AWS Load Balancer Controller: IRSA identity (Step 2b.1) --------------
    // The controller runs as a Pod but must call AWS APIs to build ALBs, so it
    // needs an AWS identity. IRSA gives it one: a Kubernetes ServiceAccount bound
    // to a scoped IAM role. addServiceAccount() creates BOTH sides + the OIDC
    // trust between them:
    //   - an IAM Role whose trust policy allows sts:AssumeRoleWithWebIdentity ONLY
    //     from this cluster's OIDC provider, ONLY for this exact ServiceAccount
    //   - the Kubernetes ServiceAccount itself (name + namespace below)
    // name/namespace must match what the controller's Helm chart expects (2b.3).
    const albServiceAccount = this.cluster.addServiceAccount(
      "AlbControllerServiceAccount",
      {
        // the ServiceAccount name the AWS LB Controller chart looks for by default
        name: "aws-load-balancer-controller",
        // controllers conventionally run in the kube-system namespace
        namespace: "kube-system",
      },
    );
    // --- 2b.2: give that role the controller's permissions -------------------
    // The IRSA role above can prove its identity but has NO permissions yet.
    // Attach the OFFICIAL AWS Load Balancer Controller IAM policy, vendored from
    // the v2.13.0 release into lib/alb-controller-iam-policy.json (pinned to match
    // the Helm chart in 2b.3). It grants the exact elasticloadbalancing / ec2 /
    // acm / wafv2 / ... actions the controller needs to build + manage ALBs.
    // Keep this JSON and the chart version in lockstep on any controller upgrade.
    const albControllerPolicy = require("./alb-controller-iam-policy.json");
    albServiceAccount.role.attachInlinePolicy(
      new iam.Policy(this, "AlbControllerPolicy", {
        document: iam.PolicyDocument.fromJson(albControllerPolicy),
      }),
    );
    // --- 2b.3: install the AWS Load Balancer Controller (Helm) ---------------
    // addHelmChart makes CDK run `helm upgrade --install` (via the kubectl
    // provider) during deploy. This chart IS the controller Pod — the process
    // that watches Ingress objects and builds ALBs. The critical value is
    // serviceAccount.create=false + name=..., which makes the Pod run as OUR
    // IRSA ServiceAccount (2b.1/2b.2) so it inherits the ALB-building IAM role.
    // Chart 1.13.0 ships controller app v2.13.0 (matches the vendored IAM policy).
    const albController = this.cluster.addHelmChart("AlbController", {
      chart: "aws-load-balancer-controller",
      repository: "https://aws.github.io/eks-charts",
      release: "aws-load-balancer-controller",
      namespace: "kube-system",
      version: "1.13.0",
      values: {
        // the controller must know which cluster it manages
        clusterName: this.cluster.clusterName,
        // Give the controller its VPC + region directly so it does NOT auto-
        // discover them from node instance metadata (IMDS), which times out from
        // inside a Pod. (IRSA still supplies credentials via the web-identity
        // token — this only avoids the failing VPC/region metadata lookup.)
        region: this.region,
        vpcId: props.vpc.vpcId,
        // reuse the IRSA ServiceAccount from 2b.1 (not a permission-less new one)
        serviceAccount: { create: false, name: "aws-load-balancer-controller" },
      },
    });
    // install the chart only after the ServiceAccount and nodes exist
    albController.node.addDependency(albServiceAccount);
    albController.node.addDependency(nodegroup);

    new CfnOutput(this, "ClusterName", {
      value: this.cluster.clusterName,
      description: "EKS cluster name",
    });
    new CfnOutput(this, "NodeRoleArn", {
      value: nodegroup.role.roleArn,
      description: "IAM role attached to the managed node group",
    });
    new CfnOutput(this, "UpdateKubeconfigCommand", {
      value: `aws eks update-kubeconfig --name ${this.cluster.clusterName} --region ${this.region}`,
      description: "Point kubectl at the cluster",
    });
    new CfnOutput(this, "OidcProviderArn", {
      value: this.cluster.openIdConnectProvider.openIdConnectProviderArn,
      description: "IAM OIDC provider ARN (for IRSA in Milestone 2)",
    });
  }
}
