var netchips = require("../tools");

module.exports = {
    getSearchSuggestions: getSearchSuggestions,
    getGeneralSuggestions: getGeneralSuggestions,
    getInfo: getInfo,
    getSeasons: getSeasons,
    getHosts: getHosts
}


/* MAIN */

var error1 = "Kan geen suggesties verkrijgen (ben je verbonden met het internet?)";
var error2 = "Kan geen suggesties verkrijgen (Netchips heeft wellicht een update nodig)";
var error3 = "Kan de serie niet verkrijgen (ben je nog steeds verbonden met het internet?)";
var error4 = "Kan de episode niet verkrijgen (ben je nog steeds verbonden met het internet?)";


function getSearchSuggestions(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            console.log("GET request failed");
            callback(error1);
            return;
        }
        
        var suggestions = [];
        var error = false;
            
        //$('div[style="float:left; width:639px;"]').each(function () {
        $('div[class="search-item-left"]').each(function () {
            var suggestionElement = $(this);
            
            var div = $('div[style="padding-left: 10px;"]', suggestionElement).eq(0);
            
            var a = netchips.getNthElement($, div, "a", 0);
            if (!a) {
                console.log("No <a> found");
                callback(error2);
                error = true;
                return false;
            }
            
            if (!netchips.getNthElement($, div, "a", 2)) {
                return;
            }
            
            var link = a.attr("href");
            
            var title = a.attr("title");
            if (!title) {
                console.log("No 'title' attribute found");
                callback(error2);
                error = true;
                return false;
            }
            
            var img = netchips.getNthElement($, suggestionElement, "img", 0);
            if (!img) {
                console.log("No <img> found");
                callback(error2);
                error = true;
                return false;
            }
            var image = img.attr("src");
            if (image == "http://static.the-watch-series.to/templates/default/images/nocover_ws.png") {
                return;
            }
            
            var text = a.text();
            if (!text) {
                console.log("No text node found");
                callback(error2);
                error = true;
                return false;
            }
            
            var release = "";
            if (text.lastIndexOf("(") >= 0 && text.lastIndexOf(")") >= 0) {
                release = text.slice(text.lastIndexOf("(") + 1, text.lastIndexOf(")"));
            }
            
            suggestions.push({
                link: link,
                title: title,
                image: image,
                release: release
            });
        });
        
        if (error) {
            return;
        }
        
        replaceImages(suggestions, 0, function () {
            callback("", {
                last: html.indexOf("Next Page</a>") < 0,
                list: suggestions
            });
        });
    });
}

function getGeneralSuggestions(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            console.log("GET request failed");
            callback(error1);
            return;
        }
        
        var suggestions = [];
        var error = false;
        
        $('li[class="category-item"]').each(function () {
            var suggestionElement = $(this);
            
            var a = netchips.getNthElement($, suggestionElement, "a", 0);
            if (!a) {
                console.log("No <a> found");
                callback(error2);
                error = true;
                return false;
            }
            
            var link = a.attr("href");
            
            var title = a.attr("title");
            if (!title) {
                console.log("No 'title' attribute found");
                callback(error2);
                error = true;
                return false;
            }
            
            var img = netchips.getNthElement($, suggestionElement, "img", 0);
            if (!img) {
                console.log("No <img> found");
                callback(error2);
                error = true;
                return false;
            }
            var image = img.attr("src");
            if (image == "http://static.the-watch-series.to/templates/default/images/nocover_ws.png") {
                return;
            }
            
            var text = a.text().trim();
            if (!text) {
                console.log("No text node found");
                callback(error2);
                error = true;
                return false;
            }
            
            var release = "";
            if (text.lastIndexOf("(") >= 0 && text.lastIndexOf(")") >= 0) {
                release = text.slice(text.lastIndexOf("(") + 1, text.lastIndexOf(")"));
            }
            
            suggestions.push({
                link: link,
                title: title,
                image: image,
                release: release
            });
        });
        
        if (error) {
            return;
        }
        
        replaceImages(suggestions, 0, function () {
            callback("", {
                last: false,
                list: suggestions
            });
        });
    });
}

function replaceImages(suggestions, index, callback) {
    if (index == suggestions.length) {
        callback();
        return;
    }
    
    netchips.GETImage(suggestions[index].image, function (src) {
        suggestions[index].image = src;
        setTimeout(function () {
            replaceImages(suggestions, index + 1, callback);
        }, 0);
    });
}

