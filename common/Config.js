const fs = require("fs")

module.exports = class Config {
    webServerOrigin = "localhost:80"
    serverOrigin = "localhost:8000"

    webServerPort = 80
    serverPort = 8000

    constructor(file) {
        if (file == undefined || file == null) throw new Error('Missing paramiter "file"')

        if (!fs.existsSync(file)) throw new Error("Config file does not exist")

        var config

        try {
            config = JSON.parse(fs.readFileSync(file))
        } catch (err) {
            throw new Error("Config file is not a valid json")
        }

        this.webServerOrigin = config.webServerOrigin || this.webServerOrigin
        this.serverOrigin = config.serverOrigin || this.serverOrigin

        this.webServerPort = config.webServerPort || this.webServerPort
        this.serverPort = config.serverPort || this.serverPort
    }
}