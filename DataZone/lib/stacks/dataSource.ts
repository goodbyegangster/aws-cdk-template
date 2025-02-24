import * as cdk from "aws-cdk-lib";

import { Construct } from "constructs";
import { Glue } from "../constructs/glue";
import { IAM } from "../constructs/iam";
import { RedshiftServerless } from "../constructs/redshiftServerless";
import { S3 } from "../constructs/s3";
import { VPC } from "../constructs/vpc";

interface Props extends cdk.StackProps {
  administrators: string[];
  publicAccesses: string[];
}

export class DataSource extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    new IAM(this, "IAM", { administrators: props.administrators });
    new S3(this, "S3");
    const vpc = new VPC(this, "VPC");
    const rs = new RedshiftServerless(this, "RedshiftServerless", {
      vpc: vpc.vpc,
      publicAccesses: props.publicAccesses,
    });
    new Glue(this, "Glue", { vpc: vpc.vpc, sg: rs.sg });
  }
}
