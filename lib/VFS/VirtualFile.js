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

    fetch() {
        if (!this.fetched && !this.originContent) {
            this.originContent = f.read(this.originPath);
            this.fetched = true;
        }
    }
}

module.exports = VFile;
