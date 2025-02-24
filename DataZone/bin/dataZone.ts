#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { DataSource } from "../lib/stacks/dataSource";
import { DataZone } from "../lib/stacks/dataZone";

const app = new cdk.App();

new DataSource(app, "DataSource", {
  description: "DataZone (DataSource)",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
  // DataZone 管理ユーザーを設定
  administrators: ["arn:aws:iam::012345678901:user/xxx"],
  // Redshift に Public Access 可能なIPアドレスを指定
  publicAccesses: ["0.0.0.0/0"],
});

new DataZone(app, "DataZone", {
  description: "DataZone",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "ap-northeast-1",
  },
  synthesizer: new cdk.DefaultStackSynthesizer({
    generateBootstrapVersionRule: false,
  }),
});
