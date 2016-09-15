var netchips = require("../tools");

module.exports = {
    getSearchSuggestions: getSuggestions,
    getGeneralSuggestions: getSuggestions,
    getGenreSuggestions: getSuggestions,
    getInfo: getInfo
}


/* MAIN */

var error1 = "Kan geen suggesties verkrijgen (ben je verbonden met het internet?)";
var error2 = "Kan geen suggesties verkrijgen (Netchips heeft wellicht een update nodig)";
var error3 = "Kan de film niet verkrijgen (ben je nog steeds verbonden met het internet?)";


function getSuggestions(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            console.log("GET request failed");
            callback(error1);
            return;
        }
        
        var suggestions = [];
        var error = false;
        var skip = [];
        
        $('td[width="71"]').each(function () {
            var suggestionElement = $(this);
            
            var a = netchips.getNthElement($, suggestionElement, "a", 1);
            if (!a) {
                console.log("No second <a> found");
                callback(error2);
                error = true;
                return false;
            }
            
            var img = netchips.getNthElement($, a, "img", 0);
            if (!img) {
                console.log("No <img> found");
                callback(error2);
                error = true;
                return false;
            }
            var image = img.attr("src");
            if (image == "http://www.zmovie.tw/files/movies/noimage.gif") {
                skip.push(true);
                return;
            }
            skip.push(false);
            
            var link = a.attr("href");
            
            var title = a.attr("title");
            if (!title) {
                console.log("No 'title' attribute found");
                callback(error2);
                error = true;
                return false;
            }
            
            suggestions.push({
                link: link,
                title: title,
                image: image,
                release: "",
                genres: [],
                rate: ""
            });
        });
        
        if (error) {
            return;
        }
        
        var filtered = [];
        var k = 0;
        
        $('td[width="200"]').each(function (i) {
            var suggestionInfoElement = $(this);
            
            if (skip[i]) {
                k += 1;
                return;
            }
            
            var suggestion = suggestions[i - k];
            
            var tr = netchips.getNthElement($, suggestionInfoElement, "tr", 3);
            var td = netchips.getNthElement($, tr, "td", 1);
            var rate = td.text().trim();
            rate = rate.slice(0, rate.indexOf("/"));
            if (rate == "0.0") {
                return;
            }
            suggestion.rate = rate;
            
            tr = netchips.getNthElement($, suggestionInfoElement, "tr", 1);
            td = netchips.getNthElement($, tr, "td", 1);
            $('a', td).each(function () {
                suggestion.genres.push($(this).text().trim());
            });
            
            tr = netchips.getNthElement($, suggestionInfoElement, "tr", 2);
            td = netchips.getNthElement($, tr, "td", 1);
            suggestion.release = td.text().trim();
            
            filtered.push(suggestion);
        });
        
        callback("", {
            last: html.indexOf("Next+</a>") < 0,
            list: filtered
        });
    });
}

function getInfo(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            console.log("GET request failed");
            callback(error3);
            return;
        }
        
        var description = "";
        var meta = $('* [name="description"]').first();
        if (meta) {
            var text = meta.attr("content");
            if (text) {
                description = text;
            }
        }
        
        var trailer = "";
        var tables = $('* [style="margin: 10px 20px 20px;"]');
        if (tables.length > 1) {
            var iframes = $('iframe', tables.eq(1));
            if (iframes.length > 0) {
                var src = iframes.first().attr("src");
                if (src) {
                    trailer = src;
                }
            }
        }
        
        var hosts = [];
        $('* [class="atest"]').each(function () {
            var a = $(this);
            
            var link = a.attr("href");
            if (!link) {
                return;
            }
            
            if (link.indexOf("https://") < 0) {
                hosts.push(link);
            }
        });
        
        callback("", {
            description: description,
            trailer: trailer,
            hosts: hosts
        });
    });
}
