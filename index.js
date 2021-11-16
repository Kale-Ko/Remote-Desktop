const Config = require("./src/Config.js")
const Server = require("./src/Server.js")

const config = new Config("./config.json")

if (process.env.PORT) config.port = process.env.PORT

var server = new Server(config.port, config.origin)

server.start()

console.log("Server started on " + config.port)