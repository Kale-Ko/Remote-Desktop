/**
    @license
    MIT License
    Copyright (c) 2021 Kale Ko
    See https://kaleko.ga/license.txt
*/

const Config = require("./src/Config.js")
const Server = require("./src/Server.js")

const config = new Config("./config.json")

if (process.env.PORT) config.port = process.env.PORT

new Server(config.port, config.origin, config.enableControl)

console.log("Server started on " + config.port)