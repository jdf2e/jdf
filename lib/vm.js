'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require("./jdf.js");
const velocity = require('velocityjs');
const vm = module.exports;

/**
 * @velocityjs extend
 * @{String} str 数据内容
 * @{String} dirname 文件的dirname
 */
vm.parse = function(str, dirname){
	dirname = typeof dirname === 'undefined' ? '' : dirname;
	const arr = str.match(/^(<!--){0}\s*#parse\([\"|\'](.*?)[\"|\']\)(\s\n\r)*(-->){0}/gmi);
	const res = {
		vm:[],
		tpl:[],
		js:[],
		css:[]
	};

	if (arr) {
		for (let i =0; i<arr.length; i++) {
			const temp = arr[i].match(/#parse\([\"|\'](.*?)[\"|\']\)/);
			if (temp) {
				const basename = temp[1];
				if (basename) {
					const source  = path.normalize(dirname + basename);

					const dirname1 = path.dirname(source);
					const dirlist1 = f.getdirlist(dirname1);

					dirlist1.forEach(function(item){
						item = item.replace(jdf.currentDir, '');
						item = item.replace(/\\/g,'/');

						if($.is.vm(item)){
							res.vm.push(item);
						}

						if($.is.tpl(item)){
							res.tpl.push(item);
						}

						if($.is.css(item)||$.is.less(item)||$.is.sass(item)){
							res.css.push($.getCssExtname(item));
						}

						if($.is.js(item)){
							res.js.push(item);
						}
					});

					if (f.exists(source)) {
						const content = f.read(source);
						if (content) {
							//替换
							str = str.replace(temp[0], content);
						}
					}
				}
			}
		}
	}

	return {
		content: str,
		url: res
	};
 }

/**
 * @rander data
 * @{String} vmSource vm内容
 * @{Object} dataObj vm对应的数据
 * @{String} dirname vm的dirname
 */
vm.render = function(vmSource, dataObj, dirname) {
	if (vmSource && dataObj) {
		const vmTpm = vm.parse(vmSource, dirname);
		return {
			content:velocity.render(vmTpm.content, dataObj),
			url:vmTpm.url
		};
	}
}
