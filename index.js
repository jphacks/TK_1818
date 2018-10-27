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
const MYSELF_SHOW = "見返す";

const OGIRI = "大喜利";
const TSUKOMI = "つっこみ";
const ARU = "あるある";
const LAST_POST = "過去の投稿";

const MINA_POST = "みんなの投稿!";
const TOP_RANKER = "上位ランキング";
const POST_DO_IT = "自分も投稿してみる!!";

const USE_RICH_MENU = "リッチメニューをご利用ください。";

// -----------------------------------------------------------------------------
// 定数の登録
const TOP_CHOOSE = 1;
const OGRI_CHOOSE = 2;
const TSUKOMI_CHOOSE = 3;
const ARU_CHOOSE = 4;
const OGRI_WRITE = OGRI_CHOOSE * 10;
const TSUKOMI_WRITE = TSUKOMI_CHOOSE * 10;
const ARU_WRITE = ARU_CHOOSE * 10;
const WRITE_OK = 8;
const WRITE_OK_OGRI = OGRI_WRITE*10;
const WRITE_OK_TSUKOMI = TSUKOMI_WRITE*10;
const WRITE_OK_ARU = ARU_WRITE*10;

const RANDOM_SHOW_NUM = 5; //投稿表示の上限数

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
    console.log("event type: "+event.type); //eventタイプを出力しておく
    var userID = event.source.userId; //LINEを送ってきたユーザのID
    console.log("userID: "+userID);

    if (event.type == "message" && event.message.type == "text"){
        //イベントタイプがメッセージで、かつ、テキストタイプだった場合の処理
        getUserDataFromDB(event, userID, messageTextProcessorCallBack);
    }else if(event.type == "follow"){
        // スタートメッセージを送信する
        followProcessor(event);
    }else if(event.type == "postback"){
        // goodボタンなどの処理
        pushButtonProcessor(event);
    }
}

/*
 * postbackイベントの処理
 * goodボタンなどを押した時の処理
 */
function pushButtonProcessor(event){
    var userID = event.source.userId;
    console.log(event);
    if(event.postback == null)return;
    var data = event.postback.data.split(":");
    var postID = data[0];
    var type = data[1];
    var pushUserID = data[2];

    console.log(data);

    // 「eval」コレクションに新たにデータを追加し、「post」コレクションのgoodCountなどをインクリメントする
    verifyEvalDataToDB(event, postID, type, pushUserID, insertEvalDataToDBCallBack);
}

/*
 * 「eval」コレクションに重複したデータが存在しないことを確認する
 * 既存でなければ、callbackを実行
 */
function verifyEvalDataToDB(event, postID, type, pushUserID, callback){
    // データベースからpostID, pushUserIDが同じものを検索
    getDBData(event, 'eval', {postID: postID, userID: pushUserID}, function(event, condition, find){
        var val = null;
        for(index in find){
            val = find[index];
            break;
        }
        if(val != null)return;

        //見つからなければcallback実行
        callback(postID, type, pushUserID);
    });
}

/*
 * 「eval」コレクションに新たにデータを追加し、「post」コレクションのgoodCountなどをインクリメントする関数
 */
function insertEvalDataToDBCallBack(postID, type, pushUserID){
    var ret_evalData = {postID: postID, userID: pushUserID, eval: type, comment: "", date : getNowDateString()};
    
    // 「eval」コレクションに新たにデータを挿入
    MongoClient.connect(mongodbURI, (error, client) => {
        var collection;
        const db = client.db(mongodbAddress);
        // コレクションの取得
        collection = db.collection('eval');
        collection.insertOne(ret_evalData, (error, result) => {
            console.log("inserted!");
        });
    });

    // 既存のpostデータのtypeに対応する「...Count」をインクリメント
    evalPostData(postID, type);
    
    return ret_evalData;
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
    console.log("func: messageTextProcessorCallBack");
    if(userData == null)return;

    var status = userData['status'];
    var nextStatus = TOP_CHOOSE; //次にセットされるステータス
    if(status == TOP_CHOOSE){
        console.log("status: TOP_CHOOSE");
        nextStatus = stageTOPProcessor(event, userData);
    }else if(status == OGRI_CHOOSE ||
             status == TSUKOMI_CHOOSE ||
             status == ARU_CHOOSE){
        console.log("status: CHOOSE_NEXT!");         
        nextStatus = stageCHOOSEProcessor(event, userData);
        
    }else if(status == OGRI_WRITE ||
             status == TSUKOMI_WRITE ||
             status == ARU_WRITE){
        console.log("status: WRITE_NEXT!");
        nextStatus = stageWRITEProcessor(event, userData);

    }else if(status == WRITE_OK_OGRI || 
            status == WRITE_OK_TSUKOMI ||
            status == WRITE_OK_ARU){
        console.log("status: WRITE_GO!");
        nextStatus = stageWriteOKProcessor(event, userData);
    }else{
        console.log("status: NANIMO_NAI!");
        return;
    }
    userData['status'] = nextStatus;
    console.log("NEXT STATUS: "+nextStatus);
    updateUserData(userData);
}

