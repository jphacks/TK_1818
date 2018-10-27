// -----------------------------------------------------------------------------
// モジュールのインポート
const server = require("express")();
const line = require("@line/bot-sdk"); // Messaging APIのSDKをインポート
const mongodb = require('mongodb')
const fs = require('fs')
const MongoClient = mongodb.MongoClient //mongodbを利用するためのインスタンス
const messageTemplate = require('./src/modules/MessageTemplate')
const LINEModule = require('./src/modules/LINEMessage')
const LINEMessage = LINEModule.lineMessage
const Verifier = require('./src/modules/verifier')
const Morphological = require('./src/modules/morph')
// -----------------------------------------------------------------------------
// パラメータ設定
const line_config = {
    channelAccessToken: process.env.LINE_ACCESS_TOKEN, // 環境変数からアクセストークンをセットしています
    channelSecret: process.env.LINE_CHANNEL_SECRET // 環境変数からChannel Secretをセットしています
};
const mongodbURI = process.env.MONGODB_URI; //環境変数からMongoDBのURIを取得
const mongodbAddress = mongodbURI.split("//")[1].split(":")[0]; //

var words = fs.readFileSync('./src/assets/ngword.csv', 'utf-8').split(',')
var ng_dict = {}
for(word in words){
    ng_dict[words[word]] = true
}

console.log("mongodbURI: "+ mongodbURI);
console.log("mogodbAddress: "+mongodbAddress);

// -----------------------------------------------------------------------------
// Webサーバー設定
server.listen(process.env.PORT || 3000);

// -----------------------------------------------------------------------------
// 定型文の登録
const START_MESSAGE = "「投稿」or「表示」";
const POST_MESSAGE = "投稿する内容を入力してください";
const CONFIRM_MESSAGE = "以下の内容でよろしいですか？\n訂正する場合は入力しなおしてください";
const CANCEL_POST_MESSAGE = "投稿をキャンセルしました";
const POST_DONE_MESSAGE = "投稿が完了しました！";
const CANCEL = "キャンセル";
const SHOW = "表示";
const POST = "投稿";
const ACCEPT_POST = "投稿する";
const DENY_POST = "訂正する";


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

/*
 * followイベントの処理
 */
function followProcessor(event){
    var userID = event.source.userId;
    getUserDataFromDB(event, userID, verifyUserCallBack);
    replyStartMessage(event);
}

/*
 * データベース上にユーザが存在するか確認して、存在しなければ追加する
 */
function verifyUserCallBack(event, userID, userData){
    if(userData == null){
        console.log("user data is null!");
        userData = makeNewUserData(userID); //データベース上にuserが登録されていなければ、登録する
    }
}

/*
 * イベントタイプがメッセージで、かつ、テキストタイプだった場合の処理を行う
 * userDataなどがデータベースからコールバックされてくる
 */
function messageTextProcessorCallBack(event, userID, userData){
    if(userData == null)return;

    var status = userData['status'];
    var nextStatus = 1; //次にセットされるステータス
    if(status == 1){
        nextStatus = stage1Processor(event, userData);
    }else if(status == 2){
        nextStatus = stage2Processor(event, userData);
    }else if(status == 3){
        nextStatus = stage3Processor(event, userData);
    }else{
        return;
    }
    if(nextStatus == 1){
        // replyStartMessage(event);
    }
    userData['status'] = nextStatus;
    updateUserData(userData);
}



/*
 * 投稿 or 表示を選択したあとの処理を行う
 * 返り値は次のステータス
 */
function stage1Processor(event, userData){
    var text = event.message.text; //入力された文字
    if(text == SHOW){
        //「表示」
        getDBData(event, 'post', {userID:userData.userID}, function(event, condition, find){
            var conts = []
            //flex post messageを配列にpush
            for(index in find){
                if(conts.length == 10)break;
                conts.push(messageTemplate.FlexPostMessage.getTemplate(find[index]).content)
            }
            //LINEMessageに配列を連想配列にして入れるとカルーセルもらえる
            var msg = new LINEMessage(
                {'content' : conts}
            ).makeCarousel(conts).makeFlex('投稿内容表示')
            if(conts.length != 0){
                sendQuery(event.replyToken, msg)
            }
        });
        return 1;
    }else if(text == POST){
        //「投稿」
        stage1POST(event, userData);
        return 2;
    }else{
        //それ以外なので、移動しない
        return 1;
    }
}

/*
 * 投稿内容を入力したあとの処理を行う
 * 返り値は次のステータス
 */
function stage2Processor(event, userData){
    var text = event.message.text; //投稿の文章
    if(text == CANCEL){
        // 投稿をキャンセルする
        replyCancelMessage(event);
        return 1;
    }else{
        // 投稿内容が正しいかの確認を促す
        // 投稿内容をDBに一時保存
        makeNewPostData(userData.userID, text);
        replyConfirmMessage(event, text);
        return 3;
    }
}

/*
 * 投稿内容が正しいかの確認をしたあとの処理を行う
 * 返り値は次のステータス
 */
function stage3Processor(event, userData){
    var text = event.message.text;
    if(text == CANCEL){
        // 「キャンセル」
        deletePendingPostData(userData.userID);
        replyCancelMessage(event);
        return 1;
    }else if(text == ACCEPT_POST){
        // 「投稿する」
        // 投稿内容をDB上で確定する
        fixPostData(userData.userID);
        replyPostDoneMessage(event);
        return 1;
    }else{
        // 投稿内容を訂正する
        deletePendingPostData(userData.userID);
        makeNewPostData(userData.userID, text);
        replyConfirmMessage(event, text);
        return 3;
    }
}

