import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class Networking extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("192.168.0.0/16"),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        // {
        //   cidrMask: 22,
        //   name: "Protected",
        //   subnetType: aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        // },
        // {
        //   cidrMask: 22,
        //   name: "Private",
        //   subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
        // },
      ],
    });
  }
}
