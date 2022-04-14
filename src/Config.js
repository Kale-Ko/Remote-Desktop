const fs = require("fs")

class Config {
    host = "http://localhost:8080"
    enforceHost = false

    https = {
        enabled: false,
        host: "http://localhost:8433",
        cert: {
            public: null,
            private: null
        }
    }

    authentication = {
        enabled: false,
        useUsername: false,
        username: null,
        password: null
    }

    stream = {
        maxScale: 0.5,
        maxFps: 10
    }

    control = {
        enabled: false,
        keyboard: true,
        mouse: true
    }

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

        this.host = config.host || this.host
        this.enforceHost = config.enforceHost || this.enforceHost

        this.https = config.https || this.https

        this.authentication = config.authentication || this.authentication

        this.stream = config.stream || this.stream

        this.control = config.control || this.control
    }
}

if (this.window) window.Config = Config
else if (module) module.exports = Config