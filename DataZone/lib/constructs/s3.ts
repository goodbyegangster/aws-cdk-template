import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3 extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new s3.Bucket(this, "Bucket", {
      bucketName: `datazone-source-${cdk.Stack.of(this).account}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
