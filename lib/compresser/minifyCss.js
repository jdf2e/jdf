"use strict";
const CleanCSS = require('clean-css');
const shelljs = require('shelljs');
const path = require('path');
//jdf-lib
const jdf = require('../jdf');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const urlReplace = require('../urlReplace');

module.exports = {
    /**
     * 压缩 css 字符串
     * @param {string} source  css string
     */
    cssSourceMinify: function (source) {
        let css = new CleanCSS({
            aggressiveMerging: false, //disable aggressive merging of properties.
            keepBreaks: false, //是否有空格
            processImport: false, //是否替换@import
            compatibility: '*'
        }).minify(source);
        return css;
    },
    /**
     * 压缩整个 css 文件 并生成一个新文件
     */
    cssFileMinify: function (srcPath, distPath, config) {
        let cssString = f.read(srcPath);
        cssString = this.cssSourceMinify(cssString);
        if (config.output.hasBanner) {
            cssString = urlReplace.setPrefixBanner(distPath) + cssString;
        }
        f.write(distPath, cssString);
    }
};
