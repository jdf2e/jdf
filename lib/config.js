"use strict";
const path = require('path');
/**
 * @统一配置文件
 */

/**
 * @config Json File Content
 */

module.exports = {
	"compressThreadCrisis": 200, //当要压缩的文件超过这个值时，会开启多进程压缩。

	"configFileName": "config.json", //配置文件名称

	"projectPath": "", //工程目录前缀

	"cssDir": "css", //css文件夹名称
	"imagesDir": "css/i", //images文件夹名称
	"jsDir": "js", //js文件夹名称
	"htmlDir": "html", //html文件夹名称
	"widgetDir": "widget", //widget文件夹名称

	"outputDirName": "build", //输出的目标文件夹名称
	"outputCustom": "", //输出的源文件夹名称，以逗号分隔

    "widgetOutputName": "widget",
    "widgetOutputMode": 1, // 1: all widgets|2: white list|3: black list
    "widgetWhiteList": [], // 指定白名单，在widgetOutputMode=2时，输出这个列表内容到widget.js/widget.css中
	"widgetBlackList": [], // 指定黑名单，在widgetOutputMode=3时，排除这个列表的widget
	"widgetNesting": true, // widget嵌套功能
	"widgetLabel": true, // 给widget嵌入html时打上标签

	"localServerPort": 80, //本地服务器端口

	"cdn": "//misc.360buyimg.com", //静态cdn域名

	"serverDir": "misc.360buyimg.com", //上传至远端服务器文件夹的名称
	"previewServerDir": "page.jd.com", //html文件夹上传至服务器所在的文件夹名称
	"widgetServerDir": "jdfwidget.jd.com", //widget服务器所在的文件夹名称

	"build":{
		"jsPlace": "insertBody", //调试时js文件位置 insertHead|insertBody
		"livereload":true, //是否开启browser-sync监测文件变化
		"sass":true,//是否开启sass编译
		"less":true,//是否开启less编译
		"csslint":false//是否开启csslint
	},
    "upload": {
	    "type": "http",     // 默认 ftp scp http
        "host": null,       // 服务器的域名或者ip
        "user": null,   // 上传时使用的用户名, ftp、scp需要，http不需要
        "password": null,   // 规则同上
        "port": null,       // 传输端口，ftp默认21，scp默认22，http默认3000
        "rootPrefix": "/var/www/html/"  // scp时传输的目录前缀，用来确认上传文件最终的地址，一个文件最终的地址会是rootPrefix + serverDir + projectPath + filePath，你可以根据自身server的配置来修改这个值
    },
	"output":{
		"cssImagesUrlReplace": true,//css中图片url加cdn替换
		"jsUrlReplace": true,//js文件的id和dependences是否添加cdn前缀
		"comboItemCount":2, //在同一个文件夹中，如果 js 或 css 文件数多于此数字，则会 combo
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

		"excludeFiles": "",//想要直接忽略的文件/文件夹，路径相对于当前项目根目录，以逗号分隔，例如："test,test.css"
	},

	"babel": {
		// 默认只启用基本转义 http://babeljs.io/docs/plugins/preset-es2015/
		"defaultPresets": [path.resolve(__dirname, "../node_modules/babel-preset-es2015")],
        "presets": [],
		"defaultPlugins": [],
        "plugins": []
	},

	// 插件  "jdf-cms"
	"plugins": []
}
