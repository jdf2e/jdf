'use strict';
const path = require('path');
const glob = require('glob');
const fse = require('fs-extra');
const escapeStringRegexp = require('escape-string-regexp');

const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');

const VFile = require('./VirtualFile');
const fileType = require('./fileType');

/**
 *  虚拟文件系统(VFS)
 *  VFS是硬盘文件在内存中的映射，用于将项目目录(config.json所在的目录)文件放入内存中操作，提高性能。
 *  VFS提供过滤机制，将不需要处理的目录，文件类型进行过滤，避免占用内存和处理时间
 *
 *  核心属性：
 *  {
 *      originDir: 'D:\\NodeApp\\jdfDev',
 *      targetDir: 'D:\\NodeApp\\jdfDev\\build',
 *      fileList: [VFile, VFile, VFile...],
 *  }
 *  核心方法：
 *  setOriginDir(): 设置VFS的读取根目录，为绝对路径(absolute path)
 *  setTargetDir(): 设置VFS的输出目录, 为绝对路径(absolute path)
 *  readFilesInOriginDir(dirname): 从this.originDir中读取文件，也可以自己设置读取文件的目录入口
 *  addFile(), queryFile(), deleteFile(), writeFile(): 基础增删查改写方法
 *  queryFileByType(type): 根据文件类型查询文件，返回[VFile, VFile...],默认根据originPath的文件后缀判断，也可以自己设置根据targetPath后缀
 *  queryDir(dirname): 根据目录查询文件，目录必须是VFS.originDir的子目录
 *  writeFiles(type): 其他批量操作文件的基础方法，批量将指定文件类型输出到目标目录
 *  go(): 返回一个resolved的Promise，用于异步处理流程的开头VFS.go().then() = Promise.resolve().then()
 *  travel(handler(vfile:VFile, done:Array)): 给处理函数一个遍历所有文件的接口，并提供Promise包装，只需将需要异步处理的Promise push到done数组中即可
 */
class VFS {
    constructor() {
        this.fileList = [];
        this.originDir = '';
        this.targetDir = '';
    }

    // 入口
    static instance() {
        return new VFS();
    }

    // 允许的文件类型, srcPath: Array
    getFilePatterns(srcPath) {
        let extnames = fileType.getPCExtname().join(',');
        let defaultPatterns = `**/*`;

        let patterns;
        let limitPath = [];
        if (srcPath && srcPath.length > 0) {
            srcPath.forEach((item, i) => {
                item = item.replace(/^\.?\//, '');

                // item = '.'|'./'|'/' then return
                if (!item || item === '.') {
                    return;
                }

                let absPath = path.join(this.originDir, item);
                if (f.isFile(absPath)) {
                    limitPath.push(item);
                } else if (f.isDir(absPath)) {
                    limitPath.push(f.pathFormat(path.join(item, '**')));
                } else {
                    logger.warn(`path ${srcPath[i]} not exist`);
                }
            });
        }

        if (limitPath.length === 0) {
            patterns = defaultPatterns;
        } else if (limitPath.length === 1) {
            patterns = limitPath[0];
        } else {
            patterns = `{${limitPath.join(',')}}`;
        }

        return patterns;
    }

    addIgnore(dirname, type) {
        fileType.addIgnore(dirname, type);
    }

    // 仅接受绝对路径
    setOriginDir(originDir) {
        this.originDir = path.normalize(originDir);
    }

    // 仅接受绝对路径
    setTargetDir(targetDir) {
        if (!path.relative(this.originDir, targetDir)) {
            logger.error('set targetDir equal originDir');
            return;
        }
        this.targetDir = path.normalize(targetDir);
    }

    // 从工程目录读取符合pattern,ignore的文件到VFS中
    // srcPath为相对于工程目录的
    // 废弃的方法
    readFilesInOriginDir(srcPath) {
        let patterns = this.getFilePatterns(srcPath);
        return new Promise((resolve, reject) => {
            let options =  {
                cwd: this.originDir,
                ignore: fileType.getIgnore(),
                dot: true,
                nocase: true,
                nodir: true
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

                this.fileList = [];
                files.forEach(file => {
                    let fullpath = path.normalize(this.originDir + '/' + file);
                    let vfile = new VFile(fullpath, '', this.genTargetPath(fullpath), '');
                    if (vfile.isTextFile()) {
                        vfile.fetch();
                    }
                    this.fileList.push(vfile);
                });
                resolve();
            });
        });
    }

    // 从工程目录读取符合pattern,ignore的文件到VFS中
    // srcPath为相对于工程目录的
    readFilesInOriginDirSync(srcPath) {
        let patterns = this.getFilePatterns(srcPath);
        let options =  {
            cwd: this.originDir,
            ignore: fileType.getIgnore(),
            dot: true,
            nocase: true,
            nodir: true
        };
        let files = glob.sync(patterns, options);
        if (files.length === 0) {
            logger.warn(`no file matched.`);
            return;
        }

        this.fileList = [];
        let extnames = fileType.getPCExtname().join(',');
        files.forEach(file => {
            let extname = path.extname(file).slice(1);
            let reg = new RegExp(`^${extname}$|\\W${extname}$|^${extname}\\W|\\W${extname}\\W`, 'i');
            // 不符合的后缀过滤掉
            if (!reg.test(extnames)) {
                return;
            }

            let fullpath = path.normalize(this.originDir + '/' + file);
            let vfile = new VFile(fullpath, '', this.genTargetPath(fullpath), '');
            if (vfile.isTextFile()) {
                vfile.fetch();
            }
            this.fileList.push(vfile);
        });
    }

