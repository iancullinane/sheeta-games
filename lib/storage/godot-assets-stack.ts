import { CfnOutput, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

interface GodotAssetsStackProps extends StackProps {
    projectName: string;
}

export class GodotAssetsStack extends Stack {
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: GodotAssetsStackProps) {
        super(scope, id, props);

        // Create the S3 bucket
        this.bucket = new s3.Bucket(this, 'GodotAssetsBucket', {
            bucketName: `${props.projectName}-godot-assets-${this.account}`,
            publicReadAccess: true,
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
            }),
            removalPolicy: RemovalPolicy.RETAIN,
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.HEAD,
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
        });

        // Add bucket policy to allow public read access
        const bucketPolicy = new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            resources: [this.bucket.arnForObjects('*')],
        });

        this.bucket.addToResourcePolicy(bucketPolicy);

        // Output the bucket name and URL
        new CfnOutput(this, 'BucketName', {
            value: this.bucket.bucketName,
            description: 'The name of the S3 bucket for Godot assets',
        });

        new CfnOutput(this, 'BucketUrl', {
            value: this.bucket.bucketWebsiteUrl,
            description: 'The URL of the S3 bucket for Godot assets',
        });
    }
} 