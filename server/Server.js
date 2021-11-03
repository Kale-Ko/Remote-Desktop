const fs = require("fs")
const express = require("express")
const WebSocket = require("websocket").server
const Packet = require("../common/Packet.js")

module.exports = class Server {
    server
    httpServer

    origin
    port

    constructor(port, origin) {
        if (port == undefined || port == null) throw new Error('Missing paramiter "port"')
        if (origin == undefined || origin == null) throw new Error('Missing paramiter "origin"')

        this.httpServer = express()
        this.server = new WebSocket({ httpServer: this.httpServer, maxReceivedFrameSize: 100000000, maxReceivedMessageSize: 100000000, fragmentationThreshold: 5000000, keepaliveInterval: 5000, parseCookies: false })
        this.origin = origin
        this.port = port
    }

    start() {
        this.httpServer.get("/", (req, res) => {
            res.statusCode = 200
            res.statusMessage = "Ok"
            res.end(fs.readFileSync("./server/index.html").toString().replace(/{origin}/g, this.origin.replace("http", "ws")))
        })

        this.httpServer.get("/Packet.js", (req, res) => {
            res.statusCode = 200
            res.statusMessage = "Ok"
            res.end(fs.readFileSync("./common/Packet.js").toString().replace(/{origin}/g, this.origin.replace("http", "ws")))
        })

        this.httpServer.get("*", (req, res) => {
            res.statusCode = 404
            res.statusMessage = "Not Found"
            res.end("404 Not Found")
        })

        this.server.on("request", (req) => {
            if (req.origin == this.origin || req.origin == undefined) req.accept()
            else req.reject(403, "Invalid request origin")
        })

        this.server.on("connect", connection => {
            connection.on("message", event => {
                var message = Packet.decode(event.utf8Data)

                this.server.broadcast(message.encode())
            })
        })

        this.httpServer.listen(this.port)
    }
}