const LINEModule = require('../modules/LINEMessage')
var LINEMessage = LINEModule.lineMessage
var ActionBuilder = LINEModule.actionBuilder
var MainBuilder = LINEModule.mainBuilder
var ContentsBuilder = LINEModule.contentsBuilder
//reaction stamp
// var stamp = {
//     "good" : "👍",
//     "bad"  : "👎",
//     "sad"  : "👋",
//     "angry": "🙏"
// }
var stamp = {
    "good" : "イイね👍!"
}

const colors = {
    "大喜利" : "#8e0000",
    "つっこみ" : "#004413",
    "あるある" : "#006b96"
}
module.exports = {
    QuickReplyMessage: {
        /*
         * data : text(str), replies([{}])
         */
        getTemplate : function(data) {
            var builder = new MainBuilder()
                        .type('text')
                        .text(date.text)
            for(index in data.replies){
                var act = data.replies[index]
                builder.quickReply(act)
            }
            return new LINEMessage(builder.build())
        }
    },
    FlexThemeMessage : {
        getTemplate: function(post, headerColor) {
            console.log("postpostpostpost: "+post);
            return new LINEMessage(
                new MainBuilder()
                .type('bubble')
                .styles({
                    "header": {
                        "backgroundColor": headerColor
                    }
                })
                .header(
                    new ContentsBuilder()
                    .type('box')
                    .layout('horizontal')
                    .contents(
                        {
                            "type": "text",
                            "color": "#FFFFFF",
                            "text": post.category,
                            "size": "xl",
                            "weight": "bold"
                        }
                    ).build()
                ).body(
                    new ContentsBuilder()
                    .type('box')
                    .layout('vertical')
                    .contents(
                        new ContentsBuilder()
                        .type('box')
                        .layout('vertical')
                        .contents(
                            new ContentsBuilder()
                            .type('box')
                            .layout('baseline')
                            .spacing('sm')
                            .contents(
                                {
                                    "type": "text",
                                    "text": "テーマ",
                                    "size": "lg",
                                    "weight": "bold",
                                }
                            )
                            .contents(
                                {
                                    "type": "text",
                                    "text": "〆"+post.endDate,
                                    "color": "#aaaaaa",
                                    "size": "xxs",
                                    "align": "end"
                                }
                            ).build()
                        )
                        .contents(
                            {
                                "type": "text",
                                "text": post.summary,
                                "size": "xl",
                                "weight": "bold",
                                "wrap" : true
                            }
                        ).build()
                    ).build()
                ).footer(
                    new ContentsBuilder()
                    .type('box')
                    .layout('horizontal')
                    .spacing('md')
                    .contents(
                        new ContentsBuilder()
                        .type('box')
                        .layout('horizontal')
                        .spacing('md')
                        .contents(
                            new ContentsBuilder()
                            .type('box')
                            .layout('vertical')
                            .spacing('md')
                            .contents(
                                {
                                    "type": "button",
                                    "style": "primary",
                                    "action": {
                                        "type": "message",
                                        "label": "みんなの投稿!",
                                        "text": "みんなの投稿!"
                                    },
                                    "color": "#4488ff"
                                }
                            ).contents(
                                {
                                    "type": "button",
                                    "style": "primary",
                                    "action": {
                                        "type": "message",
                                        "label": "上位ランキング",
                                        "text": "上位ランキング"
                                    },
                                    "color": "#ff5500"
                                }    
                            )
                            .contents(
                                {
                                    "type": "button",
                                    "style": "primary",
                                    "action": {
                                        "type": "message",
                                        "label": "自分も投稿してみる!!",
                                        "text": "自分も投稿してみる!!"
                                    }
                                }
                            ).build()
                        ).build()
                    ).build()
                ).build()
            )
        }
    },
    MyselfResponseMessage : {
        getTemplate : function(post) {
            var counter = 0
            var cont = new ContentsBuilder()
            .type("box")
            .layout("horizontal")
            .spacing("md")
            for(key in stamp){
                if(counter!=0){
                    cont.contents(
                        {
                            "type": "separator"
                        }
                    )
                }
                cont.contents(
                    {
                        "type" : "box",
                        "layout" : "vertical",
                        "spacing" : "md",
                        "contents" : [
                            {
                                "type": "text",
                                "text": stamp[key],
                                "align" : "center"
                            },
                            {
                                "type": "text",
                                "text": String(post[key+'Count']),
                                "weight" : "bold",
                                "align" : "center"
                            }
                        ]
                    }
                )
                counter++;
            }
            return new LINEMessage(
                new MainBuilder()
                .type('bubble')
                .styles({
                    "header": {
                        "backgroundColor": colors[post.theme.category]
                    },
                    "footer": {
                        "separator": true
                    }
                })
                .header(
                    new ContentsBuilder()
                    .type('box')
                    .layout('horizontal')
                    .spacing('lg')
                    .contents(
                        {
                            "flex": 0,
                            "type": "image",
                            "url": post.pictureUrl,
                            "size": "xxs"
                        }
                    ).contents(
                        {
                            "type": "text",
                            "color": "#FFFFFF",
                            "text": post.theme.summary,
                            "size": "lg",
                            "weight": "bold",
                            "wrap": true
                        }
                    ).build()
                ).body(
                    new ContentsBuilder()
                    .type('box')
                    .layout('vertical')
                    .contents(
                        new ContentsBuilder()
                        .type('box')
                        .layout('vertical')
                        .contents(
                            new ContentsBuilder()
                            .type('box')
                            .layout('baseline')
                            .spacing('sm')
                            .contents(
                                {
                                    "type": "text",
                                    "text": " ",
                                    "size": "lg",
                                    "weight": "bold"
                                }
                            )
                            .contents(
                                {
                                    "type": "text",
                                    "text": post.date,
                                    "color": "#aaaaaa",
                                    "size": "sm"
                                }
                            ).build()
                        )
                        .contents(
                            {
                                "type": "text",
                                "text": post.text,
                                "wrap": true,
                                "size": "lg",
                                "weight": "bold"
                            }
                        ).build()
                    ).build()
                ).footer(
                    new ContentsBuilder()
                    .type('box')
                    .layout('horizontal')
                    .spacing('md')
                    .contents(
                        cont.build()
                    ).build()
                ).build()
            )
        }
    },
    FlexPostMessage : {
        getTemplate : function(post, pushUserID) {
            var cont = new ContentsBuilder()
            .type("box")
            .layout("horizontal")
            .spacing("md")
            for(key in stamp){
                cont.contents(
                    {
                        "type": "button",
                        "style": "secondary",
                        "action": {
                            "type": "postback",
                            "label": stamp[key],
                            "data": post.postID+":"+key+":"+pushUserID
                        }
                    }
                )
            }
            return new LINEMessage(
                new MainBuilder()
                .type('bubble')
                .styles({
                    "header": {
                        "backgroundColor": colors[post.theme.category]
                    },
                    "footer": {
                        "separator": true
                    }
                })
                .header(
                    new ContentsBuilder()
                    .type('box')
                    .layout('horizontal')
                    .spacing('lg')
                    .contents(
                        {
                            "flex": 0,
                            "type": "image",
                            "url": post.pictureUrl,
                            "size": "xxs"
                        }
                    ).contents(
                        {
                            "type": "text",
                            "color": "#FFFFFF",
                            "text": post.theme.summary,
                            "size": "lg",
                            "weight": "bold",
                            "wrap": true
                        }
                    ).build()
                ).body(
                    new ContentsBuilder()
                    .type('box')
                    .layout('vertical')
                    .contents(
                        new ContentsBuilder()
                        .type('box')
                        .layout('vertical')
                        .contents(
                            new ContentsBuilder()
                            .type('box')
                            .layout('baseline')
                            .spacing('sm')
                            .contents(
                                {
                                    "type": "text",
                                    "text": "　",
                                    "size": "lg",
                                    "weight": "bold"
                                }
                            )
                            .contents(
                                {
                                    "type": "text",
                                    "text": post.date,
                                    "color": "#aaaaaa",
                                    "size": "sm"
                                }
                            ).build()
                        )
                        .contents(
                            {
                                "type": "text",
                                "text": post.text,
                                "wrap": true,
                                "size": "lg",
                                "weight": "bold"
                            }
                        ).build()
                    ).build()
                ).footer(
                    new ContentsBuilder()
                    .type('box')
                    .layout('horizontal')
                    .spacing('md')
                    .contents(
                        cont.build()
                    ).build()
                ).build()
            )
        }
    }
}
// .contents(
//     new ContentsBuilder()
//     .contents(
//         {
//             "type": "button",
//             "style": "secondary",
//             "action": {
//                 "type": "message",
//                 "label": "👍",
//                 "text": "いいね"
//             }
//         }
//     ).contents(
//         {
//             "type": "separator"
//         }
//     )
//     .contents(
//         {
//             "type": "button",
//             "style": "secondary",
//             "action": {
//                 "type": "message",
//                 "label": "👎",
//                 "text": "よくない"
//             }
//         }
//     ).contents(
//         {
//             "type": "separator"
//         }
//     )
//     .contents(
//         {
//             "type": "button",
//             "style": "secondary",
//             "action": {
//                 "type": "message",
//                 "label": "👋",
//                 "text": "わーい"
//             }
//         }
//     ).contents(
//         {
//             "type": "separator"
//         }
//     )
//     .contents(
//         {
//             "type": "button",
//             "style": "secondary",
//             "action": {
//                 "type": "message",
//                 "label": "🙏",
//                 "text": "尊い"
//             }
//         }
//     ).contents(
//         {
//             "type": "separator"
//         }
//     ).build()
// ).build()