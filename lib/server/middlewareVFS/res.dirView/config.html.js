const jdf = require('../../../jdf');
const configHtml = module.exports = {};

configHtml.html = function (filePath) {
    const userConfig = jdf.mergeConfig();
    const html = `
        <div class="row">
            <label><span data-balloon="服务器的域名或者ip" data-balloon-pos="down">host：</span></label><span><input name="host" value="${userConfig.host}"></span>
        </div>
        <div class="row">
            <label><span data-balloon="上传时使用的ftp用户名" data-balloon-pos="down">user：</span></label><span><input name="user" value="${userConfig.user}"></span>
        </div>
        <div class="row">
            <label><span data-balloon="上传时使用的ftp密码" data-balloon-pos="down">password：</span></label><span><input name="password" value="${userConfig.password}"></span>
        </div>
        <h3>build配置</h3>
        <div class="row">
            <label><span data-balloon="是否开启sass编译" data-balloon-pos="down">sass：</span></label><span>${booleanSelect("build.sass", userConfig.build.sass)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="是否开启less编译" data-balloon-pos="down">less：</span></label><span>${booleanSelect("build.less", userConfig.build.less)}</span>
        </div>
        <h3>output配置</h3>
        <div class="row">
            <label><span data-balloon="css中图片url加cdn替换" data-balloon-pos="down">cssImagesUrlReplace：</span></label><span>${booleanSelect("output.cssImagesUrlReplace", userConfig.output.cssImagesUrlReplace)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="js文件的id和dependences是否添加cdn前缀" data-balloon-pos="down">jsUrlReplace：</span></label><span>${booleanSelect("output.jsUrlReplace", userConfig.output.jsUrlReplace)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="对css进行combo" data-balloon-pos="down">cssCombo：</span></label><span>${booleanSelect("output.cssCombo", userConfig.output.cssCombo)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="对js进行combo" data-balloon-pos="down">jsCombo：</span></label><span>${booleanSelect("output.jsCombo", userConfig.output.jsCombo)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="是否开启压缩js文件" data-balloon-pos="down">compressJs：</span></label><span>${booleanSelect("output.compressJs", userConfig.output.compressJs)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="是否开启压缩css文件" data-balloon-pos="down">compressCss：</span></label><span>${booleanSelect("output.compressCss", userConfig.output.compressCss)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="是否开启css sprite功能" data-balloon-pos="down">cssSprite：</span></label><span>${booleanSelect("output.cssSprite", userConfig.output.cssSprite)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="是否对图片进行base64编码" data-balloon-pos="down">base64：</span></label><span>${booleanSelect("output.base64", userConfig.output.base64)}</span>
        </div>
        <div class="row">
            <label><span data-balloon-length="medium" data-balloon="想要直接忽略的文件/文件夹，路径相对于当前项目根目录，以逗号分隔" data-balloon-pos="down">excludeFiles：</span></label><span>${arrayArea("output.excludeFiles", userConfig.output.excludeFiles)}</span>
        </div>
        <h3>babel配置</h3>
        <div class="row">
            <label><span data-balloon="babel presets，以逗号分隔" data-balloon-pos="down">presets：</span></label><span>${arrayArea("babel.presets", userConfig.babel.presets)}</span>
        </div>
        <div class="row">
            <label><span data-balloon="babel plugins，以逗号分隔" data-balloon-pos="down">plugins：</span></label><span>${arrayArea("babel.plugins", userConfig.babel.plugins)}</span>
        </div>
        <h3>plugins配置</h3>
        <div class="row">
            <label><span data-balloon="jdfx插件，以逗号分隔" data-balloon-pos="down">plugins：</span></label><span>${arrayArea("plugins", userConfig.plugins)}</span>
        </div>
    `;

    function booleanSelect(name, value){
        if(value){
            return `<select name="${name}" value="${value}"><option value=${value}>${value}</option><option value=${!value}>${!value}</option></select>`
        }
    }
    
    function arrayArea(name, value){
        return `<textarea name="${name}">${value}</textarea>`
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
        <script src="http://misc.360buyimg.com/jdf/lib/jquery-1.6.4.js"></script>
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
        .wrap .row label span{
            text-align: center;
        }
        .wrap .row span{
            display: inline-block;
            vertical-align: middle;
        }
        .msg-tip{
            position: fixed;
            top: -210px;
            right: 10px;
            width: 200px;
            height: 80px;
            line-height: 80px;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,.5);
            text-align: center;
            transition: top .5s ease-out;
        }
        .msg-tip-success{
            top: 10px;
            border-top: 5px solid green;
        }
        .msg-tip-fail{
            top: 10px;
            border-top: 5px solid red;
        }
        </style>
    </head>
    <body>
    <div class="wrap">
        <h1>jdfx工程配置</h1>
        ${html}
    </div>
    <div class="msg-tip"></div>
    <script>
    var wrap = document.querySelector('.wrap');
    var msgTip = document.querySelector('.msg-tip');
    wrap.addEventListener('change', function(event){
        var target = event.target;
        var name = target.name;
        var value  = target.value;
        $.ajax({
            url: '/saveJdfConfig',
            type: 'get',
            data: {
                [name]: value
            },
            success: function(data){
                if(data.success){
                    msgTip.innerHTML = '保存配置成功！';
                    msgTip.classList.add('msg-tip-success');
                    setTimeout(() => {
                        msgTip.classList.remove('msg-tip-success');
                    }, 2000);
                }
            },
            error: function(){
                msgTip.innerHTML = '保存配置失败！';
                msgTip.classList.add('msg-tip-fail');
                setTimeout(() => {
                    msgTip.classList.remove('msg-tip-fail');
                }, 2000);
            }
        })
    });
    </script>
    </body>
    </html>
    `;
}