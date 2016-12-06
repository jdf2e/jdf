"use strict";
/**
 * @css base64
 * @ctime 2015-8-18
 */
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

const logger = require('jdf-log');
const jdf = require('./jdf.js');

const path = require('path');
const base64 = module.exports = {};

base64.init = function(source){
	var reg_background = /background(?:-image)?:([\s\S]*?)(?:;|$)/gi;
	var reg_img_url = /url\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^)}]+)\s*\)/i;
	var reg_is_base64 = /[?&]__base64/i;

	var content = f.read(source);
	var background = content.match(reg_background);

	if(background){
		content = escape(content);
		background.forEach(function(item, index){
			var img_url = item.match(reg_img_url);

			if(img_url && img_url[0].match(reg_is_base64)){
				var img = path.join(path.dirname(source), img_url[1].replace('?__base64', ''));

				if(f.exists(img)){
					var base64Encode = f.base64Encode(img);
					content = content.replace(new RegExp(escape(img_url[1]), 'gi'), ('data:image/png;base64,'+base64Encode));
				}else{
					logger.error(img + ' may be not exist！');
				}
			}
		});
	}

	return unescape(content);
}
