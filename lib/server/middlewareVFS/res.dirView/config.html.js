const jdf = require('../../../jdf');
const configHtml = module.exports = {};

configHtml.html = function (filePath) {
    const userConfig = jdf.mergeConfig();
    var html = '';
    
    function parseConfig(userConfig){
        for(let config in userConfig){
            let value = userConfig[config];
            if(value && value.toString() == '[object Object]'){
                html += `<h3>${config}</h3>`;
                parseConfig(value);
            }else{
                html += `<p><label>${config}：</label><span>${value}</span></p>`;
            }
        }
        return html;
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
        <script type="text/javascript" src="//misc.360buyimg.com/jdf/lib/jquery-1.6.4.js"></script>
        <script type="text/javascript" src="//misc.360buyimg.com/jdf/1.0.0/unit/base/1.0.0/base.js"></script>
        <link rel="icon" href="//jdf.jd.com/favicon.ico" mce_href="//jdf.jd.com/favicon.ico" type="image/x-icon">
        <style>
        html, body{
            font-size: 14px;
            font-family: "Bitstream Vera Sans Mono", "DejaVu Sans Mono", Monaco, Consolas, monospace;
        }
        </style>
    </head>
    <body>
    <div class="wrap"></div>
    <script>
        $('.wrap').html('${parseConfig(userConfig)}');
    </script>
    </body>
    </html>
    `;
}