class LINEMessage{
    constructor(builder) {
        this.content = builder.content
    }
};
class MainBuilder{
    constructor() {
        this.content = {}
    }
    type(type) {
        this.content['type'] = type
        return this
    }
    text(text) {
        this.content['text'] = text
        return this
    }
    quickReply(item) {
        if(!this.content['quickReply']){
            this.content['quickReply'] = {}
        }
        if(!this.content['quickReply']['items']){
            this.content['quickReply']['items'] = []
        }
        this.content['quickReply']['items'].push(item)
        return this
    }
    contents(content) {
        if(!this.content['contents']){
            this.content['contents'] = []
        }
        this.content['contents'].push(content)
        return this
    }
    build() {
        return new LINEMessage(this)
    }
};
class ActionBuilder extends MainBuilder{
    constructor() {
        super()
        this.type('action')
    }
    action(action) {
        this.content['action'] = action
        return this
    }
    build() {
        return this.content
    }
};

class ContentsBuilder extends ActionBuilder{
    constructor() {
        super()
    }
    layout(layout) {
        this.content['layout'] = layout
        return this
    }
    body(body) {
        this.content['body'] = body
        return this
    }
    footer(footer) {
        this.content['footer'] = footer
        return this
    }
    wrap(wrap) {
        this.content['wrap'] = wrap
        return this
    }
    style(style) {
        this.content['style'] = style
        return this
    }
}

module.exports = {
    lineMessage : LINEMessage,
    mainBuilder : MainBuilder,
    actionBuilder : ActionBuilder,
    contentsBuilder : ContentsBuilder
}