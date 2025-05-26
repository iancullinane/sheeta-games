import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

interface SecureGatewayEndpointProps extends cdk.StackProps {
  projectName: string
  hostedZone?: route53.IHostedZone
}


export class SecureGatewayEndpointStack extends cdk.Stack {

  public readonly HelloLambda: lambda.Function;
  public readonly ApiGateway: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: SecureGatewayEndpointProps) {
    super(scope, id, props);


    const domainName = props.hostedZone!.zoneName!

    // Create a certificate for the API Gateway domain
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(props.hostedZone!),
    });

    // Create API Gateway
    this.ApiGateway = new apigateway.RestApi(this, 'SheetaApi', {
      restApiName: 'Sheeta Service',
      description: 'This is the Sheeta API'
    });

    // Create the Lambda function
    this.HelloLambda = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      code: lambda.Code.fromAsset('lib/functions/build/function.zip'),
      handler: 'main',
    });

    // Create a custom domain name for the API
    const gatewayDomainName = new apigateway.DomainName(this, 'CustomDomain', {
      domainName: domainName,
      certificate: certificate,
    });

    // Map the custom domain to the API
    new apigateway.BasePathMapping(this, 'ApiMapping', {
      domainName: gatewayDomainName,
      restApi: this.ApiGateway,
    });

    // Create an A record to point to the API Gateway
    new route53.ARecord(this, 'ApiAliasRecord', {
      zone: props.hostedZone!,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGateway(this.ApiGateway)
      ),
    });

    // Create the Lambda integration and API method
    const integration = new apigateway.LambdaIntegration(this.HelloLambda);
    this.ApiGateway.root.addMethod('GET', integration);

    // Add output for the default domain
    new cdk.CfnOutput(this, 'DefaultApiEndpoint', {
      value: this.ApiGateway.url,
      description: 'Default API Gateway URL'
    });
  }
}
