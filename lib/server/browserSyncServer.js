var path = require('path');
var fs = require('fs');
var bs = require('browser-sync');
var colors = require('colors');
var f = require('jdf-file').file;
var $ = require('jdf-file').base;
$.mergeObj = $.merageObj;
var logger = require('jdf-log');

var Compress = require('../compress');
var genPort = require('./genPort');
var jdfserver = require('./middlewareLocal');

//var defaultsListen = ['**'];
var defaultsListen = ['html/**', 'widget/**/*', 'js/*', 'css/*'];

var _options = {
    autoOpen: false,
    port: 80,
    serverDir: '',
    watchDir: '',
    compress: {js: false, css: false}
}

var server = module.exports = {};
server.NAME = 'bsServer';


server.startup = function (serverDir, options, callback) {
    logger.info(`Files compiled!`);
    logger.profile('start server');

    // 确定服务器启动根目录
    serverDir = serverDir || './';
    serverDir = f.realpath(serverDir);

    _options.serverDir = serverDir;
    if (typeof options === 'function') {
        callback = options;
    } else {
        _options = $.mergeObj(_options, options);
    }

    // 如果没有传递监听目录，则监听server根目录。
    // 比如根目录在build文件夹，监听目录在src文件夹
    if (!_options.watchDir) {
        _options.watchDir =  _options.serverDir
    }

    genPort.findUsablePort(_options.port)
    .then(function (port) {
        _options.port = port;
        // 根据参数获取jdfserver中间件

        return jdfserver.init(
            _options.serverDir,
            _options.port,
            true,
            Compress.addJsDepends
        );
    })
    .then(function (middleware) {
        var options = {
            autoOpen: _options.autoOpen,
            middleware: middleware,
            port: _options.port
        }
        return initBSServer(server.NAME, options);
    })
    .then(function () {
        if(callback) {
            callback(_options.port);
        }
        logger.profile('start server');
    })
    .catch(function (err) {
        logger.error(err);
    })
}

/**
 * 监控文件变化注册函数
 * @param  {String || Array}   patterns  想要监控的文件模式(node-glob模式)
 * @param  {Function} cb    注册文件变化的处理函数
 */
server.watch = function (patterns, cb) {
    var globpatterns = [];

    if ($.isArray(patterns)) {
        globpatterns = globpatterns.concat(patterns);
    } else if (typeof patterns === 'string') {
        globpatterns.push(patterns);
    } else if (typeof patterns === 'function') {
        globpatterns = globpatterns.concat(defaultsListen);
        cb = patterns;
    }

    var bsServer = server.getServer(server.NAME);

    globpatterns = globpatterns.map(function (item) {
        return path.normalize(_options.watchDir + '/' + item);
    });

    bsServer.watch(globpatterns, function (event, filename) {
        if (!(event === 'add' || event === 'addDir')) {
            logger.info(event, filename);
            cb(event, filename, bsServer.reload);
        }
    });

    logger.info(`Watching .\\${globpatterns.join(', .\\')}`);
}

server.getServer = function (name) {
    return bs.get(name);
}

// 监控信息
server.isActive = function () {
    try {
        if (bs.get(server.NAME)) {
            return bs.get(server.NAME).active;
        }
    } catch (e) {
        logger.info('No browserSync Server!');
    }
    return false;
};

/**
 * 创建或者获取一个browser-sync server
 * @param  {String}   name    服务器名
 * @param  {json}     options 传给bs server的参数
 * @param  {Function} cb      callback after init bs server
 */
function initBSServer(name, options) {
    return new Promise(function (resolve, reject) {
        var bsServer;
        if (bs.has(name)) {
            bsServer = bs.get(name);
        } else {
            bsServer = bs.create(name);
        }

        var openbrowser = options.autoOpen ? 'external' : false;

        bsServer.init({
            server: '',
            open: openbrowser,
            logPrefix: 'jdc',
            port: options.port,
            middleware: [options.middleware],
            plugin: [
                {
                    module: 'bs-html-injector'
                }
            ]
        }, function () {
            resolve(options);
        });
    });
}
