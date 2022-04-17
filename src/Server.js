const fs = require("fs")
const express = require("express")
const http = require("http")
const https = require("https")
const io = require("socket.io")
const compression = require("compression")
const Packet = require("./Packet.js")
const sharp = require("sharp")
const screenshot = require("screenshot-desktop")
const robot = require("robotjs")

module.exports = class Server {
    config

    app
    server

    socket

    constructor(config) {
        if (config == undefined || config == null) throw new Error("Missing paramiter \"config\"")

        this.config = config

        robot.setKeyboardDelay(0)
        robot.setMouseDelay(0)

        var mouse = sharp("./assets/mouse.png")

        mouse.metadata().then(({ width, height }) => {
            mouse.webp({ quality: 100, alphaQuality: 0, reductionEffort: 6 }).resize(Math.round(width * 0.5), Math.round(height * 0.5)).toBuffer().then(mouse => {
                this.app = express()
                this.app.use(compression({ level: 7, memLevel: 9 }))

                this.app.get("*", (req, res) => {
                    var url = new URL("http" + (req.socket.getPeerCertificate != null ? "s" : "") + "://" + req.headers.host + req.url)
                    if (config.enforceHost && (url.hostname != new URL(config.host).hostname || url.port != new URL(config.host).port || url.protocol != new URL(config.host).protocol)) {
                        res.statusCode = 403
                        res.statusMessage = "Forbidden"
                        res.end()

                        return
                    }

                    var headers = [
                        { key: "Access-Control-Allow-Origin", value: new URL(config.host).hostname },
                        { key: "Access-Control-Allow-Methods", value: "GET" },
                        { key: "Allow", value: "GET" },
                        { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
                        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
                        { key: "X-Frame-Options", value: "DENY" },
                        { key: "Cache-Control", value: "no-store" }
                    ]

                    if (url.pathname == "/") {
                        res.statusCode = 200
                        res.statusMessage = "Ok"
                        headers.forEach(header => { res.setHeader(header.key, header.value) })
                        res.setHeader("Content-Type", "text/html")
                        res.end(fs.readFileSync("./src/index.html"))
                    } else if (url.pathname == "/Packet.js") {
                        res.statusCode = 200
                        res.statusMessage = "Ok"
                        headers.forEach(header => { res.setHeader(header.key, header.value) })
                        res.setHeader("Content-Type", "text/javascript")
                        res.end(fs.readFileSync("./src/Packet.js"))
                    } else if (url.pathname == "/Config.js") {
                        res.statusCode = 200
                        res.statusMessage = "Ok"
                        headers.forEach(header => { res.setHeader(header.key, header.value) })
                        res.setHeader("Content-Type", "text/javascript")
                        res.end(fs.readFileSync("./src/Config.js"))
                    } else {
                        res.statusCode = 404
                        res.statusMessage = "Not Found"
                        headers.forEach(header => { res.setHeader(header.key, header.value) })
                        res.setHeader("Content-Type", "text/plain")
                        res.end("404 Not Found")
                    }
                })

                if (config.https.enabled) {
                    this.server = https.createServer({
                        key: fs.readFileSync(config.https.cert.private),
                        cert: fs.readFileSync(config.https.cert.public)
                    }, this.app)
                } else {
                    this.server = http.createServer(this.app)
                }

                this.socket = new io.Server(this.server)
                this.socket.use((socket, next) => compression({ level: 7, memLevel: 9 })(socket.request, {}, next))

                this.socket.on("connection", connection => {
                    console.log("Received connection from " + connection.conn.remoteAddress)

                    connection.data.authenticated = false

                    connection.on("packet", async data => {
                        var message
                        try {
                            message = await Packet.decode(data)
                        } catch (err) {
                            connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.InvalidPacket, message: "Could not parse packet" }).encode())

                            return
                        }

                        if (message.type == Packet.Type.ConnectionRequested) {
                            if (config.authentication.enabled) {
                                connection.emit("packet", await new Packet(Packet.Type.AuthRequired, { useUsername: config.authentication.useUsername }).encode())
                            } else {
                                connection.data.authenticated = true

                                connection.emit("packet", await new Packet(Packet.Type.ConnectionAccepted, {}).encode())
                            }
                        } else if (message.type == Packet.Type.AuthAttempt) {
                            if (config.authentication.enabled) {
                                if (!connection.data.authenticated) {
                                    if ((!config.authentication.useUsername || message.data.username == config.authentication.username) && message.data.password == config.authentication.password) {
                                        console.log("Successfully authentication from " + connection.conn.remoteAddress)

                                        connection.data.authenticated = true

                                        connection.emit("packet", await new Packet(Packet.Type.ConnectionAccepted, {}).encode())
                                    } else {
                                        console.log("Invalid authentication from " + connection.conn.remoteAddress)

                                        connection.emit("packet", await new Packet(Packet.Type.InvalidCredentials, {}).encode())
                                    }
                                } else {
                                    connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.AlreadyAuthed, message: "You are already authenticated" }).encode())
                                }
                            } else {
                                connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.AuthNotEnabled, message: "Auth is not enabled" }).encode())
                            }
                        } else if (message.type == Packet.Type.RequestDisplays) {
                            if (connection.data.authenticated) {
                                screenshot.listDisplays().then(async displays => {
                                    var displaydata = []
                                    var index = 0
                                    displays.forEach(display => {
                                        displaydata.push({ id: index, pos: { x: display.left, y: display.top }, size: { width: display.width, height: display.height } })
                                        index++
                                    })

                                    connection.emit("packet", await new Packet(Packet.Type.Displays, displaydata).encode())
                                })
                            } else {
                                connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.NotAuthed, message: "You are not authenticated" }).encode())
                            }
                        } else if (message.type == Packet.Type.RequestDisplay) {
                            if (connection.data.authenticated) {
                                if (message.data.scale >= config.stream.maxFps) {
                                    message.data.scale = config.stream.maxFps
                                }

                                // TODO Check max fps

                                screenshot.listDisplays().then(async displays => {
                                    var display = displays[message.data.id]
                                    if (display != null) {
                                        screenshot({ screen: display.id, format: "jpg" }).then(async image => {
                                            var image = sharp(image)

                                            image.metadata().then(async ({ width, height }) => {
                                                image.webp({ quality: message.data.quality, alphaQuality: 0, reductionEffort: 6 }).resize(Math.round(width * message.data.scale), Math.round(height * message.data.scale)).composite([{ input: mouse, left: Math.round(robot.getMousePos().x * message.data.scale) - display.left, top: Math.round(robot.getMousePos().y * message.data.scale) - display.top }]).removeAlpha().toBuffer().then(async image => {
                                                    connection.emit("packet", await new Packet(Packet.Type.Display, { id: message.data.id, size: { width: width, height: height }, image }).encode())
                                                })
                                            })
                                        })
                                    } else {
                                        connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.UnknownDisplay, message: "Unknown display \"" + message.type + "\"" }).encode())
                                    }
                                })
                            } else {
                                connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.NotAuthed, message: "You are not authenticated" }).encode())
                            }
                        } else if (message.type == Packet.Type.Control.Packet) {
                            if (connection.data.authenticated) {
                                if (message.data.type == Packet.Type.Control.Type.MouseMove) {
                                    screenshot.listDisplays().then(async displays => {
                                        var bounds = { left: 0, right: 0, top: 0, bottom: 0 }

                                        displays.forEach(display => {
                                            if (display.left <= bounds.left) bounds.left = display.left
                                            if (display.top <= bounds.top) bounds.top = display.top
                                            if (display.right >= bounds.right) bounds.right = display.right
                                            if (display.bottom >= bounds.bottom) bounds.bottom = display.bottom
                                        })

                                        if (message.data.data.x >= bounds.left && message.data.data.x <= bounds.right && message.data.data.y >= bounds.top && message.data.data.y <= bounds.bottom) {
                                            robot.moveMouse(message.data.data.x, message.data.data.y)
                                        }
                                    })
                                } else if (message.data.type == Packet.Type.Control.Type.MouseScroll) {
                                    robot.scrollMouse(-message.data.data.x, -message.data.data.y)
                                } else if (message.data.type == Packet.Type.Control.Type.MouseClick.Packet) {
                                    robot.mouseClick(message.data.data.type, false)
                                } else if (message.data.type == Packet.Type.Control.Type.KeyPress) {
                                    var modifiers = []

                                    if (message.data.data.modifiers.shift) modifiers.push("shift")
                                    if (message.data.data.modifiers.control) modifiers.push("control")
                                    if (message.data.data.modifiers.alt) modifiers.push("alt")
                                    if (message.data.data.modifiers.command) modifiers.push("command")

                                    robot.keyTap(message.data.data.key, modifiers)
                                }
                            } else {
                                connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.NotAuthed, message: "You are not authenticated" }).encode())
                            }
                        } else {
                            connection.emit("packet", await new Packet(Packet.Type.Error.Packet, { type: Packet.Type.Error.Type.UnknownPacket, message: "Unknown packet type \"" + message.type + "\"" }).encode())
                        }
                    })

                    connection.on("disconnect", () => {
                        connection.data.authenticated = false

                        console.log("Lost connection to " + connection.conn.remoteAddress)
                    })
                })

                this.server.listen(new URL(config.host).port || 80)
            })
        })
    }
}