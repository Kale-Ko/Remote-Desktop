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
                        robot.moveMouseSmooth(message.data.x, message.data.y, 1)
                    } else if (message.type == "mouseclick") {
                        robot.mouseClick(message.data.button, false)
                    } else if (message.type == "mousescrool") {
                        robot.scrollMouse(message.data.x, message.data.y)
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

            sharp("./assets/mouse.png").toBuffer().then(image => {
                var size = imageSize(image)

                sharp(image).png({ compressionLevel: 9, quality: 1 }).resize(Math.floor(size.width / 4), Math.floor(size.height / 4)).toBuffer().then(mouse => {
                    var lastupdate = {}

                    setInterval(() => {
                        screenshot.all().then(async displays => {
                            for (var index = 0; index < displays.length; index++) {
                                var startedAt = new Date().getTime()

                                if (startedAt <= lastupdate[index]) return

                                var size = imageSize(displays[index])

                                if (startedAt <= lastupdate[index]) return

                                var image = await sharp(displays[index], { sequentialRead: true })
                                    .webp({ quality: 72, alphaQuality: 0, reductionEffort: 6 })
                                    .composite([{ input: mouse, top: Math.floor(robot.getMousePos().y / 2), left: Math.floor(robot.getMousePos().x / 2) }])
                                    .resize(Math.floor(size.width / 2), Math.floor(size.height / 2))
                                    .toBuffer()

                                if (startedAt <= lastupdate[index]) return

                                lastupdate[index] = new Date().getTime()

                                connection.send(new Packet("display", { id: index, size, image: image.toJSON(), totalAmount: displays.length }).encode())
                            }
                        })
                    }, 1000 / this.fps)
                })
            })
        })
    }
}