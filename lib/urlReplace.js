"use strict";
/**
 * TODO Edit DOC
 * @前端集成处理工具,此文件仅运行于子进程内.
 * @see
 * jdf-img-minify
 * homePage:
 * https://github.com/jdf2e/jdf-img-minify
 *
 */

//system
const path = require('path');
const cheerio = require('cheerio');

//jdf-lib
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require('./jdf.js');
const shelljs = require('shelljs');
const logger = require('jdf-log');
const VFS = require('./VFS/VirtualFileSystem');
const _ = require("lodash");

//exports
const urlReplace = module.exports = {};

/**
 * @fileCompress portal
 * @param {String} source filePath is an absolute file path
 * @param {Boolse} isdebug program will skip compresstion under debug mode
 * @param {Object} config config to overload
 * @returns Promise<any>
 */
urlReplace.init = function (options) {
    if (options.outputType == 'plain') {
        return Promise.resolve();
    }
    logger.profile('replace url');

    var hasBanner = jdf.config.output.hasBanner;

    return VFS.go()
        .then(() => {
            return VFS.travel((vfile, done) => {
                var config = jdf.config;
                var source = vfile.targetPath;
                var content = vfile.targetContent;

                if ($.is.html(source)) {
                    if (config.output.jsUrlReplace) {
                        //给html文件中，seajs引用的js资源，添加cdn
                        content = urlReplace.addJsDepends(source, content);

                        let $$ = cheerio.load(content, {
                            decodeEntities: false
                        });


                        //给html文件中的script标签引用资源，添加cdn
                        $$('script').each(function (index, script) {
                            var src = $$(script).attr('src');

                            if (!$.is.httpLink(src) && src) {
                                let cdnSrc = urlReplace.addSourceCdn(source, src);

                                if (cdnSrc) {
                                    $$(script).attr('src', cdnSrc);
                                }
                            }
                        });
                        content = $$.html();

                        //给html文件中的link标签引用资源，添加cdn
                        $$('link').each(function (index, link) {
                            var src = $$(link).attr('href');

                            if (!$.is.httpLink(src)) {
                                let cdnSrc = urlReplace.addSourceCdn(source, src);

                                if (cdnSrc) {
                                    $$(link).attr('href', cdnSrc);
                                }
                            }
                        });
                        content = $$.html();
                        content = urlReplace.comboUrlPath(content);
                    }
                }

                if ($.is.js(source)) {
                    //url replace
                    if (config.output.jsUrlReplace) {
                        content = urlReplace.addJsDepends(source, content);
                    }
                }

                if ($.is.css(source)) {
                    //css background url replace
                    if (config.output.cssImagesUrlReplace) {
                        content = urlReplace.cssImagesUrlReplace(source, content);
                    }
                }

                vfile.targetContent = content;


            });
        }).then(() => {
            logger.profile('replace url');
        }, err => {
            console.log(err);
        });
}

/**
 * combo  html 文件中的 css 或 js 文件引用
 * @param {string} content html 内容  
 * @return {string} combo 后的 html 内容
 */
