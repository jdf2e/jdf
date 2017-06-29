"use strict";
/**
* @输出处理后的工程文件
* @param {String} options.outputType，当前的输出模式：debug，plain
* @param {String} options.outputList，当前输出的文件列表数组
*/
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');

//lib自身组件
const logger = require('jdf-log');
const jdf = require('./jdf.js');
const urlReplace = require('./urlReplace');
const cssSprite = require('./cssSprite');
const base64 = require('./base64');
const compressScheduler = require('./compresser/compressScheduler');
const buildCss = require('./buildCss');
const buildWidget = require('./buildWidget');
const buildOutputWidget = require('./buildOutputWidget');
const buildES6 = require('./buildES6');
const VFS = require('./VFS/VirtualFileSystem');

module.exports.init = function (options) {
    var outputType = options.outputType;

    return Promise.resolve().then(() => {
        return buildCss.init(options);
    }).then(() => {
        return buildWidget.init(options);
    }).then(() => {
        buildES6.init();
    }).then(() => {
        if (jdf.config.output.base64) {
            return base64.init();
        }
    }).then(() => {
        if (jdf.config.output.cssSprite) {
            cssSprite.init();
        }
    }).then(() => {
        return buildOutputWidget.init(options);
    }).then(() => {
        return urlReplace.init(options); //todo:暂时先执行两次，后面再优化
    }).then(() => {
        logger.profile('delete build files');
        shelljs.rm('-rf', jdf.outputDir);
        logger.profile('delete build files');
    }).then(() => {
        if(outputType == 'default'){
            logger.profile('delete temp files');
            shelljs.rm("-Rf", jdf.transferDir);
            logger.profile('delete temp files');

            return VFS.writeFilesToDir(jdf.transferDir).then(() => {
                return compressScheduler.init(jdf.transferDir, jdf.outputDir);
            });

        }else{
            return VFS.writeFiles();
        }
    }).then(() => {
        logger.info('output success');
    }).catch(err => {
        logger.error(err);
    });
}
