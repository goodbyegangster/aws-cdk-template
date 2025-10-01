#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RedshiftProvisionedStack } from "../lib/stacks/redshift-provisioned-stack";

const app = new cdk.App();

new RedshiftProvisionedStack(app, "RedshiftProvisioned", {
  description: "Redshift Provisioned",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
});
