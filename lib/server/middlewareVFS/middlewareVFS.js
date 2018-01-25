'use strict';
/**
 * 基于VFS系统的服务中间件
 * request会首先经过。。。。；。。。
 * @type {[type]}
 */
const url = require('url');
const fs = require('fs');
const path = require('path');
const f = require('jdf-utils').file;
const mime = require('../mime');
const view = require('./view');
const VFS = require('../../VFS/VirtualFileSystem');
const jdf = require('../../jdf');
const logger = require('jdf-log');

let server = module.exports = {};

// enum
let pathType = {
    combo: 1,
    dir: 2,
    file: 3,
    empty: 4,
    config: 5,
    api: 6
};

server.init = function (projectDir) {
    view.config.webRoot = path.normalize(projectDir);

    return function (request, response, next) {
        let jdfRes = {};
        let requestUrl = decodeURI(request.url);
        let resource = server.getResourceInfo(requestUrl);
        logger.verbose(`resource info: ${JSON.stringify(resource)}`);

        switch (resource.type) {
            case pathType.empty: jdfRes = server.Res404(); break;
            case pathType.combo: jdfRes = server.ResCombo(resource.filelist); break;
            case pathType.dir:   jdfRes = server.ResDir(resource.filelist[0]); break;
            case pathType.file:  jdfRes = server.ResFile(resource.filelist[0]); break;
            case pathType.config: jdfRes = server.ResConfig(); break;
            case pathType.api: jdfRes = server.ResApi(resource.filelist[0], request); break;
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
    let isApi = /\/jdf-api/.test(pathname);
    let fileNameList = [];
    let resource = {};

    if (isComboUrl) {
        // ['a.js', 'b.js']
        fileNameList = parsedUrl.query.slice(1).split(',');

        fileNameList = fileNameList.map(function (item) {
            // ['C://Users/xxx/AppData/Local/Temp/a.js']
            return path.join(view.config.webRoot, pathname, decodeURI(item));
        });
    } else if (isApi) {
        fileNameList = [pathname];
    } else {
        // ['/a/b/c/']
        fileNameList = [pathname];
        fileNameList = fileNameList.map(function (item) {
            // ['C://Users/xxx/AppData/Local/Temp/a.js']
            return path.join(view.config.webRoot, decodeURI(item));
        });
    }

    // type: combo
    if (isComboUrl) {
        resource.type = pathType.combo;
    } else if (f.isDir(fileNameList[0])) {
        // type: 目录
        resource.type = pathType.dir;
    } else if (/config\.json$/.test(pathname)) {
        // type: 在线配置config
        resource.type = pathType.config;
    } else if (isApi) {
        // type: 在线配置config
        resource.type = pathType.api;
    } else {
        // defaults: file
        resource.type = pathType.file;
    }

    resource.filelist = fileNameList;
    return resource;
}

/**
 * 未找到资源返回404
 * @return {Object} 包含状态吗，返回内容类型，返回内容的对象
 */
function response404() {
    let notfound = view.res404();
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

    let content = view.fileRes.getFileContent(resPath);

    // 定义null为not found
    if (content === null) {
        return this.Res404();
    }

    return {
        status: 200,
        contentType: contentType,
        content: content
    };
}

/**
 * api处理函数
 * @param {String} routePath api请求路径
 * @return {Object} 包含状态吗，返回内容类型，返回内容的对象
 */
server.ResApi = function (routePath, req) {
    let contentType = mime['json'];

    // must 得到的content为string类型
    let content = view.router.route(routePath, req);

    // 定义null为not found
    if (content === null) {
        return this.Res404();
    }

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
server.ResDir = function (resPath) {
    let html = view.dirView.genHTML(resPath);
    return {
        status: 200,
        contentType: mime['html'],
        content: html
    };
}

/**
 * 在线配置访问处理函数
 */
server.ResConfig = function () {
    let html = view.configView.genHTML();
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

    content = view.comboRes.getComboContent(resList);

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
