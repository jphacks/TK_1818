const request = require('request')
function morphological(text, callback){
    const options = {
        method: 'POST',
        uri: 'https://labs.goo.ne.jp/api/morph',
        header : {
            'Content-Type': 'application/json'
        },
        body: {
            "app_id":"9d396dd8b1f90b46532ad56b3ff48b3cc3b19580f66877e0aacbaa852b4e18ad", 
            "request_id":"record001", 
            "sentence":text,
            "info_filter":"form"
        },
        json: true
    }
    request(options, (error,response,body) => {
        callback(response.body.word_list)
    });
}
function magnitude(text, callback) {
    const options = {
        method: 'POST',
        uri: 'https://language.googleapis.com/v1/documents:analyzeSentiment?key='+process.env.GOOGLE_LANGUAGE_API_KEY,
        header : {
            'Content-Type': 'application/json'
        },
        body : {
            "document": {
                "type": "PLAIN_TEXT",
                "language": "JA",
                "content": text
            },
            "encodingType": "UTF8"
        },
        json: true
    }
    request(options, (err, response, body) => {
        callback(response.body, text)
    })
}

module.exports = {
    morphological,
    magnitude
}