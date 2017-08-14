'use strict';

const fs = require('fs');
const path = require('path');
const f = require('jdf-utils').file;
const VFS = require('../../VFS/VirtualFileSystem');
const fileType = require('../../VFS/fileType');
const logger = require('jdf-log');

const fileRes = module.exports = {};

fileRes.getFileContent = function (absPath) {
    if (!absPath) {
        return undefined;
    }

    logger.verbose(`file abs path: ${absPath}`);

    let vfile = this.getTargetVFile(absPath);

    if (!vfile) {
        if (fileType.isPCExtname(absPath)) {
            try {
                let content = fs.readFileSync(absPath);
                return content;
            } catch (e) {
                logger.verbose(`no file exists: ${absPath}`);
            }
        }
        return null;
    }

    return  vfile.targetContent;
}

// 在访问html文件的时候需要访问scss编译后的css文件
// middlewareVFS中间件直接从VFS读取这些编译后的文件
// 根目录 D:/NodeApp/jdfDev
// 请求 http://localhost/widget/wname/wname.css
// 则读取：D:/NodeApp/jdfDev/widget/wname/wname.css
// 实际上只存在 D:/NodeApp/jdfDev/widget/wname/wname.scss
// 根据以上信息获取到VFS中D:/NodeApp/jdfDev/widget/wname/wname.scss的targetContent
fileRes.getTargetVFile = function (filepath) {
    let originpath = filepath;

    filepath = path.normalize(filepath);
    filepath = path.relative(VFS.originDir, filepath);
    filepath = path.join(VFS.targetDir, filepath);

    let vfile = VFS.queryFile(filepath, 'target');

    if (vfile) {
        try {
            vfile.fetch();
        } catch (e) {
        }
        return vfile;
    }

    vfile = VFS.queryFile(originpath);
    if (vfile) {
        try {
            vfile.fetch();
        } catch (e) {
        }
        return vfile;
    }

    return null;
}

fileRes.hasDiffTargetExtname = function (filepath) {
    let vfile = VFS.queryFile(filepath);
    if (vfile && path.extname(vfile.originPath) !== path.extname(vfile.targetPath)) {
        return path.extname(vfile.targetPath).slice(1);
    }
    return false;
}
