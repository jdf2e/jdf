"use strict";

const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');

const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');

const jdf = require('./jdf.js');
const urlReplace = require('./UrlReplace');
const cssSprite = require('./cssSprite');
const base64 = require('./base64');
const buildCss = require("./buildCss");
const buildWidget = require("./buildWidget");
const VFS = require('./VFS/VirtualFileSystem');
const bs = require('./server/browserSyncServer');

//exports
const build = module.exports = {};

build.init = function (options) {
    logger.logLevel = 'debug';
    let buildType = options.buildType;
    let serverDir = options.serverDir;
    let projectDir = options.projectDir;

    var logText = 'build files success';

    return VFS.go().then(() => {
        logger.profile('delete old file');
        shelljs.rm("-rf",serverDir);
        logger.profile('delete old file');
    }).then(() => {
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
        return VFS.writeFilesToDir(serverDir);
    }).then(() => {
        logger.info(logText);
    }).then(() => {
        let bsOptions = {
            autoOpen: false,
            watchDir: projectDir,
            serverDir: serverDir
        };
        if (buildType === 'open') {
            bsOptions.autoOpen = true;

        }
        return build.startServer(bsOptions);
    }).catch(err => {
        logger.error(err);
    });
}

build.startServer = function (options) {
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
            });
    });
}

build.buildChangeFile = function (event, filename, reloadIt) {
    reloadIt();
}
