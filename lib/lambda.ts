import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export interface LambdaConfig {
  repositoryName: string;
  imageTag: string;
  memorySize: number;
  timeoutSeconds: number;
}

export interface LambdaProps extends StackProps, LambdaConfig {
  vpc: ec2.IVpc;
  dbSecurityGroup: ec2.ISecurityGroup;
  dbSecret: secretsmanager.ISecret;
}

export class Lambda extends Stack {
  public readonly fn: lambda.DockerImageFunction;
  public readonly functionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id, props);

    const repository = ecr.Repository.fromRepositoryName(
      this,
      "PrisonerRepository",
      props.repositoryName,
    );


    const securityGroup = new ec2.SecurityGroup(this, "ServerFunctionSecurityGroup", {
      vpc: props.vpc,
      description: "Security group for the prisoner Lambda function",
      allowAllOutbound: true,
    });

    // allow the lambda to reach the Database
    ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "PrisonerRdsDbSecurityGroup",
      props.dbSecurityGroup.securityGroupId,
      { mutable: true },
    ).addIngressRule(
      ec2.Peer.securityGroupId(securityGroup.securityGroupId),
      ec2.Port.tcp(5432),
      "Prisoner Lambda to RDS Postgres",
    );

    // see lib/database for secret generation
    const databaseUrl = [
      `host=${props.dbSecret.secretValueFromJson("host").unsafeUnwrap()}`,
      `port=${props.dbSecret.secretValueFromJson("port").unsafeUnwrap()}`,
      `user=${props.dbSecret.secretValueFromJson("username").unsafeUnwrap()}`,
      `password=${props.dbSecret.secretValueFromJson("password").unsafeUnwrap()}`,
      `dbname=${props.dbSecret.secretValueFromJson("dbname").unsafeUnwrap()}`,
      "sslmode=require",
      "pool_max_conns=2",
    ].join(" ");


    this.fn = new lambda.DockerImageFunction(this, "DockerFunction", {
      code: lambda.DockerImageCode.fromEcr(repository, {
        tagOrDigest: props.imageTag,
        cmd: ["lambda"],
      }),
      architecture: lambda.Architecture.ARM_64,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [securityGroup],
      memorySize: props.memorySize,
      timeout: Duration.seconds(props.timeoutSeconds),
      environment: {
        DATABASE_URL: databaseUrl,
        PRISONER_STORE: "postgres",
        PRISONER_LOG_FORMAT: "json",
        HOME: "/tmp",
      },
      logGroup: new logs.LogGroup(this, "PrisonerFunctionLogs", {
        retention: logs.RetentionDays.ONE_DAY
      }),

    })

    this.functionUrl = this.fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    })

    new CfnOutput(this, "FunctionName", {
      value: this.fn.functionName,
      description: "Prisoner API Lambda function name",
    });
    new CfnOutput(this, "FunctionUrl", {
      value: this.functionUrl.url,
      description: "Public HTTPS endpoint for the prisoner API",
    });


  }
}
