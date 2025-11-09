#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
// import { SheetaBackendStack } from '../lib/sheeta-backend-stack';

import { Foundation } from "../lib/foundation";
import { LambdaEndpoint } from "../lib/lambda-endpoint";
import { SecureGatewayEndpointStack } from "../lib/secure-gateway-endpoint";
import { GodotAssetsStack } from "../lib/storage/godot-assets-stack";
import { SheetaComputeStack } from "../lib/compute/sheeta-compute-stack";

var mainConfig = {
  name: "adventurebrave",
  network: {
    domains: [
      {
        name: "adventurebrave.com",
      },
    ],
  },
};

const app = new cdk.App();

const defaultTags = {
  Environment: "dev",
  Project: "adventurebrave",
};

// These tags will be inherited by all child stacks and constructs
// To use them in Foundation.ts or other stacks, you can access them with:
// cdk.Tags.of(scope).tagValues('Environment')
// cdk.Tags.of(scope).tagValues('Project')
cdk.Tags.of(app).add("Environment", defaultTags.Environment);
cdk.Tags.of(app).add("Project", defaultTags.Project);

// Setup initial environment config and so on
var foundation = new Foundation(app, "FoundationStack", {
  network: mainConfig.network,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Option 1: Get hosted zone directly by name (more reliable than index-based access)
new LambdaEndpoint(app, "SheetaGamesStack", {
  projectName: mainConfig.name,
  domain: foundation.hostedZones.get("adventurebrave.com"), // Use explicit domain name
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});



// 





// Option 2: Use the new domainName parameter to look up the hosted zone
// This approach doesn't require the Foundation stack reference
/*
new LambdaEndpoint(app, "SheetaGamesEndpoint", {
  projectName: mainConfig.name,
  domainName: "adventurebrave.com", // The domain name to look up
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
*/

// Add Godot assets storage stack
new GodotAssetsStack(app, "GodotAssetsStack", {
  projectName: mainConfig.name,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Add compute stack with ALB and EC2
new SheetaComputeStack(app, "SheetaComputeStack", {
  projectName: mainConfig.name,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
