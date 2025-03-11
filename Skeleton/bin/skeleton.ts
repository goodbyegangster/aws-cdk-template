#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { deploySkeltonDev, deploySkeltonPro } from "./instances/skelton";

const app = new cdk.App();

// stack instance の生成を別モジュールに分ける
for (const deploy of [deploySkeltonPro, deploySkeltonDev]) {
  deploy(app);
}
