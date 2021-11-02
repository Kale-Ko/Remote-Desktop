const http = require("http")
const WebSocket = require("websocket").server

module.exports = class Server {
    server
    httpServer

    origin
    port

    constructor(origin, port) {
        if (origin == undefined || origin == null) throw new Error('Missig paramiter "origin"')
        if (port == undefined || port == null) throw new Error('Missig paramiter "port"')

        this.httpServer = http.createServer((req, res) => { })
        this.server = new WebSocket({ httpServer: this.httpServer, keepalive: false })
        this.origin = origin
        this.port = port
    }

    start() {
        this.httpServer.listen(this.port)

        this.server.on("request", (req) => {
            console.log(req.origin, this.origin)

            if (req.origin == this.origin) req.accept()
            else req.reject(403, "Invalid request origin")
        })

        this.server.on("connect", (connection => {

        }))
    }
}