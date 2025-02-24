import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  administrators: string[];
}

export class IAM extends Construct {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const trustedEntities = props.administrators.map((user) => {
      return new iam.PrincipalWithConditions(new iam.ArnPrincipal(user), {
        Bool: {
          "aws:MultiFactorAuthPresent": "true",
        },
      });
    });

    const inlinePolicy = {
      AccessDataPortal: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["datazone:GetIamPortalLoginUrl"],
            resources: ["*"],
          }),
        ],
      }),
    };

    new iam.Role(this, "DataSteward", {
      roleName: "DataZone-data-steward",
      assumedBy: new iam.CompositePrincipal(...trustedEntities),
      inlinePolicies: inlinePolicy,
    });

    new iam.Role(this, "DataOwner", {
      roleName: "DataZone-data-owner",
      assumedBy: new iam.CompositePrincipal(...trustedEntities),
      inlinePolicies: inlinePolicy,
    });

    new iam.Role(this, "DataContributor", {
      roleName: "DataZone-data-contributor",
      assumedBy: new iam.CompositePrincipal(...trustedEntities),
      inlinePolicies: inlinePolicy,
    });

    new iam.Role(this, "DataConsumer", {
      roleName: "DataZone-data-consumer",
      assumedBy: new iam.CompositePrincipal(...trustedEntities),
      inlinePolicies: inlinePolicy,
    });

    new iam.Role(this, "DataViewer", {
      roleName: "DataZone-data-viewer",
      assumedBy: new iam.CompositePrincipal(...trustedEntities),
      inlinePolicies: inlinePolicy,
    });
  }
}
