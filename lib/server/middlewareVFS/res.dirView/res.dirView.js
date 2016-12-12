'use strict';
const fs = require('fs');
const path = require('path');
const f = require('jdf-utils').file;
const logger = require('jdf-log');

const fileType = require('../../../VFS/fileType');
const env = require('../envConfig');
const fileRes = require('../res.file');
const dirHTML = require('./dir.html');

const view = module.exports = {};

let ignoreDir;
let allowExtname;

view.genHTML = function (projAbsDir) {
    // 扫描文件夹时只显示限定的文件和目录
    !ignoreDir && (ignoreDir = fileType.ignore.dir.join(','));
    !allowExtname && (allowExtname = fileType.getPCExtname().join(','));

    let data = {
        title: '',
        projectName: '',
        pathname: '',
        files: [],
        dirs: []
    };

    data.title = '文件夹';
    data.projectName = 'jdfDev';
    data.pathname = path.relative(env.webRoot, projAbsDir);
    data.pathname = data.pathname.replace(new RegExp(`\\${path.sep}`, 'g'), '/');

    // 返回上一级目录
    data.dirs.push({pathname: path.dirname(data.pathname), name: '..'});

    fs.readdirSync(projAbsDir).forEach(name => {
        let absPath = path.join(projAbsDir, name);
        let pathname = path.relative(env.webRoot, absPath);

        // D:\\NodeApp\\jdfDev\\widget\\ -> (localhost:8080)/jdfDev/widget，用于浏览器地址栏，手动统一转为正斜杠
        pathname = pathname.replace(new RegExp(`\\${path.sep}`, 'g'), '/');
        logger.debug(`file or dir relative path: ${pathname}`);

        // 过滤config.json
        if (pathname === 'config.json') {
            return;
        }

        // TODO 和VFS文件过滤统一
        // 过滤忽略目录
        if (f.isDir(absPath)) {
            let reg = new RegExp(`^${name}$|\\W${name}$|^${name}\\W|\\W${name}\\W`, 'i');
            if (reg.test(ignoreDir)) {
                return;
            }

            data.dirs.push({pathname: pathname, name: name});
        } else if (f.isFile(absPath)) {
            let extname = path.extname(absPath).slice(1);
            let reg = new RegExp(`^${extname}$|\\W${extname}$|^${extname}\\W|\\W${extname}\\W`, 'i');

            // 过滤不符合的后缀
            if (!reg.test(allowExtname)) {
                return;
            }

            // 生成编译后文件路径
            let tExtname = fileRes.hasDiffTargetExtname(absPath);
            if (tExtname) {
                let oExtname = path.extname(absPath).slice(1);
                let reg = new RegExp(oExtname + '$', 'i');
                pathname =  pathname.replace(reg, tExtname);
                name = name.replace(reg, tExtname);
                data.files.push({pathname: pathname, name: name});
            } else {
                data.files.push({pathname: pathname, name: name});
            }
        }
    });

    let html = dirHTML.html(data);
    return html;
}
