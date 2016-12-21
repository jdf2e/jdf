"use strict";

const path = require('path');
const os = require('os');
const fs = require('fs');
const jsmart = require('jsmart');
const logger = require('jdf-log');
const escapeStringRegexp = require('escape-string-regexp');
const stripJsonComments = require('strip-json-comments');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require('./jdf');
const Vm = require("./vm");
const VFS = require('./VFS/VirtualFileSystem');

//exports
//const buildWidget = module.exports = {};

let buildHTML = module.exports = {};

/**
 * 编译HTML
 * 在编译HTML之前，最好先编译完CSS以及JS，确保得到最正确的结果
 * @param  {VFS} VFS 内存虚拟文件系统
 * @return
 */
buildHTML.init = function () {
    buildHTML.VFS = VFS;
    logger.profile('parse widget');
    return VFS.go()
    .then(() => {
        return VFS.travel((vfile, done) => {
            // 只操作html文件
            if (!$.is.html(vfile.originPath)) {
                return;
            }

            logger.verbose(`reset vfile.targetContent to be vfile.originContent: ${vfile.originPath}`);
            // 由于要重新编译html，在这里重置targetContent
            vfile.targetContent = vfile.originContent;

            // widget处理，两条线，build和output
            // 目前只做build

            // 解析widget标签，得到widgetInfo对象
            // text: widget在html中的文本
            // buildTag: widget 中需要编译的类型
            // data: 从widgetName.json和widget标签里的data属性合并后的数据
            // comment: widget标签里的comment属性值
            // dirname: widget的绝对路径
            // {
            //     text: '{%widget name="widgetName" type="widgetType" %}',
            //     name: 'widgetName',
            //     buildTag: '{tpl: false, vm: true, smarty: false, js: false, css: false}',
            //     data: '{}',
            //     comment: '',
            //     dirname: 'widget的绝对路径'
            // }
            logger.verbose(`parse widget tag in html, generate widgetInfo object collection.`)
            let widgets = this.parseWidget(vfile.originContent);

            // 获取widget的路径，添加到widgetInfo对象中
            let originDir = VFS.originDir;
            let widgetInputName = jdf.config.widgetInputName;
            widgets = widgets.map(widget => {
                widget.dirname = path.join(originDir, jdf.config.widgetDir, widget.name);
                // 旧代码中的变量，具体用法是，当hasInputName=true时，取消后续对widget的操作
                if(widgetInputName.length > 0 && !$.inArray(widgetInputName, widgetName)){
                    widget.hasInputName = true;
                }
                return widget;
            });

            logger.verbose(`foreach widgetInfo`);
            // 编译单个widget到html中
            widgets.forEach(widgetInfo => {
                logger.verbose(`parse widget: ${widgetInfo.name}`);
                let widgetVfiles = VFS.queryDir(widgetInfo.dirname);
                widgetVfiles.forEach(widgetVfile => {
                    // 旧代码遗留判断
                    if (widgetInfo.hasInputName) {
                        return;
                    }

                    // 不处理widget中与widget规定不符的文件
                    // 匹配\\widget\\widgetName\\widgetName.ext
                    let oPath = widgetVfile.originPath;
                    let oBasename = path.basename(oPath);
                    let dirname = path.dirname(oPath);
                    let widgetNameReg = new RegExp(escapeStringRegexp(widgetInfo.name + '.'));
                    if (path.relative(dirname, widgetInfo.dirname)
                        || !widgetNameReg.test(oBasename)) {
                        // 1、相对路径不为空
                        // 2、文件名不和widget名一致
                        return;
                    }

                    let wPath = widgetVfile.targetPath;
                    // widgetInfo.buildTag反映type中指定的编译类型
                    if (widgetInfo.buildTag.vm && $.is.vm(wPath)) {
                        logger.verbose(`insert vm into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertVM(widgetInfo, vfile, widgetVfile);
                    } else if (widgetInfo.buildTag.tpl && $.is.tpl(wPath)) {
                        // 旧代码vm和tpl等价
                        logger.verbose(`insert vm into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertVM(widgetInfo, vfile, widgetVfile);
                    } else if (widgetInfo.buildTag.smarty && $.is.smarty(wPath)){
                        logger.verbose(`insert smarty into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertSmarty(widgetInfo, vfile, widgetVfile);
                    } else if (widgetInfo.buildTag.css && $.is.css(wPath)){
                        // 旧代码中staticUrl做key来判断是否已经将js和css脚本置入html中
                        // 但用了一个全局变量来维护
                        // 可以直接用生成后的<link>or<script>来正则匹配，匹配到就不插入
                        // 所以新代码不维护这个全局变量了
                        logger.verbose(`insert <link> tag into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertCSS(vfile, widgetVfile);
                    } else if (widgetInfo.buildTag.js && $.is.js(wPath)){
                        logger.verbose(`insert <script> tag into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertJS(vfile, widgetVfile, jdf.config.build.jsPlace);
                    }
                });

                // 对每一个widget在处理完vm，js，css后都要清除widget标签
                vfile.targetContent = vfile.targetContent.replace(widgetInfo.text, os.EOL);
            });
        });
    }).then(() => {
        logger.profile('parse widget');
    }).catch(err => {
        logger.error(err);
    });

}

/**
 * 抽取并解析widget标签 parse {%widget name="widgetName" type="type1,type2" %}
 * @param  {html text} html html文件内容，用以抽取其中的widget
 * @return {Array}      html文件中的所有widget构建的widgetInfo对象列表
 */
buildHTML.parseWidget = function (html) {
    let widgetList = [];
    let tagList = html.match($.reg.notCommentWidget()) || [];
    tagList.forEach(tagText => {
        let widgetInfo = {};

        widgetInfo.text = tagText;
        // name {%widget name="{name}"%}
        let result = $.reg.widget().exec(tagText);
        widgetInfo.name = result === null ? '' : result[1];

        // buildTag 允许那些文件编译进来
        let buildTag = {
            tpl:true,
            vm:true,
            smarty: true,
            js:true,
            css:true
        };
        result = $.reg.widgetType().exec(tagText);
        let typeStr = result === null ? '' : result[1];
        let isJM = (typeStr == 'jdj' || typeStr == 'jdm');
        isJM && (widgetInfo.writeJMOnce = true);
        widgetInfo.buildTag = checkbuildTag(typeStr, buildTag);

        // data {%widget data="{data}"%}
        result = $.reg.widgetData().exec(tagText);
        widgetInfo.data = result === null ? '' : result[1];

        // {%widget comment="{comment}"%}
        result = $.reg.widgetComment().exec(tagText);
        widgetInfo.comment = result === null ? '' : result[1];

        widgetList.push(widgetInfo);
    });
    return widgetList;
}

/**
 * 将widget的vm编译后插入到html的原{%widget %}标签位置
 * @param  {object} widgetInfo 描述{%widget %}信息的对象
 * @param  {VFile} htmlVfile  html文件在VFS中的抽象对象
 * @param  {VFile} vmVfile    vm文件在VFS中的抽象对象
 * @return
 */
buildHTML.insertVM = function (widgetInfo, htmlVfile, vmVfile) {
    logger.verbose(widgetInfo.name, '->insertVM');
    let replaceStr = '';

    let vmdata = this.getWidgetData(widgetInfo);

    if (!vmVfile.targetContent) {
        replaceStr = '';
    } else {
        try {
            let result = Vm.render(vmVfile.targetContent, vmdata, widgetInfo.dirname);
            replaceStr = os.EOL + result.content;
            logger.verbose(`have vm content and render success`);
        } catch (err) {
            logger.error('velocityjs compile failed.');
            logger.error(err);
        }
    }


    if (replaceStr === '') {
        logger.verbose(`vm parsed, and result to empty string`);
    }

    // 打标签
    // <!-- widget widgetName begin -->
    // <!-- widget widgetName end -->
    replaceStr = `${os.EOL}<!-- widget ${widgetInfo.name} begin -->`
        + `${replaceStr}`
        + `${os.EOL}<!-- widget ${widgetInfo.name} end -->`;
    htmlVfile.targetContent = htmlVfile.targetContent.replace(widgetInfo.text, replaceStr);
}

buildHTML.insertSmarty = function (widgetInfo, htmlVfile, smVfile) {
    let smdata = this.getWidgetData(widgetInfo);

    let smartyCompiled = new jSmart(smVfile.targetContent);

    let replaceStr = '';
    if(smartyCompiled){
        replaceStr = smartyCompiled.fetch(smdata);
    }

    htmlVfile.targetContent = htmlVfile.targetContent.replace(widgetInfo.text, replaceStr);
}

buildHTML.getWidgetData = function (widgetInfo) {
    let dataPath = path.normalize(widgetInfo.dirname + '/' + widgetInfo.name + $.is.dataSourceSuffix);
    // widgetName.json ==> dataVfile
    let dataVfile = this.VFS.queryFile(dataPath) || {}; // 性能：可以改从widgetVfiles从筛选
    // 获取数据：widgetname.json和widget标签里的data属性
    let widgetdata = {};
    if (dataVfile.originPath) {
        if (dataVfile.originContent) {
            widgetdata = JSON.parse(stripJsonComments(dataVfile.originContent));
        }
    }

    let data = {};
    if (widgetInfo.data) {
        data = JSON.parse(stripJsonComments(widgetInfo.data));
    }
    data = $.merageObj(widgetdata, data);

    return data;
}

/**
 * 将widget的js文件引用插入到html文件中
 * @param  {VFile} htmlVfile html文件在VFS中的抽象对象
 * @param  {VFile} jsVfile   js文件在VFS中的抽象对象
 * @param  {string} place     js插入html的位置
 * @return
 */
buildHTML.insertJS = function (htmlVfile, jsVfile, place) {
    let insertFn;
    if (place !== 'insertBody') {
        insertFn = $.placeholder.insertHead;
    } else {
        insertFn = $.placeholder.insertBody;
    }

    let htmlFileDir = path.dirname(htmlVfile.originPath);

    let scriptPath = path.join(path.dirname(jsVfile.originPath), path.basename(jsVfile.targetPath));
    scriptPath = path.relative(htmlFileDir, scriptPath);
    scriptPath = f.pathFormat(scriptPath);

    if (!htmlVfile.targetContent) {
        htmlVfile.targetContent = htmlVfile.originContent;
    }
    htmlVfile.targetContent = insertFn(htmlVfile.targetContent, $.placeholder.jsLink(scriptPath));
}

/**
 * 将widget的css(scss,less)文件引用插入到html中
 * @param  {VFile} htmlVfile html文件在VFS中的抽象对象
 * @param  {VFile} cssVfile  css文件在VFS中的抽象对象
 * @return
 */
buildHTML.insertCSS = function (htmlVfile, cssVfile) {
    let insertFn = $.placeholder.insertHead;

    let htmlFileDir = path.dirname(htmlVfile.originPath);

    let linkPath = path.join(path.dirname(cssVfile.originPath), path.basename(cssVfile.targetPath));
    linkPath = path.relative(htmlFileDir, linkPath);
    linkPath = f.pathFormat(linkPath);

    if (!htmlVfile.targetContent) {
        htmlVfile.targetContent = htmlVfile.originContent;
    }
    htmlVfile.targetContent = insertFn(htmlVfile.targetContent, $.placeholder.cssLink(linkPath));
}

/**
 * 抽取某一widget允许引用那些类型
 * @param  {string} wgtType {%widget name="widget name" type="type1,type2" %} wgtType="type1,type2"
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
        logger.warn("widget type["+ noSupportType.join(',') +'] not supported.');
    }

    return tagSet;
}
