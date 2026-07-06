# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Stacks are independent CloudFormation stacks, not a single monolithic deploy — always target a specific stack name. Deployment order matters for first-time setup:

1. `FoundationStack` (Route53 zones — only needed if using custom domains)
2. `ApiGatewayFoundation` (shared API Gateway — other stacks attach routes to it)
3. Everything else (`SheetaGamesStack`, `SheetaComputeStack`, `GodotAssetsStack`) can deploy in any order once the above exist.

The Go Lambda in `lib/functions/` is deployed from a prebuilt `lib/functions/build/function.zip`/`bootstrap`, not built by the CDK synth step — rebuild it manually (`go build`, produce `bootstrap`, zip it) before deploying `SheetaGamesStack` if `hello.go` changes.

## Architecture

This is a CDK (TypeScript) app, not an application service. `bin/environment.ts` is the single entrypoint that composes independent stacks from constructs under `lib/`. When adding infrastructure, add a construct/stack under the relevant `lib/` subfolder, then instantiate it in `bin/environment.ts`.

**Key pattern — shared API Gateway:** `ApiGatewayFoundation` (`lib/networking/api-gateway-foundation.ts`) creates one REST API that all other API-backed stacks attach routes to via cross-stack construct references (its `restApi` is passed into other stacks' props, not looked up via SSM/exports). See `EXAMPLE_NEW_ROUTE.md` for the exact steps to wire a new stack into it. `lib/api/lambda-endpoint.ts` (`LambdaEndpoint`) is the generic reusable construct for "attach a Lambda to a route on the shared API Gateway" — prefer extending/reusing it over hand-rolling new API Gateway wiring.

**Stack inventory (instantiated in `bin/environment.ts`):**
- `FoundationStack` (`lib/foundation.ts`) — Route53 hosted zones, GitHub Actions OIDC provider + deploy role.
- `ApiGatewayFoundation` — the shared REST API described above.
- `SheetaGamesStack` (`lib/api/lambda-endpoint.ts`) — Go Lambda at `GET /hello`.
- `GodotAssetsStack` (`lib/storage/godot-assets-stack.ts`) — public-read S3 bucket for serving Godot game assets.
- `SheetaComputeStack` (`lib/compute/sheeta-compute-stack.ts`) — VPC (no NAT gateways) + single EC2 instance + ALB; the instance's HTTP server is bootstrapped inline via `UserData`, not a built image.

**Not wired up:** `lib/secure-gateway-endpoint.ts` and `lib/networking/cert.ts` define a custom-domain API Gateway stack and ACM certs, but are never instantiated in `bin/environment.ts`. Check with the user before assuming these are live or should be extended — they may be abandoned or planned-but-unfinished.

**Config:** cross-stack config (domains, project name, tags, per-stack props) lives in `config.yaml` at the repo root, loaded via `loadConfig()` in `lib/config.ts` and passed into `bin/environment.ts`. Convention: the top-level YAML key for a stack's config must match that stack's name (e.g. `foundation` → `Foundation`/`FoundationConfig`). Each stack exports its own `<StackName>Config` interface (the non-`StackProps` fields) from its file; adding a new stack means adding its config interface, one field on `AppConfig` in `lib/config.ts`, and a matching top-level block in `config.yaml` — the loader itself doesn't change.

## Conventions

When a stack has `CfnOutput` objects, place a comment above the `new` call listing its export keys, not values.

Above each stack's `new` call in `bin/environment.ts`, also list the resources it provisions, one per constructor/class used inside the stack (e.g. `route53.HostedZone`, `iam.Role`). Where a stack exposes a resource via a `public readonly` property, note that too, since it signals the resource is meant to be consumed by other stacks/constructs.
