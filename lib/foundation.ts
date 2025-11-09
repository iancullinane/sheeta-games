import { CfnOutput, Fn, Stack, StackProps, Tags } from "aws-cdk-lib"
import { Construct } from "constructs"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ssm from "aws-cdk-lib/aws-ssm"

interface Domain {
    name: string
}

interface NetworkConfig {
    domains: Domain[]
}

interface FoundationProps extends StackProps {
    network: NetworkConfig
}

export class Foundation extends Stack {
    public readonly hostedZones: Map<string, route53.IHostedZone> = new Map()

    constructor(scope: Construct, id: string, props: FoundationProps) {
        super(scope, id, props)

        // Create hosted zones for each domain
        for (const domain of props.network.domains) {
            const hostedZone = new route53.HostedZone(this, `${domain.name}-zone`, {
                zoneName: domain.name
            })
            this.hostedZones.set(domain.name, hostedZone)


            new CfnOutput(this, `NSRecord`, {
                value: Fn.join(',', hostedZone.hostedZoneNameServers || []),
                description: `Name Servers for ${hostedZone.zoneName}`,
            });

        }
    }
}