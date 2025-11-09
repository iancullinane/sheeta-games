# Sheeta Games Environment

CDK infrastructure for Sheeta Games project.

## Stacks

### SheetaComputeStack
Simple compute stack with ALB, EC2 instance, and target group. The EC2 instance runs a basic HTTP server that responds with "sheeta".

**Deploy:**
```bash
npx cdk deploy SheetaComputeStack
```

**Destroy:**
```bash
npx cdk destroy SheetaComputeStack
```

**Resources:**
- VPC with 2 AZs (no NAT gateways for cost savings)
- t3.micro EC2 instance with Python HTTP server
- Application Load Balancer
- Target Group with health checks

### Other Stacks
- `FoundationStack` - Route53 hosted zones
- `SheetaGamesStack` - Lambda endpoints
- `GodotAssetsStack` - S3 bucket for game assets

## Useful Commands

* `npm run build` - compile typescript to js
* `npm run watch` - watch for changes and compile
* `npm run test` - perform the jest unit tests
* `npx cdk deploy <stack-name>` - deploy specific stack
* `npx cdk destroy <stack-name>` - tear down specific stack
* `npx cdk diff <stack-name>` - compare deployed stack with current state
* `npx cdk synth <stack-name>` - emits the synthesized CloudFormation template
* `npx cdk list` - list all stacks
