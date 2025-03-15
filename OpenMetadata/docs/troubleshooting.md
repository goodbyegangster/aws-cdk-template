# troubleshooting

## 環境変数設定

```sh
export AWS_PROFILE=private
export AWS_REGION=ap-northeast-1

export EC2InstanceId=$(aws ec2 describe-instances | jq -r '.Reservations[].Instances[] | select(.Tags[]?.Value == ("OpenMetadata/EC2/Bastion")).InstanceId')
export OpenSearchDomain=$(aws opensearch list-domain-names | jq -r '.DomainNames[] | select(.DomainName | startswith("opensearch")).DomainName')
export OpenSearchEndpoint=$(aws opensearch describe-domain --domain-name $OpenSearchDomain | jq -r '.DomainStatus.Endpoints.vpc')
export RDSEndpoint=$(aws rds describe-db-instances | jq -r '.DBInstances[] | select(.TagList[]?.Value == ("OpenMetadata")).Endpoint.Address')
export FILESYSTEM_ID=$(aws efs describe-file-systems | jq -r '.FileSystems[] | select(.Tags[]?.Value == ("OpenMetadata/EFS/FileSystem")).FileSystemId')
```

## EC2

```sh
aws ssm start-session --target $EC2InstanceId
```

[aws ssm start-session](https://docs.aws.amazon.com/cli/latest/reference/ssm/start-session.html)

## RDS(MySQL)

```sh
aws ssm start-session --target $EC2InstanceId \
--document-name AWS-StartPortForwardingSessionToRemoteHost \
--parameters host="$RDSEndpoint",portNumber="3306",localPortNumber="13306"
```

```sh
mysql -h 127.0.0.1 -P 13306 -u root sample
```

パスワードは `Passw0rd`

## RDS(PostgreSQL)

```sh
aws ssm start-session --target $EC2InstanceId \
--document-name AWS-StartPortForwardingSessionToRemoteHost \
--parameters host="$RDSEndpoint",portNumber="5432",localPortNumber="15432"
```

```sh
psql -h localhost -p 15432 -U root -d sample
```

パスワードは `Passw0rd`

## OpenSearch Service

```sh
aws ssm start-session --target $EC2InstanceId \
--document-name AWS-StartPortForwardingSessionToRemoteHost \
--parameters host="$OpenSearchEndpoint",portNumber="443",localPortNumber="50443"
```

```sh
curl -XGET --insecure --user "master:P@ssw0rd" https://localhost:50443/_cat/indices
```

## EFS

```sh
aws ssm start-session --target $EC2InstanceId
echo $FILESYSTEM_ID
```

```sh
sudo yum install -y amazon-efs-utils

sudo mkdir /efs
sudo mount -t efs -o tls {FILESYSTEM_ID}:/ /efs
```

## EKS

```sh
kubectl events

kubectl logs {pod名}
```
