// -----------------------------------------------------------------------------
// モジュールのインポート
const server = require("express")();
const line = require("@line/bot-sdk"); // Messaging APIのSDKをインポート
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient //mongodbを利用するためのインスタンス

// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};
const mongodbURI = process.env.MONGODB_URI; //環境変数からMongoDBのURIを取得
const mongodbAddress = mongodbURI.split("//")[1].split(":")[0]; //

console.log("mongodbURI: "+ mongodbURI);
console.log("mogodbAddress: "+mongodbAddress);

// -----------------------------------------------------------------------------
// Webサーバー設定
server.listen(process.env.PORT || 3000);

// -----------------------------------------------------------------------------
// 定型文の登録
const START_MESSAGE = "「投稿」or「表示」";
const POST_MESSAGE = "投稿する内容を入力してください";
const SHOW = "表示";
const POST = "投稿";


// -----------------------------------------------------------------------------
// ルーター設定
const bot = new line.Client(line_config);
server.post('/webhook', line.middleware(line_config), (req, res, next) => {
    // 先行してLINE側にステータスコード200でレスポンスする。
    res.sendStatus(200);

    // イベントオブジェクトを順次処理。
    req.body.events.forEach((event) => {
        // bot.replyMessage()で返答を送信
        eventProcessor(event);
    });
});

/*
 * LINE Messaging APIから送られてくるeventを処理して、bot.replyMessageする
 */
function eventProcessor(event){
    var promise_ret = null;

    console.log("event type: "+event.type); //eventタイプを出力しておく

    var userID = event.source.userId; //LINEを送ってきたユーザのID
    console.log("userID: "+userID);
    

    if (event.type == "message" && event.message.type == "text"){
        //イベントタイプがメッセージで、かつ、テキストタイプだった場合の処理
        getUserDataFromDB(event, userID, messageTextProcessorCallBack);
    }else if(event.type == "follow"){
        // スタートメッセージを送信する
        followProcessor(event);
    }

    return promise_ret;
}

//イベントタイプがフォローの処理
function followProcessor(event){
    var userID = event.source.userId;
    getUserDataFromDB(event, userID, sendStage1MessageCallBack);
}

function getUserDataFromDB(event, userID, callback){
    MongoClient.connect(mongodbURI, (error, client) => {
            var collection;
    
            const db = client.db(mongodbAddress);
         
            // コレクションの取得
            collection = db.collection('users');
         
            // コレクション中で条件に合致するドキュメントを取得
            collection.find({'userID': userID}).toArray((error, documents)=>{
                var find = null;
                for (var document of documents) {
                    console.log('find!');
                    console.log(document);
                    find = document;
                    break;
                }
                callback(event, userID, find);
            });
        });
}

// 表示or投稿を聞くときの処理
function sendStage1MessageCallBack(event, userID, userData){
    if(userData == null){
        console.log("user data is null!");
        userData = makeNewUserData(userID); //データベース上にuserが登録されていなければ、登録する
    }
    replyStartMessage(event); //yes or noのメッセージを送る
}

//DB上に新しいユーザを作成する
function makeNewUserData(userID){
    var ret_userData = {'userID': userID, status: 1, showData: "", count: 0};
    MongoClient.connect(mongodbURI, (error, client) => {
        var collection;
        const db = client.db(mongodbAddress);
        // コレクションの取得
        collection = db.collection('users');
        collection.insertOne(ret_userData, (error, result) => {
            console.log("inserted!");
        });
    });
    return ret_userData;
}

//イベントタイプがメッセージで、かつ、テキストタイプだった場合のevent処理
function messageTextProcessorCallBack(event, userID, userData){
    if(userData == null)return;

    var status = userData['status'];
    var nextStatus = 1;
    if(status == 1){
        nextStatus = stage1Processor(event, userData);
    }else if(status == 2){

    }else if(status == 3){

    }else{
        return;
    }
    userData['status'] = nextStatus;
    updateUserData(userData);
}

function updateUserData(userData){
    MongoClient.connect(mongodbURI, (error, client) => {
        var collection;

        const db = client.db(mongodbAddress);
     
        // コレクションの取得
        collection = db.collection('users');
        collection.updateMany(
            { userID: userData.userID },
            { $set: userData },
        (error, result) => {
            console.log("updated!");
        });
    });
}

function stage1Processor(event, userData){
    var text = event.message.text;
    if(text == SHOW){
        
    }else if(text == POST){
        stage1POST(event, userData);
        return 2;
    }else{
        replyStartMessage(event);
        return 1;
    }
}

function stage1POST(event, userData){
    bot.replyMessage(event.replyToken, {
        type: "text",
        text: POST_MESSAGE
    });
}

/*
 * スタートメッセージを送信し、プロミスを返す
 */
function replyStartMessage(event){
    bot.replyMessage(event.replyToken, {
        type: "text",
        text: START_MESSAGE
    });
}

function sleep(waitMsec) {
    var startMsec = new Date();

    // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
    while (new Date() - startMsec < waitMsec);
}