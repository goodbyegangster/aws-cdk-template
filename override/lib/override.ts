import * as lambda from "aws-cdk-lib/aws-lambda";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import * as scheduler_targets from "aws-cdk-lib/aws-scheduler-targets";
import { Construct } from "constructs";

import * as cdk from "aws-cdk-lib";

interface EventBridgeSchedule {
  /** 実行スケジュール(cron) */
  cron: scheduler.ScheduleExpression;
  /** スケジュール開始日 */
  start?: scheduler.ScheduleProps["start"];
  /** スケジュール終了日 */
  end?: scheduler.ScheduleProps["end"];
}

interface Props extends cdk.StackProps {
  /** 実行スケジュール */
  schedule: EventBridgeSchedule;
}

export class Override extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const func = new lambda.Function(this, "MySimpleLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log("HELLO");
          return "done";
        };
      `),
    });

    const sch = new scheduler.Schedule(this, "Schedule", {
      scheduleName: "sample",
      description: "sampleXXX",
      schedule: props.schedule.cron,
      ...(props.schedule.start ? { start: props.schedule.start } : {}),
      ...(props.schedule.end ? { end: props.schedule.end } : {}),
      target: new scheduler_targets.LambdaInvoke(func, {}),
    });

    // https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/cfn-layer.html#develop-customize-override
    const cfn = sch.node.defaultChild as scheduler.CfnSchedule;
    cfn.addPropertyDeletionOverride("State");
  }
}
