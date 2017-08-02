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
