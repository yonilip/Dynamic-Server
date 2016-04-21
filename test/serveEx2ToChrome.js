// This file is utilizing the .static method in order to serve ex2
// (in www folder) statically to be accessed in  chrome

// To access - use localhost:8888/index.html

var hujiwebserver = require('../hujiwebserver');
var srv;

srv = hujiwebserver.start(8888, function(error) {
    error ? console.log("Caught an error: " + error) :
        console.log("Server is up and running!");
});
srv.use("/", hujiwebserver.static("../www"));