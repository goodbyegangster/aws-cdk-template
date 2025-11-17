import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class Networking extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly sg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("192.168.0.0/16"),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 22,
          name: "Protected",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 22,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    this.sg = new ec2.SecurityGroup(this, "SG", {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
  }
}
