const Config = require("./Config.js")
const WebServer = require("./webclient/Server.js")
const RemoteDesktopServer = require("./server/Server.js")

const config = new Config("./config.json")

var webServer = new WebServer(config.webServerOrigin, config.serverOrigin, config.webServerPort)
var remotedesktopServer = new RemoteDesktopServer(config.serverOrigin, config.webServerOrigin, config.serverPort)

webServer.start()
remotedesktopServer.start()