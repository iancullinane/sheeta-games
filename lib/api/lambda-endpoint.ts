import {
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

interface LambdaEndpointProps extends StackProps {
  projectName: string;
  restApi: RestApi;
  routePath: string;
}

export class LambdaEndpoint extends Stack {
  public readonly lambdaFunction: Function;

  constructor(scope: Construct, id: string, props: LambdaEndpointProps) {
    super(scope, id, props);

    this.lambdaFunction = new Function(this, "HelloHandler", {
      runtime: Runtime.PROVIDED_AL2023,
      code: Code.fromAsset("lib/functions/build/function.zip"),
      handler: "main",
    });

    const resource = props.restApi.root.resourceForPath(props.routePath);
    
    resource.addMethod(
      "GET",
      new LambdaIntegration(this.lambdaFunction, {}),
    );

    new cdk.CfnOutput(this, "LambdaFunctionName", {
      value: this.lambdaFunction.functionName,
      description: `Lambda function for ${props.routePath}`,
    });

    new cdk.CfnOutput(this, "RoutePath", {
      value: props.routePath,
      description: "API route path for this Lambda",
    });
  }
}

