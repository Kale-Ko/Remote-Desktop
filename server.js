const Config = require("./common/Config.js")
const RemoteDesktopServer = require("./server/Server.js")

const config = new Config("./config.json")

if (process.env.PORT && !config.port) config.port = process.env.PORT

console.log(config.port)

var remotedesktopServer = new RemoteDesktopServer(config.port, config.origin)

remotedesktopServer.start()