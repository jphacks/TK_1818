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
const messageTemplate = require('./src/modules/MessageTemplate')

for(word in words) ng_dict[words[word]] = true
console.log(JSON.stringify(messageTemplate.FlexThemeMessage.getTemplate({
    date: new Date(),
    text: 'text',
    theme: 'つちだくんがうんち踏んだ',
    category : 'あるある'
}).content))
