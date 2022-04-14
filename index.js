const Config = require("./src/Config.js")
const Server = require("./src/Server.js")

var server = new Server(new Config("./config.json"))

console.log("Server started at " + server.config.host)