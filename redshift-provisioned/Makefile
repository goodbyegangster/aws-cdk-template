.DEFAULT_GOAL := help

.PHONY: help
help:
	@printf "%-30s %-60s\n" "[Sub command]" "[Description]"
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-30s %-60s\n", $$1, $$2}'

.PHONY: cdk-deploy
cdk-deploy: ## cdk-deploy
	npx cdk --require-approval never deploy RedshiftProvisioned

.PHONY: cdk-destroy
cdk-destroy: ## cdk-destroy
	npx cdk destroy --force RedshiftProvisioned

.PHONY: get-root-password
get-root-password: ## get-root-password
	@read -p "please input Secret Manager ARN: " arn; \
	aws secretsmanager get-secret-value \
  	  --secret-id "$${arn}" \
	  --query SecretString \
	  --output text \
	| jq -r '.password'
