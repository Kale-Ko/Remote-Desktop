const Config = require("./common/Config.js")
const Client = require("./client/Client.js")

const config = new Config("./config.json")

var client = new Client(config.origin.replace("http", "ws") + "/", config.fps, config.enableControl)

client.start()