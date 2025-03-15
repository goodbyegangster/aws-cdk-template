#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { OpenMetadata } from "../lib/stacks/openMetadata";

const app = new cdk.App();

new OpenMetadata(app, "OpenMetadata", {
  description: "OpenMetadata",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
  profile: "private",
});
