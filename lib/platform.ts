import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "aws-cdk-lib/aws-eks";
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

    // Step 1b: control plane only. `defaultCapacity: 0` means no node group
    // yet — that arrives in Step 1c. The stable `eks.Cluster` construct creates
    // the cluster through a Lambda-backed custom resource (the KubectlProvider),
    // which is why cluster-level changes flow through CloudFormation.
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

    new CfnOutput(this, "ClusterName", {
      value: this.cluster.clusterName,
      description: "EKS cluster name",
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