    genTargetPath(oPath) {
        let extmap = {
            scss: 'css',
            less: 'css',
            babel: 'js'
        }

        let extname = path.extname(oPath).slice(1);
        // 更换targetPath的后缀
        if (extmap[extname]) {
            oPath = oPath.replace(new RegExp(extname + '$', 'i'), extmap[extname]);
        }

        return oPath.replace(this.originDir, this.targetDir);
    }

    createFile(filepath) {
        let vfile = new VFile(filepath);
        vfile.fetch();
        return vfile;
    }

    // 设定所有增加的文件都是写入编译目录
    addFile(filepath, content) {
        let notIn = this.fileList.every(vfile => {
            return filepath !== vfile.originPath;
        });

        if (notIn) {
            this.fileList.push(new VFile(filepath, content, this.genTargetPath(filepath), content));
        } else {
            logger.warn(`add file failed, file already exists: ${filepath}`);
        }
    }

    // 从VFS中删除文件
    deleteFile(filepath, whichPath) {
        if (whichPath !== 'target') {
            whichPath = 'originPath';
        } else {
            whichPath = 'targetPath';
        }

        if(!filepath) {
            return;
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
            this.fileList.splice(idx, 1);
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
            logger.verbose(`query file -- not found：${filepath}`);
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
        let type = fileType.getRelativeType('js');
        return this.queryFileByType(type, 'origin');
    }

    // 查询css相关文件
    queryCSSRelativeFile() {
        let type = fileType.getRelativeType('css');;
        return this.queryFileByType(type, 'origin');
    }

    // 查询html相关文件
    queryHTMLRelativeFile() {
        let type = fileType.getRelativeType('html');;
        return this.queryFileByType(type, 'origin');
    }

    // 查询img相关文件
    queryIMGRelativeFile() {
        let type = fileType.getRelativeType('img');
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

    // 根据目录查询文件，目录必须是originDir的子目录
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

        // 加path.sep是为了防止匹配a/b/c时匹配到a/b/cc
        let reg = new RegExp(escapeStringRegexp(dirname + path.sep));
        logger.verbose(`queryDir dir's RegExp: ${reg}`);
        this.fileList.forEach(vfile => {
            if (dirname && reg.test(vfile[whichPath])) {
                collection.push(vfile);
            }
        });
        return collection;
    }

    // 将文件拷贝到dest，类似mv src dest
    // 如果读取不到src文件，那么用reservedContent作为内容填充写入dest
    copyFile(src, dest, reservedContent) {
        return new Promise((resolve, reject) => {
            if (f.exists(src)) {
                fse.copy(src, dest, err => {
                    if (err) {
                        logger.error(err);
                        reject(err);
                    }
                    resolve();
                });
            } else {
                resolve(this.writeFile(dest, reservedContent));
            }

        });
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
    writeFiles(type) {
        logger.profile('write files');
        let done = [];
        this.fileList.forEach(vfile => {
            // 存在指定的type但扩展名不符合，不输出
            if (type && path.extname(vfile.targetPath) !== '.' + type) {
                return;
            }

            if (vfile.isOutputIgnored()) {
                return;
            }

            // 如果子线程里或者手动设置vfile已经written，那么就不再输出
            if (vfile.status !== VFile.status.WRITTEN) {
                if (vfile.isTextFile()) {
                    done.push(this.writeFile(vfile.targetPath, vfile.targetContent));
                } else {
                    done.push(this.copyFile(vfile.originPath, vfile.targetPath, vfile.targetContent));
                }

            }
        });

        return Promise.all(done).then(() => {
            logger.profile('write files');
        });
    }

    // 将文件转写到absPath中，输出的文件是this.originDir读到VFS里的所有文件
    // 如果不指定absPath, 就输出到this.targetDir中
    writeFilesToDir(absPath) {
        absPath = absPath || '';
        if (!path.relative(absPath, this.originDir)) {
            logger.error('write dir equal project dir, will cover project');
            process.exit();
            return;
        }

        logger.profile('write files');
        let done = [];
        this.fileList.forEach(vfile => {
            let tPath = path.isAbsolute(absPath)
                ? vfile.targetPath.replace(this.targetDir, absPath)
                : vfile.targetPath;
            let tContent = vfile.targetContent;

            if (vfile.isOutputIgnored()) {
                return;
            }

            // 如果输出目录不是targetDir，并且
            if (!(tPath === vfile.targetPath && vfile.status !== VFile.status.WRITTEN)) {
                if (vfile.isTextFile()) {
                    done.push(this.writeFile(tPath, vfile.targetContent));
                } else {
                    done.push(this.copyFile(vfile.originPath, tPath, vfile.targetContent));
                }

            }
        });

        return Promise.all(done).then(() => {
            logger.profile('write files');
        });
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
     *     2、对vfile执行自定义的流程
     *     3(可选)：按需求更新targetPath, targetContent
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
