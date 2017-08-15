# 命令文档

## jdf init
* `jdf init xxx`，在本地初始化一个jdf的标准项目，目录结构如下所示。`xxx`可省略，省略后默认的项目名称为`jdf_init`
* `-c`或者`--current`，表示在当前目录初始化jdf工程，不会新建一个新的目录

<pre>
jdf_init
├── config.json      //jdf配置文件
├── css              
│    └── i           //css中的背景图片
├── html             //html文件夹
│    └── index.html  //项目的默认首页
├── js
├── widget           //页面中用到的所有widget
</pre>

## jdf build
执行此命令jdf会开启一个[本地服务](a_tool_build.md)用来构建项目，一般是用在项目的开发阶段。默认端口为`8080`，如果已被占用，系统会自动开启一个新的端口

* 此命令可简写为`jdf b`
* `-o`或者`--open`，开启本地服务的同时，自动在浏览器打开当前项目
* [详细说明](a_tool_build.md)

## jdf server
执行此命令，仅仅会在本地开启一个静态服务器，不会对文件进行任何编译构建，不依赖于jdf的标准目录结构，这也是它和`build`命令的区别所在

* 此命令可简写为`jdf s`
* `-o`或者`--open`，开启本地服务的同时，自动在浏览器打开当前项目
* `-w`或者`--watch`，监听当前目录的文件改动，并实时在浏览器中刷新改动内容
* [详细说明](a_tool_server.md)

## jdf output

编译当前项目，输出到`build`文件夹，所谓的『输出』，指的是jdf会自动做以下几件事情：

* 此命令可简写为`jdf o`
* 编译html文件中引用的[widget](core_widget.md)
* 编译less/sass文件为css
* 自动将html文件中使用`seajs.use`引用的js路径替换为cdn服务器的绝对路径
* 自动将html文件中引用的css，js相对路径替换为cdn服务器的绝对路径
* 自动给css文件中引用的背景图片添加cdn
* 自动给css样式添加浏览器前缀
    * 你只需要写纯css样式，不需要手动加浏览器前缀 
    * 根据当前浏览器的流行度和对当前css属性的支持度，自动添加相应的浏览器前缀
    * 添加的规则数据基于[caniuse](http://caniuse.com/)

```
a {
    display: flex;
}
```
```
a {
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex
}
```

* 压缩css、js、图片文件，并且可根据当前项目中的文件数量自动决定是否启用多线程进行压缩，当前的数量阀值是`200`
* 自动给js，css文件的内容头部添加时间戳，例如：
```css
/* jdf-test css_background_url.css Date:2016-12-13 18:33:13 */
```

* 自动对html文件中引用的css，js路径进行combo，例如以下两个js路径：
```html
<script src="http://misc.360buyimg.com/test/a.js"></script>
<script src="http://misc.360buyimg.com/test/b.js"></script>
```
进行combo之后为：
```html
<script src="http://misc.360buyimg.com/test/??a.js,b.js"></script>
```

* 生成精灵图[cssSprite](a_tool_csssprite.md)
* 生成base64编码

---

* `-d`或者`--debug`，以debug的模式输出当前项目，不压缩项目中的任何文件
* `-v`或者`--verbose`，将会详细输出当前项目每一个文件的编译信息。此参数特别适用于输出时卡死的情况，可以方便的查看问题出在了哪一个文件上
* `-p`或者`--plain`，只编译widget、less、scss，不做任何其它处理。此模式适用于页面是由前端开发，然后需要把页面交付给后端的同学来完成剩下的工作
* 支持输出指定的文件夹，例如：`jdf o js`
* 支持输出指定的文件，例如：`jdf o js/a.js`
* 支持简单的通配符，例如：`jdf o js/**/*.js`，将只输出`js`文件夹下所有的js文件

## jdf upload

把当前项目上传到测试服务器

* 可简写为`jdf u`
* 目前支持三种上传模式：ftp，sftp，http
* `-d`或者`--debug`，以debug的模式输出当前项目，不压缩项目中的任何文件
* `-p`或者`--plain`，只编译widget、less、scss，不做任何其它处理。此模式适用于前端同学仅仅做静态页面，然后把页面交付给后端的同学来完成剩下的工作
* `-P`或者`--preview`，将当前项目上传到`previewServerDir`配置的目录之下
* `-v`或者`--verbose`，将会详细输出当前项目每一个文件的编译信息。此参数特别适用于上传时卡死的情况，可以方便的查看问题出在了哪一个文件上
* 支持上传指定的文件夹，例如：`jdf u js`
* 支持上传指定的文件，例如：`jdf u js/a.js`
* 支持简单的通配符，例如：`jdf u js/**/*.js`，将只输出`js`文件夹下所有的js文件

## jdf widget

* 可简写为`jdf w`
* `-s` 或者 `--smarty`，创建widget时以smarty模板形式创建
* `-c xxx`或者`--create xxx`，创建一个widget
* `-P xxx`或者`--preview [xxx]`，预览指定的widget，当没有指定widget时，预览全部widget
* `-l xxx`或者`--list`，获取服务器上所有的widget列表
* `-p xxx`或者`--publish xxx`，发布widgt到服务器上
* `-i xxx`或者`--install xxx`，安装指定的widget到当前项目

## jdf lint

html、css、js文件代码质量检查工具，详细用法可点击[这里](a_tool_lint.md)

* 可简写为`jdf l xxx`，后面跟指定的文件夹/文件
* [详细说明](a_tool_lint.md)

## jdf format

html、css、js文件格式化工具，详细用法可点击[这里](a_tool_format.md)

* 可简写为`jdf f xxx`，后面跟指定的文件夹/文件
* [详细说明](a_tool_format.md)

## jdf compress

html、css、js文件压缩工具，详细用法可点击[这里](a_tool_deploy.md)

* 可简写为`jdf c xxx`，后面跟指定的文件夹/文件

## jdf clean

清理jdf缓存文件，遇到比较反常的现象时，可尝试执行此命令

## jdf -h

获取jdf的帮助信息

## jdf -V

获取jdf的当前版本号，注意是大写的`V`

## jdf参数配置文档

请参考：[jdf参数配置文档](a_tool_config.md)进行查阅。


