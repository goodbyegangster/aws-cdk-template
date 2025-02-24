#!/bin/usr/env bash
set -Eeuo pipefail

# shellcheck disable=SC1083
# NOTE: https://docs.aws.amazon.com/cli/latest/reference/datazone/#cli-aws-datazone

function main() {
	profile=$1
	role=$2

	account=$(aws --profile "$profile" sts get-caller-identity | jq -r '.Account')

	# domain id を取得
	domain_id=$(aws --profile "$profile" datazone list-domains |
		jq -r '.items[] | select( .name == "demo" ) | .id')

	# root domain unit id を取得
	root_domain_unit_id=$(aws --profile "$profile" datazone get-domain \
		--identifier "${domain_id}" |
		jq -r '.rootDomainUnitId')

	# domain にユーザーを登録
	aws --profile "$profile" datazone create-user-profile \
		--domain-identifier "${domain_id}" \
		--user-type IAM_ROLE \
		--user-identifier "arn:aws:iam::${account}:role/${role}"

	# ユーザーの登録処理が完了するまで待つ
	sleep 5

	# domain owner にユーザーを追加
	aws --profile "$profile" datazone add-entity-owner \
		--domain-identifier "${domain_id}" \
		--entity-type DOMAIN_UNIT \
		--entity-identifier "${root_domain_unit_id}" \
		--owner user={userIdentifier="${role}"}

	# domain unit 作成権限を付与
	aws --profile "$profile" datazone add-policy-grant \
		--domain-identifier "${domain_id}" \
		--policy-type CREATE_DOMAIN_UNIT \
		--entity-type DOMAIN_UNIT \
		--entity-identifier "${root_domain_unit_id}" \
		--detail createDomainUnit={includeChildDomainUnits=true} \
		--principal user={userIdentifier="${role}"}

	# project 作成権限を付与
	aws --profile "$profile" datazone add-policy-grant \
		--domain-identifier "${domain_id}" \
		--policy-type CREATE_PROJECT \
		--entity-type DOMAIN_UNIT \
		--entity-identifier "${root_domain_unit_id}" \
		--detail createProject={includeChildDomainUnits=true} \
		--principal user={userIdentifier="${role}"}
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
