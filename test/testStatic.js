
var http = require('http');
var fs = require('fs');
var hujiwebserver = require('../hujiwebserver');


function testSingleFile(options) {
    var req;

    req = http.request(options, function (res) {
        var string,
            filePath;

        string = "";
        filePath = '../www' + options.path;

        res.on('data', function (data) {
            string += data;
        });

        res.on('end', function () {
            console.log('Received file: ' + filePath + ' - Testing...');

            // Test 404
            if(res.statusCode === 404) {
                console.log("Failed to test: " + filePath +
                    ". Received 404 Not Found");
            }
            //  Test file matching the expected file
            else {
                fs.readFile(filePath, function (error, data) {
                    if (error) {
                        console.log("Failed to test: " + filePath +
                            ". Error: " + error.message);
                        return;
                    }
                    if (data.toString() === string.toString()) {
                        console.log("Testing of : " + filePath +
                            " Finished successfully!");
                        module.exports.testCount++;
                        module.exports.passCount++;
                    }
                    else {
                        module.exports.testCount++;
                        console.log("Failed to test: " + filePath +
                            ". File mismatch");
                    }
                })
            }
        });
    });
    req.end();
    req.on('error', function (error) {
        module.exports.testCount++;
        console.log("caught error in tester: " + error.message +
            "\n" + error.stack)
    });

}
module.exports = {
    passCount : 0,
    testCount : 0,
    totalTests : -1, // initial value

    testStatic : function() {
        var srv;
        var inter;

        srv = hujiwebserver.start(8889, function(error) {
            error ? console.log("Caught an error: " + error) :
                console.log("Server is up and running!");
        });
        srv.use("/", hujiwebserver.static("../www"));

        fs.readdir('../www', function (err, files) {
            var i,
                options;

            if (!err) {
                module.exports.totalTests = files.length;
                for (i = 0; i < files.length; i++) {
                    options = {
                        port: 8889,
                        hostname: 'localhost',
                        method: 'GET',
                        path: '/' + files[i]
                    };

                    testSingleFile(options);
                }
            } else {
                console.log("Error when accessing the given directory: " +
                    err);
            }
        });

        inter = setInterval(function() {
            if ( module.exports.totalTests > -1 &&
                module.exports.testCount ===  module.exports.totalTests) {
                srv.stop(function () {
                    console.log("Closed static server (on port: " +
                        srv.port + ")");
                });
                clearInterval(inter);
            }
        }, 500);

    }
};



