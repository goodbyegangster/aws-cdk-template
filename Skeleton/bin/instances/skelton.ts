import * as cdk from "aws-cdk-lib";
import { Skeleton } from "../../lib/stacks/skeleton";

export const deploySkeltonPro = (app: cdk.App) =>
  new Skeleton(app, "SkeltonPro", {
    description: "Skeleton (pro)",
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "ap-northeast-1",
    },
    environment: "pro",
  });

export const deploySkeltonDev = (app: cdk.App) =>
  new Skeleton(app, "SkeltonDev", {
    description: "Skeleton (dev)",
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "ap-northeast-1",
    },
    environment: "dev",
  });
