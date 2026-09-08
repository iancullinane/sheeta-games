import { CfnOutput, Fn, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface Domain {
  name: string;
}

export interface NetworkConfig {
  domains: Domain[];
}

export interface VpcConfig {
  maxAzs: number;
  natGateways: number;
}

export interface FoundationConfig {
  network: NetworkConfig;
  vpc: VpcConfig;
}

export interface FoundationProps extends StackProps, FoundationConfig {}

export class Foundation extends Stack {
  public readonly hostedZones: Map<string, route53.IHostedZone> = new Map();
  // wildcard ACM cert per domain — a shared, reusable TLS primitive alongside the
  // zone. Apps' ALBs auto-discover it by host, so nothing needs to import this ref.
  public readonly certificates: Map<string, acm.ICertificate> = new Map();
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: FoundationProps) {
    super(scope, id, props);

    // Create hosted zones for each domain
    for (const domain of props.network.domains) {
      const hostedZone = new route53.HostedZone(this, `${domain.name}-zone`, {
        zoneName: domain.name,
      });
      this.hostedZones.set(domain.name, hostedZone);

      new CfnOutput(this, `NSRecord`, {
        value: Fn.join(",", hostedZone.hostedZoneNameServers || []),
        description: `Name Servers for ${hostedZone.zoneName}`,
      });

      // Wildcard TLS cert for the domain, DNS-validated against the zone we just
      // created (CDK writes the ACM validation records and the stack blocks until
      // issued). `*.domain` covers every one-label subdomain (prisoner., app., …);
      // the SAN adds the apex. Regional (this stack's region) — right for ALBs; a
      // CloudFront edge would need a separate us-east-1 cert. App ALBs pick this up
      // via the LB controller's cert auto-discovery — no cross-stack ref needed.
      const certificate = new acm.Certificate(this, `${domain.name}-cert`, {
        domainName: `*.${domain.name}`,
        subjectAlternativeNames: [domain.name],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
      this.certificates.set(domain.name, certificate);

      new CfnOutput(this, `CertificateArn`, {
        value: certificate.certificateArn,
        description: `Wildcard ACM cert ARN for ${domain.name}`,
      });
    }

    // This is saying 'you can get a jwt from the url, and sts will
    // be an "audience" member which accepts the result
    const githubOidcProvider = new iam.OpenIdConnectProvider(
      this,
      `GithubOidcProvider`,
      {
        url: "https://token.actions.githubusercontent.com",
        // Add this in later, but it needs command line invocations
        // thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
        clientIds: ["sts.amazonaws.com"],
      },
    );

    const githubActionsDeploymentRole = new iam.Role(
      this,
      `GithubActionsDeploymentUser`,
      {
        assumedBy: new iam.WebIdentityPrincipal(
          githubOidcProvider.openIdConnectProviderArn,
          {
            StringLike: {
              "token.actions.githubusercontent.com:sub": "repo:iancullinane/*",
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            },
          },
        ),
        roleName: "iancullinane-sheeta-games-role",
        inlinePolicies: {
          "iancullinane-sheeta-games-policy": new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["*"],
                resources: ["*"],
              }),
            ],
          }),
        },
      },
    );

    this.vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: props.vpc.maxAzs,
      natGateways: props.vpc.natGateways,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: "private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    new CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
      description: "VPC ID for the environment",
    });
  }
}
