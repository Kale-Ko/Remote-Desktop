/**
    @license
    MIT License
    Copyright (c) 2021 Kale Ko
    See https://kaleko.ga/license.txt
*/

class Packet {
    type
    data

    constructor(type, data) {
        if (type == undefined || type == null) throw new Error('Missing paramiter "type"')

        this.type = type
        this.data = data || {}
    }

    encode() {
        return JSON.stringify({ type: this.type, data: this.data })
    }

    static decode(data) {
        data = JSON.parse(data)

        return new Packet(data.type, data.data)
    }
}

if (this.window) window.Packet = Packet
else if (module) module.exports = Packet