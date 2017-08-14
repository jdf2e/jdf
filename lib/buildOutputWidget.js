
"use strict";

const path = require('path');
const os = require('os');
const fs = require('fs');
const logger = require('jdf-log');
const cheerio = require('cheerio');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require('./jdf');
const VFS = require('./VFS/VirtualFileSystem');
const widgetParser = require('./buildWidget');
const buildHTML = require('./buildHTML');
const jsAst = require('./jsAst');
const urlReplace = require('./urlReplace');

//exports
let bow = module.exports = {};

/**
 * 编译{%widgetOutputName="mywidgetname" type="css,js"%}
 * 把html中的所有引用widget的css，js合并到一个文件中
 * 实际工作就是把已经编译好的css，js拼装起来，组装成一个新的mywidgetname的vfile
 * 2017-01-17：新增在config.json中配置全局(跨页面级别)widgetOutputName
 */
bow.init = function () {
    let globalOutputNameIsInvoked = false;
    return VFS.go()
    .then(() => {
        return bow.initGlobalOutputName();
    })
    .then(() => {
        return VFS.travel((vfile, done) => {
            // 只操作html文件
            if (!$.is.html(vfile.originPath)) {
                return;
            }

            logger.verbose(`parse widgetOutputName:${vfile.originPath}`);

            // 读取解析{%widgetOutputName="mywidgetname" type=""%}
            // 前面经过buildHTML处理，这里使用originContent获取引用的widget
            // {
            //     name: mywidgetname,
            //     concatTag: {js: true, css:false} //根据type确定拼装文件
            // }
            // 只允许一个页面有一个widgetOutputName, 否则提出警告，并忽略后续的outputName标签
            let outputInfo = widgetParser.parseOutputName(vfile.targetContent);

            // 如果html页面中没有{%widgetOutputName %} 返回
            if (!outputInfo.name) {
                return;
            }

            // 如果不是引用全局的widgetOutputName，那么就生成页面级别的widgetOutputName
            if (outputInfo.name !== jdf.config.widgetOutputName) {
                // 获取页面widget引用的js和css
                let contents = this.concatOutputContent(outputInfo, vfile);

                // 添加资源到VFS, 在jdf o或者b的时候可以引用到
                this.addToVFS(outputInfo, contents);
            } else {
                globalOutputNameIsInvoked = true;
            }

            // 根据outputInfo将页面中引用的link或script标签删除
            // this.delSourceFromWidget(outputInfo);
            this.delWidgetTagInHTML(outputInfo, vfile);

            // 仅删除当前{%widgetOutputName %} 标签
            let jsPath = path.join(VFS.originDir, jdf.config.jsDir, outputInfo.name + '.js');
            let cssPath = path.join(VFS.originDir, jdf.config.cssDir, outputInfo.name + '.css');
            vfile.targetContent = vfile.targetContent.replace(outputInfo.text, '');
            if (outputInfo.concatTag.js) {
                let jsVfile = VFS.queryFile(jsPath);
                buildHTML.insertJS(vfile, jsVfile, jdf.config.build.jsPlace);
            }
            if (outputInfo.concatTag.css) {
                let cssVfile = VFS.queryFile(cssPath);
                buildHTML.insertCSS(vfile, cssVfile);
            }
        });
    })
    .then(() => {
        // 如果没有调用全局outputname， 那么就删除它，不输出
        if (!globalOutputNameIsInvoked) {
            let jsPath = path.join(jdf.outputDir, jdf.config.jsDir, jdf.config.widgetOutputName + '.js');
            let cssPath = path.join(jdf.outputDir, jdf.config.cssDir, jdf.config.widgetOutputName + '.css');
            VFS.deleteFile(jsPath, 'target');
            VFS.deleteFile(cssPath, 'target');
        }

    })
    .catch((err) => {
        logger.error(err.message);
    });
}

bow.initGlobalOutputName = function () {
    // 编译全局的widgetOutputName
    let mode = jdf.config.widgetOutputMode;
    let widgetList = [],
        targetList = [];
    let widgetPath = path.join(jdf.currentDir, jdf.config.widgetDir);

    try {
        widgetList = fs.readdirSync(widgetPath);
    } catch (e) {
        throw new Error('can\'t find widget dir in your jdf project, skip combine your widget js/css file.');
    }

    // 获取需要输出的widget集合
    if (mode === 1) {
        targetList = widgetList;
    } else if (mode === 2) {
        targetList = jdf.config.widgetWhiteList;
    } else if (mode === 3) {
        let blacklist = jdf.config.widgetBlackList;
        targetList = widgetList.filter(function (item) {
            return !blacklist.some(function (item1) {
                return item1 === item;
            });
        });
    }

    // 拼装所有widget 生成js css文件，并写入VFS
    this.genWidgetOutputNameJS(targetList);
    this.genWidgetOutputNameCSS(targetList);
}

