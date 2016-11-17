var bs = require('browser-sync');
var path = require('path');

var Compress = require('./compress');
var genPort = require('./genPort');
var Server = require('./server');

var defaults = {
    listenPath: '/+(css|js|html|widget|test)/**',
    host: 'localhost',
    port: 80,
    devPath: ''
};

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
// TODO 测试 写两个watch会怎么样
// 
var server = module.exports;
server.NAME = 'bsServer';

// 私有变量管理watch列表
var watchlist = [];

server.startup = function (config, callback) {
    defaults.devPath = config.currentDir;
    // if config == funtion, callback = config; 然而需要提供默认config，实际上不现实
    genPort.findUsablePort(config.jdfconfig.localServerPort)
    .then(function (port) {
        // server.init 启动本地服务器
        config.jdfconfig.localServerPort = port;
        Server.init(config.serverDir, 
            port, // 被代理服务器隐藏端口号
            config.jdfconfig.cdn, 
            config.buildDir, 
            config.comboDebug, 
            Compress.addJsDepends);

        return port;
    }, function () {
        console.log('no port available!');
    })
    .then(function (port) {
        // bs.create.init and open url
        var options = {
            proxy: 'localhost:' + port,
            open: 'open or not TODO'
        }
        return initBSServer(server.NAME, options);
    })
    .then(function (options) {
        if(callback) {
            callback(config.jdfconfig.localServerPort);
        }
        console.log(`jdf server running at http://${options.proxy},`);
        console.log(`be proxied by browserSync at port 3000`);
    })
    .catch(function (err) {
        console.log(err);
    })
}

// 多种watch实现用options比较好
server.watch = function (options, cb) {
    if (typeof options === 'function') {
        cb = options;
        options = {};
        options.listenPath = defaults.listenPath;
    }
    var bsServer = server.getServer(server.NAME);

    var listenPath = defaults.devPath + '/' + options.listenPath; 
    listenPath = path.normalize(listenPath);
    bsServer.watch(listenPath, function (event, filename) {
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

// function watchAllFileChange(filename) {
// 
    // var regStr = '\\.(vm|tpl|shtml|html|smarty|js|css|less|sass|scss|json|babel|' + $.imageFileType() + ')$';
    // var reg = new RegExp(regStr);
//     console.log(filename);
//     //文件过滤
//     if (f.isFile(filename)) {
//         if (!reg.test(filename)) return;
//     }

//     var target = jdf.bgCurrentDir + filename.replace(jdf.currentDir, '');
//     if (jdf.checkProjectDir(filename)) {
//         if (f.exists(filename)) {
//             f.copy(filename, target, regStr);

//             jdf.buildMain(type);

//             bsServer.reload();
//             if (callback) callback(filename);
//         } else {
//             f.del(target, function() {
//                 if (callback) callback(filename);
//             });
//         }
//     }
// }

/**
 * create or get a browser-sync server, then init it
 * @param  {string}   name    server name
 * @param  {json}     options bs server init options
 * @param  {Function} cb      callback after init bs server
 */
function initBSServer(name, options) {
    return new Promise(function (resolve, reject) {
        var bsServer;
        try {
            bsServer = bs.get(name);
        } catch (e) {
            console.log('not have a exist bs server');
            bsServer = bs.create(name);
        }
        bsServer.init({
            proxy: options.proxy,
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

function noop(){}