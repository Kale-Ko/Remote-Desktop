const WebSocket = require("WebSocket").client
const Packet = require("../common/Packet.js")
const screenshot = require("screenshot-desktop")
const sharp = require("sharp")
const imageSize = require("image-size")
const robot = require("robotjs")

module.exports = class Client {
    serverurl

    fps

    controlable

    constructor(serverurl, fps, controlable) {
        if (serverurl == undefined || serverurl == null) throw new Error('Missing paramiter "serverurl"')
        if (fps == undefined || fps == null) throw new Error('Missing paramiter "fps"')
        if (controlable == undefined || controlable == null) throw new Error('Missing paramiter "controlable"')

        this.client = new WebSocket({ maxReceivedFrameSize: 100000000, maxReceivedMessageSize: 100000000, fragmentationThreshold: 5000000 })
        this.serverurl = serverurl
        this.fps = fps
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

            var lastupdate = {}

            setInterval(() => {
                screenshot.all().then(async displays => {
                    for (var index = 0; index < displays.length; index++) {
                        if (new Date().getTime() <= lastupdate[index]) return

                        var size = imageSize(displays[index])

                        if (new Date().getTime() <= lastupdate[index]) return

                        var image = await sharp(displays[index], { sequentialRead: true }).webp({ quality: 25, alphaQuality: 0, reductionEffort: 6 }).resize(size.width / 2, size.height / 2).toBuffer()

                        if (new Date().getTime() <= lastupdate[index]) return

                        lastupdate[index] = new Date().getTime()

                        connection.send(new Packet("display", { id: index, size, image: image.toJSON(), totalAmount: displays.length }).encode())
                    }
                })
            }, 1000 / this.fps)
        })
    }
}