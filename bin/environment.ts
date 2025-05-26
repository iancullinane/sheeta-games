#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
// import { SheetaBackendStack } from '../lib/sheeta-backend-stack';

import { Foundation } from '../lib/foundation';
import { LambdaEndpoint } from '../lib/lambda-endpoint';
import { SecureGatewayEndpointStack } from '../lib/secure-gateway-endpoint';

var mainConfig = {
  "name": "sheeta",
  "network": {
    "domains": [
      {
        "name": "sheeta.cloud"
      }
    ]
  }
}


const app = new cdk.App();

const defaultTags = {
  Environment: 'dev',
  Project: 'sheeta',
};

// These tags will be inherited by all child stacks and constructs
// To use them in Foundation.ts or other stacks, you can access them with:
// cdk.Tags.of(scope).tagValues('Environment') 
// cdk.Tags.of(scope).tagValues('Project')
cdk.Tags.of(app).add('Environment', defaultTags.Environment);
cdk.Tags.of(app).add('Project', defaultTags.Project);

var foundation = new Foundation(app, 'FoundationStack', {
  network: mainConfig.network,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});



// new SecureGatewayEndpointStack(app, 'SecureGatewayEndpoint-Sheeta', {
//   projectName: mainConfig.name,
//   hostedZone: foundation.hostedZones.get(mainConfig.network.domains[0].name),
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION
//   }
// });

new LambdaEndpoint(app, 'SheetaGamesStack', {
  projectName: mainConfig.name,
  domain: foundation.hostedZones.get(mainConfig.network.domains[0].name),
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});