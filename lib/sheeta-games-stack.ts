import { LambdaIntegration, MethodLoggingLevel, RestApi } from "aws-cdk-lib/aws-apigateway"
import { PolicyStatement } from "aws-cdk-lib/aws-iam"
import { Function, Runtime, AssetCode, Code } from "aws-cdk-lib/aws-lambda"
import { Duration, Stack, StackProps } from "aws-cdk-lib"
import s3 = require("aws-cdk-lib/aws-s3")
import { Construct } from "constructs"
import * as cdk from 'aws-cdk-lib';
import { ApiGatewayToCloudwatchLogs } from './roles/ApiGatewayToCloudwatchLogs'
import { SheetaNetwork } from "./networking/sheeta-network"


interface SheetaGamesProps extends StackProps {
    functionName: string
    bucketName: string
}

export class SheetaGames extends Stack {
    private restApi: RestApi
    private lambdaFunction: Function
    private bucket: s3.Bucket

    constructor(scope: Construct, id: string, props: SheetaGamesProps) {
        super(scope, id, props)
        

        
        new SheetaNetwork(this, 'SheetaNetwork', {
            domainName: 'sheeta.cloud'
        })

        this.bucket = new s3.Bucket(this, props.bucketName)

        // Create the CloudWatch Logs role
        new ApiGatewayToCloudwatchLogs(this, 'ApiGatewayCloudWatchRole')

        this.restApi = new RestApi(this, this.stackName + "RestApi", {
            deployOptions: {
                stageName: "beta",
                metricsEnabled: true,
                loggingLevel: MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
            }
        })

        const lambdaPolicy = new PolicyStatement()
        lambdaPolicy.addActions("s3:ListBucket")
        lambdaPolicy.addActions("s3:getBucketLocation")
        lambdaPolicy.addResources(this.bucket.bucketArn)


        this.lambdaFunction = new Function(this, 'HelloHandler', {
            runtime: Runtime.PROVIDED_AL2023,
            code: Code.fromAsset('lib/functions/build/function.zip'),
            handler: 'main',
        });

        this.lambdaFunction.addToRolePolicy(lambdaPolicy)

        this.restApi.root.addMethod("GET", new LambdaIntegration(this.lambdaFunction, {}))

        // Add output for the API Gateway URL
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: this.restApi.url,
            description: 'API Gateway URL'
        });
    }
}