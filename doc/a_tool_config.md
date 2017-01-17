# 配置文档

每一个项目的根目录都有一个独立的config.json配置文件，其详细配置如下：

* `"projectPath": null` - 工程目录前缀

* `"cssDir": "css"` - css文件夹名称

* `"imagesDir": "css/i"` - images文件夹名称

* `"jsDir": "js"` - js文件夹名称

* `"htmlDir": "html"` - html文件夹名称

* `"widgetDir": "widget"` - widget文件夹名称

* `"outputDirName": "build"` - 输出文件夹名称

* `"outputCustom": ""` - 自定义输出文件夹，以逗号分隔的字符串

* `"cdn": "//misc.360buyimg.com"` - 静态cdn域名

* `"serverDir": "misc.360buyimg.com"` - 上传至远端服务器文件夹的名称

* `"previewServerDir": "page.jd.com"` - html文件夹上传至服务器所在的文件夹名称

* `"widgetServerDir": "jdfwidget.jd.com"` - widget服务器所在的文件夹名称

* `"widgetOutputName": "widget"` - 全局widgetOutputName名称

* `"widgetOutputMode": 1` - 编译全局wigetOutputName模式，共三种：1: all widgets|2: white list|3: black list
    
* `"widgetWhiteList": []` - 指定白名单，在widgetOutputMode=2时，输出这个列表内容到widget.js/widget.css中

* `"widgetBlackList": []` - 指定黑名单，在widgetOutputMode=3时，排除这个列表的widget

* `"localServerPort": 80` - 本地服务器端口

* `"build"`
	* `"jsPlace": "insertBody"` - 调试时js文件位置 insertHead|insertBody
	
	* `"livereload":true` - 是否开启liveload
	
	* `"sass":true` - 是否开启sass编译
	
	* `"less":true` - 是否开启less编译
	
	* `"csslint": false` - 是否开启csslint

* `"upload"`
	* `"type": "http"` - 默认 ftp scp http
    * `"host": null` - 服务器的域名或者ip
    * `"user": null` - 上传时使用的用户名, ftp、scp需要，http不需要
    * `"password": null` - 规则同上
    * `"port": null` - 传输端口，ftp默认21，scp默认22，http默认3000
    * `"rootPrefix": "/var/www/html/"` - scp时传输的目录前缀，用来确认上传文件最终的地址，一个文件最终的地址会是rootPrefix + serverDir + projectPath + filePath，你可以根据自身server的配置来修改这个值

* `"output"`
	* `"cssImagesUrlReplace": true` - css中图片url加cdn替换

	* `"jsUrlReplace": false` - js文件的id和dependences是否添加cdn前缀
	
	* `"jsPlace": "insertBody"` - 编译后js文件位置 insertHead|insertBody
	
	* `"cssCombo": true` - css进行combo
	
	* `"jsCombo": true` - js进行combo todo

	* `"hasBanner": true` - 是否给js文件，css文件添加banner时间戳
	
	* `"compressJs":true` - 是否开启压缩js文件
	
	* `"compressCss":true` - 是否开启压缩css文件
	
	* `"compressPng":true` - 是否开启压缩png图片

	* `"cssSprite":true` - 是否开启css sprite功能
	
	* `"cssSpriteMode": 1` - 0: 将所有css文件中的背景图合并成一张sprite图片，1: 将每一个widget中的背景图分别合并成一张图片
	
	* `"cssSpriteMargin": 10` - css sprite图片之间的间距

	* `"cssSpriteDirection": vertical` - vertical：垂直合并，horizontal：水平合并

	* `base64: false` - 是否对图片进行base64编码

	* `excludeFiles: ""` - 输出时想要过滤的文件/文件夹，以逗号分隔的字符串："test", "build"

* `"babel"` - 默认只启用基本转义 http://babeljs.io/docs/plugins/preset-es2015/
	* `"defaultPresets": ["es2015"]`
	* `defaultPlugins": []`

		
