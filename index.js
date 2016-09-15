var electron = require("electron");
var netchips = require("./netchips");
var path = require("path");
var https = require("https");
var fs = require("fs");

electron.app.commandLine.appendSwitch('--enable-npapi');
electron.app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, "pepflashplayer.dll"))

electron.app.on("window-all-closed", function () {
    electron.app.quit();
});

var updateWindow = null;

electron.app.on("ready", function () {
    updateWindow = new electron.BrowserWindow({
        width: 720,
        height: 540,
        title: "Netchips Update",
        backgroundColor: "#222"
    });
    updateWindow.loadURL("file://" + path.join(__dirname, "error.html"));
    updateWindow.on("closed", function () {
        updateWindow = null;
    });
    
    checkForUpdate();
});

function start() {
    netchips.onready(function (port) {
        var mainWindow = new electron.BrowserWindow({
            width: 1080,
            height: 640,
            title: "Netchips",
            webPreferences: {
                plugins: true,
            },
            backgroundColor: "#222"
        });
        mainWindow.loadURL("http://localhost:" + port + "/");
        mainWindow.on("closed", function () {
            mainWindow = null;
        });
    });
    
    netchips.start();
    updateWindow.close();
}

function checkForUpdate() {
    var version = "";
    try {
        version = fs.readFileSync("version.txt", "utf8");
    } catch (err) {};
    
    getRawContent("version.txt", function (body) {
        if (!body) {
            updateWindow.show();
            return;
        }
        
        if (version.trim() != body.trim()) {
            update();
            return;
        }
        
        start();
    });
}

function update() {
    GET("https://api.github.com/repos/bauwen/netchips/git/trees/master?recursive=1", function (body) {
        if (!body) {
            updateWindow.show();
            return;
        }
        
        updateTree(body.tree, 0, function (success) {
            if (success) {
                start();
            } else {
                updateWindow.show();
            }
        });
    });
}

function updateTree(tree, n, callback) {
    if (n >= tree.length) {
        callback(true);
    }
    
    var path =  tree[n].path;
    
    getRawContent(path, function (body) {
        if (body) {
            fs.writeFileSync(path.join(__dirname, path), body);
            setTimeout(function () {
                updateTree(tree, n + 1, callback);
            }, 0);
        } else {
            callback(false);
        }
    });
}

function getRawContent(relpath, callback) {
    GET("https://raw.githubusercontent.com/bauwen/netchips/master/" + relpath, callback);
}

function GET(link, callback) {
    https.get(link, function (res) {
        var body = "";
        
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            body += chunk;
        });
        res.on("end", function (chunk) {
            callback(body);
        });
    }).on("error", function () {
        callback(null);
    });
}

electron.ipcMain.on("try again", function () {
    updateWindow.hide();
    checkForUpdate();
});

