const fs = require("fs")

module.exports = class Config {
    frontport = 80
    backport = 8000

    constructor(file) {
        if (file == undefined || file == null) throw new Error('Missig paramiter "file"')

        if (!fs.existsSync(file)) throw new Error("Config file does not exist")

        var config

        try {
            config = JSON.parse(fs.readFileSync(file))
        } catch (err) {
            throw new Error("Config file is not a valid json")
        }

        this.frontport = config.frontport || this.frontport
        this.backport = config.backport || this.backport
    }
}