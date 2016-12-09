'use strict';
const fs = require('fs');
const path = require('path');
const f = require('jdf-utils').file;

const fileType = require('../../VFS/fileType');
const env = require('./envConfig');
const fileRes = require('./res.file');
const footer = require('./tpl.footer');

const view = module.exports = {};

let ignoreDir;
let allowExtname;

view.genHTML = function (projAbsDir) {
    !ignoreDir && (ignoreDir = fileType.ignore.dir.join(','));
    !allowExtname && (allowExtname = fileType.getPCExtname().join(','));

    let lis = '<li style="padding-bottom:5px;"><a href="../">../</a></li>';
    fs.readdirSync(projAbsDir).forEach(name => {
        let absPath = path.join(projAbsDir, name);
        let pathname = path.relative(env.webRoot, absPath);
        pathname = pathname.replace(new RegExp(`\\${path.sep}`, 'g'), '/');
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
            lis += `\n<li style="padding-bottom:0.2em;"><a href="/${encodeURI(pathname)}">${name}/</a></li>`;
        } else if (f.isFile(absPath)) {
            let extname = path.extname(absPath).slice(1);
            let reg = new RegExp(`^${extname}$|\\W${extname}$|^${extname}\\W|\\W${extname}\\W`, 'i');

            // 过滤不符合的后缀
            if (!reg.test(allowExtname)) {
                return;
            }

            lis += `\n<li style="padding-bottom:0.2em;"><a href="/${encodeURI(pathname)}">${name}</a></li>`;

            // 生成编译后文件路径
            let tExtname = fileRes.hasDiffTargetExtname(absPath);
            if (tExtname) {
                let oExtname = path.extname(absPath).slice(1);
                let reg = new RegExp(oExtname + '$', 'i');
                pathname =  pathname.replace(reg, tExtname);
                name = name.replace(reg, tExtname);
                lis += `\n<li style="padding-bottom:0.2em;"><a href="/${encodeURI(pathname)}">${name}</a></li>`;
            }
        }
    });

    let header = `<h1>Index of /${path.relative(env.webRoot, projAbsDir).replace(/\\/g, '/')}</h1>`;
    let ul = `<ul>${lis}</ul>`;
    let thx = footer.genTPL();
    let html =
`${header}
<hr/>
${ul}
<hr/>
${thx}`;
    return html;
}
