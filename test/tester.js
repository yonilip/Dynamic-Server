/**
 * Created by yonilip on 1/18/16.
 */


var http = require('http');
var hujiwebserver = require('../hujiwebserver');
var path = require('path');
var testStatic = require('./testStatic');

var passCount = 0;
var testCount = 0;

var server = hujiwebserver.start(8888, function(err) {
    err ? console.log("Caught an error: " + err) :
        console.log("Server is up and running!");
});

server.use("/test/favi/", hujiwebserver.myUse("favicon.txt"));
server.use(hujiwebserver.myUse());


server.use('/', function (req, res, next) {
    res.status(200);
    next();
});

server.use('/test/method', function (req, res, next) {
    res.send(req.method);
});

server.use('/test/path/is/long/start_confusing', function (req, res, next) {
    res.send(req.path);
});

server.use('/test/headers', function (req, res, next) {
    res.send(req.headers);
});

server.use('/test/query', function (req, res, next) {
    res.send(JSON.stringify(req.query));
});

server.use('/test/cookie', function (req, res, next) {
    var cookie;
    for (cookie in req.cookies) {
        if (req.cookies.hasOwnProperty(cookie)) {
            res.cookie(cookie, req.cookies[cookie]); // no options
        }
    }
    res.send(JSON.stringify(res.cookiesList));
});

server.use('/test/params/:param1/bonusGrade/:param2',
    function (req, res, next) {
        res.send(JSON.stringify(req.params));
    });

server.use('/test/host', function (req, res, next) {
    res.send(req.host);
});

server.use('/test/set', function (req, res, next) {
    res.set("heAdeR-TeSt", "testHeader").send(JSON.stringify(res.headers));
});

server.use('/test/json', function (req, res, next) {
    res.json({employees : [{"firstName":"John","lastName":"Doe"},
        {"firstName":"Anna","lastName":"Smith"},
        {"firstName":"Peter","lastName":"Jones"}]});
});

server.use('/test/post', function (req, res, next) {
    if (req.is("application/x-www-form-urlencoded")) {
        res.send("logged in");
    }
});


function test_dynamic_server(testOptions, expected) {
    var options, req;

    options= {
        hostName: "localhost",
        port: 8888,
        path: testOptions.path,
        method: testOptions.method,
        data: testOptions.body || ""
    };

    if (testOptions.headers) {
        options.headers = testOptions.headers
    }

    req = http.request(options, function (res) {
        var buffer;
        buffer= "";

        res.on('data', function (chunk) {
            buffer += chunk;
        });

        res.on('end', function () {
            if (res.statusCode != expected.status || expected.data != buffer) {
                console.log("Failed on test: " + testOptions.test_name + "\n" +
                    "Path: " + testOptions.path +"\n" +
                    "Expected: " + expected.status + "\n" + expected.data +
                    "\nbut received: " + res.statusCode + "\n" + buffer);
                testCount++;
            } else {
                console.log("Passed test: " + testOptions.test_name);
                passCount++;
                testCount++;
            }
        });
    });

    req.on('error', function (err) {
        testCount++;
        console.log("Caught an error: " + err.message);
    });

    req.end();
}

function run_tester() {
    var i,
        interval;
    for (i = 0; i < testers.length; ++i) {

        test_dynamic_server(testers[i].options, testers[i].expected);
    }
    testStatic.testStatic();

    interval = setInterval(function() {
        if (testCount === testers.length) {
            server.stop(function() {
                console.log("Closed dynamic server (on port: "
                    + server.port + ")");
                console.log("\n\n--------------------------------------" +
                    "---------------------------------\n" +
                    "                          Finished testing:\n" +
                    "               Passed " + passCount + " / " + testCount +
                    " of the dynamic server tests.\n" +
                    "               Passed " + testStatic.passCount + " / " +
                    testStatic.testCount + " of the static server tests.\n" +
                    "-------------------------------------------------------" +
                    "----------------\n");
            });
            clearInterval(interval);
        }
    }, 500);
}

