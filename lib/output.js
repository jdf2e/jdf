/**
* @输出处理后的工程文件
* @param {String} options.type 'default' : 默认输出js,css文件夹 如$ jdf o
* @param {String} options.type 'custom' : 自定义输出 如$ jdf o app/js/test.js
* @param {String} options.list : 自定义输出的文件路径,如app/js/test.js
* @param {Boolse} options.isdebug 是否为debug
* @param {Function} options.callback 回调函数
* @todo 只复制改动的文件
*/
var path = require('path');
var fs = require('fs');
var Q = require("q");


//lib自身组件
var $ = require('jdf-file').base;
var f = require('jdf-file').file;
var jdf = require('./jdf.js');
var CssSprite = require('./cssSprite.js');
var Concat = require('./concat.js');
var CompressScheduler = require('./compressScheduler.js');

//exports
var output = module.exports = {};

/**
 * @init
 */
output.init = function(options){
	var type = options.type,
		list = options.list,
		isdebug = options.isdebug,
		callback = options.callback;

	var outputdirName = jdf.config.outputDirName;
	var encoding = jdf.config.output.encoding;
	var excludeFiles = jdf.config.output.excludeFiles;
		excludeFiles = excludeFiles ? excludeFiles + '|.vm|.scss|.less|.psd' : '.vm|.scss|.less|.psd';

	var bgCurrentDir = jdf.bgCurrentDir;
	var outputdir = path.normalize(path.join(f.currentDir(), jdf.config.outputDirName, jdf.config.projectPath));

	var htmlDir = path.normalize( jdf.bgCurrentDir + '/' + jdf.config.htmlDir );

	var core = function() {
		var logText = 'jdf output success!';

		switch (type){
			case 'default':
				f.copy(bgCurrentDir, outputdir, null, excludeFiles);
				break;
			case 'custom':
				if(!list) return;
				var listArray = list.split(',');
				for (var i=0; i<listArray.length; i++ ){
					var item = listArray[i];
					if (f.exists(item)){
						var dirname = path.dirname(item);
						var basename = path.basename(item);
						if($.is.less(basename) || $.is.sass(basename)){
							basename = basename.replace(/(sass|scss|less)/g, 'css');
						}

						var source = path.normalize(path.join(jdf.bgCurrentDir, dirname, basename));
						var targetdir = path.join(outputdir, dirname);
						var target = path.normalize(path.join(targetdir, basename));

						f.mkdir(targetdir);
						//jdf u widget/xxx/时要过滤某些文件
						f.copy(source, target, null, (excludeFiles ? excludeFiles : '(vm|tpl|less|scss|psd)$'), null, null, null, encoding);
					}else{
						console.log('jdf error ['+item+'] is not exists');
					}
				}
				break;
		}

        Q().then(function (){
			//css sprite
			if(jdf.config.output.cssSprite){
				CssSprite.init(outputdirName);
			}
		}).then(function (){
			CompressScheduler.init(outputdirName, isdebug, function(){
				Q().then(function (){
                    Concat.init(outputdirName);
                }).then(function (){
                	console.log(logText);
                    if(callback) callback();
                });
			});
		});
	}
	
	if (f.exists(outputdirName)) {
    	f.del(outputdirName,function(){
			core();
		});
	}else {
		core();
	}
}