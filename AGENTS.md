# AGENTS.md

These are all relevant commands to working with CDK.

## Commands

```bash
npm run build           # tsc compile
npm run watch           # tsc -w
npm run test            # jest
npx cdk list             # list all stacks
npx cdk synth <stack>     # emit synthesized CloudFormation for one stack
npx cdk diff <stack>      # compare deployed stack vs current code
npx cdk deploy <stack>    # deploy one stack
npx cdk destroy <stack>   # tear down one stack
```

## Architecture

This is a CDK (TypeScript) app, not an application service. `bin/environment.ts` is the single entrypoint that composes independent stacks from constructs under `lib/`. When adding infrastructure, add a construct/stack under the relevant `lib/` subfolder, then instantiate it in `bin/environment.ts`. 

## Conventions

When a stack has `CfnOutput` objects, place a comment above the `new` call listing its export keys, not values.

Above each stack's `new` call in `bin/environment.ts`, also list the resources it provisions, one per constructor/class used inside the stack (e.g. `route53.HostedZone`, `iam.Role`). Where a stack exposes a resource via a `public readonly` property, note that too, since it signals the resource is meant to be consumed by other stacks/constructs.

# Rules

Never run `cdk deploy` for any reason.