var test_date = new Date();
var testers = [

    { // 1
        options: {
            path:"/test/method",
            method:"GET",
            test_name:"the method requested"
        },
        expected: {
            status:200,
            data:"GET"
        }
    },

    { // 2
        options: {
            path:"/test/path/is/long/start_confusing/query/method/get/host",
            method:"GET",
            test_name:"the complex path requested"
        },
        expected: {
            status:200,
            data: path.normalize("/test/path/is/long/start_confusing/query" +
                "/method/get/host").toString()
        }
    },

    { // 3
        options: {
            path:"/test/headers",
            method:"GET",
            test_name:"the headers requested",
            headers:{Connection: "close", Date: test_date.toDateString()}
        },
        expected: {
            status:200,
            data:"{\"connection\":\"close\",\"date\":\"" +
            test_date.toDateString() +"\",\"host\":\"localhost:8888\"}"
        }
    },

    { // 4
        options: {
            path:"/test/post",
            method:"POST",
            test_name:"the post form requested",
            headers:{"Content-Type":"application/x-www-form-urlencoded"},
            body:"userName=maor&password=yoni"
        },
        expected: {
            status:200,
            data:"logged in"
        }
    },

    { // 5
        options: {
            path:"/test/query?object=undefined+++spaces&shoe[color]=black&" +
            "bonusForUs=YES!",
            method:"GET",
            test_name:"the query requested"
        },
        expected: {
            status:200,
            data:"{\"object\":\"undefined   spaces\",\"shoe\":" +
            "{\"color\":\"black\"},\"bonusForUs\":\"YES!\"}"
        }
    },

    { // 6
        options: { // illegal query test
            path:"/test/query?&&&&ruined&&=query&[alone]",
            method:"GET",
            test_name:"the illegal query requested"
        },
        expected: {
            status:500,
            data:"Error: 500"
        }
    },

    { // 7
        options: {
            path:"",
            method:"GET",
            test_name:"Get with an empty path requested"
        },
        expected: {
            status:404,
            data:"The requested resource not found"
        }
    },

    { // 8
        options: {
            path:"/test/cookie",
            method:"GET",
            test_name:"the cookie requested",
            headers:{   Cookie: "__UUID=thisIsUnique456; " +
            "_anotherName=anotherVal" }
        },
        expected: {
            status:200,
            data:"{\"__UUID\":{\"value\":\"thisIsUnique456\",\"options\":{\"" +
            "domain\":\"localhost:8888\",\"path\":\"/\",\"" +
            "encode\":\"encodeURIComponent\"}},\"_anotherName\":" +
            "{\"value\":\"anotherVal\",\"options\":" +
            "{\"domain\":\"localhost:8888\",\"path\":\"/\",\"encode\":" +
            "\"encodeURIComponent\"}}}"
        }
    },

    { // 9
        options: {
            path:"/test/params/abcdef123/bonusGrade/+100.fileOfGrade",
            method:"GET",
            test_name:"the params requested"
        },
        expected: {
            status:200,
            data:"{\"param1\":\"abcdef123\",\"param2\":\"+100.fileOfGrade\"}"
        }
    },

    { // 10
        options: {
            path:"/test/host",
            method:"GET",
            test_name:"the host requested"
        },
        expected: {
            status:200,
            data:"localhost:8888"
        }
    },

    { // 11
        options: {
            path:"/test/set",
            method:"GET",
            test_name:"the set header"
        },
        expected: {
            status:200,
            data:"{\"header-test\":\"testHeader\"}"
        }
    },

    { // 12
        options: {
            path:"/test/json",
            method:"GET",
            test_name:"the json sent"
        },
        expected: {
            status:200,
            data:"{\"employees\":[{\"firstName\":\"John\",\"lastName\":" +
            "\"Doe\"}," +
            "{\"firstName\":\"Anna\",\"lastName\":\"Smith\"}," +
            "{\"firstName\":\"Peter\",\"lastName\":\"Jones\"}]}"
        }
    },

    {
        options: {
            path:"/favicon.ico",
            method:"GET",
            test_name:"Check favicon #1"
        },
        expected: {
            status:404,
            data:"The requested resource not found"
        }
    },

    {
        options: {
            path:"/test/favicon.ico",
            method:"GET",
            test_name:"Check favicon #2"
        },
        expected: {
            status:404,
            data:"The requested resource not found"
        }
    },

    {
        options: {
            path:"/test/favi/favicon.ico",
            method:"GET",
            test_name:"Check favicon #3"
        },
        expected: {
            status:200,
            data:"\"This is favicon\""
        }
    }

];

run_tester();
