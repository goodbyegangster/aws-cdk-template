import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as redshiftserverless from "aws-cdk-lib/aws-redshiftserverless";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

interface Props {
  vpc: ec2.Vpc;
  sg: ec2.SecurityGroup;
  roleAttachedRedshift: iam.Role;
}

export class RedshiftServerless extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const ns = new redshiftserverless.CfnNamespace(this, "NameSpace", {
      namespaceName: "sample",

      // adminPasswordSecretKmsKeyId: "",
      adminUsername: "admin",
      // adminUserPassword: "",
      // dbName: "",
      defaultIamRoleArn: props.roleAttachedRedshift.roleArn,
      // finalSnapshotName: "",
      // finalSnapshotRetentionPeriod: 0,
      iamRoles: [props.roleAttachedRedshift.roleArn],
      // kmsKeyId: "",
      // logExports: ["userlog", "connectionlog", "useractivitylog"],
      manageAdminPassword: true,
      // namespaceResourcePolicy: "",
      // redshiftIdcApplicationArn: "",
      // tags: [
      //   {
      //     key: 'key',
      //     value: 'value',
      //   },
      // ],
    });

    const wg = new redshiftserverless.CfnWorkgroup(this, "WorkGroup", {
      workgroupName: "sample",

      baseCapacity: 4,
      maxCapacity: 4,
      // configParameters: [
      //   {
      //     parameterKey: 'parameterKey',
      //     parameterValue: 'parameterValue',
      //   },
      // ],
      enhancedVpcRouting: true,
      namespaceName: ns.namespaceName,
      port: 5439,
      publiclyAccessible: true,
      securityGroupIds: [props.sg.securityGroupId],
      subnetIds: props.vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC })
        .subnetIds,
      // tags: [
      //   {
      //     key: 'key',
      //     value: 'value',
      //   },
      // ],
    });
    wg.addDependency(ns);

    const getSecretArn = new cr.AwsCustomResource(this, "GetSecretArn", {
      onCreate: {
        service: "RedshiftServerless",
        action: "getNamespace",
        parameters: {
          namespaceName: ns.namespaceName,
        },
        physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
    getSecretArn.node.addDependency(ns);

    new cdk.CfnOutput(this, "AdminPasswordSecretArn", {
      value: getSecretArn.getResponseField("namespace.adminPasswordSecretArn"),
    });
  }
}
