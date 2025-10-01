import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class Iam extends Construct {
  public readonly roleAttachedRedshift: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.roleAttachedRedshift = new iam.Role(this, "Role", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("redshift.amazonaws.com"),
        new iam.ServicePrincipal("redshift-serverless.amazonaws.com"),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonRedshiftAllCommandsFullAccess",
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"),
      ],
    });
  }
}
