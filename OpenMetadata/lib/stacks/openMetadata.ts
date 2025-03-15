import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EC2 } from "../constructs/ec2";
import { EFS } from "../constructs/efs";
import { OpenSearch } from "../constructs/openSearch";
import { RDS } from "../constructs/rds";
import { VPC } from "../constructs/vpc";

interface Props extends cdk.StackProps {
  profile: string;
}

export class OpenMetadata extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const vpc = new VPC(this, "VPC");
    new EC2(this, "EC2", { vpc: vpc.vpc });
    new RDS(this, "RDS", { vpc: vpc.vpc });
    new OpenSearch(this, "OpenSearch", {
      vpc: vpc.vpc,
      profile: props.profile,
    });
    new EFS(this, "EFS", { vpc: vpc.vpc });
  }
}
