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
<script type="text/javascript" src="//misc.360buyimg.com/jdf/lib/jquery-1.6.4.js"></script>
<script type="text/javascript" src="//misc.360buyimg.com/jdf/1.0.0/unit/base/1.0.0/base.js"></script>
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
<div class="footer">
    Powered by <a href="#">前端开发部@JDC</a>
</div>
${dirHTML.qrcode}
</body>
</html>`;
}

dirHTML.qrcode = `<div class="qrcode-expand">
    <div class="deco-left"><div></div></div><div id="qrcode-btn" class="qrcode-btn">二维码</div><div class="deco-right"><div></div></div>
    <div class="qrcode-wrap">
        <span>手机访问本页面</span>
        <div id="qrcode"></div>
        <div class="tips">
            <p>顺利访问tips:</p>
            <p># 当前url不是localhost或127.0.0.1</p>
            <p># 手机电脑在同一网络</p>
            <p># 选择Access URLs: External网址</p>
            <p># build -o,自动打开的网址就是External网址</p>
            <p># weinre调试:3001/remote-debug</p>
        </div>
        <button class="up-btn">收起</button>
    </div>
</div>

<script type="text/javascript">
    var page = $('.page-content');
    if ((page.width() + 300) < $('body').width()) {
        $('.qrcode-wrap').show();
    }
    $('#qrcode-btn').click(function () {
        var codewrap = $('.qrcode-wrap');
        codewrap.toggle();
    });
    $('.up-btn').click(function () {
        $('.qrcode-wrap').hide();
    });
    seajs.use(['jdf/1.0.0/ui/qrcode/1.0.0/qrcode'], function () {
        $('#qrcode').html('').qrcode({
            text: window.location.href,
            width: 144,
            height: 144
        });
    });
</script>`;

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
        str += `<li><a href="/${encodeURI(item.pathname)}"><i class="icon iconfont i-dir">&#xe7a0;</i>${item.name}/</a></li>`;
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

