/**
    @license
    MIT License
    Copyright (c) 2021 Kale Ko
    See https://kaleko.ga/license.txt
*/

const fs = require("fs")

module.exports = class Config {
    origin = "http://localhost:8000"
    port = 8000

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

        this.port = config.port || this.port
        this.origin = config.origin || this.origin

        this.enableControl = config.enableControl || false
    }
}