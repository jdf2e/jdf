'use strict';
const path = require('path');
const glob = require('glob');
const fse = require('fs-extra');
const escapeStringRegexp = require('escape-string-regexp');

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
        this.ignore = ['..', '.git', '.svn', 'node_modules', 'Thumbs', 'DS_Store', '.db'];
        this.originDir = undefined;
        this.targetDir = undefined;

        this.jsRelativeType = ['js', 'ts', 'babel', 'es6'];
        this.cssRelativeType = ['css', 'scss', 'less'];
        this.htmlRelativeType = ['html', 'htm', 'xhtml'];
    }

    // 入口
    static instance() {
        return new VFS();
    }

    // 允许的文件类型
    getFilePatterns() {
        return ['*.{css,scss,less,js,es6,html,htm,vm,json,vue,ts}'];
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
                    let vfile = new VFile(fullpath, '', '', '');
                    if (isRelativeFile.call(this, vfile)) {
                        vfile.fetch();
                    }
                    this.fileList.push(vfile);
                });
                resolve();
            });

            // 判断默认读取到内存的文件，临时放这里，后续可单独抽取成一个方法
            function isRelativeFile(vfile) {
                let relType = 'json,js,ts,babel,es6,css,less,scss,sass,html,htm,xhtml,vm,tpl,smarty';
                let extname = path.extname(vfile.originPath).slice(1);
                // 这个match方法有bug
                if (extname && relType.match(extname)) {
                    return true;
                }
                return false;
            }
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

    // 根据路径查vfile
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

    // 根据originPath后缀名查询
    queryFileByOriginType(oType) {
        return this.queryFileByType(oType, 'origin');
    }

    // 根据targetPath后缀名查询
    queryFileByTargetType(tType) {
        return this.queryFileByType(tType, 'target');
    }

    // 查询js相关文件
    queryJSRelativeFile() {
        let type = this.jsRelativeType;
        return this.queryFileByType(type, 'origin');
    }

    // 查询css相关文件
    queryCSSRelativeFile() {
        let type = this.cssRelativeType;
        return this.queryFileByType(type, 'origin');
    }

    // 查询html相关文件
    queryHTMLRelativeFile() {
        let type = this.htmlRelativeType;
        return this.queryFileByType(type, 'origin');
    }

    // 根据指定的文件类型返回目标vfile集合
    // 如果没有指定whichPath，则等价于queryFileByOriginType方法
    queryFileByType(type, whichPath) {
        if (whichPath !== 'target') {
            whichPath = 'originPath';
        } else {
            whichPath = 'targetPath';
        }

        if (!type) {
            return [];
        }
        if ($.isArray(type)) {
            type = type.join(',');
        }

        let list = this.fileList.filter(vfile => {
            let extname = path.extname(vfile[whichPath]).slice(1);
            let reg = new RegExp(`^${extname}$|\\W${extname}$|^${extname}\\W|\\W${extname}\\W`, 'i');
            return reg.test(type);
        });

        return list;
    }

    queryDir(dirname, whichPath) {
        if (!dirname) {
            return [];
        }
        if (whichPath !== 'target') {
            whichPath = 'originPath';
        } else {
            whichPath = 'targetPath';
        }

        let collection = [];
        this.fileList.forEach(vfile => {
            let reg = new RegExp(escapeStringRegexp(dirname));
            if (dirname && reg.test(vfile[whichPath])) {
                collection.push(vfile);
            }
        });
        return collection;
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

    // 写VFS中的内容到输出目录
    // type: 如css, js, html等, type为空输出所有
    writeFilesByType(type) {
        return this.writeFiles(null, type, null);
    }

    writeFilesByDir(dirname) {
        return this.writeFiles(dirname);
    }

    // 根据指定的输出目录dirname，和输出类型type, 输出文件到tdirname中
    writeFiles(dirname, type, tdirname) {
        // 无dirname设置为originDir
        if (dirname === undefined || dirname === null) {
            dirname = this.originDir;
        }
        // 无type则意味着所有type
        if (type === undefined || type === null) {
            type = 'all';
        }
        // 无tdirname设置为targetDir
        if (tdirname === undefined || tdirname === null) {
            tdirname = this.targetDir;
        }

        let done = [];

        let dirReg = new RegExp(escapeStringRegexp(dirname));
        this.fileList.forEach(vfile => {
            if (!vfile.targetPath) {
                vfile.targetPath = vfile.originPath;
            }
            if (!vfile.targetContent) {
                vfile.targetContent = vfile.originContent;
            }

            // 存在指定的type但扩展名不符合，不输出
            if (type !== 'all' && path.extname(vfile.targetPath) !== '.' + type) {
                return;
            }
            // 不符合输出目录，不输出
            if (!dirReg.test(vfile.targetPath)) {
                return;
            }

            let tPath = vfile.targetPath.replace(dirname, tdirname);
            done.push(this.writeFile(tPath, vfile.targetContent));
        });

        return Promise.all(done);
    }

    // 仅创建一个Promise让文件处理流程有个开头
    go() {
        return Promise.resolve();
    }

    /**
     * travel方法提供一个批量处理各个文件的方式，并返回处理完所有文件后的promise
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
