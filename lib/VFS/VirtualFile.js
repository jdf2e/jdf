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
        let me = this;
        return new Promise((resolve, reject) => {
            if (!me.originContent) {
               me.originContent = f.read(me.originPath);
            }
            me.targetContent = me.originContent;
            me.targetPath = me.originPath;
            resolve();
        });
    }
}

module.exports = VFile;