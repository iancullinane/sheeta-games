# Sheeta Games Environment

CDK infrastructure for Sheeta Games project.

## Architecture

The infrastructure follows a layered approach:
- **Foundation Layer**: Route53 hosted zones, shared API Gateway
- **Service Layer**: Individual services (Lambda, EC2, etc.) that use foundation resources
- **Storage Layer**: S3 buckets and data storage

## Stacks

### ApiGatewayFoundation
Shared API Gateway that all services can use. Deploy this first as other stacks depend on it.

**Deploy:**
```bash
npx cdk deploy ApiGatewayFoundation
```

**Destroy:**
```bash
npx cdk destroy ApiGatewayFoundation
```

**Resources:**
- API Gateway REST API with CloudWatch logging
- Exported outputs for cross-stack references (API ID, root resource ID)

### SheetaGamesStack
Lambda function endpoint attached to the shared API Gateway at `/hello`.

**Deploy:**
```bash
npx cdk deploy SheetaGamesStack
```

**Destroy:**
```bash
npx cdk destroy SheetaGamesStack
```

**Resources:**
- Lambda function (Go runtime)
- API Gateway route integration

### SheetaComputeStack
Compute stack with ALB, EC2 instance, and target group. The EC2 instance runs a basic HTTP server that responds with "sheeta".

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
- `GodotAssetsStack` - S3 bucket for game assets

## Deployment Order

1. `FoundationStack` (if using Route53)
2. `ApiGatewayFoundation` (shared API Gateway)
3. All other stacks (can be deployed in any order)

## Useful Commands

* `npm run build` - compile typescript to js
* `npm run watch` - watch for changes and compile
* `npm run test` - perform the jest unit tests
* `npx cdk deploy <stack-name>` - deploy specific stack
* `npx cdk destroy <stack-name>` - tear down specific stack
* `npx cdk diff <stack-name>` - compare deployed stack with current state
* `npx cdk synth <stack-name>` - emits the synthesized CloudFormation template
* `npx cdk list` - list all stacks

## Adding New Routes to API Gateway

To add a new route (e.g., EC2, S3, ECS endpoint):

1. Create a new stack in the appropriate domain folder (`lib/compute/`, `lib/storage/`, etc.)
2. Import `ApiGatewayFoundation` in `bin/environment.ts`
3. Pass `apiGateway.restApi` to your new stack
4. Use `restApi.root.resourceForPath("/your-route")` to create your route
