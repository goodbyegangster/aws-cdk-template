import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class EC2 extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const sg = new ec2.SecurityGroup(this, "SecurityGroup", {
      description: "for EC2 bastion",
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    const role = new iam.Role(this, "BastionInstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore",
        ),
      ],
    });

    const bastion = new ec2.Instance(this, "Bastion", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: ["ap-northeast-1c"],
      },
      securityGroup: sg,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: ec2.BlockDeviceVolume.ebs(10, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      role: role,
    });

    new cdk.CfnOutput(this, "BastionInstanceId", {
      value: bastion.instanceId,
    });
  }
}
