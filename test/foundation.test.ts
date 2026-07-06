import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Foundation } from "../lib/foundation";

test("creates a Route53 hosted zone for each configured domain", () => {
  const app = new cdk.App();
  const stack = new Foundation(app, "TestFoundationStack", {
    network: {
      domains: [{ name: "example.com" }],
    },
    vpc: {
      maxAzs: 2,
      natGateways: 1,
    },
  });

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::Route53::HostedZone", {
    Name: "example.com.",
  });
});

test("creates a VPC with the configured number of NAT gateways", () => {
  const app = new cdk.App();
  const stack = new Foundation(app, "TestFoundationVpcStack", {
    network: {
      domains: [{ name: "example.com" }],
    },
    vpc: {
      maxAzs: 2,
      natGateways: 1,
    },
  });

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::EC2::VPC", {
    EnableDnsSupport: true,
  });

  template.resourceCountIs("AWS::EC2::NatGateway", 1);
});
