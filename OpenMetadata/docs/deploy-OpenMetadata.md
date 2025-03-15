# OpenMetadata デプロイ手順

## 環境変数設定

```sh
export AWS_PROFILE=private
export AWS_REGION=ap-northeast-1

export EC2InstanceId=$(aws ec2 describe-instances | jq -r '.Reservations[].Instances[] | select(.Tags[]?.Value == ("OpenMetadata/EC2/Bastion")).InstanceId')
export FILESYSTEM_ID=$(aws efs describe-file-systems | jq -r '.FileSystems[] | select(.Tags[]?.Value == ("OpenMetadata/EFS/FileSystem")).FileSystemId')
export OpenSearchDomain=$(aws opensearch list-domain-names | jq -r '.DomainNames[] | select(.DomainName | startswith("opensearch")).DomainName')
export OpenSearchEndpoint=$(aws opensearch describe-domain --domain-name $OpenSearchDomain | jq -r '.DomainStatus.Endpoints.vpc')
export RDSEndpoint=$(aws rds describe-db-instances | jq -r '.DBInstances[] | select(.TagList[]?.Value == ("OpenMetadata")).Endpoint.Address')

export VPC_ID=$(aws ec2 describe-vpcs | jq -r '.Vpcs[] | select(.Tags[]?.Value == ("OpenMetadata/VPC/VPC")).VpcId')
export SUBNET_ID_1A=$(aws ec2 describe-subnets | jq -r '.Subnets[] | select(((.Tags[]?.Value == ("OpenMetadata")) and .AvailabilityZone == "ap-northeast-1a")).SubnetId')
export SUBNET_ID_1C=$(aws ec2 describe-subnets | jq -r '.Subnets[] | select(((.Tags[]?.Value == ("OpenMetadata")) and .AvailabilityZone == "ap-northeast-1c")).SubnetId')
export SUBNET_ID_1D=$(aws ec2 describe-subnets | jq -r '.Subnets[] | select(((.Tags[]?.Value == ("OpenMetadata")) and .AvailabilityZone == "ap-northeast-1d")).SubnetId')

export ACCOUNT_ID=$(aws sts get-caller-identity | jq -r '.Account')
export cluster_name=open-meta-data
export role_name=AmazonEKS-EFS-CSI-Driver
```

## MySQL 内にデータベース作成

ポートフォワーディング。

```sh
aws ssm start-session --target $EC2InstanceId \
--document-name AWS-StartPortForwardingSessionToRemoteHost \
--parameters host="$RDSEndpoint",portNumber="3306",localPortNumber="13306"
```

接続。パスワードは `Passw0rd` 。

```sh
mysql -h 127.0.0.1 -P 13306 -u root -p
```

データベース作成。

```sh
mysql> source scripts/sql/openmetadata_db.sql
mysql> source scripts/sql/airflow_db.sql

mysql> show databases;
```

## EKS Cluster の作成

コンフィグ生成。

```sh
cp config/eksctl/default/cluster.yml config/eksctl/cluster.yml

sed -i "s/VPC_ID/$VPC_ID/g" config/eksctl/cluster.yml
sed -i "s/SUBNET_ID_1A/$SUBNET_ID_1A/g" config/eksctl/cluster.yml
sed -i "s/SUBNET_ID_1C/$SUBNET_ID_1C/g" config/eksctl/cluster.yml
sed -i "s/SUBNET_ID_1D/$SUBNET_ID_1D/g" config/eksctl/cluster.yml
```

クラスター作成。

```sh
eksctl create cluster -f config/eksctl/cluster.yml
```

kubeconfig 更新。

```sh
aws eks update-kubeconfig --region ap-northeast-1 --name open-meta-data
```

確認。

```sh
$ eksctl get cluster
NAME            REGION          EKSCTL CREATED
open-meta-data  ap-northeast-1  True

$ kubectl get pod -A
NAMESPACE     NAME                              READY   STATUS    RESTARTS   AGE
kube-system   aws-node-852k7                    2/2     Running   0          94m
kube-system   coredns-6d78c58c9f-clvmp          1/1     Running   0          97m
kube-system   coredns-6d78c58c9f-hscjc          1/1     Running   0          97m
kube-system   kube-proxy-8ktrf                  1/1     Running   0          94m
kube-system   metrics-server-7df788564f-hzpgf   1/1     Running   0          97m
kube-system   metrics-server-7df788564f-jn2vd   1/1     Running   0          97m
```

## IAM OIDC プロバイダーの作成

クラスターの OIDC 発行者 ID を取得。

```sh
oidc_id=$(aws eks describe-cluster \
--name $cluster_name \
--query "cluster.identity.oidc.issuer" \
--output text | cut -d '/' -f 5)
```

上記の発行者 ID を持つプロパイダーが存在するか確認。

```sh
aws iam list-open-id-connect-providers | grep $oidc_id | cut -d "/" -f4
```

不在の場合にプロパイダーを作成。

