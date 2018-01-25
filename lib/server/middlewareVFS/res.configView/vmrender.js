'use strict';
const fs = require('fs');
const path = require('path');
const sjc = require('strip-json-comments');
const VM = require('velocityjs');

let defaultConfig =  {
	"outputDirName": "build", //输出的目标文件夹名称
	"compressThreadCrisis": 200, //当要压缩的文件超过这个值时，会开启多进程压缩。
    "localServerPort": 80, //本地服务器端口

	"projectPath": "", //工程目录前缀
	"cdn": "//misc.360buyimg.com", //静态cdn域名
	"serverDir": "misc.360buyimg.com", //上传至远端服务器文件夹的名称
	"previewServerDir": "page.jd.com", //html文件夹上传至服务器所在的文件夹名称
	"widgetServerDir": "widget.jd.com", //widget服务器所在的文件夹名称

	"build":{
		"jsPlace": "insertBody" //调试时js文件位置 insertHead|insertBody
    },
    
	"output":{
		"linkReplace": true, // 给link.href添加cdn前缀，它和cssImagesUrlReplace相互独立  
		"cssImagesUrlReplace": true,//css中图片url加cdn替换
		"jsUrlReplace": true, //js文件的id和dependences是否添加cdn前缀，添加script.src cdn前缀
		"cssCombo": true, //css进行combo
		"jsCombo": true, //js进行combo

		"hasBanner": true, //是否给js文件，css文件添加banner时间戳
		"compresshtml": false,//是否开启压缩html文件
		"compressJs": true,//是否开启压缩js文件
		"compressCss": true,//是否开启压缩css文件
		"compressImage": true,//是否开启压缩图片

		"cssSprite": true, //是否开启css sprite功能
		"cssSpriteMode": 1, //0: 将所有css文件中的背景图合并成一张sprite图片，1: 将每一个widget中的背景图分别合并成一张图片
		"cssSpriteMargin": 10, //css sprite图片之间的间距
		"cssSpriteDirection": 'vertical', //vertical：垂直合并，horizontal：水平合并
		"cssAutoPrefixer": true, //是否自动删除过时的浏览器css前缀

		"base64": true, //是否对图片进行base64编码
		"webp":false, //是否生成对应的webp图片

		"excludeFiles": ""//想要直接忽略的文件/文件夹，路径相对于当前项目根目录，以逗号分隔，例如："test,test.css"
    },
    "widgetOutputName": "widget",
    "widgetOutputMode": 1, // 1: all widgets|2: white list|3: black list
    "widgetWhiteList": [], // 指定白名单，在widgetOutputMode=2时，输出这个列表内容到widget.js/widget.css中
	"widgetBlackList": [], // 指定黑名单，在widgetOutputMode=3时，排除这个列表的widget
	"widgetLabel": true // 给widget嵌入html时打上标签
}

exports.genHTML = function () {
    let tpl = fs.readFileSync(path.resolve(__dirname, './config.vm')).toString();
    let css = fs.readFileSync(path.resolve(__dirname, './import_configcss.css')).toString();
    let js = fs.readFileSync(path.resolve(__dirname, './import_configjs.js')).toString();
    
    let userConfig = fs.readFileSync(path.resolve(process.cwd(), 'config.json')).toString();
	// userConfig = mergeConfig(defaultConfig, userConfig);

	return tpl.replace("${userConfig}",sjc(userConfig))
			.replace("${defaultConfig}",JSON.stringify(defaultConfig))
			.replace("${css}", css)
			.replace("${js}", js);
}

function mergeConfig(defaultConfig, userConfig) {
    var build = defaultConfig.build;
    var output = defaultConfig.output;

    userConfig = Object.assign({}, defaultConfig, userConfig);

    userConfig.build = Object.assign({}, build, userConfig.build);
    userConfig.output = Object.assign({}, output, userConfig.output);

    return userConfig;
}

function fromUnicode(str) {
	return str.replace(/&#((x[0-9A-Fa-f]+)|([0-9]+));/g, function(word) {
		var code = word.split("#")[1].split(";")[0];
		return String.fromCharCode("0"+code);
	});
}