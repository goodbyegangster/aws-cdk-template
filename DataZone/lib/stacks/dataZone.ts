import * as cdk from "aws-cdk-lib";
import * as datazone from "aws-cdk-lib/aws-datazone";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class DataZone extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*************
     * Domain
     *************/
    // Domain Execution Role
    const domainExeRole = new iam.Role(this, "DomainExecutionRole", {
      roleName: "DataZone-DomainExecutionRole",
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("datazone.amazonaws.com"),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonDataZoneDomainExecutionRolePolicy",
        ),
      ],
      inlinePolicies: {
        SecretsManagerAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["iam:GetRole", "iam:GetUser"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    domainExeRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("datazone.amazonaws.com")],
        actions: ["sts:AssumeRole", "sts:TagSession"],
        conditions: {
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
          "ForAllValues:StringLike": {
            "aws:TagKeys": "datazone*",
          },
        },
      }),
    );

    // Domain
    const domain = new datazone.CfnDomain(this, "Domain", {
      name: "demo",
      description: "demo",
      domainExecutionRole: domainExeRole.roleArn,
    });

    /*************
     * Blueprint Provisioning Role
     *************/
    const blueprintProvisioningRole = new iam.Role(
      this,
      "blueprintProvisioningRole",
      {
        roleName: "DataZone-BlueprintProvisioningRole",
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal("datazone.amazonaws.com"),
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "AmazonDataZoneRedshiftGlueProvisioningPolicy",
          ),
        ],
      },
    );

    /*************
     * Blueprint DWH
     *************/
    // Blueprint Access Role(DWH)
    const blueprintDWHAccessRole = new iam.Role(
      this,
      "BlueprintDWHAccessRole",
      {
        roleName: "DataZone-BlueprintDWHAccessRole",
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal("datazone.amazonaws.com"),
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonDataZoneRedshiftManageAccessRolePolicy",
          ),
        ],
        inlinePolicies: {
          SecretsManagerAccessPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ["secretsmanager:GetSecretValue"],
                resources: ["*"],
                conditions: {
                  StringEquals: {
                    "secretsmanager:ResourceTag/AmazonDataZoneDomain":
                      domain.attrId,
                  },
                },
              }),
            ],
          }),
        },
      },
    );

    blueprintDWHAccessRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("datazone.amazonaws.com")],
        actions: ["sts:AssumeRole", "sts:TagSession"],
        conditions: {
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
          ArnEquals: {
            "aws:SourceArn": domain.attrArn,
          },
        },
      }),
    );

    // Blueprint(DWH)
    const blueprintDWH = new datazone.CfnEnvironmentBlueprintConfiguration(
      this,
      "EnvironmentBlueprintDWH",
      {
        domainIdentifier: domain.attrId,
        enabledRegions: [this.region],
        environmentBlueprintIdentifier: "DefaultDataWarehouse",
        manageAccessRoleArn: blueprintDWHAccessRole.roleArn,
        provisioningRoleArn: blueprintProvisioningRole.roleArn,
      },
    );

    /*************
     * Blueprint Lake
     *************/
    // Blueprint Access Role(Lake)
    const blueprintLakeAccessRole = new iam.Role(
      this,
      "BlueprintLakeAccessRole",
      {
        roleName: "DataZone-BlueprintLakeAccessRole",
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal("datazone.amazonaws.com"),
        ),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonDataZoneGlueManageAccessRolePolicy",
          ),
        ],
      },
    );

    blueprintLakeAccessRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("datazone.amazonaws.com")],
        actions: ["sts:AssumeRole", "sts:TagSession"],
        conditions: {
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
          ArnEquals: {
            "aws:SourceArn": domain.attrArn,
          },
        },
      }),
    );

    blueprintProvisioningRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal("datazone.amazonaws.com")],
        actions: ["sts:AssumeRole", "sts:TagSession"],
        conditions: {
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
        },
      }),
    );

    // Blueprint(Lake)
    // const blueprintLake = new datazone.CfnEnvironmentBlueprintConfiguration(
    //   this,
    //   "EnvironmentBlueprintLake",
    //   {
    //     domainIdentifier: domain.attrId,
    //     enabledRegions: [this.region],
    //     environmentBlueprintIdentifier: "DefaultDataLake",
    //     manageAccessRoleArn: blueprintLakeAccessRole.roleArn,
    //     provisioningRoleArn: blueprintProvisioningRole.roleArn,
    //     regionalParameters: [
    //       {
    //         region: this.region,
    //         parameters: { S3Location: `s3://datazone-source-${this.account}` },
    //       },
    //     ],
    //   },
    // );

    /*************
     * Project
     *************/
    // Project Producer
    const producer = new datazone.CfnProject(this, "ProjectProducer", {
      domainIdentifier: domain.attrId,
      name: "ProjectProducer",
      description: "Producer",
      glossaryTerms: undefined,
    });

    // Project Consumer
    const consumer = new datazone.CfnProject(this, "ProjectConsumer", {
      domainIdentifier: domain.attrId,
      name: "ProjectConsumer",
      description: "Consumer",
      glossaryTerms: undefined,
    });

    /*************
     * Secret Manager
     *************/
    // Secret for producer
    const secretProducer = new secretsmanager.Secret(this, "SecretProducer", {
      secretName: "DataZone-DWH-for-Producer",
      secretObjectValue: {
        username: cdk.SecretValue.unsafePlainText("admin"),
        password: cdk.SecretValue.unsafePlainText("Passw0rd"),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(secretProducer).add("AmazonDataZoneDomain", domain.attrId);
    cdk.Tags.of(secretProducer).add("AmazonDataZoneProject", producer.attrId);

    // Secret for Consumer
    const secretConsumer = new secretsmanager.Secret(this, "SecretConsumer", {
      secretName: "DataZone-DWH-for-Consumer",
      secretObjectValue: {
        username: cdk.SecretValue.unsafePlainText("admin"),
        password: cdk.SecretValue.unsafePlainText("Passw0rd"),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(secretConsumer).add("AmazonDataZoneDomain", domain.attrId);
    cdk.Tags.of(secretConsumer).add("AmazonDataZoneProject", consumer.attrId);

    /*************
     * Environment Profile(DWH)
     *************/
    // Environment DWH Profile producer
    const envDWHProfileProducer = new datazone.CfnEnvironmentProfile(
      this,
      "EnvDWHProfileProducer",
      {
        name: "redshift-producer",
        awsAccountId: this.account,
        awsAccountRegion: this.region,
        domainIdentifier: domain.attrId,
        projectIdentifier: producer.attrId,
        environmentBlueprintIdentifier: blueprintDWH.attrEnvironmentBlueprintId,
        userParameters: [
          {
            name: "dataAccessSecretsArn",
            value: secretProducer.secretArn,
          },
          {
            name: "dbName",
            value: "tickitdb",
          },
          {
            name: "workgroupName",
            value: "datazone-source",
          },
          {
            name: "profilePermissionLevel",
            value: "FULL_ACCESS",
          },
          {
            name: "allowedProjects",
            value: producer.attrId,
          },
        ],
      },
    );

    // Environment DWH Profile consumer
    const EnvDWHProfileConsumer = new datazone.CfnEnvironmentProfile(
      this,
      "EnvDWHProfileConsumer",
      {
        name: "redshift-consumer",
        awsAccountId: this.account,
        awsAccountRegion: this.region,
        domainIdentifier: domain.attrId,
        projectIdentifier: consumer.attrId,
        environmentBlueprintIdentifier: blueprintDWH.attrEnvironmentBlueprintId,
        userParameters: [
          {
            name: "dataAccessSecretsArn",
            value: secretConsumer.secretArn,
          },
          {
            name: "dbName",
            value: "tickitdb",
          },
          {
            name: "workgroupName",
            value: "datazone-source",
          },
          {
            name: "profilePermissionLevel",
            value: "LIMITED_ACCESS",
          },
          {
            name: "allowedProjects",
            value: consumer.attrId,
          },
        ],
      },
    );

    /*************
     * Environment(DWH)
     *************/
    // Environment producer(DWH)
    const envProducer = new datazone.CfnEnvironment(this, "EnvProducer", {
      name: "dwh-producer",
      domainIdentifier: domain.attrId,
      projectIdentifier: producer.attrId,
      environmentAccountIdentifier: this.account,
      environmentAccountRegion: this.region,
      environmentProfileIdentifier: envDWHProfileProducer.attrId,
    });

    // Environment consumer(DWH)
    new datazone.CfnEnvironment(this, "EnvConsumer", {
      name: "dwh-consumer",
      domainIdentifier: domain.attrId,
      projectIdentifier: consumer.attrId,
      environmentAccountIdentifier: this.account,
      environmentAccountRegion: this.region,
      environmentProfileIdentifier: EnvDWHProfileConsumer.attrId,
    });

    /*************
     * DataSource(DWH)
     *************/
    // DataSource DWH
    new datazone.CfnDataSource(this, "DataSourceDWH", {
      name: "redshift-demo",
      domainIdentifier: domain.attrId,
      projectIdentifier: producer.attrId,
      environmentIdentifier: envProducer.attrId,
      enableSetting: "ENABLED",
      type: "REDSHIFT",

      configuration: {
        redshiftRunConfiguration: {
          relationalFilterConfigurations: [
            {
              databaseName: "tickitdb",
              filterExpressions: [
                {
                  expression: "*",
                  type: "INCLUDE",
                },
              ],
              schemaName: "demo",
            },
          ],
          dataAccessRole: blueprintDWHAccessRole.roleArn,
          redshiftCredentialConfiguration: {
            secretManagerArn: secretProducer.secretArn,
          },
          redshiftStorage: {
            redshiftServerlessSource: {
              workgroupName: "datazone-source",
            },
          },
        },
      },
      recommendation: {
        enableBusinessNameGeneration: false,
      },
      schedule: {
        schedule: "cron(0 0 ? 1 1 *)",
        timezone: "UTC",
      },
      publishOnImport: false,
    });

    /*************
     * Environment Profile(Lake)
     *************/
    // Environment DataLake Profile producer
    // const envLakeProfileProducer = new datazone.CfnEnvironmentProfile(
    //   this,
    //   "EnvLakeProfileProducer",
    //   {
    //     name: "lake-producer",
    //     awsAccountId: this.account,
    //     awsAccountRegion: this.region,
    //     domainIdentifier: domain.attrId,
    //     projectIdentifier: producer.attrId,
    //     environmentBlueprintIdentifier:
    //       blueprintLake.attrEnvironmentBlueprintId,
    //     userParameters: [
    //       {
    //         name: "profilePermissionLevel",
    //         value: "FULL_ACCESS",
    //       },
    //       {
    //         name: "allowedProjects",
    //         value: producer.attrId,
    //       },
    //     ],
    //   },
    // );

    // Environment DataLake Profile Consumer
    // const envLakeProfileConsumer = new datazone.CfnEnvironmentProfile(
    //   this,
    //   "EnvLakeProfileConsumer",
    //   {
    //     name: "lake-consumer",
    //     awsAccountId: this.account,
    //     awsAccountRegion: this.region,
    //     domainIdentifier: domain.attrId,
    //     projectIdentifier: consumer.attrId,
    //     environmentBlueprintIdentifier:
    //       blueprintLake.attrEnvironmentBlueprintId,
    //     userParameters: [
    //       {
    //         name: "profilePermissionLevel",
    //         value: "LIMITED_ACCESS",
    //       },
    //       {
    //         name: "allowedProjects",
    //         value: consumer.attrId,
    //       },
    //     ],
    //   },
    // );

    /*************
     * Environment(Lake)
     *************/
    // Environment producer(Lake)
    // const envProducerLake = new datazone.CfnEnvironment(
    //   this,
    //   "EnvProducerLake",
    //   {
    //     name: "lake-producer",
    //     domainIdentifier: domain.attrId,
    //     projectIdentifier: producer.attrId,
    //     environmentAccountIdentifier: this.account,
    //     environmentAccountRegion: this.region,
    //     environmentProfileIdentifier: envLakeProfileProducer.attrId,
    //   },
    // );

    // Environment consumer(Lake)
    // new datazone.CfnEnvironment(this, "EnvConsumerLake", {
    //   name: "lake-consumer",
    //   domainIdentifier: domain.attrId,
    //   projectIdentifier: consumer.attrId,
    //   environmentAccountIdentifier: this.account,
    //   environmentAccountRegion: this.region,
    //   environmentProfileIdentifier: envLakeProfileConsumer.attrId,
    // });

    /*************
     * DataSource(Lake)
     *************/
    // DataSource DataLake
    // new datazone.CfnDataSource(this, "DataSourceLake", {
    //   name: "datalake",
    //   domainIdentifier: domain.attrId,
    //   projectIdentifier: producer.attrId,
    //   environmentIdentifier: envProducerLake.attrId,
    //   enableSetting: "ENABLED",
    //   type: "GLUE",

    //   configuration: {
    //     glueRunConfiguration: {
    //       relationalFilterConfigurations: [
    //         {
    //           databaseName: "datasource",
    //           filterExpressions: [
    //             {
    //               expression: "*",
    //               type: "INCLUDE",
    //             },
    //           ],
    //         },
    //       ],
    //       autoImportDataQualityResult: true,
    //       dataAccessRole: blueprintLakeAccessRole.roleArn,
    //     },
    //   },
    //   recommendation: {
    //     enableBusinessNameGeneration: false,
    //   },
    //   schedule: {
    //     schedule: "cron(0 0 ? 1 1 *)",
    //     timezone: "UTC",
    //   },
    //   publishOnImport: false,
    // });

    /*************
     * Project Membership
     *************/
    // Project Producer Membership(steward)
    new datazone.CfnProjectMembership(this, "ProducerMemberSteward", {
      domainIdentifier: domain.attrId,
      projectIdentifier: producer.attrId,
      designation: "PROJECT_CATALOG_STEWARD",
      member: {
        userIdentifier: `arn:aws:iam::${this.account}:role/DataZone-data-steward`,
      },
    });

    // Project Producer Membership(owner)
    new datazone.CfnProjectMembership(this, "ProducerMemberOwner", {
      domainIdentifier: domain.attrId,
      projectIdentifier: producer.attrId,
      designation: "PROJECT_OWNER",
      member: {
        userIdentifier: `arn:aws:iam::${this.account}:role/DataZone-data-owner`,
      },
    });

    // Project Producer Membership(contributor)
    new datazone.CfnProjectMembership(this, "ProducerMemberContributor", {
      domainIdentifier: domain.attrId,
      projectIdentifier: producer.attrId,
      designation: "PROJECT_CONTRIBUTOR",
      member: {
        userIdentifier: `arn:aws:iam::${this.account}:role/DataZone-data-contributor`,
      },
    });

    // Project Consumer Membership(steward)
    new datazone.CfnProjectMembership(this, "ConsumerMemberSteward", {
      domainIdentifier: domain.attrId,
      projectIdentifier: consumer.attrId,
      designation: "PROJECT_CATALOG_STEWARD",
      member: {
        userIdentifier: `arn:aws:iam::${this.account}:role/DataZone-data-steward`,
      },
    });

    // Project Consumer Membership(consumer)
    new datazone.CfnProjectMembership(this, "ConsumerMemberConsumer", {
      domainIdentifier: domain.attrId,
      projectIdentifier: consumer.attrId,
      designation: "PROJECT_CATALOG_CONSUMER",
      member: {
        userIdentifier: `arn:aws:iam::${this.account}:role/DataZone-data-consumer`,
      },
    });

    // Project Consumer Membership(viewer)
    new datazone.CfnProjectMembership(this, "ConsumerMemberViewer", {
      domainIdentifier: domain.attrId,
      projectIdentifier: consumer.attrId,
      designation: "PROJECT_CATALOG_VIEWER",
      member: {
        userIdentifier: `arn:aws:iam::${this.account}:role/DataZone-data-viewer`,
      },
    });
  }
}