function stageWriteOKProcessor(event, userData){
    var text = event.message.text;

    if(text == CANCEL){
        // 「キャンセル」
        console.log("status: CANCEL_WRITE_LATER!");
        deletePendingPostData(userData.userID);
        replyCancelMessage(event);
        return TOP_CHOOSE;
    }else if(text == ACCEPT_POST){
        // 「投稿する」
        // 投稿内容をDB上で確定する
        console.log("status: ACCEPT_POST!");
        fixPostData(userData.userID);
        replyPostDoneMessage(event);
        return TOP_CHOOSE;
    }else if(text == TSUKOMI || text == ARU || text == OGIRI){
        // リッチメニューからカテゴリメニューに移動
        console.log("status: CANCEL_WRITE_LATER_AND_MOVE_OTHERS!");
        deletePendingPostData(userData.userID);
        return stageTOPProcessor(event, userData);
    }else{
        // 投稿内容を訂正する
        console.log("status: FIX_POST!");
        deletePendingPostData(userData.userID);
        makeNewPostData(userData.userID, text, userData.status);
        replyConfirmMessage(event, text);
        return userData.status;
    }
}

function displayTheme(event, text){
    getDBData(event, 'theme', {category:text}, function(e, c, find){
        var post = {
            endDate : '0/0/0/0',
            summary : 'Tsutida kun',
            category: text
        };
        for(index in find){
            post = find[index]
            break;
        }
        console.log("post : " , post)
        if(post != null){
            console.log("template : ", messageTemplate.FlexThemeMessage.getTemplate(post).makeFlex('テーマ表示'))
            sendQuery(event.replyToken,messageTemplate.FlexThemeMessage.getTemplate(post).makeFlex('テーマ表示'))
        }
    })
}


/*
 * リッチメニューを選択したあとの処理を行う
 * 返り値は次のステータス
 */
function stageTOPProcessor(event, userData){
    var text = event.message.text; //入力された文字
    if(text == OGIRI){
        //大喜利に移動
        console.log("status: GO_OGIRI!");
        displayTheme(event, text)
        return OGRI_CHOOSE;
    }else if(text == TSUKOMI){
        //つっこみに移動
        console.log("status: GO_TUKOMI!");
        displayTheme(event, text)
        return TSUKOMI_CHOOSE;
    }else if(text == ARU){
        //あるあるに移動
        console.log("status: GO_ARU!");
        displayTheme(event, text)
        return ARU_CHOOSE;
    }else if(text == LAST_POST){
        //過去の投稿を表示
        console.log("status: SHOW_LAST_POSTS!");
        showMyPost(event, userData);
        return TOP_CHOOSE;
    }else{
        //何もしない
        console.log("status: DO_NOTHING!");
        replyUseRichMessage(event); //リッチメニューの使用を促す
        return TOP_CHOOSE;
    }
    /*
    if(text == SHOW){
        //「表示」
        //todo ポストをランダムにゲットする
        getRandomDBData(event, 5, 'post', {userID:{'$ne' : userData.userID}}, function(event, condition, find){
            var conts = []
            //flex post messageを配列にpush
            for(index in find){
                if(conts.length == 10)break;
                conts.push(messageTemplate.FlexPostMessage.getTemplate(find[index], userData.userID).content)
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
    }else if(text == MYSELF_SHOW){
        getDBData(event, 'post', {userID:userData.userID}, function(event, condition, find){
            var conts = []
            //flex post messageを配列にpush
            for(index in find){
                if(conts.length == 10)break;
                conts.push(messageTemplate.MyselfResponceMessage.getTemplate(find[index], userData.userID).content)
            }
            //LINEMessageに配列を連想配列にして入れるとカルーセルもらえる
            console.log(JSON.stringify(conts))
            var msg = new LINEMessage(
                {'content' : conts}
            ).makeCarousel(conts).makeFlex('投稿内容表示')
            if(conts.length != 0){
                sendQuery(event.replyToken, msg)
            }
        });
        return 1
    }else{
        //それ以外なので、移動しない
        return 1;
    }
    */
}

