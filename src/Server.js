const fs = require("fs")
const http = require("http")
const Packet = require("./Packet.js")
const screenshot = require("screenshot-desktop")
const sharp = require("sharp")
const imageSize = require("image-size")
const robot = require("robotjs")

module.exports = class Server {
    server

    origin
    port

    constructor(port, origin) {
        if (port == undefined || port == null) throw new Error('Missing paramiter "port"')
        if (origin == undefined || origin == null) throw new Error('Missing paramiter "origin"')

        sharp("./assets/mouse.png").toBuffer().then(image => {
            var size = imageSize(image)

            sharp(image)
                .png({ compressionLevel: 9, quality: 1 })
                .resize(Math.floor(size.width / 4), Math.floor(size.height / 4))
                .sharpen()
                .normalize()
                .toBuffer().then(mouse => {
                    this.server = http.createServer((req, res) => {
                        if (req.url == "/") {
                            res.statusCode = 200
                            res.statusMessage = "Ok"
                            res.end(fs.readFileSync("./src/index.html"))
                        } else if (req.url == "/Packet.js") {
                            res.statusCode = 200
                            res.statusMessage = "Ok"
                            res.end(fs.readFileSync("./src/Packet.js"))
                        } else if (req.url == "/displays") {
                            screenshot.all().then(async displays => {
                                var displaysdata = []

                                for (var index = 0; index < displays.length; index++) {
                                    var size = imageSize(displays[index])

                                    displaysdata.push({ id: index, size })
                                }

                                res.statusCode = 200
                                res.statusMessage = "Ok"
                                res.end(new Packet("displays", displaysdata).encode())
                            })
                        } else if (req.url == "/display") {
                            var message = Packet.decode(req.headers.packet)

                            screenshot({ screen: message.data.id }).then(async display => {
                                var size = imageSize(display)

                                var image = await sharp(display, { sequentialRead: true })
                                    .webp({ quality: message.data.quality, alphaQuality: 0, reductionEffort: 6 })
                                    .composite([{ input: mouse, top: Math.floor(robot.getMousePos().y / 2), left: Math.floor(robot.getMousePos().x / 2) }])
                                    .resize(Math.floor(size.width * message.data.scale), Math.floor(size.height * message.data.scale))
                                    .sharpen()
                                    .toBuffer()

                                res.statusCode = 200
                                res.statusMessage = "Ok"
                                res.end(new Packet("display", { id: message.data.id, size, status: "change", image }).encode())
                            })
                        } else if (req.url == "/control") {
                            var message = Packet.decode(req.headers.packet)

                            if (message.type == "mousemove") {
                                robot.moveMouseSmooth(message.data.x, message.data.y, 1)
                            } else if (message.type == "mouseclick") {
                                robot.mouseClick(message.data.button, false)
                            } else if (message.type == "mousescroll") {
                                robot.scrollMouse(message.data.x, message.data.y)
                            } else if (message.type == "keypress") {
                                if (message.data.type) robot.typeString(message.data.string)
                                else robot.keyTap(message.data.key, message.data.modifiers)
                            }

                            res.statusCode = 200
                            res.statusMessage = "Ok"
                            res.end(new Packet("complete").encode())
                        } else {
                            res.statusCode = 404
                            res.statusMessage = "Not Found"
                            res.end("404 Not Found")
                        }
                    })
                    this.origin = origin
                    this.port = port

                    this.server.listen(8000)
                })
        })
    }
}