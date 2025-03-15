import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class VPC extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      availabilityZones: [
        "ap-northeast-1a",
        "ap-northeast-1c",
        "ap-northeast-1d",
      ],
      // natGateways: 1,
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        // {
        //   cidrMask: 24,
        //   name: "Private_with_egress",
        //   subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        // },
      ],
    });

    new cdk.CfnOutput(this, "VPCId", {
      value: this.vpc.vpcId,
    });

    new cdk.CfnOutput(this, "SubnetID1a", {
      value: this.vpc
        .selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: ["ap-northeast-1a"],
        })
        .subnetIds.toString(),
    });

    new cdk.CfnOutput(this, "SubnetID1c", {
      value: this.vpc
        .selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: ["ap-northeast-1c"],
        })
        .subnetIds.toString(),
    });

    new cdk.CfnOutput(this, "SubnetID1d", {
      value: this.vpc
        .selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: ["ap-northeast-1d"],
        })
        .subnetIds.toString(),
    });
  }
}
