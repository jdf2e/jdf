/**
 * @css base64
 * @ctime 2015-8-18
 */
var colors = require('colors');

var $ = require('jdf-file').base;
var f = require('jdf-file').file;
var jdf = require('./jdf.js');

var path = require('path');
var base64 = module.exports = {};

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
					console.log(colors.red('jdf error: [' + img + ']可能不存在！'));
				}
			}
		});
	}

	return unescape(content);
}