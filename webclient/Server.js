const fs = require("fs")
const express = require("express")

module.exports = class Server {
    server

    serverorigin
    origin
    port

    constructor(origin, serverorigin, port) {
        if (origin == undefined || origin == null) throw new Error('Missig paramiter "origin"')
        if (port == undefined || port == null) throw new Error('Missig paramiter "port"')

        this.server = express()
        this.origin = origin
        this.serverorigin = serverorigin
        this.port = port
    }

    start() {
        this.server.get("*", (req, res) => {
            res.statusCode = 200
            res.statusMessage = "Ok"
            res.end(fs.readFileSync("./webclient/index.html").toString().replace(/{origin}/g, this.serverorigin))
        })

        this.server.listen(this.port)
    }
}