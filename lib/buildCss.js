'use strict';
const path = require('path');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
logger.level('debug');

//外部组件
const Sass = require('node-sass');
const Less = require('less');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

let buildCss = module.exports = {};

buildCss.init = function (VFS) {
    return VFS.go()
    .then(() => {
        return VFS.travel((vfile, done) => {
            let oPath = vfile.originPath;
            if ($.is.sass(oPath)) {
                done.push(buildCss.handleSass(vfile));
            } else if ($.is.less(oPath)) {
                done.push(buildCss.handleLess(vfile));
            } else if ($.is.css(oPath)) {
                done.push(buildCss.handleCss(vfile));
            }
        });
    })
    .then(() => {
        return VFS.travel((vfile, done) => {
            if (buildCss.isCssRelative(vfile)) {
                done.push(buildCss.postCSSProcess(vfile));
            }
        });
    })
    .then(() => {
        return resolvePromise();
    });
}

buildCss.handleSass = function (vfile) {
    return new Promise (function (resolve, reject) {
        let oPath = vfile.originPath;
        Sass.render({
            file: oPath,
            outputStyle: 'expanded'
        }, function (err, result) {
            if (err) {
                logger.error(err.formatted);
                reject(err);
                return;
            }
            vfile.targetContent = result.css.toString();
            if (!vfile.targetPath) {
                vfile.targetPath = vfile.originPath;
            }
            vfile.targetPath = vfile.targetPath.replace(/scss$/, 'css');
            resolve();
        });
    });
}

buildCss.handleLess = function (vfile) {
    return new Promise(function (resolve, reject) {
        let lessContent;
        if (!vfile.originContent) {
            lessContent = f.read(vfile.originPath);
        } else {
            lessContent = vfile.originContent;
        }

        Less.render(lessContent, {filename: vfile.originPath, syncImport: true})
        .then(function (output) {
            vfile.originContent = lessContent;
            vfile.targetContent = output.css;
            if (!vfile.targetPath) {
                vfile.targetPath = vfile.originPath;
            }
            vfile.targetPath = vfile.targetPath.replace(/less$/, 'css');
            resolve();
        }, function (err) {
            logger.error(`render less file ${fileFullPath}`);
            console.log(err);
            reject(err);
        });
    });
}

buildCss.handleCss = function (vfile) {
    vfile.fetch();
    vfile.targetPath = vfile.originPath;
    vfile.targetContent = vfile.originContent;
    return vfile;
}

buildCss.postCSSProcess = function (vfile) {
    // 更多插件可以再扩展
    let plugins = [autoprefixer];
    return new Promise(function (resolve, reject) {
        postcss(plugins)
        .process(vfile.targetContent)
        .then(result => {
            vfile.targetContent = result.css;
            resolve();
        })
        .catch(err => {
            reject(err);
        });
    });
}

buildCss.isCssRelative = function (vfile) {
    let oPath = vfile.originPath;
    if (!($.is.less(oPath) || $.is.sass(oPath) || $.is.css(oPath))) {
        return false;
    }
    return true;
}

function rejectPromise(err) {
    return new Promise(function (resolve, reject) {
        reject(err);
    });
}
function resolvePromise(err) {
    return new Promise(function (resolve, reject) {
        resolve(err);
    });
}

function start(rSource, target) {
    let VFS = require('./VirtualFileSystem').instance();
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
    VFS.searchFilesFromOrigin()
    .then(() => {
        return buildCss.init(VFS);
    })
    .then(() => {
        logger.debug(`build js`);
        return resolvePromise();
    })
    .then(() => {
        return VFS.writeDir('css');
    })
    .then(() => {
        logger.debug(`end`);
    });
}
