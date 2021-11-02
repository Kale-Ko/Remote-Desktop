const Config = require("./server/Config.js")
const WebServer = require("./client/Server.js")
const RemoteDesktopServer = require("./server/Server.js")

const config = new Config("./config.json")

var webServer = new WebServer(config.frontport)
var remotedesktopServer = new RemoteDesktopServer(config.backport)