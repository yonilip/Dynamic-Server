//----------------------- Requires

var net = require('net');
var path = require('path');
var util = require('util');
var hujiRequestParser = require('./hujirequestparser');
var httpobj = require('./httpobj');


/**
 * export the function to create server
 */
module.exports = {
    /*
     * creates a new server object and defines the property for port
     */
    createServer: function (port, callback) {
        var serverObj;  // the reference to the server object

        serverObj = new ServerObj(port, callback);

        // define read-only variables
        Object.defineProperty(serverObj,
            "port", {
                configurable: false,
                writable: false,
                value: port
            }
        );

        return serverObj;
    }
};

// this is a helper function for the chunking-receiving mechanism,
// this stays as it is
/*
 * checks if the requested header has reached its end, else return cursor
 */
function getEndOfMessageIndex(socket) {
    var endOfMessageIndex;

    endOfMessageIndex= (socket.currentData).search(/((\r\n)|\n){2}/m);
    if (endOfMessageIndex < 0) {
        return endOfMessageIndex;
    }
    if (socket.currentData.charAt(endOfMessageIndex) === '\r') {
        endOfMessageIndex += 4; // found \r\n\r\n at the end
    }
    else {
        endOfMessageIndex += 2; // found \n\n at the end
    }
    return endOfMessageIndex;
}

// this is a helper function for the chunking-receiving mechanism,
// this stays as it is
/*
 * Gets the content length of the request from client
 */
function getContentLength(request, endOfMessageIndex, socket) {
    var contentLength;
    contentLength = /Content-Length:[\s]*[^\s]+/i.exec(request);
    // case insensitive, not multiline
    if (contentLength) {
        contentLength = contentLength[0].substring(15);
        contentLength = parseInt(contentLength);

        if (socket.currentData.substring(endOfMessageIndex).length
            >= contentLength) {
            return contentLength;
        }
        else {
            return -1; // not done writing body
        }
    }
    return 0;
}

/*
 * create the response that will be answered to the client
 */
function createResponse(request, socket) {
    // parse and normalize paths
    socket.req = hujiRequestParser.parse(request);
    socket.req.path = path.normalize(socket.req.path);
    socket.next(); // here we start walking through the usages

}

// this is a helper function for the chunking-receiving mechanism,
// this stays as it is
/*
 * trim the socket current data for handleRequest
 */
function trimSocketCurrentData(socket) {
    var newCharIdx;

    newCharIdx = socket.currentData.search(/[^\s]/m);
    if (newCharIdx > 0) {
        socket.currentData = socket.currentData.substring(newCharIdx);
    }
    else {
        socket.currentData = "";
    }
}

/*
 * handle the request given by the client, make sure that all chunks have
 * arrived and try to create the response. if failed then send error page
 */
function handleRequest(socket, data) {
    var contentLength,
        endOfMessageIndex,
        request;

    util.log("received data: socketID = " + socket.id);
    socket.currentData += data;

    // parse request, reply and then check if there are more cached requests
    do {
        endOfMessageIndex = getEndOfMessageIndex(socket);
        if (endOfMessageIndex > 0) {
            request = (socket.currentData).substring(0, endOfMessageIndex);
            contentLength =
                getContentLength(request, endOfMessageIndex, socket);
            if (contentLength < 0) {
                return; // request is not done yet
            }
            else if (contentLength > 0) {
                endOfMessageIndex += contentLength;
                request = (socket.currentData).substring(0, endOfMessageIndex);
            }
            // send request to parsing and re-run the test!
            try {
                socket.currUsage = -1;
                createResponse(request, socket);
            } catch (exception) {
                util.log("caught exception: " + exception);
                socket.res.sendErrorPage(500, false);
            } finally {
                // remove the parsed message from the data cached
                socket.currentData =
                    socket.currentData.substring(endOfMessageIndex + 1);
                trimSocketCurrentData(socket);
            }
        }
    } while (endOfMessageIndex > 0);
}

/*
 * handle the sockets received by client and listen to their events.
 * sets timeout for 2 secs that closes the connection if no data was given
 */
