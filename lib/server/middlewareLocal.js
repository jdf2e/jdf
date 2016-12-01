'use strict';
const url = require('url');
const fs = require('fs');
const path = require('path');
const f = require('jdf-utils').file;

const mime = require('./mime');
const Compress = require('../compress');

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
        let requestUrl = request.url;

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
        return path.normalize(config.serverDir + '/' + item);
    });

    // type: combo
    if (isComboUrl) {
        resource.type = pathType.combo;
        resource.filelist = fileNameList;
        return resource;
    }

    let filepath = fileNameList[0];

    // not exist
    if (!fs.existsSync(filepath)) {
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
server.getDirList = function(realPath, pathname){
    let dirname = '/';
    let html = '<li style="padding-bottom:5px;"><a href="../">../</a></li>';
    realPath = path.normalize(realPath);
    pathname += '/';
    pathname = pathname.replace(/\/\//,'');

    fs.readdirSync(realPath).forEach(function(name){
        if( !/.Ds_Store$/.test(name) ){
            let url = pathname +'/'+name;
            url = url.replace(/\/\//g,'/');
            url = encodeURI(url);
            dirname = path.dirname(url);
            if(f.isDir('.'+url)){
                url = url + '/';
                name = name + '/';
            }

            html += '<li style="padding-bottom:0.2em;"><a href="'+url+'">'+name+'</a></li>';
        }
    })

    html = '<ul>' +html+ '</ul>';
    html = '<h1>Index of '+dirname+'</h1><hr/>'+html+'<hr/> '+server.copyright(config.port);
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
