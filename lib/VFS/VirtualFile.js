'use strict';
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');

/**
 *  文件描述格式
 *  originPath和targetPath均为绝对路径(absolute path)
 *  originPath是从硬盘中文件的路径
 *  targetPath是编译后生成的路径，位置和originPath处于同一文件夹下，后缀按需更改
 *  originContent是文件内容，作为留存不直接在这上面操作
 *  targetContent是处理后的文件内容，操作都是在targetContent上
 *  fetched 文件内容是否已从硬盘拉取，拉取过为true
 *  note：
 *      1、VFS在扫描文件路径的时候只会读取一些预定义的文件类型的内容，如果要处理这些预定义之外的，请先做一个vfile.fetch()操作。具体参见VirtualFileSystem.js。
 *      2、VFS不会主动对targetPath和targetContent赋值，如果需要处理target{Path,Content}，请在流程处理函数中事先判断是否存在
 *  示例：
 *  VFile {
 *      originPath: 'D:\\NodeApp\\jdfDev\\widget\\p2\\p2.scss',
 *      originContent: '#p2 {\r\n    a {\r\n        color: blue;\r\n    }\r\n}',
 *      targetPath: 'D:\\NodeApp\\jdfDev\\widget\\p2\\p2.css',
 *      targetContent: ''#p2 a {\n  color: blue;\n}\n',
 *      fetched: true
 *  }
 */

class VFile {
    constructor(oPath, oContent, tPath, tContent) {
        this._originPath = oPath;
        this._originContent = oContent;
        this._targetPath = tPath;
        this._targetContent = tContent;
        this._fetched = false;
    }

    get originPath() {
        return this._originPath;
    }

    set originPath(value) {
        this._originPath = value;
    }

    get originContent() {
        this.fetch();
        return this._originContent;
    }

    set originContent(value) {
        this._originContent = value;
    }

    get targetPath() {
        if (!this._targetPath) {
            this._targetPath = this._originPath;
        }
        return this._targetPath;
    }

    set targetPath(value) {
        this._targetPath = value;
    }

    get targetContent() {
        if (!this._targetContent) {
            this.fetch();
            this._targetContent = this._originContent;
        }
        return this._targetContent;
    }

    set targetContent(value) {
        this._targetContent = value;
    }

    // 如果没有读到内存，则执行一次读取操作
    // 无论成功失败，都只会读取一次
    fetch() {
        if (!this._fetched && !this._originContent) {
            this._originContent = f.read(this._originPath);
            this._fetched = true;
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
