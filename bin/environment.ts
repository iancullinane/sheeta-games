#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { Foundation } from "../lib/foundation";
import { Storage } from "../lib/storage";
import { Database } from "../lib/database";
import { Platform } from "../lib/platform";
import { loadConfig } from "../lib/config";

const config = loadConfig();

const app = new cdk.App();

// These tags will be inherited by all child stacks and constructs
// To use them in Foundation.ts or other stacks, you can access them with:
// cdk.Tags.of(scope).tagValues('Environment')
// cdk.Tags.of(scope).tagValues('Project')
cdk.Tags.of(app).add("Environment", config.tags.Environment);
cdk.Tags.of(app).add("Project", config.tags.Project);

// Setup initial environment config and so on
// Stack outputs:
// - NSRecord
// - VpcId
// Resources:
// - route53.HostedZone (one per domain in config.foundation.network.domains)
//   -> exposed as public readonly `hostedZones: Map<string, IHostedZone>`
// - iam.OpenIdConnectProvider (GitHub Actions OIDC trust)
// - iam.Role (GitHub Actions deployment role, assumed via the OIDC provider)
// - ec2.Vpc (public + private-with-egress subnets, per config.foundation.vpc)
//   -> exposed as public readonly `vpc: IVpc`
const foundation = new Foundation(app, "FoundationStack", {
  ...config.foundation,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Resources:
// - ecr.Repository (one per repository in config.storage.repositories)
//   -> exposed as public readonly `repositories: Map<string, IRepository>`
const storage = new Storage(app, "StorageStack", {
  ...config.storage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Stack outputs:
// - DbEndpoint
// - DbPort
// - DbSecretArn
// - BastionInstanceId
// Resources:
// - ec2.SecurityGroup (DB security group; ingress from bastion SG only on 5432)
// - ec2.SecurityGroup (bastion security group)
// - rds.DatabaseInstance (Postgres 17.4, private subnets, generated-secret credentials)
//   -> exposed as public readonly `instance: DatabaseInstance`
//   -> exposed as public readonly `secret: ISecret`
// - iam.Role (bastion role, AmazonSSMManagedInstanceCore)
// - ec2.Instance (SSM-managed bastion host, public subnet)
//   -> exposed as public readonly `bastion: Instance`
const database = new Database(app, "DatabaseStack", {
  ...config.database,
  vpc: foundation.vpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// The EKS "platform" stack: cluster + managed node group + access.
// Step 1a scaffold only — config plumbing + a placeholder output for now.
// Stack outputs:
// - ClusterName
// Resources:
// - (none yet; EKS cluster lands in Step 1b, node group in Step 1c)
const platform = new Platform(app, "PlatformStack", {
  ...config.platform,
  vpc: foundation.vpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
