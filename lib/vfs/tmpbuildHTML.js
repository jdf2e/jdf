"use strict";
/**
* @build widget 引入其内容和相关css,js文件以及css,js路径替换
* @param inputPath 文件路径
* @param content 文件内容
* @param type 编译类型 build || release
* @example
    {%widget name="unit"%}
    ==>
    <link type="text/css" rel="stylesheet"  href="/widget/base/base.css" source="widget"/>
    ==>
    <link type="text/css" rel="stylesheet"  href="/app/css/widget.css" source="widget"/>

    删除和替换 {%widgetOutputName="mywidgetname"%}
*/

const path = require('path');
const fs = require('fs');
const jsmart = require('jsmart');
const colors = require('colors');
const logger = require('jdf-log');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

const jdf = require('../jdf.js');
const Vm = require("../vm.js");

//exports
//const buildWidget = module.exports = {};

let buildHTML = module.exports = {};

buildHTML.init = function (VFS) {
    buildHTML.VFS = VFS;
    return VFS.go()
    .then(() => {
        return VFS.travel((vfile, done) => {
            // 只操作html文件
            if (!$.is.html(vfile.originPath)) {
                return;
            }
            // 保证originContent存在
            if (!vfile.originContent) {
                vfile.originContent = f.read(vfile.originPath);
            }


            // widget处理，两条线，build和output
            // build
            //      解析widget标签
            let widgets = this.parseWidget(vfile.originContent);

            // 获取widget的路径，添加到widgetInfo对象中
            let originDir = VFS.originDir;
            let widgetInputName = jdf.config.widgetInputName;
            widgets = widgets.map(widget => {
                widget.dirname = path.normalize(originDir + '/widget/' + widget.name);
                // 旧代码中的变量，具体用法是，当hasInputName=true时，取消后续对widget的操作
                if(widgetInputName.length > 0 && !$.inArray(widgetInputName, widgetName)){
                    widget.hasInputName = true;
                }
                return widget;
            });

            console.log('===>');
            // 正式处理单个widget
            widgets.forEach(widget => {
                let widgetVfiles = VFS.queryDir(widget.dirname);
                widgetVfiles.forEach(widgetVfile => {
                    // 旧代码有判断inputName
                    if (widget.hasInputName) {
                        return;
                    }

                    let wPath = widgetVfile.originPath;
                    if (!wPath.match(widget.name)) {
                        return;
                    }
                    if (widget.buildTag.vm && $.is.vm(wPath)) {
                        // compile vm
                        buildHTML.insertVM(widget, vfile, widgetVfile);
                    } else if (widget.buildTag.tpl && $.is.tpl(wPath)) {
                        // compile tpl
                    } else if (widget.buildTag.smarty && $.is.smarty(wPath)){

                    } else if (widget.buildTag.css && $.is.css(wPath)){
                        // 旧代码中staticUrl做key来判断是否已经将js和css脚本置入html中
                        // 但用了一个全局变量来维护
                        // 可以直接用生成后的<link>or<script>来正则匹配，匹配到就不插入
                        // 所以新代码不维护这个全局变量了
                    } else if (widget.buildTag.js && $.is.js(wPath)){

                    }
                })
            });
            console.log('<=====');



            // 静态CDN替换

            //

        });
    })
    .catch(err => {
        console.log('err in html');
        console.log(err);
    });

}

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

