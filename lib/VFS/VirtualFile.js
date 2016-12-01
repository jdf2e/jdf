'use strict';
let fb = require('jdf-file');
let $ = fb.base;
let f = fb.file;

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
