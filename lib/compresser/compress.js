"use strict";
/**
 * @前端集成处理工具,此文件仅运行于子进程内.
 * @see
 * jdf-img-minify
 * homePage:
 * https://github.com/jdf2e/jdf-img-minify
 *
 */

//system
const path = require('path');

//jdf-lib
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const shell = require('shelljs');

//external
const minifyCss = require('./minifyCss');
const minifyHtml = require('./minifyHtml');
const minifyJs = require('./minifyJs');
const minifyImage = require('./minifyImage');
const logger = require('jdf-log');

//exports
let compress = module.exports = {};

/**
 * @fileCompress portal
 * @param {String} source filePath is an absolute file path
 * @param {Object} config config to overload
 * @returns Promise<any>
 */
compress.init = function (data) {
    let srcPath = data.task;
    let config = global.config = data.config;
    let distPath = data.dist;
    return new Promise((resolve, reject) => {

        //image minify
        if ($.is.img(srcPath) && config.output.compressImage) {
            minifyImage.imageFileMinify(srcPath, distPath, config.output.webp).then(v => {
                resolve();
            }, err => {
                shell.cp(srcPath, distPath);
                logger.debug(err);
                logger.error(`compress error => ${distPath} just copy itself.`);
                resolve();
            });
            return;
        }

        //html minify
        if ($.is.html(srcPath) && config.output.compresshtml) {
            try {
                minifyHtml.htmlFileMinify(srcPath, distPath);
                resolve();
            } catch (err) {
                shell.cp(srcPath, distPath);
                logger.debug(err);
                logger.error(`compress error => ${distPath} just copy itself.`);
                resolve();
            }
            return;
        }

        //js minify
        if ($.is.js(srcPath) && config.output.compressJs) {
            try {
                minifyJs.jsFileMinify(srcPath, distPath, config);
                resolve();
            } catch (err) {
                shell.cp(srcPath, distPath);
                logger.debug(err);
                logger.error(`compress error => ${distPath} just copy itself.`);
                resolve();
            }
            return;
        }

        //css minify
        if ($.is.css(srcPath) && config.output.compressCss) {
            try {
                minifyCss.cssFileMinify(srcPath, distPath, config);
                resolve();
            } catch (err) {
                shell.cp(srcPath, distPath);
                logger.debug(err);
                logger.error(`compress error => ${distPath} just copy itself.`);
                resolve();
            }
            return;
        }
        shell.cp(srcPath, distPath)
        resolve();
    })
}
