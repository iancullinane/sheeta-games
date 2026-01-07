import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { ApiGatewayToCloudwatchLogs } from "../roles/ApiGatewayToCloudwatchLogs";

interface ApiGatewayFoundationProps extends StackProps {
  projectName: string;
}

export class ApiGatewayFoundation extends Stack {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayFoundationProps) {
    super(scope, id, props);

    new ApiGatewayToCloudwatchLogs(this, "ApiGatewayCloudWatchRole");

    this.restApi = new apigateway.RestApi(this, "SheetaApi", {
      restApiName: `${props.projectName}-api`,
      description: `Shared API Gateway for ${props.projectName}`,
      deployOptions: {
        stageName: "beta",
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    new CfnOutput(this, "ApiUrl", {
      value: this.restApi.url,
      description: "Shared API Gateway URL",
      exportName: `${props.projectName}-api-url`,
    });

    new CfnOutput(this, "ApiId", {
      value: this.restApi.restApiId,
      description: "API Gateway ID for cross-stack references",
      exportName: `${props.projectName}-api-id`,
    });

    new CfnOutput(this, "ApiRootResourceId", {
      value: this.restApi.restApiRootResourceId,
      description: "API Gateway root resource ID",
      exportName: `${props.projectName}-api-root-resource-id`,
    });
  }
}

