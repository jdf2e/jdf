'use strict';
/**
 * 基于browser-sync的内置服务器
 */

const path = require('path');
const fs = require('fs');
const bs = require('browser-sync');
const f = require('jdf-utils').file;
const $ = require('jdf-utils').base;
const logger = require('jdf-log');

const genPort = require('./genPort');
const jdfserver = require('./middlewareLocal');

//let defaultsListen = ['**'];
let defaultsListen = ['html/**', 'widget/**/*', 'js/*', 'css/*'];

let _options = {
    autoOpen: false,
    port: 80,
    serverDir: '',
    watchDir: '',
    compress: {js: false, css: false}
}

let server = module.exports = {};
server.NAME = 'bsServer';


server.startup = function (serverDir, options, callback) {
    logger.profile('start server');

    // 确定服务器启动根目录
    serverDir = serverDir || './';
    serverDir = f.realpath(serverDir);

    _options.serverDir = serverDir;
    if (typeof options === 'function') {
        callback = options;
    } else {
        _options = $.merageObj(_options, options);
    }

    // 如果没有传递监听目录，则监听server根目录。
    // 比如根目录在build文件夹，监听目录在src文件夹
    if (!_options.watchDir) {
        _options.watchDir =  _options.serverDir
    }

    genPort.findUsablePort(_options.port)
    .then(port => {
        _options.port = port;
        // 根据参数获取jdfserver中间件
        return jdfserver.init(_options.serverDir, _options.port);
    })
    .then(middleware => {
        let options = {
            autoOpen: _options.autoOpen,
            middleware: middleware,
            port: _options.port
        }
        return initBSServer(server.NAME, options);
    })
    .then(() => {
        if(callback) {
            callback(_options.port);
        }
        logger.profile('start server');
    })
    .catch(err => {
        logger.error(err);
    });
}

/**
 * 监控文件变化注册函数
 * @param  {String || Array}   patterns  想要监控的文件模式(node-glob模式)
 * @param  {Function} cb    注册文件变化的处理函数
 */
server.watch = function (patterns, cb) {
    let globpatterns = [];

    if ($.isArray(patterns)) {
        globpatterns = globpatterns.concat(patterns);
    } else if (typeof patterns === 'string') {
        globpatterns.push(patterns);
    } else if (typeof patterns === 'function') {
        globpatterns = globpatterns.concat(defaultsListen);
        cb = patterns;
    }

    let bsServer = server.getServer(server.NAME);

    globpatterns = globpatterns.map(function (item) {
        return path.normalize(_options.watchDir + '/' + item);
    });

    bsServer.watch(globpatterns, (event, filename) => {
        if (!(event === 'add' || event === 'addDir')) {
            logger.info(event, filename);
            cb(event, filename, bsServer.reload);
        }
    });

    logger.info(`Watching file change, and browser sync change`);
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
    return new Promise((resolve, reject) => {
        let bsServer;
        if (bs.has(name)) {
            bsServer = bs.get(name);
        } else {
            bsServer = bs.create(name);
        }

        let openbrowser = options.autoOpen ? 'external' : false;

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
