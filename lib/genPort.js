'use strict';

const net = require('net');
// allow user to open ten servers.
const maxCount = 10;
const noport = -1;
let callback = function () {};
let count = 0;

function genPort(port, cb) {
    callback = cb;
    findport(port);
}

function findport(port) {
    count++;
    const server = net.createServer().listen(port);
    server.on('listening',function() {
        if (server) {
            server.close(function () {
                count = 0;
                callback(port);
            });
        }
    });

    server.on('error',function(err) {
        port = port < 8000 ? (port + 8000) : (port + 10);
        if (count > maxCount) {
            callback(noport);
            return;
        }
        findport(port);
    });
}

module.exports.findUsablePort = function (port) {
    port = port || 8080;
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
