const fs = require("fs")
const http = require("http")
const Packet = require("./Packet.js")
const robot = require("robotjs")
const sharp = require("sharp")
const screenshot = require("screenshot-desktop")

module.exports = class Server {
    server

    origin
    port

    constructor(port, origin) {
        if (port == undefined || port == null) throw new Error('Missing paramiter "port"')
        if (origin == undefined || origin == null) throw new Error('Missing paramiter "origin"')

        this.port = port
        this.origin = origin

        sharp("./assets/mouse.png")
            .metadata()
            .then(({ width, height }) => {
                sharp("./assets/mouse.png")
                    .webp({ quality: 100, alphaQuality: 0, reductionEffort: 6 })
                    .resize(Math.round(width * 0.25), Math.round(height * 0.25))
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
                                screenshot.listDisplays().then(displays => {
                                    var displaydata = []
                                    var index = 0
                                    displays.forEach(display => {
                                        displaydata.push({ id: index, bounds: { top: display.top, left: display.left, bottom: display.bottom, right: display.right }, pos: { x: display.left, y: display.top }, size: { width: display.width, height: display.height } })
                                        index++
                                    })

                                    res.statusCode = 200
                                    res.statusMessage = "Ok"
                                    res.end(new Packet("displays", displaydata).encode())
                                })
                            } else if (req.url == "/display") {
                                var message = Packet.decode(req.headers.packet)

                                screenshot.listDisplays().then(displays => {
                                    screenshot({ screen: displays[message.data.id].id, format: "jpg" }).then(image => {
                                        sharp(image)
                                            .metadata()
                                            .then(({ width, height }) => {
                                                sharp(image)
                                                    .webp({ quality: message.data.quality, alphaQuality: 0, reductionEffort: 6 })
                                                    .resize(Math.round(width * message.data.scale), Math.round(height * message.data.scale))
                                                    .composite([{ input: mouse, left: Math.round(robot.getMousePos().x * message.data.scale), top: Math.round(robot.getMousePos().y * message.data.scale) }])
                                                    .removeAlpha()
                                                    .toBuffer().then(image => {
                                                        res.statusCode = 200
                                                        res.statusMessage = "Ok"
                                                        res.end(new Packet("display", { id: message.data.id, size: { width: width, height: height }, status: "change", image }).encode())
                                                    })
                                            })
                                    })
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
            })
    }
}