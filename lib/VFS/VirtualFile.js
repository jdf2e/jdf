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

    handleSelf() {
        return new Promise((resolve, reject) => {
            if (!this.originContent) {
               this.originContent = f.read(this.originPath);
            }
            this.targetContent = this.originContent;
            this.targetPath = this.originPath;
            resolve();
        });
    }
}

module.exports = VFile;
