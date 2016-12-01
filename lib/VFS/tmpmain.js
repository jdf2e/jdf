'use strict';
const path = require('path');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
logger.level('debug');

const jdf = require('../jdf');
const VFS = require('./VirtualFileSystem');
const buildCss = require('./tmpbuildcss');
const buildjs = require('./tmpbuildjs');
const buildHTML = require('./tmpbuildHTML');

function start(rSource, target) {
    let entrance = f.realpath(rSource);
    let absTarget = f.realpath(target);
    logger.debug(`entrance:${entrance}`);
    if (!entrance) {
        logger.error(`path not found: ${rSource}`);
        return rejectPromise(`path not found: ${rSource}`);
    }
    if (!absTarget) {
        logger.error(`target path not found: ${target}`);
        return rejectPromise(`target path not found: ${target}`);
    }
    entrance = path.normalize(entrance);
    absTarget = path.normalize(absTarget);

    VFS.setOriginDir(entrance);
    VFS.setTargetDir(absTarget);

    VFS.go()
    .then(() => {
        logger.profile('build all');
        logger.profile('read file');
        return VFS.readFilesInOriginDir()
    })
    .then(() => {
        logger.profile('read file');
        logger.profile('build css');
        return buildCss.init(jdf, VFS);
    })
    .then(() => {
        logger.profile('build css');
        logger.profile('build js');
        return buildjs.init(jdf, VFS);
    })
    .then(() => {
        logger.profile('build js');
        logger.profile('build html');
        return buildHTML.init(VFS);
    })
    .then(() => {
        logger.profile('build html');
        return VFS.writeFilesToTargetDir();
    });
    // .then(() => {
    //     logger.profile('build all');
    //     logger.debug(`end`);
    // })
    // .catch(err => {
    //     console.log(err);
    // });
}


function rejectPromise(err) {
    return new Promise((resolve, reject) => {
        reject(err);
    });
}
function resolvePromise(info) {
    return new Promise((resolve, reject) => {
        resolve(info);
    });
}


start('D:/NodeApp/jdfDev', './target');
