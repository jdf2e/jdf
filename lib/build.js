"use strict";

const path = require('path');
const fs = require('fs');

const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');

const jdf = require('./jdf.js');
const urlReplace = require('./urlReplace');
const cssSprite = require('./cssSprite');
const base64 = require('./base64');
const buildCss = require("./buildCss");
const buildWidget = require("./buildWidget");
const VFS = require('./VFS/VirtualFileSystem');
const bs = require('./server/browserSyncServer');
const middleware = require('./server/middlewareVFS');

//exports
const build = module.exports = {};

build.init = function (options) {
    logger.logLevel = 'debug';
    let buildType = options.buildType;
    let serverDir = options.serverDir;
    let projectDir = options.projectDir;

    var logText = 'build files success';

    return VFS.go().then(() => {
        logger.profile('build css');
        return buildCss.init();
    }).then(() => {
        logger.profile('build css');
        logger.profile('build widget');
        return buildWidget.init();
    }).then(() => {
        logger.profile('build widget');
        logger.profile('build base64');
        base64.init();
    }).then(() => {
        logger.profile('build base64');
        logger.profile('build sprite');
        cssSprite.init();
    }).then(() => {
        logger.profile('build sprite');
        // TODO need or not
        // urlReplace.init();
    }).then(() => {
        logger.profile(options.profileText);
        logger.info(logText);
    }).then(() => {
        let bsOptions = {
            autoOpen: false,
            watchDir: projectDir,
            serverDir: projectDir
        };
        if (buildType === 'open') {
            bsOptions.autoOpen = true;

        }
        return build.startServer(bsOptions, middleware);
    }).catch(err => {
        logger.error(err);
    });
}

build.rebuild = function (callback) {
    VFS.go().then(() => {
        logger.profile('rebuild');
        return buildCss.init();
    }).then(() => {
        return buildWidget.init();
    }).then(() => {
        base64.init();
    }).then(() => {
        cssSprite.init();
    }).then(() => {
        // TODO need or not
        // urlReplace.init();
    }).then(() => {
        logger.profile('rebuild');
        logger.info('rebuild success!');
    }).then(() => {
        // TODO 把arguments后面的参数传给callback
        callback();
    }).catch(err => {
        logger.error(err);
    });
}

build.startServer = function (options, mw) {
    return new Promise((resolve, project) => {
        bs.startup(options.serverDir,
            {autoOpen: options.autoOpen, watchDir: options.watchDir},
            function (port) {
                if (!jdf.config.build.livereload) {
                    resolve();
                    return;
                }

                bs.watch(function (event, filename, reloadIt) {
                    build.buildChangeFile(event, filename, reloadIt);
                });
                resolve();
            }, mw);
    });
}

build.buildChangeFile = function (event, filename, reloadIt) {
    if (event === 'change') {
        this.updateChangedFile(filename);
        this.rebuild(reloadIt);
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

