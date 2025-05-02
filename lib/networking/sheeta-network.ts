import * as cdk from 'aws-cdk-lib';
import * as r53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface SheetaNetworkProps {
    domainName: string;
    // api: apigateway.RestApi;
}

export class SheetaNetwork extends Construct {
    public readonly hostedZone: r53.PublicHostedZone;

    constructor(scope: Construct, id: string, props: SheetaNetworkProps) {
        super(scope, id);

        this.hostedZone = new r53.PublicHostedZone(this, 'MyHostedZone', {
            zoneName: props.domainName,
        });

        // Output the hosted zone ID instead of name servers
        new cdk.CfnOutput(this, 'HostedZoneId', {
            value: this.hostedZone.hostedZoneId,
            description: 'Hosted Zone ID'
        });
    }
} 