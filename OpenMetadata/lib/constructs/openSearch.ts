import { IAMClient, ListRolesCommand } from "@aws-sdk/client-iam";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as opensearch from "aws-cdk-lib/aws-opensearchservice";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  vpc: ec2.Vpc;
  profile: string;
}

export class OpenSearch extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const sg = new ec2.SecurityGroup(this, "SecurityGroup", {
      description: "for OpenSearch",
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    sg.addIngressRule(ec2.Peer.ipv4("10.0.0.0/16"), ec2.Port.tcp(443));

    // 過去OpenSearchを実行したことのない環境の場合、Service-linked roleを作成する
    const client = new IAMClient({
      credentials: fromIni({ profile: props.profile }),
      region: "ap-northeast-1",
    });
    (async () => {
      const response = await client.send(
        new ListRolesCommand({
          PathPrefix: "/aws-service-role/opensearchservice.amazonaws.com/",
        }),
      );

      if (response.Roles && response.Roles?.length === 0) {
        new iam.CfnServiceLinkedRole(this, "OpensearchServiceLinkedRole", {
          awsServiceName: "es.amazonaws.com",
        });
      }
    })();

    const domain = new opensearch.Domain(this, "Domain", {
      // NOTE: https://docs.open-metadata.org/latest/deployment/kubernetes/eks#aws-services-for-database-as-rds-and-search-engine-as-elasticsearch
      // Amazon OpenSearch engine version 2.X (upto 2.7)
      version: opensearch.EngineVersion.OPENSEARCH_2_7,
      vpc: props.vpc,
      vpcSubnets: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          availabilityZones: ["ap-northeast-1c"],
        },
      ],
      enforceHttps: true,
      securityGroups: [sg],
      // NOTE: Amazon OpenSearch Service の料金
      // https://aws.amazon.com/jp/opensearch-service/pricing/
      capacity: {
        // NOTE: Choosing instance types for dedicated manager nodes
        // https://docs.aws.amazon.com/opensearch-service/latest/developerguide/managedomains-dedicatedmasternodes.html#dedicatedmasternodes-instance
        // masterNodes: 3,
        // masterNodeInstanceType: "t3.small.search",
        // NOTE: T3 instance types are suitable only for testing and development purposes. For production workloads, we recommend using latest generation instance types.
        // NOTE: Multi-AZ with Standby の Domain を利用する場合、dataNode は 3 の倍数である必要があり
        dataNodes: 1,
        dataNodeInstanceType: "t3.medium.search",
        multiAzWithStandbyEnabled: false,
      },
      ebs: {
        volumeSize: 30,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      fineGrainedAccessControl: {
        masterUserName: "master",
        masterUserPassword: cdk.SecretValue.unsafePlainText("P@ssw0rd"),
      },
      // accessPolicies: undefined,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      enableVersionUpgrade: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // domain access policy
    domain.addAccessPolicies(
      new iam.PolicyStatement({
        actions: ["es:*"],
        principals: [new iam.AnyPrincipal()],
        resources: [`${domain.domainArn}/*`],
      }),
    );

    new cdk.CfnOutput(this, "OpenSearchEndpoint", {
      value: domain.domainEndpoint,
    });
  }
}
