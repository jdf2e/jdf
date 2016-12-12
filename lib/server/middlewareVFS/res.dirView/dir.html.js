'use strict';
const css = require('./dir.css');

module.exports = {};

let dirHTML = module.exports = {};

dirHTML.DataExample = {
    title: 'directory',
    projectName: 'projectName',
    pathname: '',
    files: [{pathname: '', name: ''}],
    dirs: [{pathname: '', name: ''}]
}

dirHTML.html = function (data) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="keywords" content=""/>
<meta name="description" content="" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
<title>${data.title}</title>
<style>
${css}
</style>
</head>
<body>
<div class="header-wrap">
    <div class="page-header">
        <h1 class='header-text'>${data.projectName}</h1>
    </div>
</div>
<div class="page-content">
    <div class='dir-list-header'>
        <div class="row">
            <div class="col col-type">${data.pathname}/</div>
        </div>
    </div>
    <div class='dir-list'>
        <ul>
            ${dirHTML.genDirList(data.dirs)}
            ${dirHTML.genFileList(data.files)}
        </ul>
    </div>
</div>
</body>
</html>`;
}

dirHTML.genDirList = function (list) {
    if (!list) {
        return '';
    }

    list = list.sort((a, b) => {
        if (a.name > b.name) {
            return 1;
        }
        return -1;
    });

    let str = '';
    list.forEach(item => {
        str += `<li><a href="/${item.pathname}"><i class="icon iconfont i-dir">&#xe7a0;</i>${item.name}/</a></li>`;
    });
    return str;
}

dirHTML.genFileList = function (list) {
    if (!list) {
        return '';
    }

    list = list.sort((a, b) => {
        if (a.name > b.name) {
            return 1;
        }
        return -1;
    });

    let str = '';
    list.forEach(item => {
        str += `<li><a href="/${item.pathname}"><i class="icon iconfont">&#xe66f;</i>${item.name}</a></li>`;
    });
    return str;
}

