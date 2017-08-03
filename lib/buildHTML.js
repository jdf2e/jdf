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
const widgetParser = require('./buildWidget');
const pluginCore = require('./pluginCore')

let buildHTML = module.exports = {};

/**
 * 编译HTML
 * 在编译HTML之前，最好先编译完CSS、JS、vm/tpl/smarty模板，确保得到最正确的结果
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

            logger.verbose(`parse widget tag in html, generate widgetInfo object collection.`)
            let widgets = widgetParser.parseWidget(vfile.originContent);
            widgets.forEach(widgetInfo => {
                widgetInfo.pagename = path.basename(vfile.originPath);
            });

            logger.verbose(`foreach widgetInfo`);
            // 编译单个widget到html中。下面两个map是为了css，js引用不重复插入html中
            let jsMap = new Map();
            let cssMap = new Map();
            widgets.forEach(widgetInfo => {
                logger.verbose(`parse widget: ${widgetInfo.name}`);
                let widgetVfiles = VFS.queryDir(widgetInfo.dirname);
                widgetVfiles.forEach(widgetVfile => {

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
                    let existMap = {jsMap: jsMap, cssMap: cssMap};
                    // widgetInfo.buildTag反映type中指定的编译类型
                    if (widgetInfo.buildTag.vm && $.is.vm(wPath)) {
                        logger.verbose(`insert vm into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertVM(widgetInfo, vfile, widgetVfile, existMap);
                    }
                    else if (widgetInfo.buildTag.tpl && $.is.tpl(wPath)) {
                        // 旧代码vm和tpl等价
                        logger.verbose(`insert vm into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertVM(widgetInfo, vfile, widgetVfile, existMap);
                    }
                    else if (widgetInfo.buildTag.smarty && $.is.smarty(wPath)){
                        logger.verbose(`insert smarty into HTML: ${widgetVfile.originPath}`);
                        buildHTML.insertSmarty(widgetInfo, vfile, widgetVfile);
                    }
                    else if (widgetInfo.buildTag.css && $.is.css(wPath)){
                        if (cssMap.has(widgetInfo.name)) {
                            logger.verbose(`have inserted widget ${widgetInfo.name}'s css <link> in html`);
                        } else {
                            logger.verbose(`insert <link> tag into HTML: ${widgetVfile.originPath}`);
                            buildHTML.insertCSS(vfile, widgetVfile);
                            cssMap.set(widgetInfo.name, true);
                        }
                    }
                    else if (widgetInfo.buildTag.js && $.is.js(wPath)){
                        if (jsMap.has(widgetInfo.name)) {
                            logger.verbose(`have inserted widget ${widgetInfo.name}'s js <script> in html`);
                        } else {
                            logger.verbose(`insert <script> tag into HTML: ${widgetVfile.originPath}`);
                            buildHTML.insertJS(vfile, widgetVfile, jdf.config.build.jsPlace);
                            jsMap.set(widgetInfo.name, true);
                        }
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
 * 将widget的vm编译后插入到html的原{%widget %}标签位置
 * @param  {object} widgetInfo 描述{%widget %}信息的对象
 * @param  {VFile} htmlVfile  html文件在VFS中的抽象对象
 * @param  {VFile} vmVfile    vm文件在VFS中的抽象对象
 * @return
 */
buildHTML.insertVM = function (widgetInfo, htmlVfile, vmVfile, existMap) {
    logger.verbose(widgetInfo.name, '->insertVM');
    widgetInfo.type = 'vm';

    let replaceStr = '';

    let tpl = vmVfile.targetContent;

    // hook
    tpl = pluginCore.excuteBeforeTplRender(tpl, widgetInfo);

    let vmdata = widgetParser.getWidgetData(widgetInfo);

    if (!tpl) {
        replaceStr = '';
    } else {
        try {
            let result = Vm.render(tpl, {
                dataObj: vmdata,
                dirname: widgetInfo.dirname,
                existMap: existMap,
                htmlDir: path.dirname(htmlVfile.originPath)
            });
            replaceStr = os.EOL + result;
            logger.verbose(`have vm content and render success`);
        } catch (err) {
            logger.error('velocityjs compile failed.');
            logger.error(err);
        }
    }


    if (replaceStr === '') {
        logger.verbose(`vm parsed, and result to empty string`);
    }

    // hook
    replaceStr = pluginCore.excuteBeforeTplInsert(replaceStr, widgetInfo);

    // 打标签
    // <!-- widget widgetName begin -->
    // <!-- widget widgetName end -->
    replaceStr = `${os.EOL}<!-- widget ${widgetInfo.name} begin -->`
        + `${replaceStr}`
        + `${os.EOL}<!-- widget ${widgetInfo.name} end -->`;
    htmlVfile.targetContent = htmlVfile.targetContent.replace(widgetInfo.text, replaceStr);
}

buildHTML.insertSmarty = function (widgetInfo, htmlVfile, smVfile) {
    widgetInfo.type = 'smarty';

    let smdata = widgetParser.getWidgetData(widgetInfo);

    let tpl = smVfile.targetContent;

    // hook
    tpl = pluginCore.excuteBeforeTplRender(tpl, widgetInfo);

    let smartyCompiled = new jSmart(tpl);

    let replaceStr = '';
    if(smartyCompiled){
        replaceStr = smartyCompiled.fetch(smdata);
    }

    // hook
    replaceStr = pluginCore.excuteBeforeTplInsert(replaceStr, widgetInfo);


    // 打标签
    // <!-- widget widgetName begin -->
    // <!-- widget widgetName end -->
    replaceStr = `${os.EOL}<!-- widget ${widgetInfo.name} begin -->`
        + `${replaceStr}`
        + `${os.EOL}<!-- widget ${widgetInfo.name} end -->`;
    htmlVfile.targetContent = htmlVfile.targetContent.replace(widgetInfo.text, replaceStr);
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
