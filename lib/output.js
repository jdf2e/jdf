"use strict";
/**
* @输出处理后的工程文件
* @param {String} options.type 'default' : 默认输出js,css文件夹 如$ jdf o
* @param {String} options.type 'custom' : 自定义输出 如$ jdf o app/js/test.js
* @param {String} options.list : 自定义输出的文件路径,如app/js/test.js
* @param {Boolse} options.isdebug 是否为debug
* @param {Function} options.callback 回调函数
* @todo 只复制改动的文件
*/
const path = require('path');
const fs = require('fs');
const shelljs = require('shelljs');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');
const jdf = require('./jdf.js');
const CssSprite = require('./cssSprite.js');
const Concat = require('./concat.js');
const CompressScheduler = require('./compressScheduler.js');

const BuildCss = require("./buildCss.js");
const BuildWidget = require("./buildWidget.js");

//exports
const output = module.exports = {};

/**
 * @init
 */
output.init = function (VFS, options) {
	var type = options.type,
		isdebug = options.isdebug;

	var outputdirName = jdf.config.outputDirName;
	var encoding = jdf.config.output.encoding;
	var excludeFiles = jdf.config.output.excludeFiles;
	excludeFiles = excludeFiles ? excludeFiles + '|.vm|.scss|.less|.psd' : '.vm|.scss|.less|.psd';

	var bgCurrentDir = jdf.bgCurrentDir;
	var outputdir = path.normalize(path.join(f.currentDir(), jdf.config.outputDirName, jdf.config.projectPath));

	var htmlDir = path.normalize(jdf.bgCurrentDir + '/' + jdf.config.htmlDir);

    var logText = 'jdf output success!';

    return Promise.resolve().then(() => {
        return BuildCss.init(VFS, options);
    }).then(() => {
        logger.profile('parse widget');
        return BuildWidget.init(VFS, options);
    }).then(() => {
        logger.profile('parse widget');
        logger.profile('delete file');

        shelljs.rm("-Rf",outputdir);

        logger.profile('delete file');
        logger.profile('write file');

        VFS.targetDir = outputdir;
        return VFS.writeFiles();
    }).then(() => {
        logger.profile('write file');
        logger.info(logText);
    }).catch(err => {
        logger.error(err);
    });



	/**
	 * 核心压缩方法
	 * @return Promise
	 */
	var core = function () {
		var logText = 'jdf output success!';
		switch (type) {
			case 'default':
				f.copy(bgCurrentDir, outputdir, null, excludeFiles);
				break;
			case 'custom':
				if (!list) return;
				var listArray = list.split(',');
				for (var i = 0; i < listArray.length; i++) {
					var item = listArray[i];
					if (f.exists(item)) {
						var dirname = path.dirname(item);
						var basename = path.basename(item);
						if ($.is.less(basename) || $.is.sass(basename)) {
							basename = basename.replace(/(sass|scss|less)/g, 'css');
						}
						var source = path.normalize(path.join(jdf.bgCurrentDir, dirname, basename));
						var targetdir = path.join(outputdir, dirname);
						var target = path.normalize(path.join(targetdir, basename));
						f.mkdir(targetdir);
						//jdf u widget/xxx/时要过滤某些文件
						f.copy(source, target, null, (excludeFiles ? excludeFiles : '(vm|tpl|less|scss|psd)$'), null, null, null, encoding);
					} else {
						logger.error(item + ' is not exists');
					}
				}
				break;
		}
		return new Promise((resolve, reject) => {
			//css sprite
			if (jdf.config.output.cssSprite) {
				CssSprite.init(outputdirName);
			}
			resolve();
		}).then(val => {
			// return CompressScheduler.init(outputdirName, isdebug);
		}).then(value => {
			Concat.init(outputdirName);
		}).then(val => {
			logger.info(logText);
			if (callback) callback();
		});
	}
	shelljs.rm("-Rf",outputdirName);
	return core();
}
