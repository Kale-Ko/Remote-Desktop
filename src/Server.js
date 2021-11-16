const fs = require("fs")
const http = require("http")
const Packet = require("./Packet.js")

module.exports = class Server {
    server

    origin
    port

    constructor(port, origin) {
        if (port == undefined || port == null) throw new Error('Missing paramiter "port"')
        if (origin == undefined || origin == null) throw new Error('Missing paramiter "origin"')

        this.server = http.createServer((req, res) => {
            if (req.url == "/") {
                res.statusCode = 200
                res.statusMessage = "Ok"
                res.end(fs.readFileSync("./src/index.html").toString().replace(/{origin}/g, this.origin.replace("http", "ws")))
            } else if (req.url == "/Packet.js") {
                res.statusCode = 200
                res.statusMessage = "Ok"
                res.end(fs.readFileSync("./src/Packet.js").toString().replace(/{origin}/g, this.origin.replace("http", "ws")))
            } else if (req.url == "/screen") {
                // sharp("./assets/mouse.png").toBuffer().then(image => {
                //     var size = imageSize(image)

                //     sharp(image)
                //         .png({ compressionLevel: 9, quality: 1 })
                //         .resize(Math.floor(size.width / 4), Math.floor(size.height / 4))
                //         .sharpen()
                //         .normalize()
                //         .toBuffer().then(mouse => {
                //             return

                //             setInterval(() => {
                //                 screenshot.all().then(async displays => {
                //                     for (var index = 0; index < displays.length; index++) {
                //                         var startedAt = new Date().getTime()

                //                         var size = imageSize(displays[index])

                //                         var image = await sharp(displays[index], { sequentialRead: true })
                //                             .webp({ quality: 72, alphaQuality: 0, reductionEffort: 6 })
                //                             .composite([{ input: mouse, top: Math.floor(robot.getMousePos().y / 2), left: Math.floor(robot.getMousePos().x / 2) }])
                //                             .resize(Math.floor(size.width / 2), Math.floor(size.height / 2))
                //                             .sharpen()
                //                             .normalize()
                //                             .toBuffer()

                //                         connection.send(new Packet("display", { id: index }).encode())
                //                     }
                //                 })
                //             }, 1000 / this.fps)
                //         })
                // })
            } else if (req.url == "control") {
                // if (message.type == "mousemove") {
                //     robot.moveMouseSmooth(message.data.x, message.data.y, 1)
                // } else if (message.type == "mouseclick") {
                //     robot.mouseClick(message.data.button, false)
                // } else if (message.type == "mousescroll") {
                //     robot.scrollMouse(message.data.x, message.data.y)
                // } else if (message.type == "keypress") {
                //     if (message.data.type) robot.typeString(message.data.string)
                //     else robot.keyTap(message.data.key, message.data.modifiers)
                // }
            } else {
                res.statusCode = 404
                res.statusMessage = "Not Found"
                res.end("404 Not Found")
            }
        })
        this.origin = origin
        this.port = port
    }

    start() {
        this.server.listen(this.port)
    }
}