import { Stack, CfnOutput, StackProps } from 'aws-cdk-lib';
import * as r53 from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';



export class ProjectCertsStack extends Stack {
    public readonly hostedZone: r53.PublicHostedZone;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id);

        const icullinaneCert = new Certificate(this, 'IansCert', {
            domainName: 'iancullinane.com',
            validation: CertificateValidation.fromDns(), // You will need to manually validate the CNAMEs
          });
      
          const sheetaCloudCert = new Certificate(this, 'SheetaCloudCert', {
            domainName: 'sheeta.cloud',
            validation: CertificateValidation.fromDns(), // You will need to manually validate the CNAMEs
          });

          new CfnOutput(this, 'IcullinaneCertArn', {
            value: icullinaneCert.certificateArn,
          });

          new CfnOutput(this, 'SheetaCloudCertArn', {
            value: sheetaCloudCert.certificateArn,
          });
    }
} 

