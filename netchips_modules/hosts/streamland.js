var netchips = require("../../tools");

module.exports = {
    flash: flash
}

function flash(link, callback) {
    var path = "http://streamland.cc/videos.php?" + link.slice(link.indexOf("?") + 1);
    
    netchips.getDOM(path, function (html, $) {
        if (!html || !$) {
            callback("GET request failed");
            return;
        }
        
        pos = html.indexOf(".swf");
        if (pos < 0) {
            callback("No '.swf' found");
            return;
        }
        var swf = netchips.extractString(html, pos);
        
        pos = html.indexOf(".mp4");
        if (pos < 0) {
            callback("No '.mp4' found");
            return;
        }
        var mp4 = netchips.extractString(html, pos);
        
        var video = swf + "?file=" + mp4;
        netchips.HEAD(video, function (headers) {
            if (!headers) {
                callback("Unreachable video file");
                return;
            }
            
            if (headers["content-type"] == "text/html") {
                callback("Invalid video file");
                return;
            }
            
            callback("", video);
        });
    });
}