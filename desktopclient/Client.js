const WebSocket = require("WebSocket").client
const Packet = require("../common/Packet.js")
const screenshot = require("screenshot-desktop")
const sharp = require("sharp")
const robot = require("robotjs")

module.exports = class Client {
    serverurl

    controlable

    constructor(serverurl, controlable) {
        if (serverurl == undefined || serverurl == null) throw new Error('Missing paramiter "serverurl"')

        this.client = new WebSocket({ maxReceivedFrameSize: 100000000, maxReceivedMessageSize: 100000000, fragmentationThreshold: 5000000 })
        this.serverurl = serverurl
        this.controlable = controlable

        if (this.controlable) {
            robot.setKeyboardDelay(0)
            robot.setMouseDelay(0)
        }
    }

    start() {
        this.client.connect(this.serverurl)

        this.client.on("connect", connection => {
            console.log("Connection opened")

            connection.on("message", event => {
                var message = Packet.decode(event.utf8Data)

                if (this.controlable) {
                    if (message.type == "mousemove") {
                        // robot.moveMouse(message.data.x, message.data.y)
                        robot.moveMouseSmooth(message.data.x, message.data.y)
                    } else if (message.type == "mouseclick") {
                        robot.mouseClick(message.data.button, false)
                    } else if (message.type == "keypress") {
                        if (message.data.type) robot.typeString(message.data.string)
                        else robot.keyTap(message.data.key, message.data.modifiers)
                    }
                }
            })

            connection.on("close", event => {
                console.log("Connection closed")

                process.exit(0)
            })

            setInterval(() => {
                screenshot.all().then(async displays => {
                    for (var index = 0; index < displays.length; index++) {
                        var size = robot.getScreenSize()

                        var image = await sharp(displays[index]).jpeg().resize(size.width / 2, size.height / 2).toBuffer()

                        connection.send(new Packet("display", { image: image.toJSON(), id: index }).encode())
                    }
                })
            }, 1000 / 1)
        })
    }
}