bow.concatOutputContent = function (info, htmlVfile) {
    let widgetsInfo = widgetParser.parseWidget(htmlVfile.originContent);
    let jsSet = new Set();
    let cssSet = new Set();
    widgetsInfo.forEach(widget => {
        if (widget.buildTag.js) {
            jsSet.add(widget.name);
        }
        if (widget.buildTag.css) {
            cssSet.add(widget.name);
        }
    });

    let jsContent = '';
    for (let name of jsSet.keys()) {
        let tPath = path.join(this.getWidgetTargetDirByName(name), name + '.js');
        let widgetVfile = VFS.queryFile(tPath, 'target');
        if (widgetVfile) {
            let transferTargetContent = this.jsPathRelative(widgetVfile, path.resolve(process.cwd(), jdf.config.jsDir));
            jsContent += transferTargetContent + ';' + os.EOL;
        }
    }

    let cssContent = '';
    for (let name of cssSet.keys()) {
        let tPath = path.join(this.getWidgetTargetDirByName(name), name + '.css');
        let widgetVfile = VFS.queryFile(tPath, 'target');
        if (widgetVfile) {
            let transferTargetContent = this.cssPathRelative(widgetVfile, path.resolve(process.cwd(), jdf.config.cssDir));
            cssContent += transferTargetContent + os.EOL;
        }
    }

    return {
        css: cssContent,
        js: jsContent
    }
}

bow.getWidgetTargetDirByName = function (name) {
    let widgetDir = path.join(VFS.targetDir, jdf.config.widgetDir, name);
    return widgetDir;
}

bow.addToVFS = function (info, contents) {
    let jsPath = path.join(VFS.originDir, jdf.config.jsDir, info.name + '.js');
    let cssPath = path.join(VFS.originDir, jdf.config.cssDir, info.name + '.css');
    if (info.concatTag.js) {
        VFS.updateFile(jsPath, contents.js);
    }
    if (info.concatTag.css) {
        VFS.updateFile(cssPath, contents.css);
    }
}

bow.delWidgetTagInHTML = function (info, vfile) {
    let $$ = cheerio.load(vfile.targetContent, {
        decodeEntities: false
    });
    if (info.concatTag.js) {
        $$('script[source=widget]') && $$('script[source=widget]').remove();
    }
    if (info.concatTag.css) {
        $$('link[source=widget]') && $$('link[source=widget]').remove();
    }
    vfile.targetContent = $$.html();
}

bow.genWidgetOutputNameJS = function (widgetList) {
    let jsPathList = widgetList.map(widgetname => {
        return path.join(jdf.outputDir,
            jdf.config.widgetDir,
            widgetname,
            widgetname + '.js');
    });
    let jsContent = '';
    for (let i = 0; i < jsPathList.length; i++) {
        let jsVfile = VFS.queryFile(jsPathList[i], 'target');
        if (jsVfile) {
            let transferTargetContent = this.jsPathRelative(jsVfile, path.resolve(process.cwd(), jdf.config.jsDir));
            jsContent += transferTargetContent + ';' + os.EOL;
        }
    }
    let outputJsPath = path.join(jdf.currentDir, jdf.config.jsDir, jdf.config.widgetOutputName + '.js');
    VFS.updateFile(outputJsPath, jsContent);

}

bow.genWidgetOutputNameCSS = function (widgetList) {
    let cssPathList = widgetList.map(function (widgetname) {
        return path.join(jdf.outputDir,
            jdf.config.widgetDir,
            widgetname,
            widgetname + '.css');
    });
    let cssContent = '';
    for (let i = 0; i < cssPathList.length; i++) {
        let cssVfile = VFS.queryFile(cssPathList[i], 'target');
        if (cssVfile) {
            let transferTargetContent = this.cssPathRelative(cssVfile, path.resolve(process.cwd(), jdf.config.cssDir));
            cssContent += transferTargetContent + os.EOL;
        }
    }
    let outputCssPath = path.join(jdf.currentDir, jdf.config.cssDir, jdf.config.widgetOutputName + '.css');
    VFS.updateFile(outputCssPath, cssContent);
}

bow.jsPathRelative = function (vfile, targetDir) {
    var content = vfile.targetContent;
    return jsAst.main(content, function(nodeObj) {
        var str = nodeObj.str,
            fullpathstr;

        /**
         * 以下情况不处理
         * 1、http路径；2、jdf,felibs开头；3、绝对路径
         */
        if(!str ||
            $.is.httpLink(str) ||
            /^jdf\//.test(str) ||
            /^felibs\//.test(str) ||
            path.isAbsolute(str)){
            return nodeObj;
        }

        fullpathstr = path.resolve(path.dirname(vfile.originPath), nodeObj.str);

        str = path.relative(targetDir, fullpathstr);

        str = f.pathFormat(str);

        nodeObj.str = str;

        return nodeObj;
    });
}

bow.cssPathRelative = function (vfile, targetDir) {
    var content = vfile.targetContent;
    return urlReplace.cssImagesUrlReplace(content, function (url) {
        var str = url,
            fullpathstr;
        /**
         * 以下情况不处理
         * 1、http路径；2、jdf,felibs开头；3、绝对路径
         */
        if($.is.httpLink(str) ||
            /^jdf\//.test(str) ||
            /^felibs\//.test(str) ||
            path.isAbsolute(str)){
            return url;
        }

        fullpathstr = path.resolve(path.dirname(vfile.originPath), str);

        str = path.relative(targetDir, fullpathstr);
        str = f.pathFormat(str);
        return str;
    });
}
