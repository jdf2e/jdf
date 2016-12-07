const jdfImg = require('jdf-img-minify');
const shelljs = require('shelljs');
const path = require('path');
//jdf-lib
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

module.exports = {
    /**
     * 压缩 image 文件并生成新的文件
     */
    imageFileMinify: function (srcPath, distPath, webp) {
  
        let extName = path.extname(srcPath);
        return jdfImg.all(srcPath, distPath, webp);
    },

};

