'use strict';
/**
 * 基于browser-sync的服务器
 */

const path = require('path');
const fs = require('fs');
const bs = require('browser-sync');
const watcher = require('node-watch');
const minimatch = require('minimatch');
const f = require('jdf-utils').file;
const $ = require('jdf-utils').base;
const logger = require('jdf-log');
const fileType = require('../VFS/fileType');

const genPort = require('./genPort');
const middlewareLocal = require('./middlewareLocal');

let _options = {
    autoOpen: false,
    port: 80,
    serverDir: '',
    watchDir: process.cwd(),
    compress: {js: false, css: false}
}

let server = module.exports = {};
server.NAME = 'bsServer';

server.startup = function (serverDir, options, callback, mw) {
    logger.profile('start server');
    let middleware;
    if (mw) {
        middleware = mw;
    } else {
        middleware = middlewareLocal;
    }

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
        // 根据参数获取middleware中间件
        return middleware.init(_options.serverDir, _options.port);
    })
    .then(mw => {
        let options = {
            autoOpen: _options.autoOpen,
            middleware: mw,
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
 * @param  {Function} cb    注册文件变化的处理函数
 */
server.watch = function (cb) {
    let bsServer = server.getServer(server.NAME);

    let ignored = fileType.getIgnore();

    watcher(_options.watchDir, filename => {
        // 不符合的后缀
        if (!fileType.isPCExtname(filename)) {
            return;
        }
        // 忽略的目录, 特定文件
        let pass = ignored.every(pattern => {
            let relativepath = path.relative(_options.watchDir, filename);
            return !minimatch(relativepath, pattern);
        });
        if (!pass) {
            return;
        }

        logger.info('change', filename);
        cb('change', filename, bsServer.reload);
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
            logPrefix: 'JDFX',
            port: options.port,
            middleware: [options.middleware]
        }, function () {
            resolve(options);
        });
    });
}
