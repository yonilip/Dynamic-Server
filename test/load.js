

var net = require('net');
var hujiWebServer = require('../hujiwebserver');

var numTests;
var srv,
    testSocket,
    i,
    failCount,
    receivedData;   // the number of responses that were sent from server,
                    // should be twice than the number of requests

receivedData = 0;
failCount = 0;
numTests = 1000;

srv = hujiWebServer.start(8888, function(error) {
    error ? console.log("Caught an error: " + error) :
        console.log("Server is up and running!");
});


testSocket = function (id) {
    var socket;

    socket = net.createConnection(srv.port);

    socket.on('connect', function () {
        socket.write('GET /index.html' +
            ' HTTP/1.0\nConnection: keep-alive\r\n\r\n');
    });
    socket.on('data', function () {
        console.log("socket."+ id +
            " number received so far: "+ ++receivedData);
    });
    socket.on('error', function(error) {
        console.log("socket." + id + " caught error " + error.message);
        ++failCount;
    })
};

for (i = 1; i <= numTests ; i++) {
    testSocket(i);
}


setTimeout(function() {
    console.log("\n\n------------------------------------------------------" +
        "-----------------\n" +
        "                          Finished loading:\n" +
        "               Out of " + numTests + " sockets, " + failCount +
        " failed to connect\n" +
        "                      (maxConnections set to 700).\n" +
        "---------------------------------------------------------------" +
        "--------\n");
    srv.stop();
}, 11000);
