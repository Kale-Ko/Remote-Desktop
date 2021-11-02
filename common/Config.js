const fs = require("fs")

module.exports = class Config {
    webServerOrigin = "localhost:80"
    serverOrigin = "localhost:8000"

    webServerPort = 80
    serverPort = 8000

    fps = 5

    enableControl = false

    constructor(file) {
        if (file == undefined || file == null) throw new Error('Missing paramiter "file"')

        if (!fs.existsSync(file) && !process.env.CONFIG) throw new Error("Config file does not exist")

        var config

        try {
            if (!process.env.CONFIG) config = JSON.parse(fs.readFileSync(file))
            else config = JSON.parse(process.env.CONFIG)
        } catch (err) {
            throw new Error("Config file is not a valid json")
        }

        this.webServerOrigin = config.webServerOrigin || this.webServerOrigin
        this.serverOrigin = config.serverOrigin || this.serverOrigin

        this.webServerPort = config.webServerPort || this.webServerPort
        this.serverPort = config.serverPort || this.serverPort

        this.fps = config.fps || this.fps

        this.enableControl = config.enableControl || false
    }
}