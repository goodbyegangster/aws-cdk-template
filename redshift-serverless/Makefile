.DEFAULT_GOAL := help

.PHONY: help
help:
	@printf "%-30s %-60s\n" "[Sub command]" "[Description]"
	@grep -E '^[0-9a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-30s %-60s\n", $$1, $$2}'

.PHONY: cdk-diff
cdk-diff: ## cdk-diff
	npx cdk --require-approval never diff RedshiftServerless

.PHONY: cdk-deploy
cdk-deploy: ## cdk-deploy
	npx cdk --require-approval never deploy RedshiftServerless

.PHONY: cdk-destroy
cdk-destroy: ## cdk-destroy
	npx cdk destroy --force RedshiftServerless