// 这是一个resolve的Promise
buildHTML.insertVM = function (widgetInfo, htmlVfile, vmVfile) {
    logger.debug(widgetInfo.name, '->insertVM');
    let dataPath = path.normalize(widgetInfo.dirname + '/' + widgetInfo.name + $.is.dataSourceSuffix);
    let dataVfile = this.VFS.queryFile(dataPath) || {}; // 性能：可以改从widgetVfiles从筛选
    // 获取数据：widgetname.json和widget标签里的data属性
    let widgetdata = {};
    if (dataVfile.originPath) {
        dataVfile.fetch();
        widgetdata = JSON.parse(dataVfile.originContent);
    }
    let vmdata = {};
    if (widgetInfo.data) {
        vmdata = JSON.parse(widgetInfo.data);
    }
    vmdata = $.merageObj(widgetdata, vmdata);

    console.log(vmdata);

    // 是否关闭vm编译了
    if (!jdf.config.output.vm) {
        return;
    }
    try {
        vmVfile.fetch();
        let result = Vm.render(vmVfile.originContent, vmdata, widgetInfo.dirname);
        // var vmRender =  Vm.render(vmContent, dataObj, widgetInfo.dirname);
        // if(vmRender.url.js){
        //     vmRender.url.js.forEach(function(item){
        //          jsCompileFn(item);
        //     })
        // }

        // if(vmRender.url.css){
        //     vmRender.url.css.forEach(function(item){
        //          cssCompileFn(item);
        //     })
        // }
        // 打标签
        // let typeHtml = '';
        // if () typeHtml='['+widgetType+']';
        //     if ( jdf.config.build.widgetIncludeComment){
        //         if(widgetComment === 'false') return;
        //         placeholder = '\r\n<!-- '+typeHtml+' '+fileUrl+' -->\r\n' + placeholder + '\r\n<!--/ '+fileUrl+' -->';
        //     }
        if (!htmlVfile.targetContent) {
            htmlVfile.fetch(); // 方便起见建议指定文件后缀预先读出来
            htmlVfile.targetContent = htmlVfile.originContent;
        }
        // 2016.12.01.23.00 tag here 下次工作从这里开始
        console.log(widgetInfo.text);
        console.log(htmlVfile.targetContent);
        htmlVfile.targetContent = htmlVfile.targetContent.replace(widgetInfo.text, result.content);
        console.log(htmlVfile);
    } catch (err) {
        logger.error('velocityjs compile failed.');
        logger.error(err);
    }
}

/**
 * @checkbuildTag
 *  To parse type in {%widget type="{@param wgtType}" %}
 *  if the type="" or type is not exist, return {@param tagSet} width no modification
 * @param  {string} wgtType widget.type
 * @param  {object} tagSet  types set that jdf supported. e.g. tagSet = {vm: true, css: true}
 * @return {object} tagSet  this widget needs e.g. wgtType="vm" then tagSet = {vm: true, css: false}
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
        logger.warn("widget type["+ colors.yellow(noSupportType.join(',')) +'] not supported.');
    }

    return tagSet;
}

/**
 * @init
 */
