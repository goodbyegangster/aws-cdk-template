import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as glue from "aws-cdk-lib/aws-glue";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  vpc: ec2.Vpc;
  sg: ec2.SecurityGroup;
}

export class Glue extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const database = new glue.CfnDatabase(this, "Database", {
      catalogId: cdk.Stack.of(this).account,
      databaseInput: {
        name: "datasource",
      },
    });

    const role = new iam.Role(this, "CrawlerRole", {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSGlueServiceRole",
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
      ],
    });

    new glue.CfnCrawler(this, "Crawler", {
      name: "crawler_datasource",
      databaseName: database.ref,
      role: role.roleArn,
      targets: {
        s3Targets: [
          {
            path: `s3://datazone-source-${cdk.Stack.of(this).account}/web-and-social-analytics`,
          },
        ],
      },
      schemaChangePolicy: {
        deleteBehavior: "DEPRECATE_IN_DATABASE",
        updateBehavior: "UPDATE_IN_DATABASE",
      },
    });

    new glue.CfnConnection(this, "Connection", {
      catalogId: cdk.Stack.of(this).account,
      connectionInput: {
        name: "redshift-datazone",
        connectionType: "JDBC",
        connectionProperties: {
          JDBC_CONNECTION_URL: `jdbc:redshift://datazone-source.${cdk.Stack.of(this).account}.${cdk.Stack.of(this).region}.redshift-serverless.amazonaws.com:5439/tickitdb`,
          USERNAME: "admin",
          PASSWORD: "Passw0rd",
          JDBC_ENFORCE_SSL: true,
        },
        physicalConnectionRequirements: {
          availabilityZone: "ap-northeast-1c",
          securityGroupIdList: [props.sg.securityGroupId],
          subnetId: props.vpc.selectSubnets({
            availabilityZones: ["ap-northeast-1c"],
            subnetType: ec2.SubnetType.PUBLIC,
          }).subnetIds[0],
        },
      },
    });
  }
}
