module.exports = class Client {
    constructor(serverurl) {
        if (serverurl == undefined || serverurl == null) throw new Error('Missig paramiter "serverurl"')
    }
}