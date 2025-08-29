import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";

export class ConstructStepFunctions extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    /*
    IAM Role (State Machine Execution Role)
    */
    const role = new iam.Role(this, "Role", {
      roleName: "StateMachineExecutionRole",
      assumedBy: new iam.ServicePrincipal("states.amazonaws.com"),
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        // https://docs.aws.amazon.com/ja_jp/step-functions/latest/dg/cw-logs.html#cloudwatch-iam-policy
        effect: iam.Effect.ALLOW,
        actions: [
          "batch:SubmitJob",
          "ecs:RunTask",
          "events:DescribeRule",
          "events:PutRule",
          "events:PutTargets",
          "iam:PassRole",
          "lambda:InvokeFunction",
          "logs:CreateLogDelivery",
          "logs:CreateLogStream",
          "logs:DeleteLogDelivery",
          "logs:DescribeLogGroups",
          "logs:DescribeResourcePolicies",
          "logs:GetLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutLogEvents",
          "logs:PutResourcePolicy",
          "logs:UpdateLogDelivery",
          "sns:Publish",
          "states:DescribeExecution",
          "states:StartExecution",
        ],
        resources: ["*"],
      }),
    );

    /*
    Cloudwatch Logs
    */
    const log = new logs.LogGroup(this, "LogGroup", {
      // NOTE: アクセス頻度の低いログ用の新しい Amazon CloudWatch ログクラスを割引価格で提供
      // https://aws.amazon.com/jp/blogs/news/new-amazon-cloudwatch-log-class-for-infrequent-access-logs-at-a-reduced-price/
      logGroupClass: logs.LogGroupClass.INFREQUENT_ACCESS,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const account = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    /*
    Step Functions の State Machine
    */
    new sfn.StateMachine(this, "StateMachine", {
      stateMachineName: `sample-${account}-${region}`,
      comment: "sample",
      stateMachineType: sfn.StateMachineType.STANDARD,
      definitionBody: sfn.DefinitionBody.fromFile(
        "resources/sfn/sample.asl.yml",
      ),
      definitionSubstitutions: {
        // ChildStateMachine: stmChild1.stateMachineArn,
        // FunctionName: func.functionArn,
        // EcsCluster: cluster.clusterArn,
        // EcsTaskDefinition: taskDefinition.taskDefinitionArn,
        // SubnetA: vpc.selectSubnets({
        //   availabilityZones: ["ap-northeast-1a"],
        //   onePerAz: true,
        // }).subnetIds[0],
        // SubnetC: vpc.selectSubnets({
        //   availabilityZones: ["ap-northeast-1c"],
        //   onePerAz: true,
        // }).subnetIds[0],
        // SubnetD: vpc.selectSubnets({
        //   availabilityZones: ["ap-northeast-1d"],
        //   onePerAz: true,
        // }).subnetIds[0],
        // SecurityGroup: taskSg.securityGroupId,
        // TopicArn: alertSNS.topicArn,
        hogehoge: "hogehoge",
      },
      role: role,
      logs: {
        destination: log,
        includeExecutionData: true,
        level: sfn.LogLevel.ALL,
      },
      timeout: cdk.Duration.minutes(1),
      tracingEnabled: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
