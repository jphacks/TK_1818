const LINEModule = require('./src/modules/LINEMessage')
var LINEMessage = LINEModule.lineMessage
var ActionBuilder = LINEModule.actionBuilder
var MainBuilder = LINEModule.mainBuilder
var ContentsBuilder = LINEModule.contentsBuilder
const request = require('request')
const verifier = require('./src/modules/verifier')
var fs = require('fs');
var ng_dict = {}
var words = fs.readFileSync('./src/assets/ngword.csv', 'utf-8').split(',')
var async = require('async');
for(word in words) ng_dict[words[word]] = true

const morph = require('./src/modules/morph')

const carousel = new LINEMessage(
    new MainBuilder()
        .type("flex")
        .contents(
            new ContentsBuilder()
            .type("bubble")
            .body(
                new ContentsBuilder()
                .type('box')
                .layout('horizontal')
                .contents(
                    new ContentsBuilder()
                    .type("text")
                    .text("This is Text message")
                    .wrap(true)
                    .build()
                ).build()
            ).footer(
                new ContentsBuilder()
                .type('box')
                .layout('horizontal')
                .contents(
                    new ContentsBuilder()
                    .type("button")
                    .style('primary')
                    .action({
                        "type": "uri",
                        "label": "Go",
                        "uri": "https://google.com"
                    }).build()
                ).build()
            ).build()
        ).build()
).content

console.log(JSON.stringify(carousel))
const options = {
    method: 'POST',
    uri: 'https://labs.goo.ne.jp/api/morph',
    header : {
        'Content-Type': 'application/json'
    },
    body: {
        "app_id":"9d396dd8b1f90b46532ad56b3ff48b3cc3b19580f66877e0aacbaa852b4e18ad", 
        "request_id":"record001", 
        "sentence":"こんにちは、今日はいいお天気ですね土人さん",
        "info_filter":"form"
    },
    json: true
}

request(options, (err, response, body) => {
    sentence = verifier.verifyNGWord(ng_dict, response.body.word_list)
    console.log(sentence)
})

const doit = async function(){
    const res = await morph.morphological("こんにちは、今日はいいおっぱいですね")
    console.log(res)
}

doit()