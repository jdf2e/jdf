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
const buildHTML = require("./buildHTML");
const buildHTMLDeep = require('./buildHTMLDeep')
const buildOutputWidget = require('./buildOutputWidget');
const buildES6 = require('./buildES6');
const VFS = require('./VFS/VirtualFileSystem');
const bs = require('./server/browserSyncServer');
const middleware = require('./server/middlewareVFS');
const pluginCore = require('./pluginCore');

//exports
const build = module.exports = {};

build.serverDir = '';

build.init = function (options) {
    let buildType = options.buildType;
    let serverDir = options.serverDir;
    build.serverDir = serverDir;
    let projectDir = options.projectDir;

    var logText = 'build files success';

    //注册plugin, todo异步
    pluginCore.addPluginFromConfiguration();

    return VFS.go()
    .then(() => {
        logger.profile('plugin.beforeBuild');
        return pluginCore.excuteBeforeBuild();
    })
    .then(() => {
        logger.profile('plugin.beforeBuild');
        return buildCss.init();
    })
    .then(() => {
        if (jdf.config.widgetNesting) {
            return buildHTMLDeep.init(options);
        } else {
            return buildHTML.init(options);
        }
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
        return buildOutputWidget.init();
    })
    .then(() => {
        logger.profile('plugin.afterBuild');
        return pluginCore.excuteAfterBuild();
    })
    .then(() => {
        logger.profile('plugin.afterBuild');
        
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

        if (true) {
            return build.startVFSServer(bsOptions);
        }
        else {
            // 启动localserver，基于temp目录，性能低一些
            // 这个是用来做对比测试的，保证VFS server正确性，不提供watch功能
            logger.profile('delete temp files');
            shelljs.rm("-Rf", jdf.transferDir);
            logger.profile('delete temp files');
            return VFS.writeFilesToDir(jdf.transferDir).then(() => {
                return build.startLocalServer(bsOptions);
            });
        }



    })
    .catch(err => {
        logger.error(err);
    });
}

build.rebuild = function (callback, option) {
    return VFS.go()
    .then(() => {
        logger.profile('plugin.beforeBuild');
        return pluginCore.excuteBeforeBuild();
    })
    .then(() => {
        logger.profile('plugin.beforeBuild');
        
        logger.profile('rebuild');
        if (option && option.buildcss === false) {
            // 主动不编译css，等于false是为了避免 ===undefined 这种非主动情况
            return;
        }
        return buildCss.init();
    })
    .then(() => {
        if (option && option.buildwidget === false) {
            return;
        }
        if (jdf.config.widgetNesting) {
            return buildHTMLDeep.init();
        } else {
            return buildHTML.init();
        }
    })
    .then(() => {
        if (option && option.buildjs === false) {
            return;
        }
        return buildES6.init();
    })
    .then(() => {
        if (option && option.buildcss === false) {
            return;
        }
        base64.init();
    })
    .then(() => {
        if (option && option.buildcss === false) {
            return;
        }
        cssSprite.init();
    })
    .then(() => {
        if (option && option.buildwidget === false) {
            return;
        }
        return buildOutputWidget.init();
    })
    .then(() => {
        logger.profile('plugin.afterBuild');
        return pluginCore.excuteAfterBuild();
    })
    .then(() => {
        logger.profile('plugin.afterBuild');

        logger.profile('rebuild');
        // TODO 把arguments后面的参数传给callback
        callback && callback();
    })
    .catch(err => {
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
                port: parseInt(jdf.config.localServerPort)
            }, function (port) {
                // save all的时候每save单个file都会触发一次reload，因此设置debounce，每次触发时只修改VFS
                // 设定保存一个文件的时间为300ms
                build.debounceRebuild = _.debounce(build.rebuild, 300);

                bs.watch(function (event, filename, reloadIt) {
                    build.buildChangeFile(event, filename, reloadIt);
                });
                resolve(port);
            }, middleware);
    });
}

build.startLocalServer = function (options) {
    return new Promise((resolve, project) => {
        bs.startup(options.serverDir, {autoOpen: options.autoOpen, watchDir: options.watchDir});
    });
}

build.buildChangeFile = function (event, filename, reloadIt) {
    if (!jdf.config.build.livereload) {
        reloadIt = undefined;
    }

    if (event === 'update') {
        let newvfile = VFS.createFile(filename);
        VFS.updateFile(filename, newvfile.originContent);
    } else if (event === 'remove') {
        VFS.deleteFile(filename);
        VFS.deleteDir(filename);
    }

    this.debounceRebuild(reloadIt, this.buildOption(filename));
}

/**
 * 引入按文件编译，在同时保存多个文件时存在风险，比如，最后保存的文件为js，那么就只会编译js
 * @param {*} filename 
 */
build.buildOption = function (filename) {
    let option = {
        buildcss: true,
        buildjs: true,
        buildwidget: true
    }

    let extname = path.extname(filename).replace('.', '');
    
    let cssRelativeTypeArr = VFS.fileType.getRelativeType('css');
    let jsRelativeTypeArr = VFS.fileType.getRelativeType('js');
    let imgRelativeTypeArr = VFS.fileType.getRelativeType('img');
    if (cssRelativeTypeArr.indexOf(extname) !== -1) {
        option.buildcss = true;
        option.buildjs = false;
        option.buildwidget = false;
    }
    else if (jsRelativeTypeArr.indexOf(extname) !== -1) {
        option.buildcss = false;
        option.buildjs = true;
        option.buildwidget = false;
    }
    else if (imgRelativeTypeArr.indexOf(extname) !== -1) {
        option.buildcss = false;
        option.buildjs = false;
        option.buildwidget = false;
    }
    else {
        option.buildcss = false;
        option.buildjs = false;
        option.buildwidget = true;
    }
    return option;
}
