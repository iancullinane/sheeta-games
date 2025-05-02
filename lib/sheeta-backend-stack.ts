import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class SheetaBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the Lambda function
    const helloFunction = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      code: lambda.Code.fromAsset('lib/functions/build/function.zip'),
      handler: 'main',
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'SheetaApi', {
      restApiName: 'Sheeta Service',
      description: 'This is the Sheeta API'
    });

    // Look up the hosted zone for sheeta.cloud
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: 'sheeta.cloud',
    });

    // Create a certificate for the API Gateway domain
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'api.sheeta.cloud',
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // Create a custom domain name for the API
    const domainName = new apigateway.DomainName(this, 'CustomDomain', {
      domainName: 'api.sheeta.cloud',
      certificate: certificate,
    });

    // Map the custom domain to the API
    new apigateway.BasePathMapping(this, 'ApiMapping', {
      domainName: domainName,
      restApi: api,
    });

    // Create an A record to point to the API Gateway
    new route53.ARecord(this, 'ApiAliasRecord', {
      zone,
      recordName: 'api.sheeta.cloud',
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGateway(api)
      ),
    });

    // Create the Lambda integration and API method
    const integration = new apigateway.LambdaIntegration(helloFunction);
    api.root.addMethod('GET', integration);

    // Add output for the default domain
    new cdk.CfnOutput(this, 'DefaultApiEndpoint', {
      value: api.url,
      description: 'Default API Gateway URL'
    });
  }
}