```sh
eksctl utils associate-iam-oidc-provider \
--cluster $cluster_name --approve
```

[クラスターの IAM OIDC プロバイダーを作成する](https://docs.aws.amazon.com/ja_jp/eks/latest/userguide/enable-iam-roles-for-service-accounts.html)

## EFS CSI Driver の追加

`AmazonEFSCSIDriverPolicy` ポリシーを所持した IAM Role の作成。

```sh
eksctl create iamserviceaccount \
--name efs-csi-controller-sa \
--namespace kube-system \
--cluster $cluster_name \
--role-name $role_name \
--role-only \
--attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEFSCSIDriverPolicy \
--approve

TRUST_POLICY=$(aws iam get-role \
--role-name $role_name \
--query 'Role.AssumeRolePolicyDocument' \
| sed -e 's/efs-csi-controller-sa/efs-csi-*/' -e 's/StringEquals/StringLike/')

aws iam update-assume-role-policy \
--role-name $role_name \
--policy-document "$TRUST_POLICY"
```

[Amazon EFS で伸縮自在なファイルシステムを保存する](https://docs.aws.amazon.com/ja_jp/eks/latest/userguide/efs-csi.html#eksctl_efs_store_app_data)

Amazon EFS CSI ドライバー向けの EKS Addon の追加。

下記は参考。追加可能な Addon のバージョンを確認する場合。

```sh
eksctl utils describe-addon-versions \
--kubernetes-version 1.32 \
--name aws-efs-csi-driver \
| grep AddonVersion | more
```

追加。

```sh
eksctl create addon \
--cluster $cluster_name \
--name aws-efs-csi-driver \
--version latest \
--service-account-role-arn arn:aws:iam::$ACCOUNT_ID:role/$role_name \
--force
```

[アマゾン EKS アドオンを作成する](https://docs.aws.amazon.com/ja_jp/eks/latest/userguide/creating-an-add-on.html)

確認。

```sh
$ eksctl get addon --cluster $cluster_name
NAME                    VERSION                 STATUS  ISSUES  IAMROLE                                                 UPDATE AVAILABLE        CONFIGURATION VALUES    POD IDENTITY ASSOCIATION ROLES
aws-efs-csi-driver      v2.1.4-eksbuild.1       ACTIVE  0       arn:aws:iam::123456789012:role/AmazonEKS-EFS-CSI-Driver
coredns                 v1.11.4-eksbuild.2      ACTIVE  0
kube-proxy              v1.32.0-eksbuild.2      ACTIVE  0
metrics-server          v0.7.2-eksbuild.1       ACTIVE  0
vpc-cni                 v1.19.2-eksbuild.1      ACTIVE  0
```

- その他参考情報
  - [aws-efs-csi-driver | GitHub](https://github.com/kubernetes-sigs/aws-efs-csi-driver/tree/master)

## EFS にディレクトリ作成

EFS のファイルシステムに、（自動的には作成してくれないため）マウントパス用のディレクトリを作成する。

踏み台サーバーに接続。

```sh
echo $FILESYSTEM_ID
aws ssm start-session --target $EC2InstanceId
```

EFS をマウントして、Airflow 向けのディレクトリを作成。

```sh
sudo yum install -y amazon-efs-utils

sudo mkdir /efs
sudo mount -t efs -o tls {FILESYSTEM_ID}:/ /efs
sudo mkdir -p /efs/airflow-logs /efs/airflow-dags
sudo umount /efs
```

## PersistentVolume を作成

コンフィグを生成。

```sh
cp config/manifests/default/dags_pv_pvc.yml config/manifests/dags_pv_pvc.yml
cp config/manifests/default/logs_pv_pvc.yml config/manifests/logs_pv_pvc.yml

sed -i "s/FILESYSTEM_ID/$FILESYSTEM_ID/g" config/manifests/dags_pv_pvc.yml
sed -i "s/FILESYSTEM_ID/$FILESYSTEM_ID/g" config/manifests/logs_pv_pvc.yml
```

作成。

```sh
kubectl create -f config/manifests/dags_pv_pvc.yml
kubectl create -f config/manifests/logs_pv_pvc.yml
```

確認。

```sh
$ kubectl get pv
NAME                                CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                                        STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
openmetadata-dependencies-dags-pv   10Gi       RWX            Retain           Bound    default/openmetadata-dependencies-dags-pvc                  <unset>                          45s
openmetadata-dependencies-logs-pv   5Gi        RWX            Retain           Bound    default/openmetadata-dependencies-logs-pvc                  <unset>                          37s
```

## マウントする EFS ファイルシステムの Permission を変更

> Since airflow pods run as non root users, they would not have write access on the nfs server volumes. In order to fix the permission here, spin up a pod with persistent volumes attached and run it once.

[Change owner and permission manually on disks](https://docs.open-metadata.org/latest/deployment/kubernetes/eks#change-owner-and-permission-manually-on-disks)

実行。

```sh
kubectl create -f config/manifests/permissions_pod.yml
```

確認。

```sh
$ kubectl get pods
NAME             READY   STATUS    RESTARTS   AGE
permission-pod   1/1     Running   0          19s
```

## 利用する Secret 作成

作成。

```sh
kubectl create secret generic airflow-mysql-secrets --from-literal=airflow-mysql-password=Passw0rd
kubectl create secret generic mysql-secrets --from-literal=openmetadata-mysql-password=Passw0rd
kubectl create secret generic airflow-secrets --from-literal=openmetadata-airflow-password=admin
kubectl create secret generic elasticsearch-secrets --from-literal=openmetadata-elasticsearch-password=P@ssw0rd

# kubectl create secret generic openmetadata-postgresql-secrets --from-literal=openmetadata-postgresql-password=Passw0rd
# kubectl create secret generic airflow-postgresql-secrets --from-literal=airflow-postgresql-password=Passw0rd
```

確認。

```sh
$ kubectl get secret -A
NAMESPACE   NAME                              TYPE     DATA   AGE
default     airflow-mysql-secrets             Opaque   1      6s
default     airflow-postgresql-secrets        Opaque   1      43s
default     airflow-secrets                   Opaque   1      10s
default     elasticsearch-secrets             Opaque   1      53s
default     mysql-secrets                     Opaque   1      45s
default     openmetadata-postgresql-secrets   Opaque   1      44s
```

## helm インストール（dependencies を実行）

OpenMetadata 向けのリポジトリを追加。

```sh
helm repo add open-metadata https://helm.open-metadata.org --force-update
helm repo update
helm repo list
```

コンフィグを生成。

```sh
cp config/helm/default/values-dependencies-mysql.yml config/helm/values-dependencies.yml

sed -i "s/AMAZON_OPENSEARCH_SERVICE_ENDPOINT_WITHOUT_HTTPS/$OpenSearchEndpoint/g" config/helm/values-dependencies.yml
sed -i "s/AMAZON_RDS_ENDPOINT/$RDSEndpoint/g" config/helm/values-dependencies.yml
```

インストール。

```sh
helm install openmetadata-dependencies open-metadata/openmetadata-dependencies --values config/helm/values-dependencies.yml
```

確認。

```sh
$ kubectl get pod
NAME                                                       READY   STATUS    RESTARTS   AGE
my-permission-pod                                          1/1     Running   0          9m34s
openmetadata-dependencies-db-migrations-75457fc65d-x75wn   1/1     Running   0          6m11s
openmetadata-dependencies-scheduler-759486bfd8-b6s5l       1/1     Running   0          6m11s
openmetadata-dependencies-sync-users-d6b99b75c-bplds       1/1     Running   0          6m11s
openmetadata-dependencies-triggerer-6cd87f5948-bt78r       1/1     Running   0          6m11s
openmetadata-dependencies-web-5b459dfd7f-jflfq             1/1     Running   0          6m11s
```

## helm インストール（OpenMetadata を起動）

コンフィグを生成。

```sh
cp config/helm/default/values-mysql.yml config/helm/values.yml

sed -i "s/AMAZON_OPENSEARCH_SERVICE_ENDPOINT_WITHOUT_HTTPS/$OpenSearchEndpoint/g" config/helm/values.yml
sed -i "s/AMAZON_RDS_ENDPOINT/$RDSEndpoint/g" config/helm/values.yml
```

インストール。

```sh
helm install openmetadata open-metadata/openmetadata --values config/helm/values.yml
```

確認。

```sh
$ kubectl get pod
NAME                                                       READY   STATUS    RESTARTS   AGE
openmetadata-6854cb896d-dnsjb                              1/1     Running   0          35m
openmetadata-dependencies-db-migrations-6dd7f78d46-s45cf   1/1     Running   0          38m
openmetadata-dependencies-scheduler-58c69f844d-4shrw       1/1     Running   0          38m
openmetadata-dependencies-sync-users-544c4574d9-kvjq5      1/1     Running   0          38m
openmetadata-dependencies-triggerer-75d559f44d-mm4ws       1/1     Running   0          38m
openmetadata-dependencies-web-5798648f67-pv6mg             1/1     Running   0          38m
permission-pod                                             1/1     Running   0          39m
```

## kubectl port-forward

ローカル環境から接続するため、ポートフォワードを実行。

```sh
export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=openmetadata,app.kubernetes.io/instance=openmetadata" -o jsonpath="{.items[0].metadata.name}")
export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
kubectl --namespace default port-forward $POD_NAME 8585:$CONTAINER_PORT
```

以下 URL にアクセス。

> http://127.0.0.1:8585

Admin ユーザーのログイン情報。

- Username
  - admin@open-metadata.org
- Password
  - admin

[UserName/Password Login | OpenMetadata](https://docs.open-metadata.org/latest/deployment/security/basic-auth#usernamepassword-login)
