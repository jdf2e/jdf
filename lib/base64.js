'use strict';

const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
const jdf = require('./jdf.js');
const path = require('path');
const vfs = require('./VFS/VirtualFileSystem');
/**
 * 直接修改vfs中的背景图为base64格式
 * @param source 要修改文件的绝对路径
 */
module.exports.init = function(source) {
	var regBackground = /background(?:-image)?:([\s\S]*?)(?:;|$)/gi;
	var regImgUrl = /url\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^)}]+)\s*\)/i;
	var regIsBase64 = /[?&]__base64/i;

    const vfsNode = vfs.queryFile(source);
	let content = vfsNode.targetContent;
	const background = content.match(regBackground);

	if (background && content) {
		content = encodeURIComponent(content);
		background.forEach((item) => {
			const imgUrl = item.match(regImgUrl);

			if (imgUrl && imgUrl[0].match(regIsBase64)) {
				const bgImgPath = path.join(path.dirname(source), imgUrl[1].replace('?__base64', ''));

				if(f.exists(bgImgPath)) {
					const base64Encode = f.base64Encode(bgImgPath);
					content = content.replace(new RegExp(encodeURIComponent(imgUrl[1]), 'gi'), ('data:image/png;base64,' + base64Encode));
				}else{
					logger.error(bgImgPath + ' may be not exist');
				}
			}
		});
	}
    const decodeContent = decodeURIComponent(content);
    vfsNode.targetContent = decodeContent;
    return decodeContent;
}
