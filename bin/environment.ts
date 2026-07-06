#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { Foundation } from "../lib/foundation";
import { Storage } from "../lib/storage";
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
// Resources:
// - route53.HostedZone (one per domain in config.foundation.network.domains)
//   -> exposed as public readonly `hostedZones: Map<string, IHostedZone>`
// - iam.OpenIdConnectProvider (GitHub Actions OIDC trust)
// - iam.Role (GitHub Actions deployment role, assumed via the OIDC provider)
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
