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

test("creates a DNS-validated wildcard cert (+ apex SAN) for each domain", () => {
  const app = new cdk.App();
  const stack = new Foundation(app, "TestFoundationCertStack", {
    network: {
      domains: [{ name: "example.com" }],
    },
    vpc: {
      maxAzs: 2,
      natGateways: 1,
    },
  });

  const template = Template.fromStack(stack);

  // one wildcard cert per domain, DNS-validated, also covering the apex via SAN —
  // reusable by any app's ALB (auto-discovered) and independent of PlatformStack.
  template.hasResourceProperties("AWS::CertificateManager::Certificate", {
    DomainName: "*.example.com",
    SubjectAlternativeNames: ["example.com"],
    ValidationMethod: "DNS",
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
