const WebSocket = require("WebSocket").client
const Packet = require("../common/Packet.js")
const screenshot = require("screenshot-desktop")

module.exports = class Client {
    serverurl

    constructor(serverurl) {
        if (serverurl == undefined || serverurl == null) throw new Error('Missing paramiter "serverurl"')

        this.client = new WebSocket({ maxReceivedFrameSize: 100000000, maxReceivedMessageSize: 100000000, fragmentationThreshold: 5000000 })
        this.serverurl = serverurl
    }

    start() {
        this.client.connect(this.serverurl)

        this.client.on("connect", connection => {
            console.log("Connection opened")

            connection.send(new Packet("connectionrequest").encode())

            connection.on("message", event => {
                var message = Packet.decode(event.utf8Data)

                if (message.type == "connectionaccepted") console.log("Connection accepted")
            })

            connection.on("close", event => {
                console.log("Connection closed")

                process.exit(0)
            })

            setInterval(() => {
                screenshot.all().then(displays => {
                    for (var index = 0; index < displays.length; index++) {
                        connection.send(new Packet("display", { image: displays[index].toJSON(), id: index }).encode())
                    }
                })
            }, 1000 / 10)
        })
    }
}