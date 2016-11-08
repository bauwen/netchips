var bodyParser = require("body-parser");
var express = require("express");
var fs = require("fs");
var querystring = require("querystring");
var tools = require("./tools");

var dir1 = "./netchips_modules/";
var dir2 = "hosts/";

var zmovie = require(dir1 + "zmovie");
var watchseries = require(dir1 + "watchseries");

var gorillavid = require(dir1 + dir2 + "gorillavid");
var daclips = require(dir1 + dir2 + "daclips");
var movpod = require(dir1 + dir2 + "movpod");
var filehoot = require(dir1 + dir2 + "filehoot");
var vodlocker = require(dir1 + dir2 + "vodlocker");
var nosvideo = require(dir1 + dir2 + "nosvideo");
var thevideo = require(dir1 + dir2 + "thevideo");
var vidup = require(dir1 + dir2 + "vidup");
var idowatch = require(dir1 + dir2 + "idowatch");
var vidzi = require(dir1 + dir2 + "vidzi");

var playedto = require(dir1 + dir2 + "playedto");
var streamin = require(dir1 + dir2 + "streamin");
var watchonline = require(dir1 + dir2 + "watchonline");
var streamplay = require(dir1 + dir2 + "streamplay");
var vidto = require(dir1 + dir2 + "vidto");

var vidspace = require(dir1 + dir2 + "vidspace");
var streamland = require(dir1 + dir2 + "streamland");
var hdwide = require(dir1 + dir2 + "hdwide");
var stormvid = require(dir1 + dir2 + "stormvid");
var neovid = require(dir1 + dir2 + "neovid");

var vidshark = require(dir1 + dir2 + "vidshark");
var videohub = require(dir1 + dir2 + "videohub");


var procedures = [
    // direct, mp4
    "gorillavid.in", gorillavid.HTML5,
    "daclips.in", daclips.HTML5,
    "vodlocker.com", vodlocker.HTML5,
    "thevideo.me", thevideo.HTML5,
    "movpod.in", movpod.HTML5,
    "filehoot.com", filehoot.HTML5,
    "vidup.me", vidup.HTML5,
    "nosvideo.com", nosvideo.HTML5,
    
    // clean, flash
    "vidspace.cc", vidspace.flash,
    "hdwide.co", hdwide.flash,
    "stormvid.co", stormvid.flash,
    "streamland.cc", streamland.flash,
    
    // 6 seconds wait time, mp4
    "vidzi.tv", vidzi.HTML5,
    "idowatch.net", idowatch.HTML5,
    "streamin.to", streamin.HTML5,
    "playedto.me", playedto.HTML5,
    "www.watchonline.com", watchonline.HTML5,
    "streamplay.to", streamplay.HTML5,
    "vidto.me", vidto.HTML5,
    
    // blacklisted websites, flash
    "neovid.me", neovid.flash,
    "videohub.ws", videohub.flash,
    "vidshark.ws", vidshark.flash
];

var DEFAULT_PORT = 3000;
var callback = null;

module.exports = {
    onready: function (cb) {
        callback = cb;
    },
    start: start
}

