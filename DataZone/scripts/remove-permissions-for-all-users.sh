#!/bin/usr/env bash
set -Eeuo pipefail

# NOTE: https://docs.aws.amazon.com/cli/latest/reference/datazone/#cli-aws-datazone
# shellcheck disable=SC1083

function main() {
	profile=$1

	# domain id を取得
	domain_id=$(aws --profile "${profile}" datazone list-domains |
		jq -r '.items[] | select( .name == "demo" ) | .id')

	# root domain unit id を取得
	root_domain_unit_id=$(aws --profile "${profile}" datazone get-domain \
		--identifier "${domain_id}" |
		jq -r '.rootDomainUnitId')

	# domain unit 作成権限から all users を除去
	aws --profile "${profile}" datazone remove-policy-grant \
		--domain-identifier "${domain_id}" \
		--entity-identifier "${root_domain_unit_id}" \
		--entity-type DOMAIN_UNIT \
		--policy-type CREATE_DOMAIN_UNIT \
		--principal user={allUsersGrantFilter={}}

	# project 作成権限から all users を除去
	aws --profile "${profile}" datazone remove-policy-grant \
		--domain-identifier "${domain_id}" \
		--entity-identifier "${root_domain_unit_id}" \
		--entity-type DOMAIN_UNIT \
		--policy-type CREATE_PROJECT \
		--principal user={allUsersGrantFilter={}}

	# 下記の権限も管理したほうが良いと思うのだが...
	# - createEnvironment
	# - createEnvironmentProfile
	# - createEnvironmentFromBlueprint
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
