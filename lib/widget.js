'use strict';
/**
 * @本地widget预览和发布至外端机器
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const base = require('jdf-file');
const $ = base.base;
const f = base.file;
const findPort = require('./findPort');
const glob = require('glob');
const logger = require('jdf-log');
const openner = require("./openurl.js");
const jdf = require('./jdf.js');
const bs = require('./browserSyncServer');
//exports
const widget = module.exports;
/**
 * @widget path check
 */
widget.pathCheck = function(name) {
    if (typeof name === 'undefined') {
        return true;
    }

    if (!f.exists('widget/' + name)) {
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

    let css = '';
    jdf.config.widget.css.forEach((item) => {
        css += `<link rel="stylesheet" type="text/css" href="${item}" media="all" />\n`;
    })

    let js = '';
    jdf.config.widget.js.forEach(function(item) {
        js += `<script type="text/javascript" src="${item}"></script>\n`;
    })

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${css}
        ${js}
    </head>
    <body>
    ${str}
    </body>
    </html>`;
}

/**
 * @预览所有widget
 * @example  jdf widget -all
 * @本地所有的widget中tpl,css,js拼装后html文件放在html中
 */
widget.all = function() {
    jdf.bgMkdir();

    const htmlDir = jdf.config.htmlDir;
    f.mkdir(htmlDir);

    const target = htmlDir + '/allwidget.html';

    const widgetDir = path.resolve(process.cwd(), jdf.config.widgetDir);
    if (!f.exists(widgetDir)) {
        logger.error(`widget doesn't exist`);
        return;
    }

    const core = () => {
        let widgetListHtml = '';
        fs.readdirSync(widgetDir).forEach(function(item) {
            if (f.excludeFiles(item)) {
                widgetListHtml += `{%widget name="${item}"%}\n`;
            }
        });

        const result = widget.templete(widgetListHtml, jdf.getProjectPath() + ' - all widgets preview');
        logger.debug('generate widget page content');
        f.write(target, result);
    }

    core();
    jdf.build({open : true}, () => {
        // todo watch
        //core();
        openner.open('http://localhost:' + jdf.config.localServerPort + '/' + target);
        logger.info('open your browser to see it');
    });
}

/**
 * @本地预览widget
 * @example  jdf widget -preview widget/header
 * @本地widget中tpl,css,js拼装后html文件放在当前widget中
 */
widget.preview = function(name) {
    jdf.bgMkdir();

    if (widget.pathCheck(name)) {
        return;
    }

    const target = path.join('widget', name);

    const core = () => {
        let result = widget.templete(null, name);
        fs.readdirSync(target).forEach((item) => {
            if (item && f.excludeFiles(item)) {
                const itemContent = f.read(path.join(target, item));

                if ($.is.tpl(item) || $.is.vm(item)) {
                    result = $.placeholder.insertBody(result, itemContent);
                }

                if ($.is.css(item)) {
                    result = $.placeholder.insertHead(result, $.placeholder.cssLink(item));
                }

                if ($.is.js(item)) {
                    result = $.placeholder.insertHead(result, $.placeholder.jsLink(item));
                }
            }
        });

        const indexUrl = path.join(target, `${name}.html`);
        f.write(indexUrl, result);
    }

    core();

    let serverConf = {};
        serverConf.autoOpenurl = false;
        serverConf.comboDebug = false;
        serverConf.jdfconfig = jdf.config;
        serverConf.serverDir = f.realpath(target);
        serverConf.currentDir = jdf.currentDir;

    bs.startup(serverConf, function (port) {
        openner.open(`http://localhost:${port}/${name}.html`);
        bs.watch(function (event, filename, reloadIt) {
            core();
            reloadIt();
        });
    });
}

/**
 * @下载widget到当前项目文件夹
 * @example  jdf widget -install widget/name
 * @time 2014-3-14 14:50:29
 */
