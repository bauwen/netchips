var cheerio = require("cheerio");
var http = require("http");
var https = require("https");
var os = require("os");
var querystring = require("querystring");
var url = require("url");
var zlib = require("zlib");

module.exports = {
    getDOM: getDOM,
    postDOM: postDOM,
    getNthElement: getNthElement,
    getFormValues: getFormValues,
    serialize: serialize,
    extractString: extractString,
    GET: GET,
    GETImage: GETImage,
    POST: POST,
    HEAD: HEAD,
    httpsHEAD: httpsHEAD
};

function getDOM(link, callback) {
    GET(link, function (html) {
        if (html) {
            callback(html, cheerio.load(html));
        } else {
            callback("", null);
        }
    });
}

function postDOM(link, headers, body, callback) {
    POST(link, headers, body, function (html) {
        if (html) {
            callback(html, cheerio.load(html));
        } else {
            callback("", null);
        }
    });
}

function getNthElement($, context, tagName, n) {
    var elements = $(tagName, context);
    return elements.length > n ? elements.eq(n) : null;
}

function getFormValues($, form) {
    var values = {};
    
    $('input', form).each(function () {
        var input = $(this);
        
        var name = input.attr("name");
        if (name) {
            values[name] = input.attr("value");
        }
    });
    
    return values;
}

function serialize(values) {
    return querystring.stringify(values);
}

function extractString(text, pos) {
    var piece = "";
    var quote = "";
    
    for (var i = pos - 1; i >= 0; i -= 1) {
        var character = text.charAt(i);
        if (character == '"' || character == "'") {
            quote = character;
            break;
        }
        
        piece = character + piece;
    }
    
    for (var i = pos; i < text.length; i += 1) {
        var character = text.charAt(i);
        if (character == quote) {
            break;
        }
        
        piece += character;
    }
    
    return piece;
}

function GET(link, callback) {
    var urlobject = url.parse(link);
    
    var query = "";
    if (urlobject.query) {
        query += "?" + urlobject.query;
    }
    
    var req = http.request({
        host: urlobject.hostname,
        path: urlobject.pathname + query,
        port: urlobject.port,
        method: "GET",
        headers: {
            "Host": urlobject.hostname,
            "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:43.0) Gecko/20100101 Firefox/43.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "nl,en-US;q=0.7,en;q=0.3",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
    }, function (res) {
        var chunks = [];
        
        res.on("data", function (chunk) {
            chunks.push(chunk);
        });
        res.on("end", function () {
            var buffer = Buffer.concat(chunks);
            var body;
            
            switch (res.headers["content-encoding"]) {
                case "gzip":
                    body = zlib.gunzipSync(buffer).toString();
                    break;
                    
                case "deflate":
                    body = zlib.inflateSync(buffer).toString();
                    break;
                    
                default:
                    body = buffer.toString();
            }
            
            callback(body);
        });
    });
    
    req.on("error", function (err) {
        callback("");
    });
    
    req.end();
}

function GETImage(link, callback) {
    var urlobject = url.parse(link);
    
    var query = "";
    if (urlobject.query) {
        query += "?" + urlobject.query;
    }
    
    var req = http.request({
        host: urlobject.hostname,
        path: urlobject.pathname + query,
        port: urlobject.port,
        method: "GET",
        headers: {
            "Host": urlobject.hostname,
            "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:43.0) Gecko/20100101 Firefox/43.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "nl,en-US;q=0.7,en;q=0.3",
            "Accept-Encoding": "gzip, deflate",
            "Referer": link,
            "Content-Type": "image/png",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
    }, function (res) {
        var chunks = [];
        
        res.on("data", function (chunk) {
            chunks.push(chunk);
        });
        res.on("end", function () {
            var buffer = Buffer.concat(chunks);
            var body;
            
            switch (res.headers["content-encoding"]) {
                case "gzip":
                    body = zlib.gunzipSync(buffer).toString("base64");
                    break;
                    
                case "deflate":
                    body = zlib.inflateSync(buffer).toString("base64");
                    break;
                    
                default:
                    body = buffer.toString("base64");
            }
            
            callback("data:image/png;base64," + body);
        });
    });
    
    req.on("error", function (err) {
        callback("");
    });
    
    req.end();
}

function POST(link, customHeaders, body, callback) {
    var urlobject = url.parse(link);
    
    var headers = {
        "Host": urlobject.hostname,
        "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:43.0) Gecko/20100101 Firefox/43.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "nl,en-US;q=0.7,en;q=0.3",
        "Accept-Encoding": "gzip, deflate",
        "Referer": link,
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
        "Upgrade-Insecure-Requests": "1"
    };
    
    for (customHeader in customHeaders) {
        if (customHeaders.hasOwnProperty(customHeader)) {
            headers[customHeader] = customHeaders[customHeader];
        }
    }
    
    var req = http.request({
        host: urlobject.hostname,
        path: urlobject.pathname,
        port: urlobject.port,
        method: "POST",
        headers: headers
    }, function (res) {
        var chunks = [];
        
        res.on("data", function (chunk) {
            chunks.push(chunk);
        });
        res.on("end", function () {
            var buffer = Buffer.concat(chunks);
            var body;
            
            switch (res.headers["content-encoding"]) {
                case "gzip":
                    body = zlib.gunzipSync(buffer).toString();
                    break;
                    
                case "deflate":
                    body = zlib.inflateSync(buffer).toString();
                    break;
                    
                default:
                    body = buffer.toString();
            }
            
            callback(body);
        });
    });
    
    req.on("error", function () {
        callback("");
    });
    
    req.write(body);
    req.end();
}

function HEAD(link, callback) {
    var urlobject = url.parse(link);
    
    var req = http.request({
        host: urlobject.hostname,
        path: urlobject.pathname,
        port: urlobject.port,
        method: "HEAD"
    }, function (res) {
        callback(res.headers);
    });
    
    req.on("error", function () {
        callback(null);
    });
    
    req.end();
}

function httpsHEAD(link, callback) {
    var urlobject = url.parse(link);
    
    var req = https.request({
        host: urlobject.hostname,
        path: urlobject.pathname,
        port: urlobject.port,
        method: "HEAD"
    }, function (res) {
        callback(res.headers);
    });
    
    req.on("error", function () {
        callback(null);
    });
    
    req.end();
}
