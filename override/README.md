# override

AWS CDK で Terraform の ignore_change にあたる動作を実現したく、raw override 機能を調査したもの。

## 結論

Terraform の ignore_change にあたる動作は実現できなかった。

つまり、ずばり IaC 側でコード非管理にしたいパラメーターを指定するような方法は見つからなかった。

## 調査詳細

AWS CDK の raw override 機能は、生成された Cloud Formation のテンプレートより、指定したパラメーター部分を上書きしたり、削除したりできる機能。

本リポジトリにあるコードでは、addPropertyDeletionOverride メソッドを利用して、EventBridge Scheduler の State パラメーター（enable/disable を管理）を管理対象外にしようとした。

しかしながら、EventBridge Scheduler の State パラメーターには default 値が定義されているため、addPropertyDeletionOverride を利用して CloudFormation テンプレート上から値を削除しても、 default 値が常に有効となってしまうだけだった。

[raw オーバーライドを使用する](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/cfn-layer.html#develop-customize-override)
