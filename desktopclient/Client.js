const WebSocket = require("WebSocket").client
const Packet = require("../common/Packet.js")
const screenshot = require("screenshot-desktop")

module.exports = class Client {
    serverurl

    constructor(serverurl) {
        if (serverurl == undefined || serverurl == null) throw new Error('Missing paramiter "serverurl"')

        this.client = new WebSocket()
        this.serverurl = serverurl
    }

    start() {
        this.client.connect(this.serverurl)

        this.client.on("connect", server => {
            connection.on("message", event => {
                var message = Packet.decode(event.utf8Data)

                if (message.type == "connectionaccepted") {
                    console.log("Connection accepted")
                } else if (message.type == "connectionrejected") server.close()
                else if (message.type == "ping") server.send(new Packet("pong").encode())
            })

            // setInterval(() => {
            //     screenshot.all().then(displays => {
            //         for (var index = 0; index < displays.length; index++) server.send(new Packet("display", { image: displays[index], id: index }))
            //     }, 2000)
            // })
        })
    }
}