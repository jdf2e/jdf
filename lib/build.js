"use strict";

const path = require('path');
const fs = require('fs');

const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
const shelljs = require('shelljs');
const _ = require('lodash');

const jdf = require('./jdf.js');
const cssSprite = require('./cssSprite');
const base64 = require('./base64');
const buildCss = require("./buildCss");
const buildWidget = require("./buildWidget");
const buildOutputWidget = require('./buildOutputWidget');
const buildES6 = require('./buildES6');
const VFS = require('./VFS/VirtualFileSystem');
const bs = require('./server/browserSyncServer');
const middleware = require('./server/middlewareVFS');

//exports
const build = module.exports = {};

build.serverDir = '';

build.init = function (options) {
    let buildType = options.buildType;
    let serverDir = options.serverDir;
    build.serverDir = serverDir;
    let projectDir = options.projectDir;

    var logText = 'build files success';

    return VFS.go().then(() => {
        return buildCss.init();
    })
    .then(() => {
        return buildWidget.init();
    })
    .then(() => {
        return buildOutputWidget.init();
    })
    .then(() => {
        return buildES6.init();
    })
    .then(() => {
        base64.init();
    })
    .then(() => {
        cssSprite.init();
    })
    .then(() => {
        logger.profile(options.profileText);
        logger.info(logText);
    })
    .then(() => {
        let bsOptions = {
            autoOpen: false,
            watchDir: projectDir,
            serverDir: serverDir
        };
        if (buildType === 'open') {
            bsOptions.autoOpen = true;

        }

        return build.startVFSServer(bsOptions);

        // // 启动localserver，基于temp目录，性能低一些
        // logger.profile('delete temp files');
        // shelljs.rm("-Rf", jdf.transferDir);
        // logger.profile('delete temp files');
        // return VFS.writeFilesToDir(jdf.transferDir).then(() => {
        //     return build.startLocalServer(bsOptions);
        // });
    })
    .catch(err => {
        logger.error(err);
    });
}

build.rebuild = function (callback) {
    return VFS.go().then(() => {
        logger.profile('rebuild');
        return buildCss.init();
    }).then(() => {
        return buildWidget.init();
    }).then(() => {
        return buildOutputWidget.init();
    }).then(() => {
        return buildES6.init();
    }).then(() => {
        base64.init();
    }).then(() => {
        cssSprite.init();
    }).then(() => {
        logger.profile('rebuild');
        // TODO 把arguments后面的参数传给callback
        callback && callback();
    }).catch(err => {
        logger.error(err);
    });
}

build.debounceRebuild = function () {}

build.startVFSServer = function (options) {
    return new Promise((resolve, project) => {
        // startup第一个参数是服务器根目录，基于VFS，不存在在内存中的文件从watchDir，也就是projectDir
        // 要改成middlewareLocal服务，则这个目录应该设置成jdf.transferDir
        // jdf server命令调用无参bs.startup()，用的middlewareLocal中间件服务，请参见。
        bs.startup(options.watchDir, {
                autoOpen: options.autoOpen,
                watchDir: options.watchDir,
                port: jdf.config.localServerPort
            }, function (port) {
                // save all的时候每save单个file都会触发一次reload，因此设置debounce，每次触发时只修改VFS
                // 设定保存一个文件的时间为300ms
                build.debounceRebuild = _.debounce(build.rebuild, 300);

                bs.watch(function (event, filename, reloadIt) {
                    build.buildChangeFile(event, filename, reloadIt);
                });
                resolve();
            }, middleware);
    });
}

build.startLocalServer = function (options) {
    return new Promise((resolve, project) => {
        bs.startup(options.serverDir, {autoOpen: options.autoOpen, watchDir: options.watchDir});
    });
}

build.buildChangeFile = function (event, filename, reloadIt) {
    if (event === 'change') {
        this.updateChangedFile(filename);
        if (!jdf.config.build.livereload) {
            reloadIt = undefined;
        }
        this.debounceRebuild(reloadIt);
    }
}

build.updateChangedFile = function (filename, cb) {
    let newvfile = VFS.createFile(filename);

    let vfile = VFS.queryFile(filename);
    if (vfile) {
        vfile.originContent = newvfile.originContent;
        vfile.targetContent = newvfile.targetContent;
    }
}

