const jdf = require('../../../jdf');
const configHtml = module.exports = {};

configHtml.html = function (filePath) {
    const userConfig = jdf.mergeConfig();
    const html = `
        <div class="row"><label data-balloon="服务器的域名或者ip" data-balloon-pos="right">host：</label><span><input value="${userConfig.host}"></span></div>
        <div class="row"><label data-balloon="上传时使用的ftp用户名" data-balloon-pos="right">user：</label><span><input value="${userConfig.user}"></span></div>
        <div class="row"><label data-balloon="上传时使用的ftp密码" data-balloon-pos="right">password：</label><span><input value="${userConfig.password}"></span></div>
        <h3>build配置</h3>
        <div class="row"><label data-balloon="是否开启sass编译" data-balloon-pos="right">sass：</label><span>${booleanSelect(userConfig.build.sass)}</span></div>
        <div class="row"><label data-balloon="是否开启less编译" data-balloon-pos="right">less：</label><span>${booleanSelect(userConfig.build.less)}</span></div>
        <h3>output配置</h3>
        <div class="row"><label data-balloon="css中图片url加cdn替换" data-balloon-pos="right">cssImagesUrlReplace：</label><span>${booleanSelect(userConfig.output.cssImagesUrlReplace)}</span></div>
        <div class="row"><label data-balloon="js文件的id和dependences是否添加cdn前缀" data-balloon-pos="right">jsUrlReplace：</label><span>${booleanSelect(userConfig.output.jsUrlReplace)}</span></div>
        <div class="row"><label data-balloon="对css进行combo" data-balloon-pos="right">cssCombo：</label><span>${booleanSelect(userConfig.output.cssCombo)}</span></div>
        <div class="row"><label data-balloon="对js进行combo" data-balloon-pos="right">jsCombo：</label><span>${booleanSelect(userConfig.output.jsCombo)}</span></div>
        <div class="row"><label data-balloon="是否开启压缩js文件" data-balloon-pos="right">compressJs：</label><span>${booleanSelect(userConfig.output.compressJs)}</span></div>
        <div class="row"><label data-balloon="是否开启压缩css文件" data-balloon-pos="right">compressCss：</label><span>${booleanSelect(userConfig.output.compressCss)}</span></div>
        <div class="row"><label data-balloon="是否开启css sprite功能" data-balloon-pos="right">cssSprite：</label><span>${booleanSelect(userConfig.output.cssSprite)}</span></div>
        <div class="row"><label data-balloon="是否对图片进行base64编码" data-balloon-pos="right">base64：</label><span>${booleanSelect(userConfig.output.base64)}</span></div>
        <div class="row"><label data-balloon="想要直接忽略的文件/文件夹，路径相对于当前项目根目录，以逗号分隔，例如："test,test.css"" data-balloon-pos="right">excludeFiles：</label><span>${arrayArea(userConfig.output.excludeFiles)}</span></div>
        <h3>babel配置</h3>
        <div class="row"><label data-balloon="babel presets，以逗号分隔" data-balloon-pos="right">presets：</label><span>${arrayArea(userConfig.babel.presets)}</span></div>
        <div class="row"><label data-balloon="babel plugins，以逗号分隔" data-balloon-pos="right">plugins：</label><span>${arrayArea(userConfig.babel.plugins)}</span></div>
        <h3>plugins配置</h3>
        <div class="row"><label data-balloon="jdfx插件，以逗号分隔" data-balloon-pos="right">plugins：</label><span>${arrayArea(userConfig.plugins)}</span></div>
    `;

    function booleanSelect(value){
        if(value){
            return `<select value="${value}"><option>${value}</option><option>${!value}</option></select>`
        }
    }
    
    function arrayArea(value){
        return `<textarea>${value}</textarea>`
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="keywords" content=""/>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
        <title>工程配置</title>
        <link href="https://cdn.bootcss.com/balloon-css/0.5.0/balloon.min.css" rel="stylesheet">
        <link rel="icon" href="//jdf.jd.com/favicon.ico" mce_href="//jdf.jd.com/favicon.ico" type="image/x-icon">
        <style>
        html *{
            font-size: 14px;
            font-family: "Bitstream Vera Sans Mono", "DejaVu Sans Mono", Monaco, Consolas, monospace;
            color: #333;
        }
        html, body{
            background: #26344e;
            margin: 0;   
        }
        input, textarea, select{
            width: 550px;
            padding: 6px 10px;
            border: 1px solid #ddd;
            color: #666;
        }
        select{
            width: 573px;
            height: 33px;
        }
        textarea{
            height: 70px;
        }
        h1{
            font-size: 20px;
            text-align: center;
            margin-top: 0;
            margin-bottom: 30px;
            background: #eee;
            padding: 1em 0;
        }
        .wrap{
            width: 800px;
            margin: 0 auto;
            background: #fff;
            overflow: hidden;
            box-shadow: 0 0 50px rgba(0,0,0,.5);
        }
        .wrap h3{
            background: #eee;
            padding: 10px;
        }
        .wrap .row{
            margin: 0 0 15px 1em;
        }
        .wrap .row label{
            display: inline-block;
            width: 180px;
            text-align: right;
            vertical-align: middle;
        }
        .wrap .row span{
            display: inline-block;
            vertical-align: middle;
        }
        </style>
    </head>
    <body>
    <div class="wrap">
        <h1>jdfx工程配置</h1>
        ${html}
    </div>
    </body>
    </html>
    `;
}