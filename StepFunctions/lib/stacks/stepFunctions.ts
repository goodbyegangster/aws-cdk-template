import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ConstructStepFunctions } from "../constructs/stepFunctions";

export class StepFunctions extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ConstructStepFunctions(this, "Stm");
  }
}
