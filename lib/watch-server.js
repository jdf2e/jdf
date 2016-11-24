var path = require('path');
var fs = require('fs');
var bs = require('browser-sync');
var colors = require('colors');
var $ = require('jdf-file').base;

var Compress = require('./compress');
var genPort = require('./genPort');
var jdfserver = require('./localserver');

//var defaultsListen = ['**'];
var defaultsListen = ['html/*', 'widget/**/*', 'js/*', 'css/*'];

// config template
// var config = {
//     autoOpenurl:''
//     comboDebug:''
//     type:'',
//     jdfconfig: '',
//     serverDir: jdf.bgCurrentDir
//     buildDir: jdf.getProjectPath();
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
    console.log(`Compiled!`);
    console.log("at process:<<"+process.pid+">>");
    var starttime = (new Date()).getTime();

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
        console.log(`default listen: ./${defaultsListen.join(', ./')}`);
        var endtime = (new Date()).getTime();
        console.log(`Server startup in ${endtime-starttime}ms!`);
    })
    .catch(function (err) {
        console.log(err);
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
            cb(event, filename, bsServer.reload);
        } 
    });
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
        console.log('No browserSync Server!');
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
            console.log('creating server');
            bsServer = bs.create(name);
        }
        
        bsServer.init({
            server: '',
            open: options.open,
            logPrefix: 'jdf',
            port: options.port,
            middleware: [
                function (request, response, next) {
                    console.log('request url: ', request.url);
                    next();
                },
                options.middleware
            ],
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