function socketHandler(socket, id, usages) {
    // Add socket instance members
    socket.currentData = "";
    socket.id = id;
    socket.currUsage = -1;

    socket.req = null;
    socket.res = httpobj.response(socket);
    socket.next = next; //by reference, doesn't recreate the function each time

    /*util.log("A new socket was opened . socketId = " + socket.id);*/

    socket.setTimeout(2000);
    socket.setKeepAlive(true, 2000);


    socket.on('data', function(data) {
        // received data, reset the timeout
        socket.setTimeout(2000);
        handleRequest(socket, data);

    });

    socket.on('end', function() {
        socket.setTimeout(0);
        util.log("Socket " + socket.id +" was ended by the other party.");
    });

    socket.on('error', function(error) {
        util.log("caught an " + error + ". socketId = " + socket.id);
        if (error.message.search(/end/) < 0 ) {
            // if socket was not ended need to send an error page
            socket.res.sendErrorPage(500);
        }
    });

    socket.on('close', function() {
        socket.setTimeout(0);
        util.log("Socket " + socket.id +" is now closed");
    });

    socket.on('timeout', function() {
        util.log("timeout on id: " + socket.id);
        socket.end();
    });

    function next() {
        // loop until we find a match
        while (++socket.currUsage < usages.length) {
            if (match(usages[socket.currUsage].path, socket.req.path,
                    socket.req)) {
                usages[socket.currUsage].handler(socket.req, socket.res, next);
                return;
            }
        }
        socket.res.sendErrorPage(404);
    }
}

/*
 * the server object that is returned in the exported function
 * creates a new server, listens on the port, defines the max connections
 * and supports the stop function.
 */
function ServerObj(port, callback) {
    var currConnectionID, // used to give each socket a unique id
        initialErrorListener; // Listener only for start-up errors
    this.usages = [];

    currConnectionID = 0;
    this.server = net.createServer(onConnection.bind(this));

    function onConnection(socket) {
        // Note that this sould only be called in context of ServerObj
        socketHandler(socket, port + ":" + ++currConnectionID, this.usages);
    }

    initialErrorListener = function(error) {
        util.log("Caught an error. port:" + port);
        callback(error);
    };
    this.server.on('error', initialErrorListener);

    this.server.on('listening', function () {
        util.log("Server is running and listening to port: " + port);

        this.removeListener('error', initialErrorListener);

        this.on('error', function(error) {
            util.log("Server caught order: " + error);
            callback(error);
        });
        callback();
    });

    this.server.listen(port);
    // To fight DDOS, no more than 700 connections can be made simultaneously
    this.server.maxConnections = 700;

    this.stop = function (callback) {
        this.server.close(callback);
    };
}

/**
 *
 * @param resource
 * @param requestHandler is a function like func(req, res, next) when req is
 * a httpRequest, res is hrrpResponse and next is a reference to the next
 * function (use next() )
 */
ServerObj.prototype.use = function(resource, requestHandler) {
    if (!requestHandler) {
        requestHandler = resource;
        resource = '/';
    }
    this.usages.push({path: path.normalize(resource).toString().substring(1),
        handler: requestHandler}); // removing the prefix '/'
};

// checks whether the query is a match to the resource,
// fills the request with the values of the params
function match(resource, query, req) {
    var delim,
        resourceSplit,
        querySplit,
        i;

    delim = path.normalize("/");
    delim = delim.toString();

    resourceSplit = resource.split(delim).filter(function(el) {
        return el.length != 0});
    querySplit = path.normalize(query.substring(1)).split(delim).filter(
        function(el) {return el.length != 0});
    // assuming query has been tested and starts with a '/'

    for (i = 0; i < resourceSplit.length; i++) {
        // check not out of bounds
        if (querySplit.length === i) {
            return false;
        }
        if (resourceSplit[i].charAt(0) === ':') {
            req.params[resourceSplit[i].substring(1)] = querySplit[i];
        } else if (resourceSplit[i] !== querySplit[i]) {
            return false;
        }
    }
    return true;
}