/*
 * 自分の過去の投稿を表示する
 */
function showMyPost(event, userData){
    getDBData(event, 'post', {userID:userData.userID}, function(event, condition, find){
        var conts = []
        //flex post messageを配列にpush
        for(index in find){
            if(conts.length == 10)break;
            conts.push(messageTemplate.MyselfResponceMessage.getTemplate(find[index], userData.userID).content)
        }
        //LINEMessageに配列を連想配列にして入れるとカルーセルもらえる
        console.log(JSON.stringify(conts))
        var msg = new LINEMessage(
            {'content' : conts}
        ).makeCarousel(conts).makeFlex('投稿内容表示')
        if(conts.length != 0){
            sendQuery(event.replyToken, msg)
        }
    });
}

/*
 * 各カテゴリの選択「random」「random」「insert」など
 * 返り値は次のステータス
 */
function stageCHOOSEProcessor(event, userData){
    var text = event.message.text; //投稿の文章

    if(text == MINA_POST){
        //「みんなの投稿を見る」処理
        console.log("status: MIRU_MINNA!");
        
        // 自分以外のポストからランダムに5個選出
        // mahitodo: ランダムポストの先頭にカテゴリメニューをくっつける
        console.log("SEARCH: "+userData.userID+", "+getCategoryFromStatus(userData.status));
        showRandomPost(event, userData, {userID:{'$ne' : userData.userID}, category: getCategoryFromStatus(userData.status)}); 
        //
        
        return userData.status;
    }else if(text == POST_DO_IT){
        //「自分も投稿する」処理
        console.log("status: JIBUN_TOKO!");
        stage1POST(event, userData);
        var status = userData.status;
        return status * 10;
    }else if(text == TOP_RANKER){
        //「上位ランキング」処理
        //mahitodo
        console.log("status: TOP_RANKER!");
        
        // 自分以外のポストからトップ5を選出
        // mahitodo: ポストの先頭にカテゴリメニューをくっつける
        showTopPost(event, userData); 
        //
        
        return userData.status;
    }else if(text == TSUKOMI || text == ARU || text == OGIRI){
        //つっこみ、大喜利、あるある処理
        console.log("status: MOVE_OTHER!");
        return stageTOPProcessor(event, userData);
    }else{
        //それ以外
        //todo: あとで窓が出るように直す
        console.log("status: ATODE_NAOSU!");
        return userData.status;
    }
    /*
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
    */
}

/*
 * 投稿内容が正しいかの確認をしたあとの処理を行う
 * 返り値は次のステータス
 */
