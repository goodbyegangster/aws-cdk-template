#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RedshiftServerlessStack } from "../lib/stacks/redshift-serverless-stack";

const app = new cdk.App();
new RedshiftServerlessStack(app, "RedshiftServerless", {
  description: "Redshift Serverless",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
});
