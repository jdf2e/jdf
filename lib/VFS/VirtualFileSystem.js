'use strict';
const path = require('path');
const glob = require('glob');
const fse = require('fs-extra');

const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
logger.level('debug');

const VFile = require('./VirtualFile');

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
        if (!!originDir) {
            this.originDir = path.normalize(originDir);
        }

        return new Promise((resolve, reject) => {
            let patterns = this.getFilePatterns();
            let options =  {
                cwd: this.originDir,
                ignore: this.getIgnoreGlob(),
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
                this.fileList = [];
                files.forEach(file => {
                    let fullpath = path.normalize(this.originDir + '/' + file);
                    this.fileList.push(new VFile(fullpath, ''));
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
            logger.error(`add file failed, file already exists: ${filepath}`);
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
            logger.warn(`delete file -- not found：${filepath}`);
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
            logger.warn(`query file -- not found：${filepath}`);
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
            file.targetPath = file.targetPath.replace(this.originDir, this.targetDir);
            done.push(this.writeFile(file.targetPath, file.targetContent))
        });

        return Promise.all(done);
    }

    // 仅创建一个Promise让文件处理流程有个开头
    go() {
        return Promise.resolve();
    }

    /**
     * travel方法的回调是某个流程的定义
     * 这个流程要完成以下的事：
     *     1、不需要的vfile直接return;
     *     2、判定originContent是否存在，不存在则调用vfile.fetch()
     *     3、对vfile执行自定义的流程
     *     4(可选)：更新targetPath, targetContent
     * @param  {function} handler
     *         自定义处理流程，handler(vfile, done)
     *         如果流程是同步的，则不需要调用done.push方法
     *         done接收对象约束参见Node v4.4 Promise.all() API
     * @return {Promise}         自定义流程走完Promise
     */
    travel(handler) {
        let done = [];
        this.fileList.forEach(vfile => {
            handler.call(null, vfile, done);
        });
        return Promise.all(done);
    }
}

module.exports = VFS.instance();
