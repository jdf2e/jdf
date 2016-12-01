"use strict";
/**
 * @files concat
 * @ctime 2014-9-24
 */

const path = require('path');
const fs = require('fs');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

const logger = require('jdf-log');
const jdf = require('./jdf.js');

//exports
var concat = module.exports = {};

concat.init = function(rSource){
	var concatFiles = jdf.config.output.concat;

	Object.size = function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};
	var source = f.realpath(rSource)+'/'+jdf.getProjectPath();

	if ( Object.size(concatFiles)) {
		for (var i in concatFiles  ){
			var res = '';
			concatFiles[i].forEach(function(j){
				var m = $.getCssExtname(source+'/'+j);
				if (f.exists(m)) {
					res += f.read(m);
					//f.del(source+'/'+j);
				}else {
					logger.warn(j+'" is not exists');
				}
			});
			if (res != '') {
				f.write(source+'/'+i, res);
			}
		}
	}
}
