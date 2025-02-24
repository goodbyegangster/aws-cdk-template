#!/bin/usr/env bash
set -Eeuo pipefail

function main() {
	profile=$1

	# domain id を取得
	domain_id=$(aws --profile "$profile" datazone list-domains |
		jq -r '.items[] | select( .name == "demo" ) | .id')

	# project id を取得
	project_id=$(
		aws --profile "$profile" datazone list-projects \
			--domain-identifier "$domain_id" |
			jq -r '.items[] | select( .name == "ProjectProducer" ) | .id'
	)

	# datasource ID を取得
	datasource_id=$(
		aws --profile "$profile" datazone list-data-sources \
			--domain-identifier "$domain_id" \
			--project-identifier "$project_id" |
			jq -r '.items[] | select( .name == "redshift-demo" ) | .dataSourceId'
	)

	# datasource を実行
	# NOTE: https://docs.aws.amazon.com/cli/latest/reference/datazone/start-data-source-run.html
	aws --profile "$profile" datazone start-data-source-run \
		--domain-identifier "$domain_id" \
		--data-source-identifier "$datasource_id"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
