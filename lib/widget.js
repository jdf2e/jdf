'use strict';
/**
 * @本地widget预览和发布至外端机器
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const request = require('request');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const ERP = require('node-erp');
const glob = require('glob');
const logger = require('jdf-log');
const jdf = require('./jdf');
const VFS = require('./VFS/VirtualFileSystem');
const openner = require("./server/openurl");
const bs = require('./server/browserSyncServer');
//exports
const widget = module.exports;
/**
 * @widget path check
 */
widget.pathCheck = function(name) {
    if (typeof name === 'undefined') {
        return true;
    }

    if (!f.exists(name)) {
        logger.error('widget path is not exists');
        return true;
    }

    return false;
}

/**
 * @本地预览页面templete
 * @todo: 放在server上控制
 */
widget.templete = function(str, title) {
    if (typeof str == 'undefined' || !str) {
        str = '';
    }

    let css = `<link rel="stylesheet" href="//misc.360buyimg.com/jdf/1.0.0/unit/ui-base/1.0.0/ui-base.css" />`;

    let js = `<script src="//misc.360buyimg.com/jdf/lib/jquery-1.6.4.js"></script>`;

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <link rel="icon" href="//jdf.jd.com/favicon.ico" mce_href="//jdf.jd.com/favicon.ico" type="image/x-icon">
        ${css}
        ${js}
    </head>
    <body>
    ${str}
    </body>
    </html>`;
}

/**
 * @本地预览widget
 * @example  jdf widget --preview widget/header
 */
widget.preview = function(name) {
    let previewPage = 'previewWidget.html';
    let widgets = [];
    if (name === true) {
        widgets = fs.readdirSync(path.resolve(VFS.originDir, jdf.config.widgetDir));
    }
    else {
        widgets = name.split(',');
    }

    let widgettpl = '';
    widgets.forEach(widgetName => {
        widgettpl += `
<h1 style="padding: 10px;">Widget: ${widgetName}</h1>
{%widget name="${widgetName}" %}`;
    });

    let previewContent = this.templete(widgettpl, 'Preview Widgets');
    let previewPath = path.resolve(VFS.originDir, jdf.config.htmlDir, previewPage);

    VFS.addFile(previewPath, previewContent);
    
    jdf.build({}, function (port) {
        openner.open(`http://localhost:${port}/${jdf.config.htmlDir}/${previewPage}`);
    });
}

/**
 * @下载widget到当前项目文件夹
 * @example  jdf widget -install widget/name
 * @time 2014-3-14 14:50:29
 */
widget.install = function(id) {
    if(id){
        request.get({url: `http://widget.jdf.jd.com/common/modules/${id}`}, (error, response) => {
            if(error){
                logger.error(error);
            }else{
                var body = JSON.parse(response.body);
                if(body.flag){
                    let htmlCode = body.data.html_code;
                    let jsCode = body.data.js_code;
                    let cssCode = body.data.css_code;
                    let dataJson = body.data.data_json;
                    let configJson = body.data.config_json;
                    let widgetName = body.data.title;
                    let widgetDir = path.resolve(`widget/${widgetName}`);

                    if(f.exists(widgetDir)){
                        logger.warn(`${widgetName} is exists`);
                    }else{
                        f.mkdir(widgetDir);
                        f.write(`${widgetDir}/${widgetName}.vm`, htmlCode);
                        f.write(`${widgetDir}/${widgetName}.sass`, cssCode);
                        f.write(`${widgetDir}/${widgetName}.js`, jsCode);
                        f.write(`${widgetDir}/${widgetName}.json`, dataJson);
                        f.write(`${widgetDir}/component.json`, configJson);
                        logger.info(`${widgetName} install success`);
                    }
                }
            }
        })
    }else{
        logger.error('please type a module id');
    }
}

/**
 * @发布widget至server
 * @time 2014-3-14 14:50:29
 * @example  jdf widget -publish name
 * @todo 增加name验证和版本控制
 */

