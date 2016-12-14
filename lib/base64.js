'use strict';

const jdfUtils = require('jdf-utils');
const f = jdfUtils.file;
const logger = require('jdf-log');
const jdf = require('./jdf');
const path = require('path');
const vfs = require('./VFS/VirtualFileSystem');
/**
 * 直接修改vfs中的背景图为base64格式
 * @param vNode vfs指向的一个文件节点
 */
function convert(vNode) {
	const regBackground = /background(?:-image)?:([\s\S]*?)(?:;|$)/gi;
	const regImgUrl = /url\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^)}]+)\s*\)/i;
	const regIsBase64 = /[?&]__base64/i;

    const source = vNode.originPath; // 要修改文件的绝对路径
    let content = vNode.targetContent; // 文件的原始内容
	const background = content.match(regBackground);

	if (background) {
	    logger.verbose(`base64: ${source}`);
        content = encodeURIComponent(content);
		background.forEach((item) => {
			const imgUrl = item.match(regImgUrl);

			if (imgUrl && imgUrl[0].match(regIsBase64)) {
				const bgImgPath = path.join(path.dirname(source), imgUrl[1].replace('?__base64', ''));

				if (f.exists(bgImgPath)) {
					const base64Encode = f.base64Encode(bgImgPath);
					content = content.replace(new RegExp(encodeURIComponent(imgUrl[1]), 'gi'), ('data:image/png;base64,' + base64Encode));
				}else{
					logger.error(bgImgPath + ' is not exist');
				}
			}
		});
        vNode.targetContent = decodeURIComponent(content);
	}
}

module.exports.init = function() {
    logger.profile('base64');
    vfs.queryFileByTargetType('css').forEach((item) => convert(item));
    logger.profile('base64');
}
