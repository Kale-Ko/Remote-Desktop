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

    type
    data

    constructor(type, data) {
        if (type == undefined || type == null) throw new Error('Missing paramiter "type"')
        if (data == undefined || data == null) throw new Error('Missing paramiter "data"')

        this.type = type
        this.data = data
    }

    encode() {
        return JSON.stringify({ x: this.type, y: this.data })
    }

    static decode(data) {
        data = JSON.parse(data)

        return new Packet(data.x, data.y)
    }
}

if (this.window) window.Packet = Packet
else if (module) module.exports = Packet