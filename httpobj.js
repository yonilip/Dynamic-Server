/**
 * Created by yonilip on 1/11/16.
 */


module.exports = {
    response : function (socket) {
        return new HttpResponse(socket);
    },

    request : function () {
        return new HttpRequest();
    }

};

function HttpResponse(socket) {
    this.socket = socket;
    this.statusCode = null;
    this.headers = {};
    this.cookiesList = {};
    this.protocolMember = "HTTP/1.1"; // default
}

function Cookie(value, options) {
    this.value = value;
    this.options = options;
}

/**
 * Expecting protocol value in the form of: "HTTP/1.X" concatenated
 * @param value
 */
HttpResponse.prototype.protocol = function (value) {
    if (value) {
        this.protocolMember = value;
    }
    return this;
};


/**
 * notice that set will overwrite the http headers if called more than once
 * @param field
 * @param value
 */
HttpResponse.prototype.set = function (field, value) {
    var header,
        headers;
    if (value) {
        this.headers[field.toLowerCase()] = value;
    } else {
        headers = field;
        for (header in headers) {
            if (headers.hasOwnProperty(header)) {
                this.headers[header.toLowerCase()] = headers[header];
            }
        }
    }
    return this;
};

HttpResponse.prototype.status = function (httpStatus) {
    this.statusCode = httpStatus;
    return this;
};

HttpResponse.prototype.get = function (field) {
    var value;
    value = this.headers[field.toLowerCase()];
    if (value !== undefined) {
        return value;
    } else {
        return undefined;
    }
};

/**
 * creates a new cookie object and appends it to the responses cookieList
 * @param name type string
 * @param value type string or object converted to json
 * @param options object that holds: property, type
 */
HttpResponse.prototype.cookie = function (name, value, options) {
    options = options || {};
    options["domain"] = options["domain"] || this.socket.req.host;
    options["path"] = options["path"] || "/";
    options["encode"] = options["encode"] || "encodeURIComponent";

    this.cookiesList[name] = new Cookie(value, options);
    return this;
};

function parseHeaders(headers) {
    var headerString, header;

    headerString = "";

    for (header in headers) {
        if (headers.hasOwnProperty(header)) {
            headerString += "\n" + capitalize(header) + ": " + headers[header];
        }
    }
    return headerString;
}

// capitalizes every first letter
function capitalize(str) {
    return str.replace(/\w[^\s-]*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Like send, this closes the transaction (actually sends)
HttpResponse.prototype.sendErrorPage = function(statusCode, closeConAtEnd) {
    closeConAtEnd = closeConAtEnd || false;
    this.headers = {}; // reset headers
    this.status(statusCode);

    if (statusCode === 404) {
        this.send("The requested resource not found");
    }
    else {
        this.send("Error: " + statusCode);
    }
    if (closeConAtEnd) {
        this.socket.end();
    }
};

function parseCookies(cookiesList) {
    var cookieString, cookie, option;

    cookieString = "";

    for (cookie in cookiesList) {
        if (cookiesList.hasOwnProperty(cookie)) {

            cookieString += "\nSet-Cookie: " + cookie + "=" +
                cookiesList[cookie].value;

            // if the cookie has options, write them
            for (option in cookiesList[cookie].options) {
                if (cookiesList[cookie].options.hasOwnProperty(option)) {

                    cookieString += "; " + option + "=" +
                        cookiesList[cookie].options[option];
                }
            }
        }
    }
    cookieString += "\n\n";

    return cookieString;
}

function parseBody(body) {
    if (body) {
        body += "\n";
    } else {
        body = "";
    }
    return body;
}
/**
 */
HttpResponse.prototype.send = function (body) {
    var headerString,
        cookieString;

    if (body) {
        if (body instanceof Buffer && this.get("content-type") === undefined) {
            this.set("content-type", "application/octet-stream");
        } else if (typeof body === 'string') {
            if (this.get("content-type") === undefined)
            {
                this.set("content-type", "text/html");
            }
        } else { // body is an array or object
            this.set("Content-Type", "application/json");
            this.json(body);
            return; // will cause a recursive call since json() calls send()
        }

        if (this.get("content-length") === undefined ) {
            this.set("content-length", body.length);
        }
    }

    headerString = parseHeaders(this.headers);
    cookieString = parseCookies(this.cookiesList);
    body = parseBody(body);


    this.socket.write(this.protocolMember.toUpperCase() + " " +
        this.statusCode + headerString + cookieString + body);


};

/**
 Sends a JSON response. This method is identical to res.send() with an
 object or array as the parameter.
 However, you can use it to convert other values to JSON, such as null,
 and undefined. (although these are technically not valid JSON).
 */
HttpResponse.prototype.json = function (body)
{
    this.send(JSON.stringify(body))
};


/**
 * The object that holds the requests parsed information
 */
function HttpRequest() {
    // Which method is used (e.g GET, POST etc.)
    this.method = undefined;
    // Contains the path part of the request URL.
    this.path = undefined;
    // http version (e.g "1.0", "1.1")
    this.version = undefined;
    // An object containing all headers
    this.headers = {};
    this.body = undefined;
    // An object containing a property for each query string parameter in the
    // route. If there is no query string, it is the empty object, {}.
    this.query = {};
    // The request protocol string, http or https when requested with TLS.
    this.protocol = undefined;
    // this property is an object that contains cookies sent by the request.
    // If the request contains no cookies, it defaults to {}.
    this.cookies = {};
    this.host = undefined; // the value in the host header
    /* An object containing properties mapped to the named route “parameters”.
    For example,if you have the route /user/:name, then the “name” property
    is available as req.params.name. This object defaults to {}. */
    this.params = {};
}

/**
 * Returns the specified HTTP request header field (case-insensitive match).
 * The Referrer and Referer fields are interchangeable.
 */
HttpRequest.prototype.get = function (field) {
    return this.headers[field.toLowerCase()];
};

/**
 * Return the value of param name when present.
 */
HttpRequest.prototype.param = function (name, defaultValue) {
    defaultValue = defaultValue || null;
    return this.params[name] || this.body[name] || this.query[name]
        || defaultValue; // returns the value in the specified lookup order
};

/**
 * Returns true if the incoming request’s “Content-Type” HTTP header
 * field matches the MIME type specified by the
 * type parameter. Returns false otherwise.
 */
HttpRequest.prototype.is = function (type) {
    if (!this.headers["content-type"] || typeof type !== 'string') {
        return false;
    }
    var regExp = new RegExp(type.replace(/\*/, ".+") + "$");
    var cType = this.headers["content-type"].split(';')[0];
    return cType.search(regExp) >= 0;
};