let buildWidget = {};
buildWidget.init = function(inputPath,content,type,callback,param){
    var isBuild = type == 'build';
    var isOutput = type == 'output';

    //css,js路径替换
    if (isOutput) content = staticUrlReplace(content);

    var result = content.match($.reg.notCommentWidget());
    var origin = content;
    var isJM = false;
    var cssFile='' , jsFile='';
    var cssComboArr = [];
    var jsComboArr = [];

    //widget
    if (result){
        var filesListObj = {};//去重用
        result.forEach(function(resultItem){

            var placeholder='';
            var dirExists = f.exists(fileDir);
            if (dirExists){
                var files = fs.readdirSync(fileDir);
                files.forEach(function(item){
                    //less,scss文件转换成css文件
                    var itemOrgin = item;
                    item = $.getCssExtname(item);

                    //tpl,css,js路径中含有widgetName前缀的才引用 ---> 名字完全一样才引用

                    //单个文件
                    var fileUrl = path.join(fileDir, item);
                    var staticUrl = ''+widgetDir +'/'+ item;

                    if (param && param.plain) {
                        staticUrl = '..'+widgetDir +'/'+ item;
                    }

                    //css Compile
                    var cssCompileFn = function(staticUrl){
                        var cssLink = $.placeholder.cssLink(staticUrl);
                        if (isBuild){
                            content = $.placeholder.insertHead(content,cssLink);
                        }else if(isOutput){
                            if(jdf.config.output.combineWidgetCss){
                                //less,sass文件从编译后的bgCurrent读取
                                if ($.is.less(itemOrgin) || $.is.sass(itemOrgin)) {
                                    var fileUrlTemp = jdf.bgCurrentDir + staticUrl;
                                    cssFile +=  f.read(fileUrlTemp) + '\n\r';
                                }else{
                                    cssFile +=  f.read(jdf.bgCurrentDir+staticUrl) + '\n\r';
                                }
                            }else{
                                if(jdf.config.output.cssCombo && jdf.config.cdn){
                                    cssComboArr.push(staticUrl.replace('/widget/', ''));
                                }else{
                                    content = $.placeholder.insertHead(content,cssLink);
                                }
                            }
                        }

                        /*
                        if (isJM){
                            origin = $.placeholder.insertHead(origin,cssLink);
                        }*/
                        filesListObj[staticUrl] = 1;
                    }

                    //js Compile
                    var jsCompileFn = function(staticUrl){
                        var jsLink = $.placeholder.jsLink(staticUrl);
                        if (isBuild){
                            content = buildWidget.insertJs(content,jsLink, jdf.config.build.jsPlace);
                        }else if (isOutput){
                            if(jdf.config.output.combineWidgetJs){
                                //合并所有widget中的js文件至widgetOutputName
                                jsFile += f.read(jdf.currentDir+staticUrl) + '\n\r';
                            }else{
                                if(jdf.config.output.jsCombo && jdf.config.cdn){
                                    jsComboArr.push(staticUrl.replace('/widget/', ''));
                                }else{
                                    content = buildWidget.insertJs(content,jsLink, jdf.config.output.jsPlace);
                                }
                            }
                        }
                        /*
                        if (isJM){
                            origin = $.placeholder.insertBody(origin,jsLink);
                        }*/
                        filesListObj[staticUrl] = 1;
                    }

                    /**
                     * @build widget tpl/vm
                     */
                    //vm编译
                    var vmCompileFn = function(vmContent){
                        var fileUrlDirname = path.dirname(fileUrl)+'/';
                        var dataSourceContent={};
                        var dataSourceUrl = fileUrlDirname+widgetName+$.is.dataSourceSuffix ;

                        try {
                            if (f.exists(dataSourceUrl)) {
                                var temp = f.read(dataSourceUrl);
                                if (temp && temp != '')  dataSourceContent = JSON.parse(temp);
                            }
                        } catch (e) {
                            logger.error(e);
                            return;
                        }

                        try {
                            var widgetDataObj = {};
                            if (widgetData){
                                widgetDataObj = JSON.parse(widgetData);
                            }
                        } catch (e) {
                            logger.error('jdf widget ' +widgetName  +' data error');
                            return;
                        }

                        var dataObj = $.merageObj( dataSourceContent, widgetDataObj);

                        //vm处理
                        try {
                            if (dataObj && vmContent && jdf.config.output.vm){
                                var vmRender =  Vm.render(vmContent, dataObj, fileUrlDirname);
                                //vm继承js/css
                                if(vmRender.url.js){
                                    vmRender.url.js.forEach(function(item){
                                         jsCompileFn(item);
                                    })
                                }

                                if(vmRender.url.css){
                                    vmRender.url.css.forEach(function(item){
                                         cssCompileFn(item);
                                    })
                                }
                                return vmRender.content;
                            }
                        } catch (e) {
                            logger.error('jdf erro [jdf.buildWidget] - velocityjs');
                            logger.error(e);
                        }

                        return vmContent;
                    }

                    //tpl vm Compile
                    var tmplCompileFn = function(type){
                        placeholder = f.read(fileUrl);
                        //替换模板中的cssLink/jsLink
                        if (isOutput) placeholder = staticUrlReplace(placeholder);

                        if (type == 'vm' || type == 'tpl') {
                            placeholder = vmCompileFn(placeholder);
                        }

                        if(type == 'smarty'){
                            var smartyJSON = f.read(path.join(fileDir, widgetName+'.json')) || widgetData;
                            var smartyCompiled = new jSmart(placeholder);

                            if(smartyCompiled && smartyJSON){
                                placeholder = smartyCompiled.fetch(JSON.parse(smartyJSON));
                            }
                        }

                        fileUrl = f.pathFormat(path.join(widgetDir, item));

                        var typeHtml='';
                        if (widgetType) typeHtml='['+widgetType+']';
                        if ( jdf.config.build.widgetIncludeComment){
                            if(widgetComment === 'false') return;
                            placeholder = '\r\n<!-- '+typeHtml+' '+fileUrl+' -->\r\n' + placeholder + '\r\n<!--/ '+fileUrl+' -->';
                        }
                    }

                    //tpl
                    if ( $.is.tpl(item) && buildTag.tpl && (item == widgetName+$.is.tplSuffix) ){
                        tmplCompileFn('tpl');
                    }

                    //vm
                    if ( $.is.vm(item) && buildTag.vm && item == widgetName+$.is.vmSuffix ){
                        tmplCompileFn('vm');
                    }

                    //smarty
                    if ( $.is.smarty(item) && buildTag.smarty && item == widgetName+$.is.smartySuffix ){
                        tmplCompileFn('smarty');
                    }

                    /**
                     * @build widget css
                     */
                    if ($.is.css(item) && !filesListObj[staticUrl] && buildTag.css && item == widgetName+$.is.cssSuffix ){
                        cssCompileFn(staticUrl);
                    }

                    /**
                     * @build widget js
                     */
                    if ($.is.js(item) && !filesListObj[staticUrl] && buildTag.js && item == widgetName+$.is.jsSuffix){
                        jsCompileFn(staticUrl);
                    }
                });
                /*
                if (isJM){
                    origin = origin.replace(widgetStr,placeholder);
                }*/
                //替换掉{%widget name="base"%}
                content = content.replace(widgetStr,placeholder);
            }else{
                logger.warn(widgetStr +' widget '+ widgetName+ ' does not exist.');
            }
        });

        //去掉{%widgetOutputName="mywidgetname"%}
        var getContentWidgetOutputName = $.reg.widgetOutputName().exec(content);
        if ( getContentWidgetOutputName ){
            content = content.replace(getContentWidgetOutputName[0],'');
        }

        //release output处理
        if (isOutput){
            //修改为默认取配置文件中的widgetOutputName 2014-5-24
            var pkgName = jdf.config.widgetOutputName;
            //var pkgName = path.basename(inputPath).replace('.html', '');
            if (getContentWidgetOutputName){
                pkgName = getContentWidgetOutputName[1];
            }

            var outputDir = jdf.bgCurrentDir;
            var outputCss = '/' + jdf.config.cssDir+'/'+pkgName+'.css';
            var outputJs = '/' + jdf.config.jsDir+'/'+pkgName+'.js';

            var cssOutputDir = '/' + jdf.config.cssDir.replace(jdf.config.baseDir+'/', '') +'/';
            var jsOutputDir = '/' + jdf.config.jsDir.replace(jdf.config.baseDir+'/', '') +'/';
            if (isOutput) {
                if(jdf.config.cdn){
                    outputCss = '/' +  jdf.getProjectPath() + cssOutputDir+pkgName+'.css';
                    outputCss = $.replaceSlash(outputCss);
                    outputCss = jdf.config.cdn + outputCss;

                    outputJs = '/' + jdf.getProjectPath() + jsOutputDir+pkgName+'.js';
                    outputJs = $.replaceSlash(outputJs);
                    outputJs = jdf.config.cdn + outputJs;
                }else{
                    outputCss = addgetProjectPath(cssOutputDir+pkgName+'.css');
                    outputJs = addgetProjectPath(jsOutputDir+pkgName+'.js');
                }
            }

            //seajsAddCdn
            content = seajsAddCdn(content);

            //widgetUrlAddCdn
            content = widgetUrlAddCdn(content);

            //css链接加前缀
            if(jdf.config.output.combineWidgetCss && cssFile !=''){
                var cssLink = $.placeholder.cssLink(outputCss);
                content = $.placeholder.insertHead(content, cssLink  );
                f.write(path.normalize(outputDir+'/' + jdf.config.cssDir+'/'+pkgName+'.css') , cssFile);
            }else if(jdf.config.output.cssCombo && cssComboArr.length){
                cssComboArr = $.uniq(cssComboArr);
                var outputCss1 = '/' +  jdf.getProjectPath() +'/widget/??'+cssComboArr.join(',');
                outputCss1 = jdf.config.cdn + $.replaceSlash(outputCss1);
                var cssLink1 = $.placeholder.cssLink(outputCss1);
                content = $.placeholder.insertHead(content, cssLink1);
            }

            //js链接加前缀
            if(jdf.config.output.combineWidgetJs && jsFile !=''){
                var jsLink = $.placeholder.jsLink(outputJs);
                content = buildWidget.insertJs(content,jsLink,jdf.config.output.jsPlace);
                f.write(path.normalize(outputDir+'/' + jdf.config.jsDir+'/'+pkgName+'.js') , jsFile);
            }else if(jdf.config.output.jsCombo && jsComboArr.length){
                jsComboArr = $.uniq(jsComboArr);
                var outputJs1 = '/' +  jdf.getProjectPath() +'/widget/??'+jsComboArr.join(',');
                outputJs1 = jdf.config.cdn + $.replaceSlash(outputJs1);
                var jsLink1 = $.placeholder.jsLink(outputJs1);
                content = buildWidget.insertJs(content,jsLink1, jdf.config.output.jsPlace);
            }
        }
    }else if (isOutput) {
        // seajsAddCdn
        content = seajsAddCdn(content);
        // widgetUrlAddCdn
        content = widgetUrlAddCdn(content);
    }

    var data = {
        origin:origin,
        tpl:content,
        css:cssFile,
        js:jsFile
    }
    if (callback) callback(data);
}


