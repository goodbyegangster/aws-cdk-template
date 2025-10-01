import * as redshift from "@aws-cdk/aws-redshift-alpha";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

interface Props {
  vpc: ec2.Vpc;
  sg: ec2.SecurityGroup;
  roleAttachedRedshift: iam.Role;
}

export class RedshiftProvisioned extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const params = new redshift.ClusterParameterGroup(this, "Params", {
      description: "desc",
      parameters: {
        require_ssl: "true",
      },
    });

    const subnet = new redshift.ClusterSubnetGroup(this, "Subnet", {
      description: "sample",
      vpc: props.vpc,
      vpcSubnets: {
        availabilityZones: ["ap-northeast-1a"],
        subnetType: ec2.SubnetType.PUBLIC,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const secret = new secrets.Secret(this, "RedshiftSecret", {
      secretObjectValue: {
        username: cdk.SecretValue.unsafePlainText("root"),
        password: cdk.SecretValue.unsafePlainText("Passw0rd"),
        engine: cdk.SecretValue.unsafePlainText("redshift"),
        host: cdk.SecretValue.unsafePlainText("PLACEHOLDER"),
        port: cdk.SecretValue.unsafePlainText("PLACEHOLDER"),
        dbClusterIdentifier: cdk.SecretValue.unsafePlainText("PLACEHOLDER"),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(secret).add("Redshift", "dummy");

    const cluster = new redshift.Cluster(this, "Sample", {
      clusterType: redshift.ClusterType.SINGLE_NODE,
      nodeType: redshift.NodeType.RA3_LARGE,
      //
      publiclyAccessible: true,
      vpc: props.vpc,
      subnetGroup: subnet,
      enhancedVpcRouting: true,
      multiAz: false,
      securityGroups: [props.sg],
      //
      parameterGroup: params,
      encrypted: true,
      //
      masterUser: {
        masterUsername: "root",
        masterPassword: secret.secretValueFromJson("password"),
      },
      //
      roles: [props.roleAttachedRedshift],
      //
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const secretString = cdk.Lazy.string({
      produce: () =>
        JSON.stringify({
          username: "root",
          password: "Passw0rd",
          engine: "redshift",
          host: cluster.clusterEndpoint.hostname,
          port: cluster.clusterEndpoint.port,
          dbClusterIdentifier: cluster.clusterName,
        }),
    });

    const custom = new cr.AwsCustomResource(this, "UpdateSecret", {
      onUpdate: {
        service: "SecretsManager",
        action: "putSecretValue",
        parameters: {
          SecretId: secret.secretArn,
          SecretString: secretString,
        },
        physicalResourceId: cr.PhysicalResourceId.of(secret.secretArn),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [secret.secretArn],
      }),
    });
    custom.node.addDependency(cluster);

    new cdk.CfnOutput(this, "SecretArn", {
      value: secret.secretArn,
    });
  }
}
