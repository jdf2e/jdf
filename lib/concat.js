'use strict';

const path = require('path');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
const jdf = require('./jdf');
const vfs = require('./VFS/VirtualFileSystem');

/**
 * 根据config.json的配置来合并文件，格式如下
 * "concat": {
 *     "js/c1.js": ["js/c1.js", "js/c2.js", "widget/about/about.js"],
 *     "css/c1.css": ["css/c1.sass", "css/c2.less"]
 * }
 * @param rSource 项目输出的目录名称
 */
module.exports.init = function(rSource) {
	const concatFiles = jdf.config.output.concat;
	const source = path.resolve(f.realpath(rSource), jdf.getProjectPath());
    logger.verbose(`concat: ${source}`);

    Object.keys(concatFiles).forEach(desFile => {
        let content = '';
        desFile.forEach(singleFile => {
            // 获取要输出的文件名称
            const singleFilePath = path.resolve(source, singleFile);
            logger.verbose(`singleFilePath is ${singleFilePath}`);

            const vfsFile = vfs.queryFile(singleFilePath);
            if (vfsFile) {
                content += vfsFile.targetContent;
            }
            else {
                logger.error(`${singleFilePath} is not exists`);
            }
        });
        logger.verbose(`${desFilePath} file content is ${content}`);

        if (content !== '') {
            const desFilePath = path.resolve(source, desFile);
            vfs.addFile(desFilePath, content);
        }
    });
}
