'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require("./jdf");
const velocity = require('velocityjs');
const vm = module.exports;

/**
 * @rander data
 * @{String} vmSource vm内容
 * @{Object} dataObj vm对应的数据
 * @{String} dirname vm的dirname
 */
vm.render = function(vmSource, dataObj, dirname) {
	if (vmSource && dataObj) {
        let macros = {
            parse: function (name) {
                let vmpath = path.resolve(dirname, name);
                let content = '';
                if (f.exists(vmpath)) {
                    let content = f.read(vmpath);
                    // 递归解析parse，但这不是widget，所以并不解析widget的data
                    return vm.render(content, {}, path.dirname(vmpath)).content;
                } else {
                    logger.error(`'#parse(${name})' in ${dirname}'s vm, path not exist`);
                }
                return content;
            }
        }
        return {
            content: velocity.render(vmSource, dataObj, macros)
        }
	}
}
