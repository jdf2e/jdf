'use strict';
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

class VFile {
    constructor(oPath, oContent, tPath, tContent) {
        this.originPath = oPath;
        this.originContent = oContent;
        this.targetPath = tPath;
        this.targetContent = tContent;
    }

    // 如果没有读到内存，则执行一次读取操作
    // 无论成功失败，都只会读取一次
    fetch() {
        if (!this.fetched && !this.originContent) {
            this.originContent = f.read(this.originPath);
            this.fetched = true;
        }
    }

    getType() {
        return path.extname(this.originPath).slice(1);
    }

    getTargetType() {
        return path.extname(this.targetPath).slice(1);
    }
}

module.exports = VFile;
