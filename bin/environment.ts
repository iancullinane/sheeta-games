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
new Storage(app, "StorageStack", {
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
new Database(app, "DatabaseStack", {
  ...config.database,
  vpc: foundation.vpc,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// The EKS "platform" stack: cluster + admin access (node group in Step 1c).
// Stack outputs:
// - ClusterName
// - UpdateKubeconfigCommand
// - OidcProviderArn
// Resources:
// - eks.Cluster (control plane; private-subnet ENIs, public+private endpoint,
//   defaultCapacity 0 — no nodes yet) -> exposed as public readonly `cluster`
// - eks.AccessEntry (admin principal -> AmazonEKSClusterAdminPolicy, cluster scope)
// - (managed node group lands in Step 1c)
// ExternalDNS (Step 3c) manages records in the app's hosted zone — pull it from
// Foundation's exported map (created from config.foundation.network.domains).
const appZone = foundation.hostedZones.get("adventurebrave.com");
if (!appZone) {
  throw new Error("hosted zone adventurebrave.com not found in FoundationStack");
}

new Platform(app, "PlatformStack", {
  ...config.platform,
  vpc: foundation.vpc,
  hostedZone: appZone,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
