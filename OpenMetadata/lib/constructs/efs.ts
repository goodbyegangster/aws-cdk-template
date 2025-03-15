import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class EFS extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const sg = new ec2.SecurityGroup(this, "SecurityGroup", {
      description: "for EFS",
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    sg.addIngressRule(ec2.Peer.ipv4("10.0.0.0/16"), ec2.Port.tcp(2049));

    const fileSystem = new efs.FileSystem(this, "FileSystem", {
      vpc: props.vpc,
      vpcSubnets: {
        availabilityZones: ["ap-northeast-1c"],
      },
      oneZone: true,
      throughputMode: efs.ThroughputMode.BURSTING,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      allowAnonymousAccess: true,
      securityGroup: sg,
      encrypted: true,
      enableAutomaticBackups: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, "EFSInstanceId", {
      value: fileSystem.fileSystemId,
    });
  }
}
