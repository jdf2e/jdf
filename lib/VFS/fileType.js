'use strict';

let fileType = {};

// 允许读入VFS的文件类型
fileType.extname = {
    // 文本文件类型
    js: ['js', 'ts', 'babel', 'es6'],
    css: ['css', 'scss', 'less'],
    html: ['html', 'htm', 'xhtml'],
    vm: ['vm', 'tpl', 'smarty', 'jade', 'md'],
    data: ['json', 'xml', 'txt', 'map'],

    // 非文本文件类型
    img: ['jpg', 'png', 'gif', 'jpeg'],
    doc: ['doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'],
    zip: ['zip', 'rar', 'tar', 'war']
};

// 被VFS忽略的文件类型
fileType.ignoreExtname = {
    sys: ['dll', 'ini', 'sys', 'exe']
};

// 可以在内存中当文本文件操作的类型
fileType._textExtname = [];
fileType.getTextExtname = function () {
    if (this._allowExtname.length === 0) {
        this._textExtname = this.extname.js
            .concat(this.extname.css)
            .concat(this.extname.html)
            .concat(this.extname.vm)
            .concat(this.extname.data);
    }
    return this._textExtname;
}

fileType._allowExtname = [];
// 获取所有能被VFS读取的文件类型
fileType.getAllowExtname = function () {
    if (this._allowExtname.length === 0) {
        let textArr = [];
        for (let ext in this.extname) {
            textArr = textArr.concat(this.extname[ext]);
        }
        this._allowExtname = textArr;
    }
    return this._allowExtname;
}

fileType.getRelativeType = function (type) {
    if (!this.extname[type]) {
        return [];
    }
    return this.extname[type];
}




module.exports = fileType;
