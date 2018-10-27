const request = require('request')
function morphological(text){
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
    return new Promise(function (resolve, reject) {
        request(options, (error,response,body) => {
            resolve(response.body.word_list)
        });
    })
}

module.exports = {
    morphological
}