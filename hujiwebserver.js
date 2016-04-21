
var hujinet = require('./hujinet');
var fs = require('fs');
var path = require('path');
var util = require('util');

//----------------------- Declarations

var IMAGE_EXTENSIONS,       // the supported image file extensions
    SUPPORTED_EXTENSIONS;   // the supported file extensions

SUPPORTED_EXTENSIONS = ['js', 'css', 'txt', 'html', 'jpg', 'jpeg', 'gif'];
IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'gif'];


function isToClose( req) {
    return ((req.protocol + "/" + req.version === "HTTP/1.0") &&
        (req.get("connection").toLowerCase() !== "keep-alive")) ||
        (((req.protocol + "/" + req.version === "HTTP/1.1") &&
        (req.get("connection").toLowerCase() === "close")));
}

/**
 * This module that can be required will run a server
 */
module.exports = {

    start : function (port, callback) {
        return  hujinet.createServer(port, callback);
    },

    static : function (rootFolder) {
        return function(req, res, next) {
            var closeAtEnd;
            // check if the socket should be closed at the end of response
            closeAtEnd = isToClose(req);

            // make sure the request method is supported
            if (req.method !== "GET") {
                next();
            } else {
                req.path = rootFolder + req.path;
                fs.exists(req.path,
                    function (exists) {
                        sendResponsePage(exists, res, req, closeAtEnd);
                    });
            }
        };
    },

    // handles all favicon requests.
    // returns the file in te given path. if empty - returns 404
    myUse : function (path) {
        var reqHandler;

        reqHandler = function(req, res, next) {
            if (req.path.search('favicon.ico') >= 0) { // asks for favicon
                if (!path) {
                    res.sendErrorPage(404);
                }
                else {
                    fs.exists(path,
                        function (exists) {
                            req.path = path;
                            sendResponsePage(exists, res, req, isToClose(req));
                        });
                }
            }
            else {
                next();
            }
        };
        // inside since the usage is hujiwebserver.myUse().toString()
        // and not hujiwebserver.myUse.toString()
        reqHandler.toString  = function () {
            return "This function can handle all of the favicon request " +
                "in a match directory.\n" +
                "If a request is for favicon.ico, it returns the favicon in " +
                "the given path.\n" +
                "If no path were given, it sends 404.\n" +
                "Example uses: 'server.use(\"/test/favi/\", " +
                "hujiwebserver.myUse(\"favicon.txt\"))'\n" +
                "to actually return favicon or:  " +
                "'server.use(hujiwebserver.myUse());' to return 404 " +
                "on all favicon\n" +
                "request (put first in your uses)";
        };
        return reqHandler;

    }
};

/*
 * sends the file that has been found in the servers directory
 */
function sendFile(res,req, statusCode, extension, closeAtEnd) {
    closeAtEnd = closeAtEnd || false; // default value

    var contentType,
        filePath;

    contentType =
        (IMAGE_EXTENSIONS.indexOf(extension) !== -1) ? "image" : "text";

    filePath = path.normalize(req.path);

    fs.stat(filePath, function(error , stat) {
        var fileAsStream;

        res.protocol(req.protocol + "/" + req.version);
        res.status(statusCode);
        res.set({"Content-Type" : contentType +"/"+ extension,
            "Content-Length" : stat.size});
        util.log("starting sending file: " + filePath);
        res.send();

        fileAsStream = fs.createReadStream(filePath); // assuming file exists
        fileAsStream.pipe(res.socket, { end: false });
        fileAsStream.on('end', function () {
            util.log("finished piping of " + filePath);
            if(closeAtEnd) {
                res.socket.end();
            }
        });

    });
}


/*
 * sends the response page, if exists, check if the file extension is supported
 * if so, send the page, if not supported, send error page.
 * if file does not exist, send 404.
 */
function sendResponsePage(exists, res, req, closeAtEnd) {
    closeAtEnd = closeAtEnd || false;
    var extension;

    if (exists) {
        extension = path.extname(req.path).substring(1);

        if (extension) {
            if (SUPPORTED_EXTENSIONS.indexOf(extension) !== -1) {
                sendFile(res,req, "200 OK", extension, closeAtEnd);
                return;
            }
            else {
                res.sendErrorPage(501, closeAtEnd);
                util.log("501 on: " + req.path);
                return;
            }
        }
    } // does not exist
    res.sendErrorPage(404, closeAtEnd);
    util.log("404 on: " + req.path);
}