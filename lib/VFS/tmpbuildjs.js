"use strict";

const path = require('path');
const babel = require('babel-core');

const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');

let buildjs = module.exports = {};

let jdf;

buildjs.init = function (jdfin, VFS) {
    jdf = jdfin;
    return VFS.go()
    .then(() => {
        return VFS.travel((vfile, done) => {
            let extname = path.extname(vfile.originPath)
            if (extname === '.es6') {
                //done.push(buildjs.handleES6(vfile));
            } else if (extname === '.js') {
                done.push(buildjs.handleJS(vfile));
            }
        });
    });
}

buildjs.handleES6 = function (vfile) {
    return new Promise((resolve, reject) => {
        try {
            let content = f.read(vfile.originPath);
            let result = babel.transform(content, {
                presets: $.uniq(jdf.config.babel.defaultPresets.concat(jdf.config.babel.presets || [])),
                plugins: $.uniq(jdf.config.babel.defaultPlugins.concat(jdf.config.babel.plugins || [])),
                sourceMaps: false
            });
            vfile.originContent = content;
            vfile.targetContent = result.code;
            if (!vfile.targetPath) {
                vfile.targetPath = vfile.originPath;
            }
            vfile.targetPath = vfile.targetPath.replace(/es6$/, 'css');
            // TODO source-map怎么整。
            resolve();
        } catch (err) {
            logger.error(`buildES6 - babel ${vfile.originPath}`);
            console.log(err);
            reject(err);
        }
    });
}

buildjs.handleJS = function (vfile) {
    return vfile.handleSelf();
}
