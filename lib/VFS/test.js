'use strict';
const path = require('path');
const VFile = require('./VirtualFile');
const VFS = require('./VirtualFileSystem');
const fileType = require('./fileType');
const escapeStringRegexp = require('escape-string-regexp');
const f = require('jdf-utils').file;
const fs = require('fs');

let dir = 'D:\\NodeApp\\jdfDev\\widget';

let subdir;
subdir = [''];
subdir = ['.'];
subdir = ['./'];
subdir = ['./p1/', './p1/p1.js'];

VFS.setOriginDir(dir);
VFS.readFilesInOriginDir(subdir).then(() => {
    console.log(VFS);
});



// let writepath = 'C:\\Users\\liujia30\\AppData\\Local\\.jdf-temp\\project\\a\\5.png';
// let pngpath = 'D:\\NodeApp\\jdfDev\\css\\i\\5.png';
// let png5 = new VFile(pngpath);
// png5.fetch();
// let png5s = fs.readFileSync(pngpath);
// f.write(writepath, png5s);
//f.write(writepath, png5.targetContent);
//f.copy('D:\\NodeApp\\jdfDev\\css', 'D:\\NodeApp\\jdfDev\\build');



// const jdf = require('../jdf.js');

// let projpath = 'D:\\NodeApp\\jdfDev';
// let projname = path.basename(projpath);
// console.log(projname);

// console.log(jdf.getTransferDir('a'));
// console.log(!path.relative(projpath, projpath+'\\0'));


// let scssfilepath = 'D:\\NodeApp\\jdfDev\\widget\\browser-sync-watch\\browser-sync-watch.scss';
// let cssfilepath = 'D:\\NodeApp\\jdfDev\\build\\widget\\browser-sync-watch\\browser-sync-watch.css';
// console.log(path.relative(scssfilepath, cssfilepath));


// let odir = 'D:\\NodeApp\\jdfDev';
// let tdir = 'D:\\NodeApp\\jdfDev\\build';

// // console.log(fileType.getAllowExtname());
// console.log(fileType.getTextExtname());

// VFS.setOriginDir(odir);
// VFS.setTargetDir(tdir);
// VFS.readFilesInOriginDir().then(function(){
//     let imgfile = VFS.queryIMGRelativeFile();
//     // console.log(imgfile);
//     console.log(VFS.isTextFile(imgfile[0]));
//     let mdfile = VFS.queryFileByType('md');
//     //console.log(mdfile);
//     console.log(VFS.isTextFile(mdfile[0]));

// }).catch(err => {
//     logger.error(err);
// });



// let vfile1 = new VFile('ad', 'abc');
// let vfile2 = new VFile('ac', 'abcd');
// let vfile3 = new VFile('ab', 'abcde');
// let files = [vfile1, vfile2, vfile3];

// let nfile = files.filter(item => {
//     return item.originPath === 'ad';
// });
// nfile[0].originContent = 1;
// console.log(nfile[0]);
// console.log(files[0]);

// let ext = path.extname('d://www.jb51.net/article/58306.htm').slice(1);
// console.log(ext);

// let reg = new RegExp(escapeStringRegexp(ext) + '$');
// console.log(reg.test('adc.htm.html'));
// console.log(reg.test('adc.htm'));


// reg = new RegExp(`^ts$|\\Wts$|^ts\\W|\\Wts\\W`, 'i');
// console.log(reg);
// let str1 = 'js,es6,ts,babel';
// console.log(reg.test(str1));

// let oType = path.extname('.afb').slice(1);
// console.log(oType);

// let html = 'D:\\NodeApp\\jdfDev\\html\\p2.html';
// let re = path.relative(path.dirname(html),'D:\\NodeApp\\jdfDev\\widget\\p1\\p1.js');
// console.log(re);

// console.log(f.realpath('.'));
