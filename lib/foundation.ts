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

            // Output the NS records
            // if (hostedZone.hostedZoneNameServers) {
            //     for (let i = 0; i < hostedZone.hostedZoneNameServers.length; i++) {
            //         new CfnOutput(this, `NSRecord${i + 1} :: ${hostedZone.hostedZoneNameServers.length}`, {
            //             value: Fn.select(i, hostedZone.hostedZoneNameServers),
            //             description: `Name Server ${i + 1} for ${hostedZone.zoneName}`,
            //         });
            //     }
            // }

        }


        // Export VPC ID to SSM Parameter Store
        // new ssm.StringParameter(this, 'SharedVpcIdParam', {
        //     parameterName: '/foundation/sheeta/hosted-zone', // Standardized path for easy discovery
        //     stringValue: this.vpc.,
        //     description: 'ID of the shared VPC for applications.',
        //     tier: ssm.ParameterTier.STANDARD,
        // });

    }






    // // Store NS records in SSM Parameter Store for each hosted zone
    // for (const [domainName, zone] of this.hostedZones) {
    //     const nsRecords = zone.hostedZoneNameServers || [];

    //     new StringParameter(this, `${domainName}-ns-records`, {
    //         parameterName: `/dns/${domainName}/nameservers`,
    //         stringValue: JSON.stringify(nsRecords),
    //         description: `Nameservers for ${domainName} hosted zone`
    //     });
    // }
}