/**
 * @本地widget预览和发布至外端机器
 */

'use strict';

var path = require('path');
var fs = require('fs');
var readline = require('readline');

//依赖lib
var $ = require('jdf-file').base;
var f = require('./file.js');
var jdf = require('./jdf.js');
var Server = require('./server.js');
var Openurl = require("./openurl.js");
var FindPort = require('./findPort');
var Node_watch = require('node-watch');
//exports
var widget = module.exports;
const glob = require('glob');
/**
 * @widget path check
 */
widget.pathCheck = function(name) {
    if (typeof(name) == 'undefined') return true;

    /*
    if ( !/^widget\//.test(name) ) {
    	console.log('jdf error widget name format error');
    	return true;
    }*/

    if (!f.exists('widget/' + name)) {
        console.log('jdf error widget path is not exists');
        return true;
    }

    return false;
}

/**
 * @本地预览页面templete
 * @todo: 放在server上控制
 */
widget.templete = function(str, title) {
    if (typeof(str) == 'undefined' || !str) {
        var str = '';
    }

    var css = '';
    jdf.config.widget.css.forEach(function(item) {
        css += '<link rel="stylesheet" type="text/css" href="' + item + '" media="all" />\r\n';
    })

    var js = '';
    jdf.config.widget.js.forEach(function(item) {
        js += '<script type="text/javascript" src="' + item + '"></script>\r\n';
    })

    return '<!DOCTYPE html>' + '\r\n' +
        '<html>' + '\r\n' +
        '<head>' + '\r\n' +
        '<meta charset="utf-8" />' + '\r\n' +
        '<title>' + title + '</title>' + '\r\n' + css + js +
        '</head>' + '\r\n' +
        '<body>' + '\r\n' + str + '\r\n' +
        '</body>' + '\r\n' +
        '</html>';
}

/**
 * @path has "widget" 
 */
widget.hasWidget = function(path) {
    var reg = new RegExp(jdf.config.widgetDir, 'gm');
    return reg.test(path);
}

/**
 * @预览所有widget
 * @example  jdf widget -all
 * @本地所有的widget中tpl,css,js拼装后html文件放在html中
 */
widget.all = function() {
    jdf.bgMkdir();

    var htmlDir = jdf.config.htmlDir;
    f.mkdir(htmlDir);

    var target = htmlDir + '/allwidget.html';

    var widgetDir = f.currentDir() + '/' + jdf.config.widgetDir;
    if (!f.exists(widgetDir)) {
        console.log('jdf error widget not exists');
        return;
    }

    var core = function() {
        var widgetListHtml = '';
        fs.readdirSync(widgetDir).forEach(function(item) {
            if (f.excludeFiles(item)) {
                widgetListHtml += '{%widget name="' + item + '"%}\r\n';
            }
        });

        var result = widget.templete('\r\n' + widgetListHtml, jdf.getProjectPath() + ' - all widget preview');
        f.write(target, result);
    }

    core();
    jdf.build({open: true}, function() {
        // todo watch
        //core();
        Openurl.open('http://localhost:' + jdf.config.localServerPort + '/' + target);
        console.log('jdf open you broswer to see it');
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

    var target = 'widget/' + name;
    var widgetname = name;

    var core = function() {
        var result = widget.templete(null, widgetname);
        fs.readdirSync(target).forEach(function(item) {
            if (item && f.excludeFiles(item)) {
                var itemContent = f.read(target + '/' + item);

                if ($.is.tpl(item) || $.is.vm(item)) {
                    hasTpl = true;
                    itemContent = itemContent;
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

        var indexUrl = target + '/' + widgetname + '.html';
        f.write(indexUrl, result);
    }

    core();

    var localServerPort = jdf.config.localServerPort;
    FindPort(localServerPort, function(data) {
        if (!data) {
            console.log('Port ' + localServerPort + ' is tack up');
            localServerPort += 1000;
            jdf.config.localServerPort = localServerPort;
        }

        Server.init(target + '/', jdf.config.localServerPort);
        Openurl.open('http://localhost:' + jdf.config.localServerPort + '/' + widgetname + '.html');
        console.log('jdf open you broswer to see it');

        //监听
        Node_watch(target, function(widgetname) {
            core();
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
        const target = path.resolve(process.cwd(), 'widget', widgetName);
        return ftp.list($.pathJoin(jdf.config.widgetServerDir, 'widget', widgetName))
            .then(data => {
                var version = '';
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
                const source = $.pathJoin(jdf.config.widgetServerDir, 'widget', widgetName, version);
                const target = path.resolve(process.cwd(), 'widget', widgetName);
                return ftp.list(source)
                    .then(files => {
                        f.mkdir(target);
                        return files.filter(item => item.type == 'file')
                            .reduce((p, n) => {
                                var sourcePut = $.pathJoin(source, n.name);
                                var targetPut = path.join(target, n.name);
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
            for(item in data.dependencies) {
                chain = chain.then(function(){return downloadWidget(item);})
            }
        });
        return chain;
    }

    downloadWidget(name)
        .then(function(v) {
            ftp.client.end();
            console.log(`jdf widget [${v}] install done`);
        })
        .catch(error => {
            ftp.client.end();
            console.log(`jdf error: ${error.message}`);
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
                    console.log(`jdf widget [${name}/${cVersion}] publish done`);
                })
                .catch(error => {
                    console.log(`jdf error: ${error.message}`);
                });
        }
    });
}

/**
 * @取得所有widget的列表
 * @time 2014-6-23 11:04:00
 */
widget.list = function() {
    const publishDir = jdf.config.widgetServerDir + '/widget';
    const ftp = createFtp();

    ftp.list(publishDir)
        .then(data => {
            if (data) {
                ftp.client.end();
                console.log('jdf widget list: ');
                console.log('----------------');
                data.forEach(function(item) {
                    console.log(item.name);
                })
            }
        })
        .catch(error => {
            console.log(`jdf error: ${error.message}`);
        })
}

/**
 * @widget自动生成目录
 * @time 2014-6-23 11:04:00
 */
widget.create = function(name) {
    var widgetDir = 'widget/' + name;
    if (f.exists(widgetDir)) {
        console.log('jdf warnning : widget [' + name + '] is exists');
        return;
    }

    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("jdf tips: if you create it, input 'y', else input 'n'");

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
            if (item == 'y') {
                createFileObj[name + '.' + questions[index]] = ''
            }
        });

        f.mkdir(widgetDir);
        for(var p in createFileObj) {
            f.write(widgetDir + '/' + p, createFileObj[p]);
        }
        console.log('jdf widget [' + name + '] create done');
        process.exit(0);
    }

    next(questions[start]);
}

function createFtp(root) {
    return require('jdf-upload/src/baseUploader.js').create('ftp', {
        host: jdf.config.host || jdf.config.upload.host,
        user: jdf.config.user || jdf.config.upload.user,
        password: jdf.config.password || jdf.config.upload.password,
    });
}
