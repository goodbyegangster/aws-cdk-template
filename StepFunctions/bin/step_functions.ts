#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { StepFunctions } from "../lib/stacks/stepFunctions";

const app = new cdk.App();

new StepFunctions(app, "StepFunctions", {
  description: "StepFunctions",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
});
