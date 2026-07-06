import { Stack, StackProps, CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface DatabaseConfig {
  databaseName: string;
  masterUsername: string;
  destroyOnDelete: boolean;
}

export interface DatabaseProps extends StackProps, DatabaseConfig {
  vpc: ec2.IVpc;
}

export class Database extends Stack {
  public readonly instance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.ISecret;
  public readonly bastion: ec2.Instance;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id, props);

    const removalPolicy = props.destroyOnDelete
      ? RemovalPolicy.DESTROY
      : RemovalPolicy.RETAIN;
    console.log(
      "DEBUG destroyOnDelete:",
      props.destroyOnDelete,
      "removalPolicy:",
      removalPolicy,
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc: props.vpc,
      description: "Security group for the RDS Postgres instance",
      allowAllOutbound: true,
    });

    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      "BastionSecurityGroup",
      {
        vpc: props.vpc,
        description: "Security group for the SSM bastion host",
        allowAllOutbound: true,
      },
    );

    dbSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow Postgres access from the bastion",
    );

    this.instance = new rds.DatabaseInstance(this, "Instance", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_9,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MICRO,
      ),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromGeneratedSecret(props.masterUsername),
      databaseName: props.databaseName,
      securityGroups: [dbSecurityGroup],
      multiAz: false,
      publiclyAccessible: false,
      removalPolicy,
      deletionProtection: !props.destroyOnDelete,
    });
    this.secret = this.instance.secret!;

    const bastionRole = new iam.Role(this, "BastionRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore",
        ),
      ],
    });

    this.bastion = new ec2.Instance(this, "Bastion", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.NANO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: bastionSecurityGroup,
      role: bastionRole,
    });

    new CfnOutput(this, "DbEndpoint", {
      value: this.instance.dbInstanceEndpointAddress,
      description: "RDS Postgres endpoint address",
    });
    new CfnOutput(this, "DbPort", {
      value: this.instance.dbInstanceEndpointPort,
      description: "RDS Postgres port",
    });
    new CfnOutput(this, "DbSecretArn", {
      value: this.secret.secretArn,
      description: "Secrets Manager ARN holding the generated DB credentials",
    });
    new CfnOutput(this, "BastionInstanceId", {
      value: this.bastion.instanceId,
      description: "Bastion instance ID for SSM port-forwarding",
    });
  }
}
