var netchips = require("../../tools");

module.exports = {
    HTML5: HTML5
}

function HTML5(link, callback) {
    link = link.replace("://www.", "://");
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
            
            values["imhuman"] = "";
            values["gfk"] = "i22abd2449";
            values["_vhash"] = "i1102394cE";
            query = netchips.serialize(values);
        });
        
        if (query) {
            netchips.postDOM(link, {}, query, function (html, $) {
                if (!html || !$) {
                    callback("POST request failed");
                    return;
                }
                
                searchVideo(html, $, callback);
            });
        } else {
            searchVideo(html, $, callback);
        }
    });
}

function searchVideo(html, $, callback) {
    var pos = html.lastIndexOf('v.mp4"');
    if (pos < 0) {
        pos = html.lastIndexOf("v.mp4'");
        if (pos < 0) {
            callback("No video found (in)");
            return;
        }
    }
    
    var video = netchips.extractString(html, pos);
    
    pos = html.indexOf("mpri_Key='");
    if (pos >= 0) {
        var tkn = netchips.extractString(html, pos + "mpri_Key='".length + 1);
        
        netchips.GET("http://thevideo.me/jwv/" + tkn, function (data) {
            var text = eval(data.slice(4));
            var vt = netchips.extractString(text, text.indexOf("vt="));
            
            video += "?direct=false&ua=1&" + vt;
            
            netchips.httpsHEAD(video, function (headers) {
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
    } else {
        netchips.HEAD(video, function (headers) {
            if (!headers) {
                callback("Unreachable video file (no key)");
                return;
            }
            
            if (headers["content-type"] == "text/html") {
                callback("Invalid video file");
                return;
            }
            
            callback("", video);
        });
    }
};
