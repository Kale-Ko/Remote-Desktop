const http = require("http")
const WebSocket = require("websocket").server
const Packet = require("../common/Packet.js")

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
            if (req.origin == this.webServerOrigin) req.accept()
            else req.reject(403, "Invalid request origin")
        })

        this.server.on("connect", (connection => {
            connection.on("message", event => {
                var message = Packet.decode(event.utf8Data)

                if (message.type == "connectionrequest") {
                    connection.send(new Packet("connectionaccepted").encode())

                    connection.lastPing = new Date().getTime()

                    setInterval(() => {
                        if (new Date().getTime() - connection.lastPing > 15000) connection.close()

                        connection.send(new Packet("ping").encode())
                    }, 5000)
                } else if (message.type == "pong") connection.lastPing = new Date().getTime()
            })
        }))
    }
}