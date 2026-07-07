import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
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

test("scaffold: synthesizes, echoes the configured cluster name, no cluster yet", () => {
  const app = new cdk.App();
  const stack = new Platform(app, "TestPlatformStack", {
    vpc: testVpc(app),
    clusterName: "test-cluster",
    kubernetesVersion: "1.31",
    nodeInstanceType: "t4g.small",
    nodeCount: { min: 1, desired: 2, max: 3 },
    adminPrincipalArn: "arn:aws:iam::123456789012:role/test-admin",
  });

  const template = Template.fromStack(stack);

  // Config plumbing proven end-to-end via an output...
  template.hasOutput("ClusterName", { Value: "test-cluster" });
  // ...and the scaffold has created no EKS resources yet (that's Step 1b).
  template.resourceCountIs("AWS::EKS::Cluster", 0);
});
