import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Iam } from "../constructs/iam";
import { Networking } from "../constructs/networking";
import { RedshiftServerless } from "../constructs/redshift-serverless";

export class RedshiftServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const networking = new Networking(this, "Networking");
    const iam = new Iam(this, "Iam");
    new RedshiftServerless(this, "Redshift", {
      vpc: networking.vpc,
      sg: networking.sg,
      roleAttachedRedshift: iam.roleAttachedRedshift,
    });
  }
}
