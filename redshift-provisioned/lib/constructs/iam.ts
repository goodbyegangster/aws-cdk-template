import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class Iam extends Construct {
  public readonly roleAttachedRedshift: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.roleAttachedRedshift = new iam.Role(this, "ClusterRole", {
      assumedBy: new iam.ServicePrincipal("redshift.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
      ],
    });
  }
}
