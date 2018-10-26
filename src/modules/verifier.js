function verifyNGWord(nglist, sentence){
    ret = ""
    for(index in sentence){
        for(section in sentence[index]){
            for(word in sentence[index][section]){
                if(nglist[sentence[index][section][word]]){
                    ret += "*****";
                }else{
                    ret += sentence[index][section][word]
                }
            }
        }
    }
    return ret
}

module.exports = {
    verifyNGWord
}