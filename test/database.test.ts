import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Database } from "../lib/database";

test("creates an RDS Postgres instance, a bastion, and ingress from the bastion", () => {
  const app = new cdk.App();
  const vpcStack = new cdk.Stack(app, "TestVpcStack");
  const vpc = new ec2.Vpc(vpcStack, "TestVpc", {
    maxAzs: 2,
    natGateways: 1,
    subnetConfiguration: [
      {
        name: "public",
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: "private",
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
    ],
  });

  const stack = new Database(app, "TestDatabaseStack", {
    vpc,
    databaseName: "sheetagames",
    masterUsername: "postgres",
    destroyOnDelete: true,
  });

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::RDS::DBInstance", {
    Engine: "postgres",
    EngineVersion: Match.stringLikeRegexp("^17"),
    DBInstanceClass: "db.t4g.micro",
    DBName: "sheetagames",
  });

  template.resourceCountIs("AWS::EC2::Instance", 1);

  template.hasResourceProperties("AWS::EC2::SecurityGroupIngress", {
    FromPort: 5432,
    ToPort: 5432,
    IpProtocol: "tcp",
    SourceSecurityGroupId: Match.anyValue(),
  });
});

test("tears down the RDS instance when destroyOnDelete is true", () => {
  const app = new cdk.App();
  const vpcStack = new cdk.Stack(app, "TestVpcStackDestroyTrue");
  const vpc = new ec2.Vpc(vpcStack, "TestVpc", {
    maxAzs: 2,
    natGateways: 1,
    subnetConfiguration: [
      {
        name: "public",
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: "private",
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
    ],
  });

  const stack = new Database(app, "TestDatabaseStackDestroyTrue", {
    vpc,
    databaseName: "sheetagames",
    masterUsername: "postgres",
    destroyOnDelete: true,
  });

  const template = Template.fromStack(stack);

  template.hasResource("AWS::RDS::DBInstance", {
    DeletionPolicy: "Delete",
    Properties: Match.objectLike({
      DeletionProtection: false,
    }),
  });
});

test("retains the RDS instance when destroyOnDelete is true", () => {
  const app = new cdk.App();
  const vpcStack = new cdk.Stack(app, "TestVpcStackDestroyFalse");
  const vpc = new ec2.Vpc(vpcStack, "TestVpc", {
    maxAzs: 2,
    natGateways: 1,
    subnetConfiguration: [
      {
        name: "public",
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: "private",
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
    ],
  });

  const stack = new Database(app, "TestDatabaseStackDestroyFalse", {
    vpc,
    databaseName: "sheetagames",
    masterUsername: "postgres",
    destroyOnDelete: true,
  });

  const template = Template.fromStack(stack);

  template.hasResource("AWS::RDS::DBInstance", {
    DeletionPolicy: "Delete",
    Properties: Match.objectLike({
      DeletionProtection: false,
    }),
  });
});
