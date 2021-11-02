const fs = require("fs")
const express = require("express")

module.exports = class Server {
    constructor(port) {
        const server = express()

        server.get("*", (req, res) => {
            res.statusCode = 200
            res.statusMessage = "Ok"
            res.end(fs.readFileSync("./client/index.html"))
        })

        server.listen(port)
    }
}