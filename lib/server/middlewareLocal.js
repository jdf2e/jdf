'use strict';
/**
 * 基于硬盘文件的服务中间件
 * 和VFS系统完全不相关
 * 在任意目录运行jdf server就是调用的这个middleware
 */

const url = require('url');
const fs = require('fs');
const path = require('path');
const f = require('jdf-utils').file;
const logger = require('jdf-log');

const mime = require('./mime');
const Compress = require('../urlReplace');
const dirHTML = require('./middlewareVFS/res.dirView/dir.html');

let server = module.exports = {};

let config = server.config = {};

// enum
let pathType = {
    combo: 1,
    dir: 2,
    file: 3,
    empty: 4
};

server.init = function (serverDir, port) {
    port = port || 8080;
    config.port = port;

    config.serverDir = serverDir;

    return function (request, response, next) {
        let jdfRes = {};
        let requestUrl = decodeURI(request.url);

        let resource = server.getResourceInfo(requestUrl);
        switch (resource.type) {
            case pathType.empty: jdfRes = server.Res404(); break;
            case pathType.combo: jdfRes = server.ResCombo(resource.filelist); break;
            case pathType.dir:   jdfRes = server.ResDir(resource.filelist[0], url.parse(requestUrl).pathname); break;
            case pathType.file:  jdfRes = server.ResFile(resource.filelist[0]); break;
            default: jdfRes = server.Res404();
        }

        response.writeHead(jdfRes.status, {
            'Content-Type': jdfRes.contentType
        });
        response.write(jdfRes.content);
        response.end();
        next();
    }
}

/**
 * 根据请求url获取本地文件，目录路径
 * @param  {String} requestUrl 请求url
 * @return {Object}            包含路径信息以及有关这个路径信息的元信息
 */
server.getResourceInfo = function (requestUrl) {
    requestUrl = requestUrl || '';
    // example /a/b/c/
    let parsedUrl = url.parse(requestUrl);
    let pathname = parsedUrl.pathname;
    let isComboUrl = /^\?\?/.test(parsedUrl.search);
    let fileNameList = [];
    let resource = {};

    if (isComboUrl) {
        // ['a.js', 'b.js']
        fileNameList = parsedUrl.query.slice(1).split(',');
    } else {
        // ['/a/b/c/']
        fileNameList = [pathname];
    }

    fileNameList = fileNameList.map(function (item) {
        // ['C://Users/xxx/AppData/Local/Temp/a.js']
        return path.normalize(config.serverDir + '/' + decodeURI(item));
    });

    // type: combo
    if (isComboUrl) {
        resource.type = pathType.combo;
        resource.filelist = fileNameList;
        return resource;
    }

    let filepath = fileNameList[0];
    let stat = fs.statSync(filepath);
    if (!stat) {
        resource.type = pathType.empty;
        resource.filelist = [];
        return resource;
    }

    // type: 目录
    if (f.isDir(filepath)) {
        resource.type = pathType.dir;
        resource.filelist = fileNameList;
        return resource;
    }

    // type: 文件
    if (f.isFile(filepath)) {
        resource.type = pathType.file;
        resource.filelist = fileNameList;
        return resource;
    }

    return resource;
}

/**
 * 未找到资源返回404
 * @return {Object} 包含状态吗，返回内容类型，返回内容的对象
 */
function response404() {
    let notfound = '<center><h1>404 Not Found</h1></center><hr><center>'+server.copyright(config.port)+'</center>';
    return {
        status: 404,
        contentType: mime['html'],
        content: notfound
    };
}

/**
 * 404处理函数
 * @type {[void]}
 */
server.Res404 = response404;

/**
 * 文件资源处理函数
 * @param {String} resPath 文件资源路径
 * @return {Object} 包含状态吗，返回内容类型，返回内容的对象
 */
server.ResFile = function (resPath) {
    let ext = path.extname(resPath);
    ext = ext.replace('.', '');
    let contentType = mime[ext] || mime['txt'];
    let content = fs.readFileSync(resPath);
    return {
        status: 200,
        contentType: contentType,
        content: content
    };
}

/**
 * 目录访问处理函数
 * @param {String} resPath 目录路径
 * @param {String} urlPath url相对根域名的路径
 */
