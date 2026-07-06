import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Storage } from "../lib/storage";

test("creates an ECR repository for each configured name", () => {
  const app = new cdk.App();
  const stack = new Storage(app, "TestStorageStack", {
    repositories: [{ name: "adventurebrave" }, { name: "sheeta-games" }],
  });

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::ECR::Repository", {
    RepositoryName: "adventurebrave",
  });
  template.hasResourceProperties("AWS::ECR::Repository", {
    RepositoryName: "sheeta-games",
  });
});
