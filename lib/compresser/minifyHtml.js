"use strict";
const htmlminify = require('html-minifier').minify;
const shelljs = require('shelljs');
const path = require('path');
//jdf-lib
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

module.exports = {
    /**
     * 压缩 html 字符串
     * @param {string} source  html string
     */
    htmlSourceMinify: function (source) {
        return htmlminify(source, {
            removeComments: true, //移除注释
            collapseWhitespace: true, //合并多余的空格
            minifyJS: true, //压缩文件中的js代码
            minifyCSS: true //压缩文件中的css代码
        });
    },
    /**
     * 压缩整个 html 文件 并生成一个新文件
     */
    htmlFileMinify: function (srcPath, distPath) {
 
        let htmlString = f.read(srcPath);
        f.write(distPath, this.htmlSourceMinify(htmlString));
    }
};

