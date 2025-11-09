import {
  LambdaIntegration,
  MethodLoggingLevel,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Function, Runtime, AssetCode, Code } from "aws-cdk-lib/aws-lambda";
import { Stack, StackProps } from "aws-cdk-lib";
import s3 = require("aws-cdk-lib/aws-s3");
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import { ApiGatewayToCloudwatchLogs } from "./roles/ApiGatewayToCloudwatchLogs";
import * as route53 from "aws-cdk-lib/aws-route53";

interface LambdaEndpointProps extends StackProps {
  projectName: string;
  domain?: route53.IHostedZone;
  domainName?: string;
}

export class LambdaEndpoint extends Stack {
  private restApi: RestApi;
  private lambdaFunction: Function;
  private bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: LambdaEndpointProps) {
    super(scope, id, props);

    // Handle domain lookup if domain is not provided but domainName is
    let hostedZone = props.domain;
    if (!hostedZone && props.domainName) {
      try {
        // Look up the hosted zone by name
        hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
          domainName: props.domainName,
        });
      } catch (error) {
        console.warn(
          `Failed to look up hosted zone for domain ${props.domainName}:`,
          error,
        );
      }
    }

    // Create the CloudWatch Logs role
    new ApiGatewayToCloudwatchLogs(this, "ApiGatewayCloudWatchRole");

    this.restApi = new RestApi(this, this.stackName + "RestApi", {
      deployOptions: {
        stageName: "beta",
        metricsEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    // const lambdaPolicy = new PolicyStatement()
    // lambdaPolicy.addActions("s3:ListBucket")
    // lambdaPolicy.addActions("s3:getBucketLocation")
    // lambdaPolicy.addResources(this.bucket.bucketArn)

    this.lambdaFunction = new Function(this, "HelloHandler", {
      runtime: Runtime.PROVIDED_AL2023,
      code: Code.fromAsset("lib/functions/build/function.zip"),
      handler: "main",
    });

    // this.lambdaFunction.addToRolePolicy(lambdaPolicy)

    this.restApi.root.addMethod(
      "GET",
      new LambdaIntegration(this.lambdaFunction, {}),
    );

    // Add output for the API Gateway URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: this.restApi.url,
      description: "API Gateway URL",
    });
  }
}
