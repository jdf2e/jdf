'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');
const jdfUtils = require('jdf-utils');
const logger = require('jdf-log');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require("./jdf");
const velocity = require('velocityjs');
const VFS = require('./VFS/VirtualFileSystem');
const vm = module.exports;

/**
 * @rander data
 * 格式：
 * <!-- begin embed widget ./widget/myWidget -->
 *  <link src="" source="widget">
 *  <script href="" source="widget"></script>
 *  vm's content
 * <!-- end embed widget ./widget/myWidget -->
 * @{String} vmSource vm内容
 * @{Object} dataObj vm对应的数据
 * @{String} dirname vm的dirname
 */
vm.render = function(vmSource, options) {
    let dataObj = options.dataObj;
    let dirname = options.dirname;
    let existMap = options.existMap;

	if (!(vmSource && dataObj)) {
        return '';
    }

    let macros = {
        parse: function (name) {
            let content = '';

            content += `<!-- begin embed widget ${name} -->\n`;
            let vmpath = path.resolve(dirname, name);
            let vmVfile = VFS.queryFile(vmpath);
            if (!vmVfile) {
                logger.error(`'#parse(${name})' in ${dirname}'s vm, path not exist or not a file`);
                return name;
            }

            // TODO content不将js css放进去，只放到cssMap，jsMap中

            // 添加#parse(vmpath)相应的css和js标签
            let vmName = path.basename(vmpath).replace(path.extname(vmpath), '');
            if (!existMap.cssMap[vmName]) {
                // 获取vfile，没有就不添加css标签到html中
                let csspath = vmpath.replace(path.extname(vmpath), '.css');
                csspath = path.relative(VFS.originDir, csspath);
                csspath = path.join(VFS.targetDir, csspath);
                let cssVfile = VFS.queryFile(csspath, 'target');
                if (cssVfile) {
                    existMap.cssMap.set(vmName, true);
                }
            }
            if (!existMap.jsMap[vmName]) {
                let jspath = vmpath.replace(path.extname(vmpath), '.js');
                jspath = path.relative(VFS.originDir, jspath);
                jspath = path.join(VFS.targetDir, jspath);
                let jsVfile = VFS.queryFile(jspath, 'target');
                if (jsVfile) {
                    existMap.jsMap.set(vmName, true);
                }
            }
            // 递归解析
            content += vm.render(vmVfile.targetContent, {
                dataObj: dataObj,
                dirname: path.dirname(vmpath),
                existMap: existMap
            });

            content += `<!-- end embed widget ${name} -->`;

            return content;
        }
    }

    return  velocity.render(vmSource, dataObj, macros);
}
