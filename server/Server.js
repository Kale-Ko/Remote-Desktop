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
        if (origin == undefined || origin == null) throw new Error('Missing paramiter "origin"')
        if (webServerOrigin == undefined || webServerOrigin == null) throw new Error('Missing paramiter "webServerOrigin"')
        if (port == undefined || port == null) throw new Error('Missing paramiter "port"')

        this.httpServer = http.createServer((req, res) => { })
        this.server = new WebSocket({ httpServer: this.httpServer, maxReceivedFrameSize: 100000000, maxReceivedMessageSize: 100000000, fragmentationThreshold: 5000000, keepaliveInterval: 5000, parseCookies: false })
        this.origin = origin
        this.webServerOrigin = webServerOrigin
        this.port = port
    }

    start() {
        this.httpServer.listen(this.port)

        this.server.on("request", (req) => {
            if (req.origin == this.webServerOrigin || req.origin == undefined) req.accept()
            else req.reject(403, "Invalid request origin")
        })

        this.server.on("connect", connection => {
            connection.on("message", event => {
                var message = Packet.decode(event.utf8Data)

                if (message.type == "connectionrequest") connection.send(new Packet("connectionaccepted").encode())
                else if (message.type == "display") this.server.broadcast(message.encode())
            })
        })
    }
}