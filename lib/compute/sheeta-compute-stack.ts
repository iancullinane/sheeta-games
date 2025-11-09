import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

interface SheetaComputeStackProps extends StackProps {
    projectName: string;
}

export class SheetaComputeStack extends Stack {
    public readonly vpc: ec2.Vpc;
    public readonly instance: ec2.Instance;
    public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
    public readonly targetGroup: elbv2.ApplicationTargetGroup;

    constructor(scope: Construct, id: string, props: SheetaComputeStackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'SheetaVpc', {
            maxAzs: 2,
            natGateways: 0,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
            ],
        });

        const securityGroup = new ec2.SecurityGroup(this, 'SheetaInstanceSg', {
            vpc: this.vpc,
            description: 'Security group for Sheeta compute instance',
            allowAllOutbound: true,
        });

        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            'Allow HTTP traffic from ALB'
        );

        const userData = ec2.UserData.forLinux();
        userData.addCommands(
            'yum update -y',
            'yum install -y python3',
            'cat > /home/ec2-user/server.py << EOF',
            'from http.server import HTTPServer, BaseHTTPRequestHandler',
            '',
            'class SheetaHandler(BaseHTTPRequestHandler):',
            '    def do_GET(self):',
            '        self.send_response(200)',
            '        self.send_header("Content-type", "text/plain")',
            '        self.end_headers()',
            '        self.wfile.write(b"sheeta")',
            '',
            '    def log_message(self, format, *args):',
            '        pass',
            '',
            'if __name__ == "__main__":',
            '    server = HTTPServer(("0.0.0.0", 80), SheetaHandler)',
            '    print("Server running on port 80")',
            '    server.serve_forever()',
            'EOF',
            'python3 /home/ec2-user/server.py &'
        );

        this.instance = new ec2.Instance(this, 'SheetaInstance', {
            vpc: this.vpc,
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machineImage: ec2.MachineImage.latestAmazonLinux2023(),
            securityGroup: securityGroup,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            userData: userData,
        });

        const albSecurityGroup = new ec2.SecurityGroup(this, 'SheetaAlbSg', {
            vpc: this.vpc,
            description: 'Security group for Sheeta ALB',
            allowAllOutbound: true,
        });

        albSecurityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            'Allow HTTP traffic from internet'
        );

        this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'SheetaAlb', {
            vpc: this.vpc,
            internetFacing: true,
            securityGroup: albSecurityGroup,
        });

        this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'SheetaTargetGroup', {
            vpc: this.vpc,
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targets: [new targets.InstanceTarget(this.instance)],
            healthCheck: {
                path: '/',
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 3,
            },
        });

        this.loadBalancer.addListener('HttpListener', {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            defaultTargetGroups: [this.targetGroup],
        });

        new CfnOutput(this, 'LoadBalancerDns', {
            value: this.loadBalancer.loadBalancerDnsName,
            description: 'DNS name of the Application Load Balancer',
        });

        new CfnOutput(this, 'LoadBalancerUrl', {
            value: `http://${this.loadBalancer.loadBalancerDnsName}`,
            description: 'URL to access the Sheeta service',
        });

        new CfnOutput(this, 'InstanceId', {
            value: this.instance.instanceId,
            description: 'EC2 Instance ID',
        });
    }
}

