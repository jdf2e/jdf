var net = require('net');

var count = 0;
// allow user to open ten servers.
var maxCount = 10; 
var noport = -1;
var callback = function () {};

var portUtil = module.exports;
portUtil.findUsablePort = function (port) {
    port = port || defaults.port;
    return new Promise(function (resolve, reject) {
        genPort(port, function (port) {
            if (port !== -1) {
                resolve(port);
            } else {
                reject(port);
            }
        })
    });
}
function genPort(port, cb) {
    callback = cb;
    findport(port);
}
function findport(port) {
    count++;
    var server = net.createServer().listen(port);
    server.on('listening',function() {
        if (server) {
            server.close(function () {
                count = 0;
                callback(port);
            });
        }
    });

    server.on('error',function(err) {
        var result = true;
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') result = false;
        port = port < 8000 ? (port + 8000) : (port + 10);
        if (count > maxCount) { 
            callback(noport);
            return;
        }
        findport(port);
    });
}