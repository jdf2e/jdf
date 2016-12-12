'use strict';

// 外部模块
const path = require('path');

// jdf内置模块
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const jdf = require('./jdf');
const vfs = require('./VFS/VirtualFileSystem');
const logger = require('jdf-log');

module.exports.init = () => {
    const files = vfs.queryFileByType('babel');
    if(files.length > 0) {
        logger.profile('parse es6');
        const babel = require('babel-core');
        files.forEach((item) => {
            const result = babel.transform(item.originContent, {
                presets: $.uniq(jdf.config.babel.defaultPresets.concat(jdf.config.babel.presets || [])),
                plugins: $.uniq(jdf.config.babel.defaultPlugins.concat(jdf.config.babel.plugins || [])),
                sourceRoot: path.resolve(__dirname, '../node_modules'),
                sourceMaps: true
            });
            logger.verbose(item.originPath);
            const fileName = path.basename(item.originPath, '.babel');
            const sourcemapFileName = `${fileName}.js.map`;
            item.targetContent = `${result.code}\n//# sourceMappingURL=./${sourcemapFileName}`;
            result.map.file = `${fileName}}.js`;
            logger.debug(`generate sourcemap ${sourcemapFileName}`);
            const sourcemapFilePath = path.join(path.dirname(item.originPath), sourcemapFileName);
            vfs.addFile(sourcemapFilePath, JSON.stringify(result.map));
        });
        logger.profile('parse es6');
    }
}
