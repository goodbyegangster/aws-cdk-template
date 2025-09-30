#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import { Override } from "../lib/override";

const app = new cdk.App();
new Override(app, "OverRide", {
  description: "OverRide",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
  schedule: {
    cron: scheduler.ScheduleExpression.cron({
      minute: "00",
      hour: "14",
      day: "*",
      timeZone: cdk.TimeZone.ASIA_TOKYO,
    }),
  },
});
