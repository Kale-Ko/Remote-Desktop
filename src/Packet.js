if (this.window) var window = this.window
else if (module) var window = undefined

if (window) var zlib = null
else if (module) var zlib = require("zlib")

class Packet {
    static Type = {
        ConnectionRequested: 0,
        ConnectionAccepted: 1,
        AuthRequired: 2,
        AuthAttempt: 3,
        InvalidCredentials: 4,
        Error: {
            Packet: 5,
            Type: {
                InvalidPacket: 0,
                UnknownPacket: 1,
                AuthNotEnabled: 2,
                AlreadyAuthed: 3,
                NotAuthed: 4,
                UnknownDisplay: 5
            }
        },
        RequestDisplays: 7,
        Displays: 8,
        RequestDisplay: 9,
        Display: 10,
        Control: {
            Packet: 11,
            Type: {
                MouseMove: 0,
                MouseClick: {
                    Packet: 1,
                    Type: {
                        Left: "left",
                        Right: "right",
                        Middle: "middle"
                    }
                },
                MouseScroll: 2,
                KeyPress: 3
            }
        }
    }

    static compress = false
    static encoding = "gzip"

    type
    data

    constructor(type, data) {
        if (type == undefined || type == null) throw new Error('Missing paramiter "type"')
        if (data == undefined || data == null) throw new Error('Missing paramiter "data"')

        this.type = type
        this.data = data
    }

    async encode() {
        if (Packet.compress) {
            if (window) {
                var data = new TextEncoder().encode(JSON.stringify({ type: this.type, data: this.data }))
                var cs = new CompressionStream(Packet.encoding)
                var writer = cs.writable.getWriter()
                writer.write(data)
                writer.close()
                data = await new Response(cs.readable).arrayBuffer()
                return JSON.stringify(Array.from(new Uint8Array(data)))
            } else if (module) {
                var gzip = await zlib.gzipSync(new TextEncoder().encode(JSON.stringify({ x: this.type, y: this.data })))
                console.log(JSON.stringify(gzip.toJSON().data).length)
                return JSON.stringify({ x: this.type, y: this.data })
            }
        } else {
            return JSON.stringify({ type: this.type, data: this.data })
        }
    }

    static async decode(data) {
        if (Packet.compress) {
            if (window) {
                var cs = new DecompressionStream(Packet.encoding)
                var writer = cs.writable.getWriter()
                writer.write(new Uint8Array(JSON.parse(data)).buffer)
                writer.close()
                data = await new Response(cs.readable).text()
                data = JSON.parse(data)

                return new Packet(data.type, data.data)
            } else if (module) {
                var data = await zlib.unzipSync(Buffer.from(JSON.parse(data)))
                data = JSON.parse(data)
                return new Packet(data.type, data.data)
            }
        } else {
            data = JSON.parse(data)
            return new Packet(data.type, data.data)
        }
    }
}

if (window) window.Packet = Packet
else if (module) module.exports = Packet