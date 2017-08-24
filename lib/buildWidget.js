/**
 * 这个文件是jdf的专用标签解析器
 */
"use strict";

const path = require('path');
const os = require('os');
const fs = require('fs');
const logger = require('jdf-log');
const escapeStringRegexp = require('escape-string-regexp');
const stripJsonComments = require('strip-json-comments');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require('./jdf');
const VFS = require('./VFS/VirtualFileSystem');
const htmlAst = require('./htmlAst');

let widgetParser = module.exports = {};

/**
 * 抽取并解析widget标签 parse {%widget name="widgetName" type="type1,type2" %}
 * 解析widget标签，得到widgetInfo对象
 * text: widget在html中的文本
 * buildTag: widget 中需要编译的类型
 * data: 从widgetName.json和widget标签里的data属性合并后的数据
 * comment: widget标签里的comment属性值
 * dirname: widget的绝对路径
 * {
 *     text: '{%widget name="widgetName" type="widgetType" %}',
 *     name: 'widgetName',
 *     buildTag: '{tpl: false, vm: true, smarty: false, js: false, css: false}',
 *     data: '{}',
 *     comment: '',
 *     dirname: 'widget的绝对路径'
 * }
 * @param  {html text} html html文件内容，用以抽取其中的widget
 * @return {Array}      html文件中的所有widget构建的widgetInfo对象列表
 */
widgetParser.parseWidget = function (html) {
    let widgetList = [];
    let tagList = htmlAst.findWidget(html);
    tagList.forEach(tagText => {
        let widgetInfo = {};

        widgetInfo.text = tagText;

        // 多行转成一行
        tagText = tagText.replace(/[\r\n]/g, ' ');
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
        widgetInfo.data = widgetInfo.data.replace(/\\'/g, "'");

        // {%widget comment="{comment}"%}
        result = $.reg.widgetComment().exec(tagText);
        widgetInfo.comment = result === null ? '' : result[1];

        // dirname widget的绝对路径
        let originDir = VFS.originDir;
        widgetInfo.dirname = path.join(originDir, jdf.config.widgetDir, widgetInfo.name);

        widgetList.push(widgetInfo);
    });

    return widgetList;
}

widgetParser.getWidgetData = function (widgetInfo) {
    let dataPath = path.normalize(widgetInfo.dirname + '/' + widgetInfo.name + $.is.dataSourceSuffix);
    // widgetName.json ==> dataVfile
    let dataVfile = VFS.queryFile(dataPath) || {}; // 性能：可以改从widgetVfiles从筛选
    // 获取数据：widgetname.json和widget标签里的data属性
    let widgetdata = {};
    if (dataVfile.originPath) {
        if (dataVfile.targetContent) {
            widgetdata = JSON.parse(stripJsonComments(dataVfile.targetContent));
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
 * 解析widgetOutputName这个标签
 * @param  {[type]} html 原始html
 * @return {[type]}      解析出来的信息
 * { name: 'output4',
 *   text: '{%widgetOutputName="output4" type="js" %}',
 *   concatTag: { js: true, css: false } }
 */
widgetParser.parseOutputName = function (html) {
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

/**
 * widgetTree的节点数据结构
 */
widgetParser.TreeNode = function (widgetInfo, pNode) {
    this.widgetInfo = widgetInfo
    this.parent = pNode || null;
    this.children = [];
}

/**
 * 创建一个TreeNode，创建的同时检测是否存在循环嵌套
 */
widgetParser.createTreeNode = function (widgetInfo, pNode) {
    // 检测是否有widget循环嵌套
    let pointer = pNode;
    let link = [widgetInfo.name];
    while (pointer && pointer.parent) {
        if (link.indexOf(pointer.widgetInfo.name) === -1) {
            // 所有的上级都不存在该widget
            link.push(pointer.widgetInfo.name);
            pointer = pointer.parent;
        }
        else {
            link.push(pointer.widgetInfo.name);
            logger.error(`存在widget循环引用，引用链${link.join('->')}`);
            logger.info(`jdf退出`);
            process.exit(-1);
        }
    }

    let node = new this.TreeNode(widgetInfo, pNode);

    // 不去重，有可能一个sub widget里包含同一个子widget多次
    pNode && pNode.children.push(node);
    
    return node;
}

/**
 * 根据根widget生成widgetTree
 */
widgetParser.generateWidgetTree = function (rootWidgetInfo) {
    let rootNode = this.createTreeNode(rootWidgetInfo);

    this.WidgetTreeDFS(rootNode);
    
    return rootNode;
}

/**
 * 深度搜索widgetTree
 */
widgetParser.WidgetTreeDFS = function (node) {
    let widgetname = node.widgetInfo.name;
    let widgetVfiles = VFS.queryDir(node.widgetInfo.dirname);
    widgetVfiles.forEach(widgetVfile => {
        let oBasename = path.basename(widgetVfile.originPath);
        let dirname = path.dirname(widgetVfile.originPath);
        let widgetNameReg = new RegExp(escapeStringRegexp(widgetname) + '\.\\w+$');
        if (path.relative(dirname, node.widgetInfo.dirname)
            || !widgetNameReg.test(oBasename)) {
            // 1、相对路径不为空 2、文件名不和widget名一致
            return;
        }

        if ($.is.vm(oBasename) || $.is.tpl(oBasename) || $.is.smarty(oBasename)) {
            let nodeWidgetInfos = this.parseWidget(widgetVfile.targetContent);
            nodeWidgetInfos.forEach(nodeWidgetInfo => {
                let childnode = this.createTreeNode(nodeWidgetInfo, node);
                // 深度遍历
                this.WidgetTreeDFS(childnode);
            })
        }
    });
}

/**
 * 根据widgetInfo获取vmVfile
 */
widgetParser.findvmVfile = function (widgetInfo) {
    let widgetVfiles = VFS.queryDir(widgetInfo.dirname);
    for (let i = 0; i < widgetVfiles.length; i++) {
        let widgetVfile = widgetVfiles[i];
        let oBasename = path.basename(widgetVfile.originPath);
        let dirname = path.dirname(widgetVfile.originPath);
        let widgetNameReg = new RegExp(escapeStringRegexp(widgetInfo.name) + '\.\\w+$');
        if (path.relative(dirname, widgetInfo.dirname)
            || !widgetNameReg.test(oBasename)) {
            // 1、相对路径不为空 2、文件名不和widget名一致
            continue;
        }

        // 这个判断将widget type置为唯一
        if ($.is.smarty(oBasename)) {
            widgetInfo.buildTag.vm = false;
            widgetInfo.buildTag.tpl= false;
            widgetInfo.type = 'smarty';
            return widgetVfile;
        }
        else if ($.is.tpl(oBasename)) {
            widgetInfo.buildTag.vm = false;
            widgetInfo.buildTag.smarty = false;
            widgetInfo.type = 'tpl';
            return widgetVfile;
        }
        else if ($.is.vm(oBasename)){
            widgetInfo.buildTag.tpl = false;
            widgetInfo.buildTag.smarty = false;
            widgetInfo.type = 'vm';
            return widgetVfile;
        }
    }

    logger.verbose(`cannot find widget template ${widgetInfo.name}`);
    return null;
}
