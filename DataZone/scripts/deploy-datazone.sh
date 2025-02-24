#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CFN_DIR=${SCRIPT_DIR}/../lib/cfn
CFN_FILE=${CFN_DIR}/DataZone.yml

function main() {
	profile=$1

	# synth
	npx cdk synth \
		--version-reporting false \
		--path-metadata false DataZone |
		tee "$CFN_FILE"
	sed -i 's/^MFA .* \(Description.*$\)/\1/' "$CFN_FILE"

	# deploy
	aws --profile "$profile" --region ap-northeast-1 \
		cloudformation deploy \
		--stack-name DataZone \
		--template "$CFN_FILE" \
		--capabilities CAPABILITY_NAMED_IAM
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
