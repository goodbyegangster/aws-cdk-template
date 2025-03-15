import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class RDS extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const sg = new ec2.SecurityGroup(this, "SecurityGroup", {
      description: "for RDS",
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    sg.addIngressRule(ec2.Peer.ipv4("10.0.0.0/16"), ec2.Port.tcp(3306));
    sg.addIngressRule(ec2.Peer.ipv4("10.0.0.0/16"), ec2.Port.tcp(5432));

    const mySQL = new rds.DatabaseInstance(this, "MySQL", {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_4_3,
      }),
      databaseName: "sample",
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      publiclyAccessible: false,
      securityGroups: [sg],
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      storageType: rds.StorageType.GP3,
      allocatedStorage: 30,
      multiAz: false,
      credentials: {
        username: "root",
        password: cdk.SecretValue.unsafePlainText("Passw0rd"),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, "MySQLEndpoint", {
      value: mySQL.instanceEndpoint.hostname,
    });

    /**
     * 該当 PostgreSQL バージョンを起動できる Instance Type 一覧
     * https://docs.open-metadata.org/latest/deployment/kubernetes/eks#aws-services-for-database-as-rds-and-search-engine-as-elasticsearch
      aws --profile private rds describe-orderable-db-instance-options \
      --engine postgres \
      --engine-version 17.1 \
      --query 'OrderableDBInstanceOptions[].[DBInstanceClass,StorageType,Engine,EngineVersion]' \
      --output table \
      --region ap-northeast-1
     */
    // const postgres = new rds.DatabaseInstance(this, "PostgreSQL", {
    //   engine: rds.DatabaseInstanceEngine.postgres({
    //     version: rds.PostgresEngineVersion.VER_17_1,
    //   }),
    //   databaseName: "sample",
    //   vpc: props.vpc,
    //   vpcSubnets: {
    //     subnetType: ec2.SubnetType.PUBLIC,
    //   },
    //   publiclyAccessible: false,
    //   securityGroups: [sg],
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
    //   storageType: rds.StorageType.GP3,
    //   allocatedStorage: 20,
    //   multiAz: false,
    //   credentials: {
    //     username: "root",
    //     password: cdk.SecretValue.unsafePlainText("Passw0rd"),
    //   },
    //   removalPolicy: cdk.RemovalPolicy.DESTROY,
    // });

    // new cdk.CfnOutput(this, "PostgresEndpoint", {
    //   value: postgres.instanceEndpoint.hostname,
    // });
  }
}
