'use strict';

let fileType = {};

// 允许读入VFS的文件类型
fileType.extname = {
    // 文本文件类型
    js: ['js', 'ts', 'babel', 'es6'],
    css: ['css', 'scss', 'less', 'sass'],
    html: ['html', 'htm', 'xhtml'],
    vm: ['vm', 'tpl', 'smarty', 'jade'],
    data: ['json', 'xml', 'map'],

    // 非文本文件类型
    img: ['jpg', 'png', 'gif', 'jpeg', 'ico', 'swf', 'webp', 'svg'],
    doc: ['txt', 'md', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'],
    zip: ['zip', 'rar', 'tar', 'war']
};

// 被VFS忽略的文件类型
fileType.ignoreExtname = {
    sys: ['dll', 'ini', 'sys', 'exe']
};

// 可以在内存中当文本文件操作的类型
fileType._textExtname = [];
fileType.getTextExtname = function () {
    if (this._textExtname.length === 0) {
        this._textExtname = this.extname.js
            .concat(this.extname.css)
            .concat(this.extname.html)
            .concat(this.extname.vm)
            .concat(this.extname.data);
    }
    return this._textExtname;
}

fileType._PCExtname = [];
fileType.getPCExtname = function () {
    if (this._PCExtname.length === 0) {
        this._PCExtname = this.getTextExtname()
            .concat(this.extname.img);
    }
    return this._PCExtname;
}

// 获取所有能被VFS读取的文件类型
fileType._allExtname = [];
fileType.getAllExtname = function () {
    if (this._allExtname.length === 0) {
        let textArr = [];
        for (let ext in this.extname) {
            textArr = textArr.concat(this.extname[ext]);
        }
        this._allExtname = textArr;
    }
    return this._allExtname;
}

fileType.getRelativeType = function (type) {
    if (!this.extname[type]) {
        return [];
    }
    return this.extname[type];
}

module.exports = fileType;
