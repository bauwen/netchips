var netchips = require("../../tools");

module.exports = {
    HTML5: HTML5
}

function HTML5(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            callback("GET request failed");
            return;
        }
        
        var query = "";
        
        $('form').each(function () {
            var form = $(this);
            
            var values = netchips.getFormValues($, form);
            if (!values.hasOwnProperty("fname")) {
                return;
            }
            
            values["referer"] = link;
            query = netchips.serialize(values);
        });
        
        if (query) {
            setTimeout(function () {
                netchips.postDOM(link, {}, query, function (html, $) {
                    if (!html || !$) {
                        callback("POST request failed");
                        return;
                    }
                    
                    searchVideo(html, $, callback);
                });
            }, 6000);
        } else {
            searchVideo(html, $, callback);
        }
    });
}

function searchVideo(html, $, callback) {
    var pos = html.indexOf("eval(function(");
    
    if (pos >= 0) {
        var end = html.indexOf(".split('|')))");
        if (end > pos) {
            var code = html.slice(pos + 4, end + ".split('|')))".length);
            html = eval(code);
        }
    }
    
    pos = html.indexOf('.mp4"');
    if (pos < 0) {
        pos = html.indexOf(".mp4'");
        if (pos < 0) {
            callback("No video found");
            return;
        }
    }
    
    var video = netchips.extractString(html, pos);
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
};
