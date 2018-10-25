# 各自のサーバにデプロイする方法

## 準備

### 必要なもの

- herokuサーバ
- LINEのチャンネル
    - Channel ID
    - Channel Secret
    - アクセストークン

### 設定しておくもの

- herokuサーバ
    - heroku config:set LINE_CHANNEL_ID=xxxxxxxxx -a 自分のherokuサーバ名
    - heroku config:set LINE_CHANNEL_SECRET=xxxxxxxxx -a 自分のherokuサーバ名
    - heroku config:set LINE_ACCESS_TOKEN=xxxxxxxxx -a 自分のherokuサーバ名
- LINEのチャンネル
    - Webhook URL: 「https://自分のherokuサーバ名.herokuapp.com/webhook」

## 手順

1. 「https://github.com/hokekyo1210/TK_1818」にアクセス
1. 「Branch:master」をクリックして、フォームに作成したいブランチの名前を入力しブランチを作成
1. herokuのサイトに行って自分のサーバの管理ページにアクセス
1. 「Deploy」メニューを選択して「Deployment method」をgithubに変更
1. 作成しておいたブランチをdeploy先に指定して、「Automatic Deploy」を有効にする
1. ターミナルで`git clone https://github.com/hokekyo1210/TK_1818.git`コマンドでクローン
1. ブランチを自分のブランチに切り替えて開発を進める
1. `git push origin 自分のブランチ`すると自分のherokuサバにdeployされている