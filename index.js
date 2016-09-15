var electron = require("electron");
var fs = require("fs");
var https = require("https");
var netchips = require("./netchips");
var path = require("path");
var url = require("url");

electron.app.commandLine.appendSwitch('--enable-npapi');
electron.app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, "pepflashplayer.dll"))

electron.app.on("window-all-closed", function () {
    electron.app.quit();
});

var version = "";
var updateWindow = null;

electron.app.on("ready", function () {
    updateWindow = new electron.BrowserWindow({
        width: 720,
        height: 540,
        title: "Netchips update",
        backgroundColor: "#222",
        show: false
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
        updateWindow.close();
    });
    
    netchips.start(version);
}

function checkForUpdate() {
    try {
        version = fs.readFileSync(path.join(__dirname, "version.txt"), "utf8");
    } catch (err) {};
    
    getRawContent("version.txt", function (body) {
        if (!body) {
            updateWindow.show();
            return;
        }
        
        if (version.trim() != body.trim()) {
            console.log("We need to update");
            version = body;
            update();
            return;
        }
        
        console.log("We don't need to update");
        start();
    });
}

function update() {
    GET("https://api.github.com/repos/bauwen/netchips/git/trees/master?recursive=1", function (body) {
        if (!body) {
            updateWindow.show();
            return;
        }
        
        var json;
        try {
            json = JSON.parse(body);
        } catch (err) {
            updateWindow.show();
            return;
        }
        
        updateTree(json.tree, 0, function (success) {
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
        return;
    }
    
    var pathname = tree[n].path;
    
    if (tree[n].type != "blob") {
        setTimeout(function () {
            updateTree(tree, n + 1, callback);
        }, 0);
        return;
    }
    
    getRawContent(pathname, function (body) {
        if (body) {
            fs.writeFileSync(path.join(__dirname, pathname), body);
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
    var urlobject = url.parse(link);
    
    var query = "";
    if (urlobject.query) {
        query += "?" + urlobject.query;
    }
    
    var req = https.request({
        host: urlobject.hostname,
        path: urlobject.pathname + query,
        port: urlobject.port,
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:43.0) Gecko/20100101 Firefox/43.0",
        }
    }, function (res) {
        var body = "";
        
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            body += chunk;
        });
        res.on("end", function () {
            callback(body);
        });
    });
    
    req.on("error", function () {
        callback(null);
    });
    
    req.end();
}

electron.ipcMain.on("try again", function () {
    updateWindow.hide();
    checkForUpdate();
});
