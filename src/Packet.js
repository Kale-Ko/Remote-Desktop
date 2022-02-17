class LZW {
    static compress(uncompressed) {
        let dictionary = {};
        for (let i = 0; i < 256; i++) {
            dictionary[String.fromCharCode(i)] = i;
        }

        let word = "";
        let result = [];
        let dictSize = 256;

        for (let i = 0, len = uncompressed.length; i < len; i++) {
            let curChar = uncompressed[i];
            let joinedWord = word + curChar;

            if (dictionary.hasOwnProperty(joinedWord)) {
                word = joinedWord;
            }
            else {
                result.push(dictionary[word]);
                dictionary[joinedWord] = dictSize++;
                word = curChar;
            }
        }

        if (word !== "") {
            result.push(dictionary[word]);
        }

        return result;
    }

    static decompress(compressed) {
        let dictionary = {};
        for (let i = 0; i < 256; i++) {
            dictionary[i] = String.fromCharCode(i);
        }

        let word = String.fromCharCode(compressed[0]);
        let result = word;
        let entry = "";
        let dictSize = 256;

        for (let i = 1, len = compressed.length; i < len; i++) {
            let curNumber = compressed[i];

            if (dictionary[curNumber] !== undefined) {
                entry = dictionary[curNumber];
            }
            else {
                if (curNumber === dictSize) {
                    entry = word + word[0];
                }
                else {
                    throw new Error("Error in processing");
                }
            }

            result += entry;

            dictionary[dictSize++] = word + entry[0];

            word = entry;
        }

        return result;
    }
}

class Packet {
    type
    data

    constructor(type, data) {
        if (type == undefined || type == null) throw new Error('Missing paramiter "type"')

        this.type = type
        this.data = data || {}
    }

    encode() {
        return JSON.stringify(LZW.compress(JSON.stringify({ type: this.type, data: this.data })))
    }

    static decode(data) {
        data = JSON.parse(LZW.decompress(JSON.parse(data)))

        return new Packet(data.type, data.data)
    }
}

if (this.window) window.Packet = Packet
else if (module) module.exports = Packet