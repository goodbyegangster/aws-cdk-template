import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { SQS } from "../constructs/sqs";
import { Environment } from "../helper/environment";

interface Props extends cdk.StackProps {
  environment: Environment;
}

export class Skeleton extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    new SQS(this, "SQS", {
      environment: props.environment,
    });
  }
}
