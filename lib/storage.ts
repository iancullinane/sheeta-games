import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";

export interface Repository {
  name: string;
}

export interface StorageConfig {
  repositories: Repository[];
}

export interface StorageProps extends StackProps, StorageConfig {}

export class Storage extends Stack {
  public readonly repositories: Map<string, ecr.IRepository> = new Map();

  constructor(scope: Construct, id: string, props: StorageProps) {
    super(scope, id, props);

    for (const repo of props.repositories) {
      const repository = new ecr.Repository(this, `${repo.name}-repo`, {
        repositoryName: repo.name,
      });
      this.repositories.set(repo.name, repository);
    }
  }
}
