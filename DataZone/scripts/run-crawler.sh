#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DATA_FILE=${SCRIPT_DIR}/../glue/web-and-social-analytics.csv

function main() {
	profile=$1

	account=$(aws --profile "$profile" sts get-caller-identity | jq -r '.Account')
	aws --profile "$profile" s3 cp "$DATA_FILE" "s3://datazone-source-${account}/web-and-social-analytics/"
	aws --profile "$profile" glue start-crawler --name crawler_datasource
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
