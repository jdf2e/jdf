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
 * 深度搜索widget，实现widget嵌套
 * 算法概要：
 * 1、收集HTML中的widget，作为widgetTree的root节点，一个页面有多个widgetTree
 * 2、深度搜索widgetname.vm中的widget依赖，将依赖附加到widgetTree上，同时确定模板为vm、tpl、smarty其中一种
 *      在搜索依赖时检测循环引用，一旦出现循环引用直接退出编译
 * 3、自底向上遍历widgetTree，生成{jsMap, cssMap, vmContent}
 * 4、有条件将渲染好的template插入container
 * 5、合并所有widgetTree的{jsMap, cssMap}，并插入HTML
 * 6、完毕
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

            logger.verbose(`step1: parse widgetTree roots`)
            let widgetRoots = widgetParser.parseWidget(vfile.originContent);

            // 去重，引用同一个widget多次，js，css只引用一次
            let jsMap = new Map();
            let cssMap = new Map();

            let rootTrees = [];
            widgetRoots.forEach(rootWidgetInfo => {
                logger.verbose(`step2: generate widget tree，page:${path.basename(vfile.originPath)}，widget:${rootWidgetInfo.name}`);
                let WidgetTree = widgetParser.generateWidgetTree(rootWidgetInfo);
                rootTrees.push(WidgetTree);
                
                logger.verbose(`step 3: 自底向上遍历widget tree, 生成vmcontent, jsMap, cssMap`);
                let container = vfile.targetContent;
                container = buildHTML.renderTemplateToContainer(WidgetTree, container, jsMap, cssMap);

                logger.verbose(`step 4: 插入vm到html中`);
                vfile.targetContent = container;
            });

            logger.verbose(`step 5: 清除widget标签,因为有些只引入js或css，从而不会被vm替换`);
            rootTrees.forEach(WidgetTree => {
                vfile.targetContent = this.cleanWidgetLabel(WidgetTree, vfile.targetContent);
            })

            logger.verbose(`step 6: 插入js、css到html中`);
            for (let key of jsMap.keys()) {
                let jsPath = path.resolve(VFS.targetDir, jdf.config.widgetDir, key, key + '.js');
                let jsVfile = VFS.queryFile(jsPath, 'target');
                if (jsVfile) {
                    this.insertJS(vfile, jsVfile, jdf.config.build.jsPlace);
                }
            }
            for (let key of cssMap.keys()) {
                let cssPath = path.resolve(VFS.targetDir, jdf.config.widgetDir, key, key + '.css');
                let cssVfile = VFS.queryFile(cssPath, 'target');
                if (cssVfile) {
                    this.insertCSS(vfile, cssVfile);
                }
            }            
        });
    }).then(() => {
        logger.profile('parse widget');
    }).catch(err => {
        logger.error(err);
    });

}

/**
 * 生成root vmcontent算法，自底向上DFS
 */
buildHTML.renderTemplateToContainer = function (node, container, jsMap, cssMap) {
    let widgetInfo = node.widgetInfo;

    let buildTag = widgetInfo.buildTag;

    if (buildTag.js) {
        jsMap.set(widgetInfo.name, true);
    }
    if (buildTag.css) {
        cssMap.set(widgetInfo.name, true);
    }

    // 没有模板编译
    if (!(widgetInfo.buildTag.vm || widgetInfo.buildTag.tpl || widgetInfo.buildTag.smarty)) {
        return container;
    }

    let renderedResult = '';
    if (node.children.length === 0) {
        // 不存在子widget，且可以编译模板
        if (widgetInfo.buildTag.vm || widgetInfo.buildTag.tpl) {
            renderedResult = this.renderVM(widgetInfo, jsMap, cssMap);
        } else if (widgetInfo.buildTag.smarty) {
            renderedResult = this.renderSmarty(widgetInfo, jsMap, cssMap);
        }
    }
    else {
        // 获取当前widget的模板，作为新的container
        let vmVfile = widgetParser.findvmVfile(widgetInfo);
        let childContainer = vmVfile.targetContent;
        node.children.forEach(child => {
            childContainer = this.renderTemplateToContainer(child, childContainer, jsMap, cssMap);
        });
        renderedResult = childContainer;
    }

    // if (renderedResult) {
    //     // 打标签
    //     // <!-- widget widgetName begin -->
    //     // <!-- widget widgetName end -->
    //     renderedResult = `${os.EOL}<!-- widget ${widgetInfo.name} begin -->`
    //         + `${renderedResult}`
    //         + `${os.EOL}<!-- widget ${widgetInfo.name} end -->`;
    // }

    container = container.replace(widgetInfo.text, renderedResult);
    
    return container;
}

/**
 * 根据widgetInfo编译vm，同时收集#parse引进的js，css
 * 注：#parse功能和widget嵌套类似
 */
buildHTML.renderVM = function (widgetInfo, jsMap, cssMap) {
    widgetInfo.type = 'vm';

    let replaceStr = '';

    // 获取widget的模板
    let vmVfile = widgetParser.findvmVfile(widgetInfo);
    let tpl = vmVfile.targetContent;

    // hook
    tpl = pluginCore.excuteBeforeTplRender(tpl, widgetInfo);

    // 编译模板
    let vmdata = widgetParser.getWidgetData(widgetInfo);
    if (!tpl) {
        replaceStr = '';
    } else {
        try {
            let result = Vm.render(tpl, {
                dataObj: vmdata,
                dirname: widgetInfo.dirname,
                existMap: {jsMap: jsMap, cssMap: cssMap}
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

    return replaceStr;
}

/**
 * 根据widgetInfo编译smarty
 */
buildHTML.renderSmarty = function (widgetInfo) {
    widgetInfo.type = 'smarty';
    let smdata = widgetParser.getWidgetData(widgetInfo);

    // 获取widget的模板
    let vmVfile = widgetParser.findvmVfile(widgetInfo);
    let tpl = vmVfile.targetContent;

    // hook
    tpl = pluginCore.excuteBeforeTplRender(tpl, widgetInfo);

    let smartyCompiled = new jSmart(tpl);

    let replaceStr = '';
    if(smartyCompiled){
        replaceStr = smartyCompiled.fetch(smdata);
    }

    return replaceStr;
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

buildHTML.cleanWidgetLabel = function (node, content) {
    content = content.replace(new RegExp(escapeStringRegexp(node.widgetInfo.text), 'g'), os.EOL);
    node.children.forEach(child => {
        content = this.cleanWidgetLabel(child, content);
    });
    return content;
}