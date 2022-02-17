const Config = require("./src/Config.js")
const Server = require("./src/Server.js")

const config = new Config("./config.json")

if (process.env.PORT) config.port = process.env.PORT

var server = new Server(config.port, config.origin, config.enableControl)

console.log("Server started at " + server.origin)