widget.install = function(name, force) {
    force = force || false;
    const ftp = createFtp();

    function getWidgetVersion(widgetName) {
        logger.debug(`get widget version ${widgetName}`);
        const target = path.resolve(process.cwd(), 'widget', widgetName);
        return ftp.list($.pathJoin(jdf.config.widgetServerDir, 'widget', widgetName))
            .then(data => {
                let version = '';
                data.sort().forEach(item => version = item.name);

                if (!parseInt(version, 10)) {
                    version = '';
                }

                if (f.exists(target) && !force) {
                    const err =  new Error(`widget ${name} exists in current project`);
                    err.pin = 66997304;
                    throw err;
                } else {
                    return version;
                }
            })
            .catch(error => {
                if(error.hasOwnProperty('pin')) {
                    throw error;
                }
                else {
                    throw new Error(`widget ${name} doesn't exists on remote server`);
                }
            })
    }

    /**
     * 先遍历对应name下面文件夹，看是否有版本号
     * 有版本号，就下载最后一个版本号里面的文件，没有版本号的，就直接下载widgetName下面的所有文件
     * 如果发现这个widget还有依赖的其他widget，则都下载
     * todo 需要解决相同依赖的去冗余，现在会把所有依赖都下载，如果一个模块被依赖了多次，那么就会有多次下载
     * @param widgetName
     * @returns {*|Function|any|Promise.<TResult>|Promise}
     */
    function downloadWidget(widgetName) {
        return getWidgetVersion(widgetName)
            .then(version => {
                logger.debug(`download widget content ${widgetName}`);
                const source = $.pathJoin(jdf.config.widgetServerDir, 'widget', widgetName, version);
                const target = path.resolve(process.cwd(), 'widget', widgetName);
                return ftp.list(source)
                    .then(files => {
                        f.mkdir(target);
                        return files.filter(item => item.type === 'file')
                            .reduce((p, n) => {
                                const sourcePut = $.pathJoin(source, n.name);
                                const targetPut = path.join(target, n.name);
                                return p.then(() => {
                                    return ftp.get(sourcePut, targetPut);
                                })
                            }, Promise.resolve())
                            .then(function() {
                                return downDependencies(widgetName);
                            })
                            .then(function() {
                                return widgetName + '/' + version;
                            });
                    });
            });

    }

    /**
     * 当一个widget安装完毕后，查看是否有依赖，有的话就下载依赖
     * @param name
     * @returns {Promise.<T>}
     */
    function downDependencies(name) {
        const target = path.resolve(process.cwd(), 'widget', name);
        let chain = Promise.resolve();
        f.readJSON(path.resolve(target, 'component.json'), function(data) {
            logger.debug(`download widget dependencies ${name}, %j`, data.dependencies);
            for(let item in data.dependencies) {
                chain = chain.then(function(){return downloadWidget(item);})
            }
        });
        return chain;
    }
    downloadWidget(name)
        .then(function(v) {
            ftp.client.end();
            logger.info(`widget [${v}] install done`);
        })
        .catch(error => {
            ftp.client.end();
            logger.error(error);
        });
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

    const publishDir = $.pathJoin(jdf.config.widgetServerDir, 'widget');
    const widgetHomeDir = $.pathJoin('widget', name);
    const widgetConfig = $.pathJoin(widgetHomeDir, 'component.json');
    force = force || false;

    f.readJSON(widgetConfig, function(json) {
        if (json) {
            const cVersion = json.version;
            const ftp = createFtp();
            const vtarget = $.pathJoin(publishDir, name, cVersion);
            const files = glob.sync('**', {
                cwd: widgetHomeDir
            });
            // todo 实现force
            ftp.mkdir($.pathJoin(publishDir, name))
                .then(function() {
                    return ftp.mkdir(vtarget);
                })
                .then(function() {
                    return ftp
                        .connect()
                        .then(function() {
                            return files.reduce((p, n) => {
                                return p.then(function() {
                                    const source = path.resolve(widgetHomeDir, n);
                                    const target = $.pathJoin(vtarget, n);
                                    const stat = fs.statSync(source);
                                    if(stat.isFile()) {
                                        return ftp.put(source, target);
                                    }
                                    else {
                                        return ftp.mkdir(target);
                                    }
                                })
                            }, Promise.resolve())
                        })
                })
                .then(function() {
                    ftp.client.end();
                    logger.info(`widget [${name}/${cVersion}] publish done`);
                })
                .catch(error => {
                    logger.error(error);
                });
        }
    });
}

/**
 * @取得所有widget的列表
 * @time 2014-6-23 11:04:00
 */
widget.list = function() {
    const publishDir = $.pathJoin(jdf.config.widgetServerDir, 'widget');
    const ftp = createFtp();

    logger.profile('fetch remote widget');
    ftp.list(publishDir)
        .then(data => {
            if (data) {
                ftp.client.end();
                data.forEach(function(item) {
                    console.log(item.name);
                });

                if(data.length === 0) {
                    logger.info('there are no widgets in remote');
                }

                logger.profile('fetch remote widget');
            }
        })
        .catch(error => {
            logger.error(error);
            logger.profile('fetch remote widget');
        })
}

/**
 * @widget自动生成目录
 * @time 2014-6-23 11:04:00
 */
widget.create = function(name) {
    const widgetDir = 'widget/' + name;
    if (f.exists(widgetDir)) {
        logger.warn(`widget [${name}] is exist`);
        return;
    }
    console.log(`if you want to create it, type 'y', else 'n'`);

    process.stdout.isTTY = false;
    process.stderr.isTTY = false;

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    var start = 0;
    var answers = [];
    var questions = ['vm', 'js', 'scss', 'json'];

    function next(q) {
        if (start == questions.length) {
            rl.close();
            promptComplete(answers);
        }
        else {
            rl.question(q + ': ', function(answer) {
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
