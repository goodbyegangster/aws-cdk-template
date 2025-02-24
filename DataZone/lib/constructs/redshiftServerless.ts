import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as redshiftserverless from "aws-cdk-lib/aws-redshiftserverless";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  vpc: ec2.Vpc;
  publicAccesses: string[];
}

export class RedshiftServerless extends Construct {
  public readonly sg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.sg = new ec2.SecurityGroup(this, "SG", {
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    props.publicAccesses.map((cidr) => {
      return this.sg.addIngressRule(ec2.Peer.ipv4(cidr), ec2.Port.tcp(5439));
    });
    this.sg.addIngressRule(this.sg, ec2.Port.allTcp());

    const role = new iam.Role(this, "RedshiftClusterRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("redshift.amazonaws.com"),
        new iam.ServicePrincipal("redshift-serverless.amazonaws.com"),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonRedshiftAllCommandsFullAccess",
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
      ],
    });

    const ns = new redshiftserverless.CfnNamespace(this, "NameSpace", {
      namespaceName: "datazone-source",
      adminUsername: "admin",
      adminUserPassword: "Passw0rd",
      dbName: "tickitdb",
      defaultIamRoleArn: role.roleArn,
      iamRoles: [role.roleArn],
    });

    const wg = new redshiftserverless.CfnWorkgroup(this, "WorkGroup", {
      workgroupName: "datazone-source",
      baseCapacity: 8,
      maxCapacity: 8,
      configParameters: [
        {
          parameterKey: "require_ssl",
          parameterValue: "true",
        },
      ],
      enhancedVpcRouting: true,
      namespaceName: ns.namespaceName,
      port: 5439,
      publiclyAccessible: true,
      securityGroupIds: [this.sg.securityGroupId],
      subnetIds: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC })
        .subnetIds,
    });
    wg.addDependency(ns);
  }
}
