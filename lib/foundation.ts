import { CfnOutput, Fn, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";

export interface Domain {
  name: string;
}

export interface NetworkConfig {
  domains: Domain[];
}

export interface FoundationConfig {
  network: NetworkConfig;
}

export interface FoundationProps extends StackProps, FoundationConfig {}

export class Foundation extends Stack {
  public readonly hostedZones: Map<string, route53.IHostedZone> = new Map();

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
  }
}