/*
 * 投稿文の入力を促すメッセージを出す
 */
function stage1POST(event, userData){
    sendQuery(event.replyToken, {
        type: "text",
        text: POST_MESSAGE
    });
}

/*
 * スタートメッセージを送信
 */
function replyStartMessage(event){
    sendQuery(event.replyToken, messageTemplate.QuickReplyMessage.getTemplate(
        START_MESSAGE, 
        {
            "type": "text",
            "label": "投稿"
        },{
            "type": "text",
            "label": "表示"
        }
    ));
}

/*
 * 確認メッセージを送信
 */
function replyConfirmMessage(event, text){
    bot.replyMessage(event.replyToken, {
        type: "text",
        text: CONFIRM_MESSAGE + "\n「" + text + "」"
    });
}

/*
 * キャンセルメッセージを送信
 */
function replyCancelMessage(event){
    bot.replyMessage(event.replyToken, {
        type: "text",
        text: CANCEL_POST_MESSAGE
    });
}

/*
 * 投稿完了メッセージを送信
 */
function replyPostDoneMessage(event){
    bot.replyMessage(event.replyToken, {
        type: "text",
        text: POST_DONE_MESSAGE
    });
}

/*
 * 長さ32の乱数文字列を生成
 */
function makeRandomString(){
    // 生成する文字列の長さ
    var l = 32;
    // 生成する文字列に含める文字セット
    var c = "abcdefghijklmnopqrstuvwxyz0123456789";
    var cl = c.length;
    var r = "";
    for(var i=0; i<l; i++){
        r += c[Math.floor(Math.random()*cl)];
    }
    return r;
}

/*
 * dateをformatの形式に変換して返す関数
 */
function sampleDate(date, format) {
    format = format.replace(/YYYY/, date.getFullYear());
    format = format.replace(/MM/, date.getMonth() + 1);
    format = format.replace(/DD/, date.getDate());
    format = format.replace(/hh/, date.getHours());
    format = format.replace(/mm/, date.getMinutes());
    format = format.replace(/ss/, date.getSeconds());
 
    return format;
}
/*
 * 現在時刻のタイムスタンプ(日本時間)
 */
function getNowDateString(){
    let date = new Date();
    date.setTime(date.getTime() + 1000*60*60*9);// JSTに変換
    return sampleDate(date, 'YYYY/MM/DD hh:mm:ss');
}

function sendQuery(token, json) {
    bot.replyMessage(token, json);
}

function getDBData(event, collectionName, condition, callback){
    MongoClient.connect(mongodbURI, (error, client) => {
        var collection;
         const db = client.db(mongodbAddress);
     
        // コレクションの取得
        collection = db.collection(collectionName);
     
        // コレクション中で条件に合致するドキュメントを取得
        collection.find(condition).toArray((error, documents)=>{
            var find = [];
            for (var document of documents) {
                console.log('find!');
                console.log(document);
                find.push(document);
            }
            callback(event, condition, find);
        });
    });
}


/*
 * DBの「users」コレクションから指定したuserIDのデータを見つけて、callbackに投げる関数
 */
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

/*
 * 「users」テーブルを更新する
 */
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

/*
 * DB上に新しいユーザを作成する
 * statusは1で作成
 */
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

/*
 * DB上に新しいポストを作成する(まだ作業中なのでdateはpendingに設定)
 */
function makeNewPostData(userID, text){
    //get sentimental magnitude and score
    Morphological.magnitude(text, function(sentiment_data, ret2){
        //run morphological
        Morphological.morphological(ret2, function(ret3) {
            //verifying ng word to *****.
            text = Verifier.verifyNGWord(ng_dict, ret3)
            var ret_postData = {
                postID: makeRandomString(),
                userID: userID,
                text: text,
                magnitude: sentiment_data.sentences[0].sentiment.magnitude,
                score: sentiment_data.sentences[0].sentiment.score,
                stamp: "",
                date: "pending",
                category: "",
                goodCount: 0,
                badCount: 0,
                sadCount: 0,
                angryCount: 0
            };
            //temporary post mongo db client
            MongoClient.connect(mongodbURI, (error, client) => {
                var collection;
                const db = client.db(mongodbAddress);
                // コレクションの取得
                collection = db.collection('post');
                collection.insertOne(ret_postData, (error, result) => {
                    console.log("inserted!");
                });
            });
        })
    })
}

/*
 * pending状態のpostデータを確定する
 */
function fixPostData(userID){
    MongoClient.connect(mongodbURI, (error, client) => {
        var collection;

        const db = client.db(mongodbAddress);
     
        // コレクションの取得
        collection = db.collection('post');
        collection.updateMany(
            { userID: userID, date: "pending"},
            { $set: {date: getNowDateString()} },
        (error, result) => {
            console.log("fixed!!");
        });
    });
}

/*
 * DBからpending状態のポストデータを削除する
 */
function deletePendingPostData(userID){
    MongoClient.connect(mongodbURI, (error, client) => {
        var collection;
        const db = client.db(mongodbAddress);
        // コレクションの取得
        collection = db.collection('post');
        collection.deleteOne({ userID: userID, date: "pending"}, (error, result) => {
            console.log("deleted!");
        });
    });
}