server.ResDir = function (resPath, urlPath) {
    let html = server.getDirList(resPath, urlPath);
    return {
        status: 200,
        contentType: mime['html'],
        content: html
    };
}

/**
 * combo组装处理函数
 * @param {Array} resList 需要combo的文件列表
 * 备注2016-11-23：有require时解析依赖没有测试，这个测试应该放在compress.js中，正常文件combo是可以成功的
 */
server.ResCombo = function (resList) {
    let ext, type, content, res;

    if (resList && resList.length > 0) {
        ext = path.extname(resList[0]).slice(1);
    }
    type = mime[ext] || mime['txt'];

    content = server.getComboFilesContent(resList);

    if (content === undefined) {
        res = response404();
    } else {
        res = {
            status: 200,
            contentType: type,
            content: content
        }
    }
    return res;
}

server.getIp = function(){
    let net = require('os').networkInterfaces();
    for(let key in net){
        if(net.hasOwnProperty(key)){
            let items = net[key];
            if(items && items.length){
                for(let i = 0; i < items.length; i++){
                    let ip = String(items[i].address).trim();
                    if(ip && /^\d+(?:\.\d+){3}$/.test(ip) && ip !== '127.0.0.1'){
                        return ip;
                    }
                }
            }
        }
    }
    return '127.0.0.1';
};

server.copyright = function (port){
    let serverIp = server.getIp()+':'+port;
    let copyright = '<p><strong style="font-size:1.2em">jdf server </strong>'+
        ' <strong>IP</strong> <a href="http://'+serverIp+'">'+serverIp+'</a>   '+
        //'<span style="font-size:0.8em">'+new Date()+'</span>  '+
    '</p>';
    return copyright;
}

/**
 * 拼接展示目录的页面
 * @param  {String} realPath 目录路径
 * @param  {String} pathname 相对于根域名的路径
 * @return {HTML String}     拼接的html片段
 */
server.getDirList = function(realPath){
    let data = {
        title: '',
        projectName: '',
        pathname: '',
        files: [],
        dirs: []
    };

    realPath = path.normalize(realPath);
    let serverDir = config.serverDir;
    let pathname = path.relative(serverDir, realPath);

    data.projectName = path.basename(serverDir);
    data.title = data.projectName + ' File List';
    data.pathname = pathname;
    data.pathname = data.pathname.replace(new RegExp(`\\${path.sep}`, 'g'), '/');

    // 返回上一级目录
    data.dirs.push({pathname: path.dirname(data.pathname), name: '..'});

    let projAbsDir = realPath;
    // 不过滤任何内容
    fs.readdirSync(projAbsDir).forEach(name => {
        let absPath = path.join(projAbsDir, name);
        let pathname = path.relative(serverDir, absPath);

        // D:\\NodeApp\\jdfDev\\widget\\ -> (localhost:8080)/jdfDev/widget，用于浏览器地址栏，手动统一转为正斜杠
        pathname = pathname.replace(new RegExp(`\\${path.sep}`, 'g'), '/');
        logger.verbose(`file or dir relative path: ${pathname}`);

        if (f.isDir(absPath)) {
            data.dirs.push({pathname: pathname, name: name});
        } else if (f.isFile(absPath)) {
            data.files.push({pathname: pathname, name: name});
        }
    });

    let html = dirHTML.html(data);
    return html;
}

/**
 * 拼接combo文件
 * @param  {Array} combolist 需要combo的路径列表
 * @return {String}          combo后的文件内容
 */
server.getComboFilesContent = function (combolist) {
    let comboContent = '';
    combolist.forEach(function(file){
        let content = '';
        if(f.exists(file)){
            content = f.read(file);
            if (path.extname(file) === '.js') {
                // 解析js依赖，没有解析css依赖
                content = f.read(file);
                if(typeof(Compress.addJsDepends) === 'function'){
                    content = Compress.addJsDepends(file);
                }
                //如果代码的末尾没有分号，则自动添加一个。以避免代码合并出现异常。
                if(!/[;\r\n]$/.test(content)){
                    content += ';';
                }
            }
            comboContent += content;
        }else{
            comboContent = undefined;
            return false;
        }
    });
    return comboContent;;
}
