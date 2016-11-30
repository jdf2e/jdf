var path = require('path');
var fs = require('fs');
var bs = require('browser-sync');
var colors = require('colors');
var $ = require('jdf-file').base;
var logger = require('jdf-log');

var Compress = require('./compress');
var genPort = require('./genPort');
var jdfserver = require('./middlewareLocal');

//var defaultsListen = ['**'];
var defaultsListen = ['html/*', 'widget/**/*', 'js/*', 'css/*'];

// config template
// var config = {
//     autoOpenurl:''
//     comboDebug:''
//     jdfconfig: '',
//     serverDir: jdf.bgCurrentDir
//     currentDir
// }

var server = module.exports;
server.NAME = 'bsServer';

/**
 * 启动本地服务器
 * @param  {json}     config   必要参数集合
 * @param  {function} callback 启动成功后回调函数
 */
server.startup = function (config, callback) {
    logger.info(`Files compiled!`);
    logger.profile('start server');
    // if config == funtion, callback = config; 然而需要提供默认config，实际上不现实
    genPort.findUsablePort(config.jdfconfig.localServerPort)
    .then(function (port) {
        config.jdfconfig.localServerPort = port;
        // 根据参数获取jdfserver中间件
        return jdfserver.init(
                    config.serverDir,
                    port, // 被代理服务器隐藏端口号
                    config.comboDebug,
                    Compress.addJsDepends
                );
    })
    .then(function (middleware) {
        var options = {
            open: config.autoOpenurl,
            middleware: middleware,
            port: config.jdfconfig.localServerPort
        }
        return initBSServer(server.NAME, options);
    })
    .then(function () {
        if(callback) {
            callback(config.jdfconfig.localServerPort);
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

    // 都相对于开发目录
    globpatterns = globpatterns.map(function (item) {
        return path.normalize('./' + item);
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

        var openbrowser = options.open ? 'external' : false;

        bsServer.init({
            server: '',
            open: openbrowser,
            logPrefix: 'jdf',
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

// -o 打开的url
// var indexPath = '';
//         if (config.autoOpenurl) {
//             if (fs.existsSync(path.normalize(config.bgCurrentDir + '/html/index.html'))) {
//                 indexPath = 'html/index.html';
//             } else {
//                 indexPath = 'html/';
//             }
//         }