function getInfo(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            console.log("GET request failed");
            callback(error2);
            return;
        }
        
        var seasons = getSeasonsList($);
        
        var summaries = $('.show-summary');
        if (summaries.length == 0) {
            callback("", {
                description: "",
                release: "",
                genres: [],
                rate: "",
                background: "",
                seasons: seasons
            });
            return;
        }
        var summary = summaries.first();
        
        var release = "";
        var span = netchips.getNthElement($, summary, "span", 0);
        if (span) {
            release = span.text().trim();
        }
        
        var genres = [];
        $('* [itemprop="genre"]', summary).each(function () {
            genres.push($(this).text().trim());
        });

        var rate = "";
        var background = "";
        
        var text = summary.text();
        text = text.slice(text.indexOf("Description: ") + "Description: ".length);
        var description = text.slice(0, text.indexOf("\t"));
        
        var a = $('* [style="font-size:11px;"]', summary).first();
        if (a) {
            var link = a.attr("href");
            
            netchips.getDOM(link, function (html, $) {
                if (html && $) {
                    
                    // Better description
                    var span = $('* [itemprop="description"]').first();
                    if (span) {
                        var tempdescr = span.text().trim();
                        
                        if (tempdescr != "") {
                            description = tempdescr;
                            
                            var div = $('* [class="_hidden"]').first();
                            if (div) {
                                var text = div.text().trim();
                                if (text) {
                                    description += text.slice(3);
                                }
                            } else {
                                description += "...";
                            }
                        }
                    }
                    
                    span = $('* [itemprop="ratingValue"]').first();
                    if (span) {
                        rate = span.text().trim();
                    }
                    
                    var div = $('* [class="header-big-show"]').first();
                    if (div) {
                        var style = div.attr("style");
                        if (style && style.lastIndexOf("(") >= 0 && style.lastIndexOf(")") >= 0) {
                            background = style.slice(style.lastIndexOf("(") + 1, style.lastIndexOf(")"));
                        }
                    }
                }
                
                callback("", {
                    description: description,
                    release: release,
                    genres: genres,
                    rate: rate,
                    background: background,
                    seasons: seasons
                });
            });
        } else {
            callback("", {
                description: description,
                release: release,
                genres: genres,
                rate: rate,
                background: background,
                seasons: seasons
            });
        }
    });
}

function getSeasons(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            console.log("GET request failed");
            callback(error2);
            return;
        }
        
        callback("", {
            seasons: getSeasonsList($)
        });
    });
}

function getHosts(link, callback) {
    netchips.getDOM(link, function (html, $) {
        if (!html || !$) {
            console.log("GET request failed");
            callback(error4);
            return;
        }
        
        var hosts = [];
        
        $('tr[class^="download_link_"]').each(function () {
            var hostElement = $(this);
            
            if (hostElement.attr("class") == "download_link_sponsored") {
                return;
            }
            
            var a = netchips.getNthElement($, hostElement, "a", 0);
            if (!a) {
                return;
            }
            var href = a.attr("href");
            if (!href) {
                return;
            }
            var pos = href.indexOf("=");
            if (pos < 0) {
                return;
            }
            
            var link = new Buffer(href.slice(pos + 1), "base64").toString("ascii");
            if (!link) {
                return;
            }
            
            if (link.indexOf("https://") < 0) {
                hosts.push(link);
            }
        });
        
        callback("", hosts);
    });
}

function getSeasonsList($) {
    var seasons = [];
    
    $('.listings.show-listings').each(function (_, list) {
        var season = [];
        
        $('a', list).each(function () {
            var a = $(this);
            
            if (a.attr("style")) {
                return true;
            }
            
            var link = a.attr("href");
            if (!link) {
                return true;
            }
            
            var title = "";
            var span = netchips.getNthElement($, a, "span", 0);
            if (span) {
                var text = span.text().trim();
                var done = false;
                
                for (var k = 0; k < text.length; k += 1) {
                    var character = text.charAt(k);
                    
                    if (character.charCodeAt(0) == 160) {
                        if (!done) {
                            title += ": ";
                            done = true;
                        }
                    } else {
                        title += character;
                    }
                }
                
                if (title) {
                    season.unshift({
                        link: link,
                        title: title
                    });
                }
            }
        });
        
        seasons.unshift(season);
    });
    
    return seasons;
}