function stageWRITEProcessor(event, userData){
    var text = event.message.text;

    if(text == CANCEL){
        //キャンセルして戻す
        console.log("status: CANCEL_WRITE!");
        replyCancelMessage(event);
        return TOP_CHOOSE;
    }else if(text == TSUKOMI || text == ARU || text == OGIRI){
        // リッチメニューからカテゴリメニューに移動
        console.log("status: CANCEL_WRITE_MOVE_OTHERS!");
        return stageTOPProcessor(event, userData);
    }else{
        //投稿文をDBに格納など
        console.log("status: SAVE_DATABASE!");
        // 投稿内容が正しいかの確認を促す
        // 投稿内容をDBに一時保存
        makeNewPostData(userData.userID, text, userData.status);
        replyConfirmMessage(event, text);
        return userData.status*10;
    }

    /*
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
    */
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
 * リッチメニューの使用を促すメッセージ
 */
function replyUseRichMessage(event){
    bot.replyMessage(event.replyToken, {
        type: "text",
        text: USE_RICH_MENU
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

function getRandomDBData(event, num, collectionName, condition, callback){
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
            var length = find.length;
            find = shuffleArray(find).slice(0, Math.min(RANDOM_SHOW_NUM, length));
            
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
function makeNewPostData(userID, text, status){
    var statusString = getCategoryFromStatus(status);
    //get sentimental magnitude and score
    Morphological.magnitude(text, function(sentiment_data, ret2){
        //run morphological
        Morphological.morphological(ret2, function(ret3) {
            //verifying ng word to *****.
            text = Verifier.verifyNGWord(ng_dict, ret3)
            console.log(sentiment_data.documentSentiment)
            var ret_postData = {
                postID: makeRandomString(),
                userID: userID,
                text: text,
                magnitude: sentiment_data.documentSentiment.magnitude,
                score: sentiment_data.documentSentiment.score,
                stamp: "",
                date: "pending",
                category: statusString,
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

function getCategoryFromStatus(status){
    if(status == OGRI_WRITE){
        return OGIRI;
    }else if(status == TSUKOMI_WRITE){
        return TSUKOMI;
    }else if(status == ARU_WRITE){
        return ARU;
    }else if(status == WRITE_OK_OGRI){
        return OGIRI;
    }else if(status == WRITE_OK_TSUKOMI){
        return TSUKOMI;
    }else if(status == WRITE_OK_ARU){
        return ARU;
    }else if(status == OGRI_CHOOSE){
        return OGIRI;
    }else if(status == TSUKOMI_CHOOSE){
        return TSUKOMI;
    }else if(status == ARU_CHOOSE){
        return ARU;
    }else{
        return "YABAI!!!";
    }
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
 * postデータに評価をつける
 */
function evalPostData(postID, type){
    MongoClient.connect(mongodbURI, (error, client) => {
        var collection;

        const db = client.db(mongodbAddress);
        
        var sp = {};
        sp[type+"Count"] = 1;

        // コレクションの取得
        collection = db.collection('post');
        collection.updateMany(
            { postID: postID},
            { $inc: sp },
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

/*
 * Fisher–Yatesアルゴリズムを用いてシャッフルを行う
 */
function shuffleArray(array){
    for(var i = array.length - 1; i > 0; i--){
        var r = Math.floor(Math.random() * (i + 1));
        var tmp = array[i];
        array[i] = array[r];
        array[r] = tmp;
    }
    return array;
}

function showRandomPost(event, userData, condition, category){
    getRandomDBData(event, 5, 'post', condition, function(event, condition, find){

        var length = find.length;
        find = shuffleArray(find).slice(0, Math.min(RANDOM_SHOW_NUM, length));
        getDBData(event, 'theme', {category:condition.category}, function(e, c, find2){
            var post = {
                endDate : '0/0/0/0',
                summary : 'Tsutida kun',
                category: condition.category
            };
            for(index in find2){
                post = find2[index]
                break;
            }
            var conts = [messageTemplate.FlexThemeMessage.getTemplate(post).content]
            //flex post messageを配列にpush
            for(index in find){
                conts.push(messageTemplate.FlexPostMessage.getTemplate(find[index], userData.userID).content)
            }

            console.log("find : ", find)
            //LINEMessageに配列を連想配列にして入れるとカルーセルもらえる
            var msg = new LINEMessage(
                {'content' : conts}
            ).makeCarousel(conts).makeFlex('投稿内容表示')
            if(conts.length != 0){
                sendQuery(event.replyToken, msg)
            }
        })
    });
}

function showTopPost(event, userData){
    getRandomDBData(event, 5, 'post', {category: getCategoryFromStatus(userData.status)}, function(event, condition, find){
        find.sort(function(a,b){
            if( a.goodCount < b.goodCount ) return -1;
            if( a.goodCount > b.goodCount ) return 1;
            return 0;
        });
        var length = find.length;
        find = find.slice(0, Math.min(RANDOM_SHOW_NUM, length));

        var conts = []
        //flex post messageを配列にpush
        for(index in find){
            if(conts.length == 10)break;
            conts.push(messageTemplate.FlexPostMessage.getTemplate(find[index], userData.userID).content)
        }

        //LINEMessageに配列を連想配列にして入れるとカルーセルもらえる
        var msg = new LINEMessage(
            {'content' : conts}
        ).makeCarousel(conts).makeFlex('投稿内容表示')
        if(conts.length != 0){
            sendQuery(event.replyToken, msg)
        }
    });
}