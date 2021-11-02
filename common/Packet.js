class Packet {
    type
    data

    constructor(type, data) {
        if (type == undefined || type == null) throw new Error('Missing paramiter "type"')

        this.type = type
        this.data = data || {}
    }

    encode() {
        this.data.timestamp = new Date().getTime()

        return btoa(JSON.stringify({ type: this.type, data: this.data }))
    }

    static decode(data) {
        data = JSON.parse(atob(data))

        return new Packet(data.type, data.data)
    }
}

if (this.window) window.Packet = Packet
else if (module) module.exports = Packet