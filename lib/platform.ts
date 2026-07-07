import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

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
  constructor(scope: Construct, id: string, props: PlatformProps) {
    super(scope, id, props);

    // Step 1a scaffold: config plumbing only. The EKS cluster, managed node
    // group, and access entries arrive in Steps 1b–1c. For now we prove the
    // config flows through to the stack by surfacing the intended cluster name.
    new CfnOutput(this, "ClusterName", {
      value: props.clusterName,
      description: "Name the EKS cluster will be created with (Step 1b)",
    });
  }
}
