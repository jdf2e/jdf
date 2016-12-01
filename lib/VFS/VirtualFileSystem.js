'use strict';
let path = require('path');
let glob = require('glob');
let fse = require('fs-extra');

let fb = require('jdf-file');
let $ = fb.base;
let f = fb.file;
let logger = require('jdf-log');
logger.level('debug');

var VFile = require('./VirtualFile');

/**
 *  VFS
 */
class VFS {
    constructor() {
        this.fileList = [];
        this.ignore = ['..', '.git', '.svn', 'node_modules', 'Thumbs', 'DS_Store', '.db', 'test'];
        this.originDir = undefined;
        this.targetDir = undefined;
    }

    // 入口
    static instance() {
        return new VFS();
    }

    // 允许的文件类型
    getFilePatterns() {
        return ['*.{css,scss,less,js,es6}'];
    }

    // 忽略的文件夹
    getIgnoreGlob() {
        return this.ignore.map(item => {
            return item + '/**';
        });
    }

    // 增加忽略的文件目录
    addIgnoreDir(dir) {
        this.ignore = this.ignore.concat(dir);
    }

    // 仅接受绝对路径
    setOriginDir(originDir) {
        this.originDir = path.normalize(originDir);
    }

    // 仅接受绝对路径
    setTargetDir(targetDir) {
        this.targetDir = path.normalize(targetDir);
    }

    // 从源目录读取符合pattern,ignore的文件到VFS中
    // 仅保存源文件的绝对路径，不对它进行读取
    readFilesInOriginDir(originDir) {
        let me = this;

        if (!!originDir) {
            this.originDir = path.normalize(originDir);
        }

        return new Promise((resolve, reject) => {
            let patterns = me.getFilePatterns();
            let options =  {
                cwd: me.originDir,
                ignore: me.getIgnoreGlob(),
                dot: true,
                matchBase: true,
                nocase: true
            };
            glob(patterns, options, (err, files) => {
                if (err) {
                    logger.error(`search files error`);
                    logger.error(err);
                    reject(err);
                    return;
                }
                if (files.length === 0) {
                    logger.warn(`no file matched.`);
                    reject(`no file matched.`);
                    return;
                }
                // TODO 重复时覆盖
                me.fileList = [];
                files.forEach(file => {
                    let fullpath = path.normalize(me.originDir + '/' + file);
                    me.fileList.push(new VFile(fullpath, ''));
                });

                resolve();
            });
        });
    }

    // 设定所有增加的文件都是写入编译目录
    addFile(filepath, content) {
        let notIn = this.fileList.every(vfile => {
            return filepath !== vfile.originPath;
        });

        if (notIn) {
            this.fileList.push(new VFile(filepath, content));
        } else {
            logger.error(`增加文件失败，已存在该文件: ${filepath}`);
        }
    }

    // 从VFS中删除文件
    deleteFile(filepath, whichPath) {
        if (whichPath !== 'target') {
            whichPath = 'originPath';
        } else {
            whichPath = 'targetPath';
        }

        let idx;
        this.fileList.every((vfile, index) => {
            if (vfile[whichPath] === filepath) {
                idx = index;
                return false;
             }
            return true;
        });

        if (typeof idx === 'number') {
            this.fileList.splice(idx + 1, 1);
        } else {
            logger.warn(`没有可删除的文件：${filepath}`);
        }
    }

    queryFile(filepath, whichPath) {
        if (whichPath !== 'target') {
            whichPath = 'originPath';
        } else {
            whichPath = 'targetPath';
        }
        let idx;
        this.fileList.every((vfile, index) => {
            if (vfile[whichPath] === filepath) {
                idx = index;
                return false;
            }
            return true;
        });

        if (typeof idx === 'number') {
            return this.fileList[idx];
        } else {
            logger.warn(`没有找到文件：${filepath}`);
            return undefined;
        }
    }

    // 写内容到某绝对路径
    writeFile(targetPath, content) {
        return new Promise((resolve, reject) => {
            fse.outputFile(targetPath, content, (err, data) => {
                if (err) {
                    logger.error(`error occured when output file`);
                    reject(err);
                    return;
                }
                resolve(true);
            });

        });
    }

    // 写VFS中的内容到编译目录
    // type: css, js, html, type为空输出所有
    writeFilesToTargetDir(type) {
        let me = this;
        let done = [];

        this.fileList.forEach(file => {
            if (!!type && path.extname(file.targetPath) !== '.' + type) {
                return;
            }
            if (!file.targetPath) {
                file.targetPath = file.originPath;
            }
            if (!file.targetContent) {
                file.targetContent = file.originContent;
            }
            file.targetPath = file.targetPath.replace(me.originDir, me.targetDir);
            done.push(me.writeFile(file.targetPath, file.targetContent))
        });

        return Promise.all(done);
    }

    // 仅创建一个Promise让文件处理流程有个开头
    go() {
        return new Promise((resolve, reject) => {
            resolve();
        })
    }

    // VFS文件夹被某个流程处理了一下
    // handler(vfile, done)
    travel(handler) {
        let done = [];
        this.fileList.forEach(vfile => {
            handler.call(null, vfile, done);
        });
        return Promise.all(done);
    }
}

module.exports = VFS.instance();
