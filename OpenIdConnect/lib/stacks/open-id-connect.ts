import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

/**
 * Configuring OpenID Connect in Amazon Web Services
 * https://docs.github.com/en/actions/how-tos/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
 *
 * @export
 * @class
 * @extends {cdk.Stack}
 */
export class OpenIdConnect extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // GitHub OIDC プロバイダー向けの設定
    // Adding the identity provider to AWS
    // https://docs.github.com/en/actions/how-tos/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#adding-the-identity-provider-to-aws
    // L2 の construct では、タグが設定できなかったため、L1 の construct を利用
    new iam.CfnOIDCProvider(this, "GitHubOIDCProvider", {
      url: "https://token.actions.githubusercontent.com",
      clientIdList: ["sts.amazonaws.com"],
      // GitHub Actions 向け認証では thumbprintList は不要のためダミー値を設定
      // https://github.com/aws-actions/configure-aws-credentials/blob/main/README.md#configuring-iam-to-trust-github
      thumbprintList: ["ffffffffffffffffffffffffffffffffffffffff"],
      tags: [
        {
          key: "UsedBy",
          value: "GitHub Actions",
        },
      ],
    });

    const providerArn = `arn:aws:iam::${cdk.Stack.of(this).account}:oidc-provider/token.actions.githubusercontent.com`;

    // GitHub Actions が Assume Role する IAM ロール
    const role = new iam.Role(this, "RoleGitHubActions", {
      roleName: "GitHubActionsOIDCRole",
      // 信頼ポリシーの設定
      // https://docs.github.com/en/actions/how-tos/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#adding-the-identity-provider-to-aws
      assumedBy: new iam.WebIdentityPrincipal(providerArn, {
        StringLike: {
          "token.actions.githubusercontent.com:sub":
            // Assume Role できる GitHub リポジトリを指定
            // repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME
            "repo:goodbyegangster/repository-sample-name:*",
        },
        StringEquals: {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        },
      }),
      description: "IAM Role assumed by GitHub Actions via OIDC",
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // ECR への push 権限を付与
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ecr:CompleteLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:BatchGetImage",
        ],
        resources: [
          `arn:aws:ecr:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:repository/*`,
        ],
      }),
    );

    // ECR ログイン用のトークン取得は Resource: "*" で許可
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ecr:GetAuthorizationToken"],
        resources: ["*"],
      }),
    );
  }
}