function start(version) {
    var app = express();
    
    console.log("Netchips server is booting up...");

    var server = app.listen(DEFAULT_PORT, function () {
        console.log("Netchips uses port", DEFAULT_PORT);
        
        if (callback) {
            callback(DEFAULT_PORT);
        }
    });

    server.on("error", function (err) {
        if (err.code == "EADDRINUSE") {
            server = app.listen(0, function () {
                console.log("Port 3000 already in use, so Netchips now uses port", server.address().port);
            });
            
            if (callback) {
                callback(server.address().port);
            }
        } else {
            console.log(err);
        }
    });

    app.get("/", function (req, res) {
        res.sendFile(__dirname + "/index.html");
    });

    app.use(bodyParser.json());

    app.post("/", function (req, res) {
        var send = function (obj) {
            res.send(JSON.stringify(obj));
        };
        
        var sendString = function (text) {
            res.send(text);
        };
        
        switch (req.body.event) {
            case "port_get":
                send({
                    error: "",
                    port: server.address().port
                });
                break;
                
            case "version_get":
                send({
                    error: "",
                    version: version
                });
                break;
                
            case "films_general":
                zmovie.getGeneralSuggestions("http://www.zmovie.tw/movies/recent_update", function (err, result) {
                    if (err) {
                        send({error: err});
                    } else {
                        send({
                            error: "",
                            list: result.list
                        });
                    }
                });
                break;
                
            case "films_search":
                var query = querystring.escape(req.body.query);
                var page = req.body.page;
                
                zmovie.getSearchSuggestions("http://www.zmovie.tw/search/title/" + query + "/" + page, function (err, result) {
                    if (err) {
                        send({error: err});
                    } else {
                        send({
                            error: "",
                            list: result.list,
                            last: result.last
                        });
                    }
                });
                break;
                
            case "films_genre":
                var genre = req.body.genre;
                var page = req.body.page;
                
                zmovie.getGenreSuggestions("http://www.zmovie.tw/search/genre/" + genre + "/" + page, function (err, result) {
                    if (err) {
                        send({error: err});
                    } else {
                        send({
                            error: "",
                            list: result.list,
                            last: result.last
                        });
                    }
                });
                break;
                
            case "films_info":
                var link = req.body.link;
                
                zmovie.getInfo(link, function (err, result) {
                    if (err) {
                        send({error: err});
                        return;
                    } else {
                        send({
                            error: "",
                            description: result.description,
                            trailer: result.trailer,
                            hosts: result.hosts
                        });
                    }
                });
                break;
                
            case "films_video":
                var hosts = req.body.hosts;
                var ii = req.body.i;
                var jj = req.body.j;
                
                findVideo(hosts, function (err, video, i, j) {
                    if (err) {
                        send({error: err});
                    } else {
                        send({
                            error: "",
                            video: video,
                            i: i,
                            j: j
                        });
                    }
                }, ii, jj);
                break;
                
            case "series_general":
                var page = req.body.page;
                
                watchseries.getGeneralSuggestions("http://the-watch-series.to/series/" + page, function (err, result) {
                    if (err) {
                        send({error: err});
                    } else {
                        send({
                            error: "",
                            list: result.list
                        });
                    }
                });
                break;
                
            case "series_search":
                var query = querystring.escape(req.body.query);
                var page = req.body.page;
                
                watchseries.getSearchSuggestions("http://the-watch-series.to/search/" + query + "/page/" + page + "/sortby/MATCH", function (err, result) {
                    if (err) {
                        send({error: err});
                    } else {
                        send({
                            error: "",
                            list: result.list,
                            last: result.last
                        });
                    }
                });
                break;
                
            case "series_info":
                var link = "http://the-watch-series.to" + req.body.link;
                
                watchseries.getInfo(link, function (err, result) {
                    if (err) {
                        send({error: err});
                        return;
                    } else {
                        send({
                            error: "",
                            seasons: result.seasons,
                            description: result.description,
                            release: result.release,
                            genres: result.genres,
                            rate: result.rate,
                            background: result.background
                        });
                    }
                });
                break;
                
            case "series_seasons":
                var rel = req.body.link;
                var link = "http://the-watch-series.to" + rel;
                
                watchseries.getSeasons(link, function (err, result) {
                    if (err) {
                        send({error: err});
                        return;
                    } else {
                        send({
                            error: "",
                            link: rel,
                            seasons: result.seasons
                        });
                    }
                });
                break;
                
            case "series_episode":
                var link = /*"http://the-watch-series.to" + */req.body.link;
                var ii = req.body.i;
                var jj = req.body.j;
                
                watchseries.getHosts(link, function (err, hosts) {
                    if (err) {
                        send({error: err});
                        return;
                    }
                    
                    findVideo(hosts, function (err, video, i, j) {
                        if (err) {
                            send({error: err});
                        } else {
                            send({
                                error: "",
                                video: video,
                                i: i,
                                j: j
                            });
                        }
                    }, ii, jj);
                });
                break;
                
            case "storage_get":
                try {
                    var data = JSON.parse(fs.readFileSync(__dirname + "/netchips_data.json", "utf8"));
                    
                    for (var episode in data.episodes) {
                        if (data.episodes.hasOwnProperty(episode)) {
                            if (episode.indexOf("http://") != 0) {
                                data.episodes["http://the-watch-series.to" + episode] = true;
                                delete data.episodes[episode];
                            }
                        }
                    }
                    
                    var keys = Object.keys(data.series);
                    
                    replaceImages(data.series, keys, 0, function () {
                        send(data);
                    });
                } catch (err) {};
                break;
                
            case "storage_set":
                var storage = req.body.storage;
                
                try {
                    fs.writeFileSync(__dirname + "/netchips_data.json", JSON.stringify(storage));
                } catch (err) {};
                sendString("{}");
                break;
            
            default:
                console.log("Unknown event POSTed: ", req.body.event);
                send({error: "Er is iets foutgelopen (" + req.body.event + ")"});
        }
    });
}

function findVideo(hosts, callback, i, j) {
    if (i == procedures.length / 2) {
        callback("Geen video gevonden. :(", "");
        return;
    }
    
    if (j == hosts.length) {
        setTimeout(function () {
            findVideo(hosts, callback, i + 1, 0);
        }, 0);
        return;
    }
    
    var name = procedures[i * 2];
    var host = hosts[j];
    if (host.indexOf(name) < 0) {
        setTimeout(function () {
            findVideo(hosts, callback, i, j + 1);
        }, 0);
        return;
    }
    
    var procedure = procedures[i * 2 + 1];
    
    procedure(host, function (err, video) {
        if (err) {
            console.log(host + ": " + err);
            setTimeout(function () {
                findVideo(hosts, callback, i, j + 1);
            }, 0);
        } else {
            console.log(host + ": success!");
            callback("", video, i, j + 1);
        }
    });
}

function replaceImages(list, keys, index, callback) {
    if (index == keys.length) {
        callback();
        return;
    }
    
    var image = list[keys[index]].image;
    
    if (image.indexOf("data:") != 0) {
        tools.GETImage(image, function (src) {
            list[keys[index]].image = src;
            setTimeout(function () {
                replaceImages(list, keys, index + 1, callback);
            }, 0);
        });
    } else {
        setTimeout(function () {
            replaceImages(list, keys, index + 1, callback);
        }, 0);
    }
}