urlReplace.comboUrlPath = function (content) {
    let $$ = cheerio.load(content, {
        decodeEntities: false
    });

    /**
     * @param {Array}  [["aaa","bbb"],["aaa","b1bb"],["aaa","b2bb"]]
     * @returns {Array} [{short:"a/b",data["c/d","c",""]},{}]
     */
    function getShortest(arr) {
        if (arr.length == 0) {
            return false;
        }
        let idx = 0;
        let isSame = true;
        while (isSame) {
            let item4Idx;
            for (let i = 0; i < arr.length; i++) {
                let item = arr[i];
                if (item.length == 0 || item[idx] == undefined) {
                    isSame = false;
                    break;
                }
                if (!item4Idx) item4Idx = item[idx];
                if (item4Idx != item[idx]) {
                    isSame = false;
                    break;
                }
            }
            idx++;
        }
        return arr[0].slice(0, idx - 1)
    };

    let cdn = _.trim(jdf.config.cdn, '/')

    function comboByHtmlTag(tagArr, attr) {
        let resultArr = [];
        tagArr.forEach((tag, index) => {
            let url = $$(tag).attr(attr);
            url = url.replace(cdn, "");
            url = _.trim(url, '/');
            resultArr.push(url.split("/"));
        });


        let commonPart;
        commonPart = getShortest(resultArr).join("/");
        commonPart = _.trim(commonPart, "/")

        let part = commonPart ? commonPart + "/??" : "??";
        let cdnCombo = [cdn, '/', part];

        resultArr.forEach((val, idx) => {
            let p = val.join('/').replace(commonPart, "");
            cdnCombo.push(p)
            cdnCombo.push(',')
        });
        if (cdnCombo[cdnCombo.length - 1] == ',') {
            cdnCombo.pop();
        }
        return cdnCombo.join('')
    }

    function appendLink(src, extProp) {
        let tpl = `<link ${extProp || ""} type="text/css" rel="stylesheet" href="${src}" >\n`;
        $$("head").append(tpl);
    }

    function appendScript(src, extProp) {
        let tpl = `<script ${extProp || ""} type="text/javascript" src="${src}"></script>\n`;
        let $lastScript = $$('body script:not([src])').last();
        if ($lastScript.length) {
            $lastScript.before(tpl);
        } else {
            $$("body").append(tpl);
        }

    }

    let comboStr;

    if (jdf.config.output.cssCombo) {

        let $widgetCssTags = $$('link[source="widget"]');
        if ($widgetCssTags.length >= jdf.config.output.comboItemCount) {
            comboStr = comboByHtmlTag($widgetCssTags.toArray(), "href");
            appendLink(comboStr, 'source="widget"');
            $widgetCssTags.remove();
        }

        let cssSet = {};
        let $CssTags = $$('link[source != "widget"][href^="' + cdn + '"]');
        if ($CssTags.length) {
            $CssTags.each((index, tag) => {

                let p = path.dirname($$(tag).attr("href"));

                if (!cssSet[p]) {
                    cssSet[p] = {
                        child: [tag]
                    }
                } else {
                    cssSet[p].child.push(tag);
                }

            });
            for (let i in cssSet) {
                let folder = cssSet[i];
                if (folder.child.length >= jdf.config.output.comboItemCount) {
                    comboStr = comboByHtmlTag(folder.child, "href");
                    appendLink(comboStr);
                    $$(folder.child).remove();
                }
            }
        }

    }

    if (jdf.config.output.jsCombo) {
        let $widgetScriptTags = $$('script[source="widget"]');
        if ($widgetScriptTags.length >= jdf.config.output.comboItemCount) {
            comboStr = comboByHtmlTag($widgetScriptTags.toArray(), "src");
            appendScript(comboStr, 'source="widget"');
            $widgetScriptTags.remove();
        }
        let scriptSet = {};
        let $scriptTags = $$('script[source != "widget"][src^="' + cdn + '"]');
        if ($scriptTags.length) {
            $scriptTags.each((index, tag) => {
                let p = path.dirname($$(tag).attr("src"));
                if (!scriptSet[p]) {
                    scriptSet[p] = {
                        child: [tag]
                    }
                } else {
                    cssSet[p].child.push(tag);
                }
            });

            for (let i in scriptSet) {
                let folder = scriptSet[i];
                if (folder.child.length >= jdf.config.output.comboItemCount) {
                    comboStr = comboByHtmlTag(folder.child, "src");
                    appendScript(comboStr);
                    $$(folder.child).remove();
                }
            }
        }
    }
    let html = $$.html();
    html = html.replace(/\r/ig, "");
    return html.replace(/\n{2,}/ig, "\n");

}

/**
 * @js文件依赖替换
 * @time 2014-2-21 18:46:24
 * @param source 文件名
 * @param source 文件内容
 *
 *   var a=require('a.js') ==> var a=require('projectPath/a.js')
 *
 *   define('/a.js',function(require, exports) {});  ==>
 *   define('projectPath/a.js', ['projectPath/b.js'], function(require, exports) {});
 *
 *  define(function(require, exports)) ==>
 *  define('projectPath/a.js',['projectPath/b.js'],function(require, exports))
 *
 *  seajs.use(['/a.js', '/b.js'],function(){}) ==>
 *  seajs.use(['projectPath/a.js', 'projectPath/b.js'],function(){})
 *
 */
