#!/usr/bin/env bash
set -Eeuo pipefail

# shellcheck disable=SC2034
export PGPASSWORD=Passw0rd

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SQL_DIR=${SCRIPT_DIR}/../sql

SCRIPTS=(
	"$SQL_DIR/schema/schema.sql"
	"$SQL_DIR/table/category.sql"
	"$SQL_DIR/table/date.sql"
	"$SQL_DIR/table/users.sql"
	"$SQL_DIR/table/venue.sql"
	"$SQL_DIR/table/event.sql"
	"$SQL_DIR/table/listing.sql"
	"$SQL_DIR/table/sales.sql"
)

function main() {
	profile=$1

	account=$(aws --profile "$profile" sts get-caller-identity | jq -r '.Account')
	redshift_endpoint=datazone-source.${account}.ap-northeast-1.redshift-serverless.amazonaws.com
	redshift_port=5439
	redshift_db=tickitdb
	role=$(aws --profile "$profile" redshift-serverless get-namespace --namespace-name datazone-source | jq -r '.namespace.defaultIamRoleArn')

	# Redshift にロードするデータを、S3 にアップロード
	wget https://docs.aws.amazon.com/ja_jp/redshift/latest/gsg/samples/tickitdb.zip -O "${SCRIPT_DIR}/../tickitdb.zip"
	unzip tickitdb.zip -d tickitdb
	aws --profile "$profile" s3 cp ./tickitdb "s3://datazone-source-${account}/tickitdb/" --recursive
	rm tickitdb.zip
	rm -r ./tickitdb

	# テーブル作成
	for script in "${SCRIPTS[@]}"; do
		psql -h "$redshift_endpoint" -p "$redshift_port" -d "${redshift_db}" -U admin -f "$script"
	done

	# データロード
	sed "s/ACCOUNT/${account}/g" "${SQL_DIR}/copy/copy.sql" >"${SQL_DIR}/copy/copy_replace.sql" # psqlの変数で上手く管理できなかったので、強引に実行スクリプトを置換
	psql -h "$redshift_endpoint" -p "$redshift_port" -d "${redshift_db}" -U admin \
		-f "${SQL_DIR}/copy/copy_replace.sql" \
		-v role="$role"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
	main "$@"
fi
