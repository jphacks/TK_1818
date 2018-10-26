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


// -----------------------------------------------------------------------------
// ルーター設定
const bot = new line.Client(line_config);
server.post('/webhook', line.middleware(line_config), (req, res, next) => {
    // 先行してLINE側にステータスコード200でレスポンスする。
    res.sendStatus(200);

    // すべてのイベント処理のプロミスを格納する配列。
    let events_processed = [];

    // イベントオブジェクトを順次処理。
    req.body.events.forEach((event) => {
        // bot.replyMessage()で返答を送信、そのプロミスをevents_processedに追加。
        var promise = eventProcessor(event);
        events_processed.push(promise);
    });

    // すべてのイベント処理が終了したら何個のイベントが処理されたか出力。
    Promise.all(events_processed).then(
        (response) => {
            console.log(`${response.length} event(s) processed.`);
        }
    );
});

/*
 * LINE Messaging APIから送られてくるeventを処理して、bot.replyMessageのPromiseを返す
 */
function eventProcessor(event){
    var promise_ret = null;

    console.log("event type: "+event.type); //eventタイプを出力しておく

    var userID = event.source.userId; //LINEを送ってきたユーザのID
    console.log("userID: "+userID);
    

    if (event.type == "message" && event.message.type == "text"){
        //イベントタイプがメッセージで、かつ、テキストタイプだった場合の処理
        // promise_ret = messageTextProcessor(event);
    }else if(event.type == "follow"){
        // スタートメッセージを送信する
        promise_ret = followProcessor(event);
    }

    return promise_ret;
}

//イベントタイプがフォローの処理
function followProcessor(event){
    var promise_ret = sendStage1Message(event);
    return promise_ret;
}

// 表示or投稿を聞くときの処理
function sendStage1Message(event){
    var promise_ret = null;

    var userID = event.source.userId;
    var userData = getUserData(userID);
    if(userData == null){
        console.log("user data is null!");
        userData = makeNewUserData(userID); //データベース上にuserが登録されていなければ、登録する
    }
    promise_ret = replyStartMessage(event); //yes or noのメッセージを送る
    return promise_ret;
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

//DBに新しいユーザを登録
function insertNewUserDataToDB(userData){

}

//イベントタイプがメッセージで、かつ、テキストタイプだった場合のevent処理
function messageTextProcessor(event){
    var promise_ret = null;
    
    var userID = event.source.userId;
    var userData = getUserData(userID);


}

async function getUserData(userID){
    var ret_userData = null;
    console.log("get!");
    ret_userData = await getUserDataFromMongoDB(userID);
    console.log("done!: "+ret_userData);
    return ret_userData;
}

async function getUserDataFromMongoDB(userID){
    var datab = await MongoClient.connect(mongodbURI);
    console.log("a: "+datab);
    var db = datab.db(mongodbAddress);
    console.log("b: "+db);
    const MyCollection = db.collection('users');
    console.log("c: "+MyCollection);
    const result = await MyCollection.find({'userID': userID}).toArray();
    console.log("d: "+result);
    return result;
}

/*
 * スタートメッセージを送信し、プロミスを返す
 */
function replyStartMessage(event){
    var promise = bot.replyMessage(event.replyToken, {
        type: "text",
        text: START_MESSAGE
    });
    return promise;
}