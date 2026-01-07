import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as opensearchserverless from "aws-cdk-lib/aws-opensearchserverless";
import { Construct } from "constructs";

export interface OracleProps {
  collectionName: string;
  description?: string;
  sourceBucket?: s3.IBucket;
  // dataAccessPrincipals?: iam.IPrincipal[];
}

export class Oracle extends Construct {
  // public readonly bucket: s3.Bucket;
  public readonly collection: opensearchserverless.CfnCollection;
  public readonly index: opensearchserverless.CfnIndex;
  public readonly collectionId: string;
  public readonly collectionArn: string;
  public readonly collectionEndpoint: string;
  public readonly dashboardEndpoint: string;

  constructor(scope: Construct, id: string, props: OracleProps) {
    super(scope, id);

    const collectionName = props.collectionName;
    const collectionType = "VECTORSEARCH";

    const encryptionPolicy = this.createEncryptionPolicy(collectionName);
    const networkPolicy = this.createNetworkPolicy(collectionName);

    // create a new collection, later we will add data into it
    // directly and sync with external sources
    this.collection = this.createCollection(
      collectionName,
      collectionType,
      props.description,
    );

    // Collection depends on encryption policy
    this.collection.addDependency(encryptionPolicy);
    this.collection.addDependency(networkPolicy);

    // populate values needed and exported
    this.collectionId = this.collection.attrId;
    this.collectionArn = this.collection.attrArn;
    this.collectionEndpoint = this.collection.attrCollectionEndpoint;

    // Create index after collection
    this.index = this.createIndex(collectionName);
    this.index.addDependency(this.collection);

    //   this.bucket = new s3.Bucket(this, "KnowledgeBaseBucket", {
    //     bucketName: props?.bucketName || "sheeta-kb-sources",
    //     removalPolicy: props?.removalPolicy || cdk.RemovalPolicy.RETAIN,
    //     autoDeleteObjects: props?.removalPolicy === cdk.RemovalPolicy.DESTROY,
    //     versioned: true,
    //     encryption: s3.BucketEncryption.S3_MANAGED,
    //     blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    //   });

    //     // Export attributes
    this.dashboardEndpoint = this.collection.attrDashboardEndpoint;

    // CloudFormation outputs
    new cdk.CfnOutput(this, "CollectionId", {
      value: this.collectionId,
      description: `OpenSearch Serverless Collection ID`,
    });

    new cdk.CfnOutput(this, "CollectionEndpoint", {
      value: this.collectionEndpoint,
      description: `Collection endpoint for ${collectionName}`,
    });

    new cdk.CfnOutput(this, "DashboardEndpoint", {
      value: this.dashboardEndpoint,
      description: `Dashboard endpoint for ${collectionName}`,
    });
  }

  private createEncryptionPolicy(
    collectionName: string,
  ): opensearchserverless.CfnSecurityPolicy {
    return new opensearchserverless.CfnSecurityPolicy(
      this,
      "EncryptionPolicy",
      {
        name: `${collectionName}-encryption`,
        type: "encryption",
        description: `Encryption policy for ${collectionName}`,
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${collectionName}`],
            },
          ],
          AWSOwnedKey: true,
        }),
      },
    );
  }

  private createNetworkPolicy(
    collectionName: string,
  ): opensearchserverless.CfnSecurityPolicy {
    return new opensearchserverless.CfnSecurityPolicy(this, "NetworkPolicy", {
      name: `${collectionName}-network`,
      type: "network",
      description: `Network policy for ${collectionName}`,
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${collectionName}`],
            },
            {
              ResourceType: "dashboard",
              Resource: [`collection/${collectionName}`],
            },
          ],
          AllowFromPublic: true,
        },
      ]),
    });
  }

  // private createBedrockPolicyDocument(): any {
  //   return {
  //     Version: "2012-10-17",
  //     Statement: [
  //       {
  //         Effect: "Allow",
  //         Principal: {
  //           Service: "bedrock.amazonaws.com",
  //         },
  //         Action: "sts:AssumeRole",
  //       },
  //     ],
  //   };
  // }

  private createCollection(
    collectionName: string,
    collectionType: string,
    description?: string,
  ): opensearchserverless.CfnCollection {
    return new opensearchserverless.CfnCollection(this, "Collection", {
      name: collectionName,
      description: description,
      type: collectionType,
    });
  }

  private createIndex(collectionName: string): opensearchserverless.CfnIndex {
    return new opensearchserverless.CfnIndex(this, "Index", {
      indexName: collectionName,
      collectionEndpoint: this.collectionEndpoint,
      mappings: {
        properties: {
          vector: {
            type: "knn_vector",

            // the properties below are optional
            dimension: 1924,
            // TODO maybe add index true?
            method: {
              name: "hnsw",
              // the properties below are optional
              engine: "faiss",
              spaceType: "l2",
            },
          },
          text: {
            type: "text",
          },
          "text-metadata": {
            type: "text",
          },
        },
      },
      // settings: [],
    });
  }
}
