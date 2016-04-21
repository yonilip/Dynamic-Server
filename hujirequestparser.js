/**
 * The module ‘hujirequestparser’  which exposes one method:
 * parse(string) return HttpRequest object.
 */

var httpobj = require('./httpobj');

/*
 * Read the rest of the line in a string, starting from a given index.
 * Note that it does no checks - assumes validity of the string,
 * assumes string.length > startIndex and assumes the last
 * character of a line is \n (as well as the last character of the
 * string if a body exists, two if not)
 */
function readLine(string, startIndex) {
    var line;
    line =  /[^\n]*\n/.exec(string.toString().substring((startIndex ?
        startIndex : 0)));
    return line ? line[0] : "";
}


function trimString(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    // trim beginning and end
}
/*
 * extracts the headers and fills the header object
 */
function parseNameValuePairsLine(obj, line, pairsDelim, nameValDelim) {
    var pairs,
        lhPair,
        lhName,
        lhVal,
        idx;

    pairsDelim = pairsDelim || ';';
    nameValDelim = nameValDelim || '=';
    pairs = line.split(pairsDelim);

    // search all occurrences of the type "someName=someValue"
    // (allow spaces after the first real character)
    for (lhPair in pairs) {
        if (pairs.hasOwnProperty(lhPair) && pairs[lhPair]) {
            idx = pairs[lhPair].search(nameValDelim);
            lhName = trimString(pairs[lhPair].substring(0, idx));
            lhVal = trimString(pairs[lhPair].substring(idx + 1));
            obj[lhName] = lhVal;
        }
    }
}

function extractHeadersAndCookies(string, cursor, headers, cookies) {
    var currLine,
        currHeader,
        headerName,
        headerVal;

    currHeader = "";

    do {
        currLine = readLine(string, cursor);
        cursor += currLine.length;

        if (currHeader === "" || (/^\s/.test(currLine) &&
            /[^\s]/.test(currLine))) {
            currHeader += currLine;
        }
        else {
            // parse current header
            headerName = (/[^:]+:/.exec(currHeader))[0];
            headerVal =
                ((/[^\s].*/.exec(currHeader.substring(headerName.length))))[0];
            headerName = headerName.substring(0,
                headerName.length - 1).toLowerCase();

            if (headerName == "cookie") {
                parseNameValuePairsLine(cookies, headerVal);
            }
            else {
                headers[headerName] = headerVal;
            }

            currHeader = currLine;
        }
    }
    while (/[^\s]/.test(currLine) && cursor < string.length);
    return cursor;
}

function extractQuery(query, req) {
    query = query.split('?');
    var pairs = {};
    req.path = query[0];
    if (query.length > 2) {
        throw Error("Bad request - more than one question mark" + query[1]);
    }
    if (query[1]) {
        if (query[1].search(/(&&)|(==)|(=&)|(&=)/) >= 0) {
            throw Error("Bad request - illegal query form: " + query[1]);
        }
        parseNameValuePairsLine(pairs, query[1], '&');
        var val;
        for (val in pairs) {
            if (pairs.hasOwnProperty(val)) {
                var objVal = pairs[val].replace(/\+/gm, ' ');

                // if contains an object like "shoes[color]=blue"
                if (/[^\s\[]+\[.+]/.test(val)) {
                    var idx = val.search(/\[/);
                    var objName = val.substring(0, idx);

                    if (!req.query[objName]) {
                        req.query[objName] = {};
                    }
                    req.query[objName][val.substring(idx + 1,
                        val.length -1)] = objVal;
                }
                else {
                    req.query[val] = objVal;
                }
            }
        }
    }
}

function parseReqBody(req, body) {
    if (!body) {
        req.body = "";
        return;
    }
    if (req.is('application/x-www-form-urlencoded')) {
        req.body = {};
        parseNameValuePairsLine(req.body, body, '&');
    } else if (req.is('json')) {
        try {
            req.body = JSON.parse(body);
        }
        catch (e) {
            req.body = body.toString();
            console.log("Exception while parsing json: " + e);
        }
    } else {
        req.body = body.toString();
    }
}
/**
 * Parse a single http request and returns an
 * httpRequest instance with it's data
 * assumes a valid http request! undefined behavior
 * if not (might throw exceptions)
 */
module.exports = {
        parse : function(string) {
            var cursor,
                currLine,
                header,
                headers,
                cookies;

            cursor = 0; // current location in the string
            headers = {};
            cookies = {};

            // Get initial line
            header = readLine(string, cursor);
            cursor += header.length;
            header = header.split(" ");

            // Get headers
            cursor = extractHeadersAndCookies(string, cursor, headers,
                cookies);

            // getting one more line down
            currLine = readLine(string, cursor);
            cursor += currLine.length;

            // build and return the httpRequest instance
            var req = httpobj.request();
            req.method = header[0];
            extractQuery(header[1], req); // Parse path and query

            var protocol = header[2].replace(/\s/g, "");
            protocol = protocol.split('/');
            req.protocol = protocol[0].toLowerCase();
            req.version = protocol[1];

            req.headers = headers;
            var body = string.toString().substring(cursor);
            parseReqBody(req, body);

            req.cookies = cookies;
            req.host = headers['host'];
            return req;
    }
};