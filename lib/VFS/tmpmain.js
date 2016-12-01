'use strict';
const path = require('path');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
logger.level('debug');

const buildCss = require('./tmpbuildcss');
const buildjs = require('./tmpbuildjs');
const jdf = require('../jdf');
const VFS = require('./VirtualFileSystem');

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
        return buildCss.init(jdf, VFS);
    })
    .then(() => {
        return buildjs.init(jdf, VFS);
    })
    .then(() => {
        return VFS.writeFilesToTargetDir();
    })
    .then(() => {
        logger.profile('build all');
        logger.debug(`end`);
    })
    .catch(err => {
        console.log(err);
    });
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


start('D:/JDCProject/JDIndex/gitsource/JDC_arch_index', './target');