widget.publish = function(name, force) {    
    if (widget.pathCheck(name)) {
        return;
    }

    ERP.login()
    .then(data => {
        logger.info(`${data.username} login success`);

        var username = data.username;
        var widgetName = name.replace('widget/', '');
        var filelist = f.getdirlist(name);
        var htmlCode = '';
        var cssCode = '';
        var jsCode = '';
        var dataJson = '';
        var configJson = '';
        var widgetCover = '';
    
        filelist.forEach(file => {
            if($.is.vm(file) || $.is.tpl(file) || $.is.smarty(file)){
                htmlCode = f.read(file);
            }
            else if($.is.less(file) || $.is.sass(file) || $.is.css(file)){
                cssCode = f.read(file);
            }
            else if($.is.js(file)){
                jsCode = f.read(file);
            }
            else if($.is.json(file) || file.includes('component.json')){
                configJson = f.read(file);
            }
            else if($.is.json(file) && file.startsWith(widgetName)){
                dataJson = f.read(file);
            }
            else if($.is.imageFile(file) && path.basename(file).startsWith(widgetName)){
                widgetCover = path.resolve(file);
            }
        });

        new Promise((resolve, reject) => {
            if(f.exists(widgetCover)){
                request.post({
                    url: 'https://uba.jd.com/api/fe/image-upload',
                    formData: {img: fs.createReadStream(widgetCover)},
                }, (error, res) => {
                    if(error){
                        logger.error(error);
                        resolve('');
                    }else{
                        resolve(JSON.parse(res.body)[0].msg);
                    }
                });
            }else{
                resolve('');
            }
        })
        .then(pic_url => {
            var params = {
                title: widgetName,
                erp: username,
                module_type: 1,
                html_code: htmlCode,
                css_code: cssCode,
                js_code: jsCode,
                data_json: dataJson,
                config_json: dataJson,
                pic_url: pic_url
            };
            
            return new Promise((resolve, reject) => {
                request.post({
                    url: 'http://widget.jdf.jd.com/common/modules/widgets',
                    form: params
                }, (error, res) => {
                    if(error){
                        logger.error(error);
                        reject();
                    }else{
                        var body = JSON.parse(res.body);
                        if(body.flag){
                            logger.info(`upload ${name} success`);
                            resolve();
                        }else{
                            logger.error(body.msg);
                            reject();
                        }
                    }
                })
            });
        })
        .catch(error => {
            logger.error(error);
        });
    })
    .catch(() => {
        logger.error('ERP login fail');
    })
}

/**
 * @取得所有widget的列表
 * @time 2014-6-23 11:04:00
 */
widget.list = function() {
    const child_process = require('child_process');
    const type = process.platform == 'darwin' ? 'open' : 'start';
    child_process.exec(`${type} http://widget.jdf.jd.com/`);
    logger.info('open widget repository');
}

/**
 * @widget自动生成目录
 * @time 2014-6-23 11:04:00
 */
widget.create = function(name, isSmarty) {
    const widgetDir = 'widget/' + name;
    if (f.exists(widgetDir)) {
        logger.warn(`widget [${name}] is exist`);
        return;
    }
    logger.info(`if you want to create it, type 'y', else 'n'`);

    process.stdout.isTTY = false;
    process.stderr.isTTY = false;

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    var start = 0;
    var answers = [];
    var questions = ['vm', 'js', 'scss', 'json'];
    if (isSmarty) {
        questions[0] = 'smarty';
    }

    function next(q) {
        if (start == questions.length) {
            rl.close();
            promptComplete(answers);
        }
        else {
            rl.question(q + ': (y)', function(answer) {
                if (answer === '') {
                    answer = 'y';
                }
                if (answer != 'y' && answer != 'n') {
                    console.log("answer choice 'y' or 'n'");
                    next(questions[start]);
                }
                else {
                    answers.push(answer);
                    next(questions[++start]);
                }
            });
        }
    }

    function promptComplete(ans) {
        //给compoent.json写入默认的内容
        var componentDefault = {name: name, version: '1.0.0', dependencies: {}};
        var createFileObj = {
            'component.json' : JSON.stringify(componentDefault, null, '\t')
        };
        ans.forEach(function(item, index) {
            if (item === 'y') {
                createFileObj[name + '.' + questions[index]] = ''
            }
        });

        f.mkdir(widgetDir);
        for(var p in createFileObj) {
            f.write(widgetDir + '/' + p, createFileObj[p]);
        }

        process.stdout.isTTY = true;
        process.stderr.isTTY = true;
        logger.info(`widget [${name}] create done`);
        process.exit(0);
    }

    next(questions[start]);
}

function createFtp() {
    return require('jdf-upload/src/baseUploader.js').create('ftp', {
        host: jdf.config.host || jdf.config.upload.host,
        user: jdf.config.user || jdf.config.upload.user,
        password: jdf.config.password || jdf.config.upload.password,
    });
}
