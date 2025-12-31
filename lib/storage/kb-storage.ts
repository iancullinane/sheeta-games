import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface KnowledgeBaseStorageProps {
  bucketName?: string;
  removalPolicy?: cdk.RemovalPolicy;
}

export class KnowledgeBaseStorage extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: KnowledgeBaseStorageProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, "KnowledgeBaseBucket", {
      bucketName: props?.bucketName || "sheeta-kb-sources",
      removalPolicy: props?.removalPolicy || cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: props?.removalPolicy === cdk.RemovalPolicy.DESTROY,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
  }
}
