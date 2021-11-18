const fs = require("fs")
const http = require("http")
const Packet = require("./Packet.js")
const jimp = require("jimp")
const robot = require("robotjs")
const path = require("path")

module.exports = class Server {
    server

    origin
    port

    constructor(port, origin) {
        if (port == undefined || port == null) throw new Error('Missing paramiter "port"')
        if (origin == undefined || origin == null) throw new Error('Missing paramiter "origin"')

        jimp.read(path.join(__dirname, "../assets/mouse.png")).then(mouse => {
            // .resize(Math.floor(size.width / 4), Math.floor(size.height / 4))
            mouse.scale(0.25).quality(100)

            this.server = http.createServer((req, res) => {
                if (req.url == "/") {
                    res.statusCode = 200
                    res.statusMessage = "Ok"
                    res.end(fs.readFileSync(path.join(__dirname, "./index.html")))
                } else if (req.url == "/Packet.js") {
                    res.statusCode = 200
                    res.statusMessage = "Ok"
                    res.end(fs.readFileSync(path.join(__dirname, "./Packet.js")))
                } else if (req.url == "/displays") {
                    res.statusCode = 200
                    res.statusMessage = "Ok"
                    res.end(new Packet("displays", [{ id: 0, size: robot.getScreenSize() }]).encode())
                } else if (req.url == "/display") {
                    var message = Packet.decode(req.headers.packet)

                    var screen = robot.screen.capture()
                    var rawDesktop = []

                    var index = 0
                    screen.image.forEach(value => {
                        if (index % 4 == 3) {
                            rawDesktop[index - 3] = screen.image[index - 1]
                            rawDesktop[index - 2] = screen.image[index - 2]
                            rawDesktop[index - 1] = screen.image[index - 3]
                            rawDesktop[index] = screen.image[index]
                        }

                        index++
                    })

                    new jimp({ data: Buffer.from(rawDesktop), width: screen.width, height: screen.height })
                        .quality(message.data.quality)
                        .composite(mouse, Math.floor(robot.getMousePos().y * message.data.scale), Math.floor(robot.getMousePos().x * message.data.scale))
                        .scale(message.data.scale)
                        .getBufferAsync(jimp.MIME_PNG).then(image => {
                            res.statusCode = 200
                            res.statusMessage = "Ok"
                            res.end(new Packet("display", { id: message.data.id, size: { width: screen.width, height: screen.height }, status: "change", image }).encode())
                        })
                } else if (req.url == "/control") {
                    var message = Packet.decode(req.headers.packet)

                    message.data.forEach(data => {
                        var packet = Packet.decode(data)

                        if (packet.type == "mousemove") {
                            robot.moveMouseSmooth(packet.data.x, packet.data.y, 1)
                        } else if (packet.type == "mouseclick") {
                            robot.mouseClick(packet.data.button, false)
                        } else if (packet.type == "mousescroll") {
                            robot.scrollMouse(packet.data.x, packet.data.y)
                        } else if (packet.type == "keypress") {
                            if (packet.data.type) robot.typeString(packet.data.string)
                            else robot.keyTap(packet.data.key, packet.data.modifiers)
                        }
                    })

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
    }
}