const Config = require("./common/Config.js")
const Client = require("./desktopclient/Client.js")

const config = new Config("./config.json")

var client = new Client(config.serverOrigin.replace("http", "ws") + "/", config.fps, config.enableControl)

client.start()