/**
 * @insertJs
 * @(考虑到性能 insertHead -> insertBody) -> 放head有利于前后端沟通,可通过配置修改
 * @jdf.config.output.jsPlace 'insertHead' --> header ; 'insertBody' --> body
 */
buildWidget.insertJs = function(content, jsLink, jsPlace){
    if(jsPlace == 'insertHead'){
        content = $.placeholder.insertHead(content, jsLink);
    }else if(jsPlace == 'insertBody'){
        content = $.placeholder.insertBody(content, jsLink);
    }
    return content;
}

/**
* @非widget引用, 原页面上的静态资源css, js链接替换处理: js直接加cdn, css链接根据配置是否combo加cdn
* @param {String} str 源代码
* @return {String} 替换后的源代码
* @example
    <link type="text/css" rel="stylesheet"  href="../app/css/main.css" />
    <link type="text/css" rel="stylesheet"  href="../app/css/less.css" />
    ==>
    <link type="text/css" rel="stylesheet"  href="http://cdnul.com/??productpath/css/main.css,productpath/css/less.css" />

    <script type="text/javascript" src="../app/js/common.js"></script>
     ==>
    <script type="text/javascript" src="http://cdnul.com/productpath/js/common.js"></script>
*/
function staticUrlReplace(str){
    var replaceCore= function (str,type){
        var regStr = $.reg[type+'Str'];
        var reg = new RegExp(regStr,'gm');
        var regResult =  str.match(reg);

        if (regResult){
            var comboArray = [];
            regResult.forEach(function(item){
                var reg = new RegExp(regStr,'gm');
                var i = reg.exec(item);
                var cdnRegStr = jdf.config.cdnDefalut ? jdf.config.cdnDefalut : jdf.config.cdn;
                var cdnReg = new RegExp(cdnRegStr+'/', 'gm');
                var k = i['input'];

                var strReplace = function (){
                    if(!/href="\/\//.test(k)){
                        str = str.replace(k+'\r\n', '');
                    }
                }

                if(i && !cdnReg.test(i[1]) && !$.is.httpLink(i[1]) ){
                    //var t = i[1].replace(cdnReg, '');
                    //comboArray.push(t);
                    strReplace();
                }

                if ( i && !$.is.httpLink(i[1]) ){
                    //url
                    var j = i[1];
                    j = projectPathReplace(j);

                    var widgetReg = new RegExp('^'+jdf.config.widgetDir, 'gm');
                    if(! widgetReg.test(j)){
                        comboArray.push(j);
                        strReplace();
                    }
                }
            });

            if(comboArray.length>0){
                comboArray = $.uniq(comboArray);
                var tagSrc = '';

                //combo
                if(jdf.config.output[type+'Combo'] && jdf.config.cdn){
                    var cdnPrefix = '';
                    cdnPrefix =  jdf.config.cdn + (comboArray.length>1 ? '/??' : '/');
                    var comboUrl = comboArray.join(',');
                    comboUrl = comboUrl.replace(/\/\//gm,'/');
                    var staticUrl =  cdnPrefix + comboUrl;
                    tagSrc = '' + $.placeholder[type+'comboLink'](staticUrl);
                }else{
                    for (var i=0; i<comboArray.length; i++){
                        var item = comboArray[i];
                        item = jdf.config.cdn ? jdf.config.cdn+'/'+item : item;
                        item = addgetProjectPath(item) ;
                        tagSrc += $.placeholder[type+'Link'](item);
                    }
                }

                //console.log(tagSrc);
                //if (/<\/head>/.test(str)) {
                    if (type == 'js') {
                        str = buildWidget.insertJs(str,tagSrc, jdf.config.output.jsPlace);
                    }else{
                        str = $.placeholder.insertHead(str, tagSrc);
                    }
                //} else{
                //  str += tagSrc;
                //};
            }
        }
        return str;
    }

    var jsReplace= function (str,regStr){
        var reg = new RegExp(regStr,'gm');
        var regResult =  str.match(reg);
        if (regResult){
            regResult.forEach(function(item){
                var reg = new RegExp(regStr,'gm');
                var i = reg.exec(item);
                if ( i && !$.is.httpLink(i[1]) ){
                    //url
                    var j = i[1];
                    j = projectPathReplace(j);

                    //add cdn
                    if(jdf.config.cdn){
                        j =  '/' + j;
                        j = $.replaceSlash(j);
                        j = jdf.config.cdn +  j;
                    }

                    j = addgetProjectPath(j) ;

                    //replace
                    var r = new RegExp(i[1],'gm');
                    str = str.replace(r,j);
                }
            });
        }
        return str;
    }

    str = replaceCore(str, 'css');
    str = replaceCore(str, 'js');
    //str = jsReplace(str, $.reg.jsStr);
    return str;
}

/**
* @seajs.use add prefix
* @example
*   seajs.use(['/a.js', '/b.js'],function(){}) ==>
*   seajs.use(['projectPath/a.js', 'projectPath/b.js'],function(){})
*/
function seajsAddCdn(source){
    var cdn = jdf.config.cdn;
    var configBaseDir = jdf.config.baseDir ? jdf.config.baseDir+'/'  : '';
    var tag = source.match(/seajs.use\((.*?)\S*[function)|]/gmi);
    if (tag) {
        var tempObj = {};
        for (var i =0, j= tag.length; i<j; i++){
            var  t= tag[i].replace(/seajs.use\(|\[|\]|\)/gim, "");
            t = t.replace(/function\(/gim, "");
            var t1 = t.split(',');
            if (t1) {
                for (var m=0; m<t1.length; m++ ){
                    var t2 = t1[m].replace(/\"/g, '').replace(/\'/g, '');
                    //js和widget的路径,'js/a.js'的不做替换
                    var t1R = new RegExp(jdf.config.jsDir+'/|'+jdf.config.widgetDir+'/', 'gm');
                    if ( t1R.test(t2) && !$.is.httpLink(t2) &&
                        ( t2.charAt(0) == '/' || t2.charAt(0) == '\\' || t2.charAt(0) == '.' )
                    ) {
                        tempObj[t2] = projectPathReplace(t2);
                    }
                }
            }
        }

        for (var i in  tempObj ){
            var reg = new RegExp(escape(i), 'gim');

            if(cdn){
                tempObj[i] = cdn + '/' + tempObj[i];
            }
            source = source.replace(reg, tempObj[i]);
        }
    }
    return source;
}

/**
 * @addgetProjectPath
 */
function addgetProjectPath(str){
    if(!jdf.config.cdn && !/^\.\./.test(str)){
        str = '..'+str;
    }
    return str ;
}

/**
 * @引用widget文件下的img/cssLink/jsLink add cdn prefix
 * @example
    <img src="/widget/a/a.png"><img src='/widget/a/a.png'><img src='../widget/a/a.png'><img src="./widget/a/a.png">
    --->
    <img src="http://cdn.com/projectPath/widget/a/a.png">
 */
function widgetUrlAddCdn(source){
    var configBaseDir = jdf.config.baseDir ? jdf.config.baseDir+'/'  : '';
    var tag = source.match(/["|'][\\.]*\/widget\/\S*["|']/gmi);
    if (tag) {
        var tempObj = {};
        for (var i =0, j= tag.length; i<j; i++){
            var  t = tag[i].replace(/["|']/gim, "");
            var t1 = t;
            if(jdf.config.cdn){
                var t2 = '/' + jdf.getProjectPath() + t.replace(/^\.*/, "");
                t2 = $.replaceSlash(t2);
                t1 = jdf.config.cdn + t2;
            }else{
                t1 = addgetProjectPath(t1) ;
                t1 = $.replaceSlash(t1);
            }

            if(t != t1){
                tempObj[t] = t1;
            }
        }
        for (var i in tempObj ){
            var reg = new RegExp(i, 'gim');
            source = source.replace(reg, tempObj[i]);
        }
    }
    return source;
}


/**
 * @projectPathReplace
 * @ctime 2014-7-5
 * @example
    /css/index.css
    ../css/index.css
    ==>
    projectPath/css/index.css
 */
function projectPathReplace(j){
    j = j.replace(jdf.config.baseDir, '');

    if(jdf.config.cdn){
        j = j.replace(/\.\.\//g,'/');
        //add projectPath
        j = jdf.getProjectPath() +  j;
        // del ../  ./
        if (j.charAt(0) == '/') { j = j.replace('/','');}
        // 替换./和//为/
        j = j.replace(/\/\/|\.\//gm, '/');
    }

    // // ==> /
    j = j.replace(/\/\//gm,'/');
    return j;
}
