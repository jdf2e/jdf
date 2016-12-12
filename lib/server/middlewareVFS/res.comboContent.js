'use strict';

const fs = require('fs');
const path = require('path');
const f = require('jdf-utils').file;
const VFS = require('../../VFS/VirtualFileSystem');

const combo = module.exports = {};

/**
 * 拼接combo文件
 * @param  {Array} combolist 需要combo的路径列表
 * @return {String}          combo后的文件内容
 */
combo.getComboContent = function (combolist) {
    let comboContent = '';
    let allExist = true;
    combolist.forEach(filepath => {
        filepath = path.normalize(filepath);
        let vfile = VFS.queryFile(filepath);
        if (!allExist || !vfile) {
            allExist = false;
            return;
        }

        comboContent += vfile.targetContent;

        if (path.extname(filepath) === '.js') {
            // 添加分号 以避免代码合并出现异常。
            comboContent += ';';
        }
    });

    if (allExist) {
        return comboContent;
    } else {
        return undefined;
    }
}
