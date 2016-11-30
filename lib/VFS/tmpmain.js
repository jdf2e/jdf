'use strict';
let path = require('path');
let fb = require('jdf-file');
let $ = fb.base;
let f = fb.file;
let logger = require('jdf-log');
logger.level('debug');

let buildCss = require('./tmpbuildcss');
let buildjs = require('./tmpbuildjs');
let jdf = require('../jdf');
let VFS = require('./VirtualFileSystem');

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
        return VFS.readFilesInOriginDir()
    })
    .then(() => {
        return buildCss.init(jdf, VFS);
    })
    .then(() => {
        return buildjs.init(jdf, VFS);
    })
    .then(() => {
        return VFS.writeFilesToTargetDir();
    })
    .then(() => {
        logger.debug(`end`);
    })
    .catch(err => {
        console.log(err);
    });
}

start('./css', './target');

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