import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { Environment } from "../helper/environment";

interface Props extends cdk.StackProps {
  environment: Environment;
}

export class SQS extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const account = cdk.Stack.of(this).account;

    new sqs.Queue(this, "Queue", {
      queueName: `${account}-${props.environment}-skelton`,
    });
  }
}
