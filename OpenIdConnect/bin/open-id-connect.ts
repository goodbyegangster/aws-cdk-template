#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { OpenIdConnect } from "../lib/stacks/open-id-connect";

const app = new cdk.App();

new OpenIdConnect(app, "OpenIdConnect", {
  description: "OpenIdConnect",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
});
