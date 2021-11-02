const http = require("http")
const WebSocket = require("websocket").server

module.exports = class Server {
    server
    httpServer

    origin
    webServerOrigin
    port

    constructor(origin, webServerOrigin, port) {
        if (origin == undefined || origin == null) throw new Error('Missig paramiter "origin"')
        if (webServerOrigin == undefined || webServerOrigin == null) throw new Error('Missig paramiter "webServerOrigin"')
        if (port == undefined || port == null) throw new Error('Missig paramiter "port"')

        this.httpServer = http.createServer((req, res) => { })
        this.server = new WebSocket({ httpServer: this.httpServer, keepalive: false })
        this.origin = origin
        this.webServerOrigin = webServerOrigin
        this.port = port
    }

    start() {
        this.httpServer.listen(this.port)

        this.server.on("request", (req) => {
            console.log(req.origin, this.webServerOrigin)

            if (req.origin == this.webServerOrigin) req.accept()
            else req.reject(403, "Invalid request origin")
        })

        this.server.on("connect", (connection => {
            console.log(connection)
        }))
    }
}