
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
const buildWidget = require('./buildWidget');
const htmlAst = require('./htmlAst');

//exports
//const buildWidget = module.exports = {};

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
            // 前面经过buildWidget处理，这里使用originContent获取引用的widget
            // {
            //     name: mywidgetname,
            //     concatTag: {js: true, css:false} //根据type确定拼装文件
            // }
            // 只允许一个页面有一个widgetOutputName, 否则提出警告，并忽略后续的outputName标签
            let outputInfo = this.parseOutputName(vfile.targetContent);

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
                buildWidget.insertJS(vfile, jsVfile, jdf.config.build.jsPlace);
            }
            if (outputInfo.concatTag.css) {
                let cssVfile = VFS.queryFile(cssPath);
                buildWidget.insertCSS(vfile, cssVfile);
            }
        });
    })
    .then(() => {
        if (!globalOutputNameIsInvoked) {
            let jsPath = path.join(jdf.outputDir, jdf.config.jsDir, jdf.config.widgetOutputName + '.js');
            let cssPath = path.join(jdf.outputDir, jdf.config.cssDir, jdf.config.widgetOutputName + '.css');
            VFS.deleteFile(jsPath, 'target');
            VFS.deleteFile(cssPath, 'target');
        }

    });
}

bow.initGlobalOutputName = function () {
    // 编译全局的widgetOutputName
    let mode = jdf.config.widgetOutputMode;
    let widgetList = [],
        targetList = [];
    let widgetPath = path.join(jdf.currentDir, jdf.config.widgetDir);
    widgetList = fs.readdirSync(widgetPath);

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

bow.parseOutputName = function (html) {
    let info = {};

    let nameReg = /{%widgetOutputName=["|'](.*?)["|'].*?%}/;
    let typeReg = /{%widgetOutputName=["|'].*? type=["|'](.*?)["|'].*?%}/;
    let tagList = htmlAst.findWidgetOutputName(html);

    // 只允许一个widgetOutputName存在，忽略其他并提示
    let tag = '';
    if (tagList.length === 0) {
        return info;
    } else if (tagList.length > 1) {
        logger.warn(`more than one widgetOutputName, just parse the first one: ${tagList[0]}`);
    }
    tag = tagList[0];

    let result = nameReg.exec(tag);
    let name = result[1];

    info.name = name;
    info.text = tag.replace(/^[\r\t\n]*|[\r\t\n]*$/g, '');

    result = typeReg.exec(tag);
    let typeStr = result === null ? '' : result[1];
    let concatTag = {
        js: true,
        css: true
    };
    concatTag = checkbuildTag(typeStr, concatTag);
    info.concatTag = concatTag;

    return info;
}

bow.concatOutputContent = function (info, htmlVfile) {
    let widgetsInfo = buildWidget.parseWidget(htmlVfile.originContent);
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
        jsContent += widgetVfile.targetContent + ';' + os.EOL;
    }

    let cssContent = '';
    for (let name of cssSet.keys()) {
        let tPath = path.join(this.getWidgetTargetDirByName(name), name + '.css');
        let widgetVfile = VFS.queryFile(tPath, 'target');
        cssContent += widgetVfile.targetContent + os.EOL;
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
        VFS.addFile(jsPath, contents.js);
    }
    if (info.concatTag.css) {
        VFS.addFile(cssPath, contents.css);
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
            jsContent += jsVfile.targetContent + ';' + os.EOL;
        }
    }
    let outputJsPath = path.join(jdf.currentDir, jdf.config.jsDir, jdf.config.widgetOutputName + '.js');
    VFS.addFile(outputJsPath, jsContent);

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
            cssContent += cssVfile.targetContent + os.EOL;
        }
    }
    let outputCssPath = path.join(jdf.currentDir, jdf.config.cssDir, jdf.config.widgetOutputName + '.css');
    VFS.addFile(outputCssPath, cssContent);
}

/**
 * 从buildWidget中复制过来，功能一样，只是在logger上有一些变化
 * @param  {string} wgtType {%widgetOutputName="widget name" type="type1,type2" %} wgtType="type1,type2"
 * @param  {object} tagSet  默认允许引用类型的集合
 * @return {object}         处理后允许引用类型的集合
 */
function checkbuildTag(wgtType, tagSet) {
    var reg = /\s*,\s*/g,
        arr = [],
        str = wgtType,
        noSupportType = [],
        i, item, key;

    if (!wgtType) {
        return tagSet;
    }

    tagSet = tagSet || {};
    arr = str.replace(reg, ',').trim().split(',');

    for (key in tagSet) {
        tagSet[key] = false;
    }
    for (i = 0; i < arr.length; i++) {
        item = arr[i].toLowerCase();
        if (item !== '' && tagSet[item] !== undefined) {
            tagSet[item] = true;
        } else {
            noSupportType.push(arr[i]);
        }
    }
    if (noSupportType.length > 0) {
        logger.warn("widgetOutputName type["+ noSupportType.join(',') +'] not supported.');
    }

    return tagSet;
}