urlReplace.addJsDepends = function (source, content) {
    var cdn = jdf.config.cdn;

    var requireReg = /require\s*\(\s*("|')(.*?)("|')\s*\)/gmi;
    var requireArray = content.match(requireReg);

    var dependenceReg = /define\(.*?['|"].*?['|"].*?,\s*\[.*?\],\s*function/m;
    var dependenceArray = [];

    if (requireArray && requireArray.length) {
        requireHandle();
    }

    dependenceHandle();

    defineHandle();

    useHandle();

    function requireHandle() {
        for (var i = 0; i < requireArray.length; i++) {
            var temp = requireArray[i].match(/require\((.*?)\)/);
            if (temp) {
                let match = temp[1].replace(/'|"/g, '');

                //不是以http路径并且不以jdf开头的路径
                if (/^jdf/.test(match)) {
                    match = cdn + $.pathJoin('/', match);
                } else if (!$.is.httpLink(match)) {
                    match = urlReplace.addSourceCdn(source, match);
                }

                content = content.replace(requireArray[i], 'require("' + match + '")');
                dependenceArray.push(match);
            }
        }
    }

    /**
     * @has file id add dependenceArray
     * @example
     *   define('/a.js',function(require, exports) {});  ==>
     *   define('projectPath/a.js', ['projectPath/b.js'], function(require, exports) {});
     */
    function dependenceHandle() {
        var a = content.match(dependenceReg);
        var d = [];

        if (a) {
            var b = a[0].match(/['|"].*?['|"]/g);

            if (b && b.length) {
                for (let i = 0; i < b.length; i++) {
                    let c = b[i].replace(/['|"]/g, '');
                    d.push(urlReplace.addSourceCdn(source, c));
                }
            }

            dependenceArray = dependenceArray.concat(d.slice(1));
        }
    }

    /**
     * @add files id and dependenceArray
     * @example
     *  define(function(require, exports)) ==>
     *  define('projectPath/a.js',['projectPath/b.js'],function(require, exports))
     */

    function defineHandle() {
        var defineReg = /define\(.*?function/gm;

        dependenceArray = dependenceArray.map(function (item) {
            return '"' + item + '"';
        });

        if (content.match(defineReg)) {

            content = content.replace(defineReg, 'define("' + urlReplace.addSourceCdn(source) + '",[' + dependenceArray.join(',') + '],function');
        }
    }

    /**
     * @seajs.use add prefix
     * @example
     *  seajs.use(['/a.js', '/b.js'],function(){}) ==>
     *  seajs.use(['projectPath/a.js', 'projectPath/b.js'],function(){})
     */
    function useHandle() {
        var hasSeajs = content.match(/seajs\.use\((.*?),\s*function/gim);
        if (hasSeajs) {
            //去重obj
            var tempObj = {};

            for (let i = 0, j = hasSeajs.length; i < j; i++) {
                let t = hasSeajs[i].replace(/seajs.use\(|\[|\]|,function/gim, '');
                let t1 = t.split(',');

                if (t1) {
                    for (var m = 0; m < t1.length; m++) {
                        let key = t1[m].replace(/[\"\'\s]/g, '');
                        let value = key;

                        //无.js缀和不含有.css的url加.js
                        if (!(/\.js$/i.test(value)) && !/\.css/i.test(value)) {
                            value += '.js';
                        }

                        //不是以http路径并且不以jdf开头的路径
                        if (/^jdf/.test(value)) {
                            tempObj[key] = cdn + $.pathJoin('/', value)
                        } else if (!$.is.httpLink(value)) {
                            tempObj[key] = urlReplace.addSourceCdn(source, value);
                        }
                    }
                }
            }
            for (var i in tempObj) {
                var reg = new RegExp('["\']' + i + '["\']', 'gim');
                content = content.replace(reg, '"' + tempObj[i] + '"');
            }
        }
    }

    return content;
};

/**
 * @增加前缀banner
 * @return {String} /* projectPath - Date:2014-03-13 13:06:12:120 * /
 */
urlReplace.setPrefixBanner = function (source) {
    var projectPath = jdf.getProjectPath() ? jdf.getProjectPath().replace('/', '-') + ' ' : '';
    var basename = path.basename(source);

    return '/* ' + projectPath + basename + ' Date:' + $.getDay('-') + ' ' + $.getTime(':', false) + ' */\r\n';
}

/**
* css中图片路径替换
* @time 2014-2-21 10:17:13
* @param cdn 前缀
* @param prefix css目录前缀
* @param suffix 后缀
* @example
    cssImagesUrlReplace('.test{background-image:url("i/test.jpg");}','http://cdn.com/','?time=123') ===>
    .test{background-image:url("http://cdn.com/i/test.jpg?time=123");}
*/
urlReplace.cssImagesUrlReplace = function (source, content) {
    var cssImagesUrlReg = new RegExp("url\\(.*?\\)", "igm");
    var cssImagesUrl = content.match(cssImagesUrlReg);

    //使用Set数据结构，直接去重
    var tempSet = new Set(cssImagesUrl);

    var sourcedir = path.normalize(path.dirname(source));
    var outputdir = path.normalize(f.currentDir() + '/' + jdf.config.outputDirName);

    if (tempSet.size) {

        for (var i of tempSet.values()) {
            var b = i;
            b = b.replace('url(', '');
            b = b.replace(')', '');
            b = b.replace(/\s/g, '');
            b = b.replace(/\"/g, '');
            b = b.replace(/\'/g, '');

            if (b != 'about:blank' && !$.is.httpLink(b) && !/data:image/.test(b) && b.indexOf('?__base64') == -1) {

                var sReg = new RegExp('url\\("{0,1}' + b + '"{0,1}\\)', 'gim');
                content = content.replace(sReg, 'url(' + urlReplace.addSourceCdn(source, b) + ')');
            }
        };
    };

    return content;
}

urlReplace.addSourceCdn = function (source, filename) {
    var cdn = jdf.config.cdn;
    var sourcedir = path.normalize(path.dirname(source));
    var projectPath = jdf.config.projectPath;
    let outputdir = path.normalize($.pathJoin(f.currentDir(), jdf.config.outputDirName, projectPath));

    if (!source) {
        return;
    }

    if (!filename) {
        filename = path.basename(source);
    }

    if (/^\//.test(filename)) {
        //以斜杠的开头的文件直接添加cdn和项目根目录
        filename = cdn + $.pathJoin('/', jdf.getProjectPath(), filename);
    } else {
        //得到当前项目的路径和当前文件路径的一个差值
        var d = sourcedir.replace(outputdir, '');
        var e = path.normalize(path.join(d, filename));

        filename = cdn + $.pathJoin('/', projectPath, e);
    }

    return filename.replace(/\\/g, '/');
}

urlReplace.imagesSuffix = function (source, str) {
    var imagesSuffix = jdf.config.output.imagesSuffix;
    var suffix = jdf.config.suffix;

    if (imagesSuffix == 1) {
        str = str.replace(new RegExp('\\.png\\?__sprite', 'gmi'), '.png?__sprite' + suffix);
    } else if (imagesSuffix == 2) {
        str = str.replace(/\.png\?__sprite/gmi, suffix + '.png?__sprite');
    }

    return str;
}


/**
@method 将 webp 相关css 追加到指定css中
@option {String} source 输入文件路径
**/
urlReplace.appendWebpCSSFIX = function (source) {
    var AST_result = [];
    var sourceCode = urlReplace.css(source, false);
    //remove comment
    sourceCode = sourceCode.replace(/\/\*.*?\*\//ig, function (match) {
        return ""
    });
    var rules = sourceCode.match(/.*?\{.*?\}/ig);
    if (!rules) {
        return;
    }
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (rule.match(/\{/g).length != rule.match(/\}/g).length) {
            continue;
        }
        var cssBodyStr = rule.match(/\{.*?\}/ig)[0];
        var cssHead = rule.replace(cssBodyStr, "");
        cssHead = cssHead.split(';');
        cssHead = cssHead[cssHead.length - 1];
        cssBodyStr = cssBodyStr.replace('{', '').replace('}', '');
        var cssBodyProperties = cssBodyStr.split(';');
        var astCssRule = {};
        astCssRule.selector = cssHead;
        astCssRule.values = [];
        for (var j in cssBodyProperties) {
            var cssObj = cssBodyProperties[j].split(":");
            var cssPropertyName = cssObj[0];
            var cssPropertyValue = cssBodyProperties[j].replace(cssPropertyName + ":", "");
            if (cssPropertyValue.match(/.*?url.*?\.(png|jpg)/ig)) {
                var _c = {
                    k: cssPropertyName,
                    v: cssPropertyValue.replace(/.*?url.*?\.(png|jpg)/ig, function (match) {
                        return match + ".webp";
                    })
                };
                astCssRule.values.push(_c);
            }
        }
        if (astCssRule.values.length) {
            AST_result.push(astCssRule);
        }
    }

    var resultCss = ["/* webp css prefix */"];
    for (var i in AST_result) {
        var webpCssRule = AST_result[i];
        var rootClass = jdf.config.output.webpRootClass ? '.' + jdf.config.output.webpRootClass + " " : ".root-webp ";

        var cssValues = [];
        for (var j in webpCssRule.values) {
            var cssV = webpCssRule.values[j];
            cssValues.push(cssV.k + ":" + cssV.v);
        }
        var css = rootClass + webpCssRule.selector + "{" + cssValues.join(';') + "}";
        resultCss.push(css);
    }

    var raw = f.read(source);
    f.write(source, raw + "\n" + resultCss.join("\n"));


}
