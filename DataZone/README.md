# DataZone

`demo` という名前の DataZone を作成する。

## DataZone プロジェクト構成

|                         | ProjectProducer                                                                                    | ProjectConsumer                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 用途                    | データ公開側                                                                                       | データ参照側                                                        |
| Environment             | dwh-producer<br>lake-producer                                                                      | dwh-consumer<br>lake-consumer                                       |
| Data Source             | dwh-consumer-default-datasource<br>lake-consumer-default-datasource<br>redshift-demo<br>datasource | dwh-consumer-default-datasource<br>lake-consumer-default-datasource |
| (user) Data Steward     | role/DataZone-data-steward                                                                         | role/DataZone-data-steward                                          |
| (user) Data Owner       | role/DataZone-data-owner                                                                           |                                                                     |
| (user) Data Contributor | role/DataZone-data-contributor                                                                     |                                                                     |
| (user) Data Consumer    |                                                                                                    | role/DataZone-data-consumer                                         |
| (user) Data Viewer      |                                                                                                    | role/DataZone-data-viewer                                           |

## 利用している DataSource

- Redshift
  - [sample TICKIT](https://docs.aws.amazon.com/ja_jp/redshift/latest/dg/c_sampledb.html)
- S3 DataLake
  - [web-and-social-analytics.csv.zip](https://docs.aws.amazon.com/ja_jp/quicksight/latest/user/quickstart-createanalysis.html)

## デプロイ手順

前提として、対象 AWS 環境向けの profile 名を `private` に設定して利用する。

以下を上から順番に実行する。

```sh
$ npm run
Scripts available in data_zone@0.1.0 via `npm run-script`:
  deploy-datasource
    npx cdk --profile private deploy --require-approval never DataSource
  load-redshift
    bash scripts/load-redshift.sh private
  run-crawler
    bash scripts/run-crawler.sh private
  deploy-datazone
    bash scripts/deploy-datazone.sh private
  run-datasource
    bash scripts/run-datasource.sh private
  create-lake-environment
    bash scripts/create-lake-environment.sh private
  remove-permissions
    bash scripts/remove-permissions-for-all-users.sh private
```

以下作業は自動化できなかったため（おそらく LakeFormation との権限関連）、AWS コンソールより手動で設定。

- domain で `Default DataLake` BluePrint を有効化
- ProjectProducer 側で、DataLake 向けの以下を作成
  - Environment Profiler を作成
  - Environment を作成
  - DataSource を作成
- ProjectConsumer 側で、DataLake 向けの以下を作成
  - Environment Profiler を作成
  - Environment を作成

## 管理者の登録方法

[bin/dataZone.ts](bin/dataZone.ts) の administrators 配列に、IAM Role の ARN を追加。

デプロイ。

```sh
npm run deploy-datasource
```

以下のスクリプトを実行。`{IAM Role名}` は ARN でなく、Role 名を指定。

```sh
bash scripts/add-root-domain-owner.sh private {IAM Role名}
```

## 参考資料

- [Amazon DataZone Overview | Black Belt](https://pages.awscloud.com/rs/112-TZM-766/images/AWS-Black-Belt_2023_Amazon-DataZone-Overview_1231_v1.pdf)
- [amazon-datazone-cdk-example | GitHub](https://github.com/aws-samples/amazon-datazone-cdk-example)
- [Implement data quality checks on Amazon Redshift data assets and integrate with Amazon DataZone](https://aws.amazon.com/jp/blogs/big-data/implement-data-quality-checks-on-amazon-redshift-data-assets-and-integrate-with-amazon-datazone/)
