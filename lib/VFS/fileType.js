'use strict';
const path = require('path');

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
    font: ['ttf', 'eot', 'woff'],
    img: ['jpg', 'png', 'gif', 'jpeg', 'ico', 'swf', 'webp', 'svg'],
    doc: ['txt', 'md', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'],
    zip: ['zip', 'rar', 'tar', 'war']
};

// 读取直接忽略的文件
fileType.ignore = {
    dir: ['test', '..', '.git', '.svn', 'node_modules', 'Thumbs', 'DS_Store', '.db', 'bower_components'],
    file: ['.*', 'config.json', 'package.json'],
    glob: [],
    extname: ['dll', 'ini', 'sys', 'exe']
}

// 读取的时候需要读取，但不需要输出的文件
fileType.outputIgnore = {
    extname: fileType.extname.vm.concat([])
}

// ------------------extname--------------

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
            .concat(this.extname.img)
            .concat(this.extname.font);
    }
    return this._PCExtname;
}

fileType.isPCExtname = function (filename) {
    let extnames = fileType.getPCExtname().join(',');
    let extname = path.extname(filename).slice(1);
    let reg = new RegExp(`^${extname}$|\\W${extname}$|^${extname}\\W|\\W${extname}\\W`, 'i');
    // 不符合的后缀过滤掉
    if (!reg.test(extnames)) {
        return false;
    }
    return true;
};

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

// ------------------ignore--------------

fileType.getIgnore = function () {
    let patterns = this.ignore.glob
        .concat(this.ignore.file)
        .concat(this.ignore.dir.map(item => {
            return item + '/**';
        }))
        .concat(this.ignore.extname.map(item => {
            return '**/*.' + item;
        }));
    return patterns;
}

fileType.addIgnore = function (dirname, type) {
    if (type === 'glob') {
        this.ignore.glob = this.ignore.glob.concat(dirname);
    } else if (type === 'dir') {
        this.ignore.dir = this.ignore.dir.concat(dirname);
    } else if (type === 'file') {
        this.ignore.file = this.ignore.file.concat(dirname);
    }
}

fileType.getOutputIgnore = function () {
    // 需要的时候再扩展
    return fileType.outputIgnore.extname;
}

module.exports = fileType;
