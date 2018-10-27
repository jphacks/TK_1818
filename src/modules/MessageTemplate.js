const LINEModule = require('../modules/LINEMessage')
var LINEMessage = LINEModule.lineMessage
var ActionBuilder = LINEModule.actionBuilder
var MainBuilder = LINEModule.mainBuilder
var ContentsBuilder = LINEModule.contentsBuilder

module.exports = {
    FlexPostMessage : {
        getTemplate : function(post, pushUserID) {
            return new LINEMessage(
                new MainBuilder()
                .type('bubble')
                .styles({
                    "header": {
                        "backgroundColor": "#2A2A2A"
                    },
                    "footer": {
                        "separator": true
                    }
                })
                .header(
                    new ContentsBuilder()
                    .type('box')
                    .layout('horizontal')
                    .contents(
                        {
                            "flex": 0,
                            "type": "image",
                            "url": "https://1.bp.blogspot.com/-feZpLEvuGUM/WKFi-l2h5uI/AAAAAAABBrM/bDCwWhvg-W4jtez5fTdCu1SN1eC078DsgCLcB/s800/face_angry_man5.png",
                            "size": "xs"
                        }
                    ).contents(
                        {
                            "type": "text",
                            "color": "#FFFFFF",
                            "text": "　怒りのコメント",
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
                                    "text": "お言葉",
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
                                "wrap": true
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
                        .type("box")
                        .layout("horizontal")
                        .spacing("md")
                        .contents(
                            {
                                "type": "button",
                                "style": "secondary",
                                "action": {
                                    "type": "postback",
                                    "label": "👍",
                                    "data": post.postID+":good:"+pushUserID
                                }
                            }
                        ).contents(
                            {
                                "type": "separator"
                            }
                        )
                        .contents(
                            {
                                "type": "button",
                                "style": "secondary",
                                "action": {
                                    "type": "postback",
                                    "label": "👎",
                                    "data": post.postID+":bad:"+pushUserID
                                }
                            }
                        ).contents(
                            {
                                "type": "separator"
                            }
                        )
                        .contents(
                            {
                                "type": "button",
                                "style": "secondary",
                                "action": {
                                    "type": "postback",
                                    "label": "👋",
                                    "data": post.postID+":sad:"+pushUserID, 
                                }
                            }
                        ).contents(
                            {
                                "type": "separator"
                            }
                        )
                        .contents(
                            {
                                "type": "button",
                                "style": "secondary",
                                "action": {
                                    "type": "postback",
                                    "label": "🙏",
                                    "data": post.postID+":angry:"+pushUserID
                                }
                            }
                        ).contents(
                            {
                                "type": "separator"
                            }
                        ).build()
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