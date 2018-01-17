[![NPM](https://nodei.co/npm/jdfx.png?downloads=true)](https://nodei.co/npm/jdfx/)

[![NPM version](https://badge.fury.io/js/jdfx.png)](http://badge.fury.io/js/jdfx)  [![Build Status](https://travis-ci.org/jdf2e/jdf.svg?branch=master)](https://travis-ci.org/jdf2e/jdf)

## 关于JDFX

JDFX是京东前端团队自主研发的一款自动化构建工具，目的是合理、快速和高效的解决前端开发中的工程和项目问题，核心集成了本地调试、本地构建、远程布署、代码生成等一系列开发命令工具。

## 安装使用

* [nodejs@4.4.5到最新LTS版本可用](http://nodejs.org/)
```
$ npm install jdfx -g
```
* 执行`jdf -V`，测试是否安装成功（注意是大写的`V`）

## 更新日志

[完整日志](https://github.com/jdf2e/jdf/blob/master/CHANGELOG.md)

### 3.4.8  / 2018/01/17 18:40:00
* [fix] 修复github提示的安全风险
* [add] 支持{}对象为seajs的factory，比如`define('id', [], {})`

## 说明文档
* [示例安装](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_develop.md)
* [命令文档](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_command.md)
* [配置文档](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_config.md)
* [api调用文档](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_api.md)
* [css优化策略](https://github.com/jdf2e/jdf/blob/master/doc/core_css_optimize.md)
* [css雪碧图](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_csssprite.md)
* [smarty模版](https://github.com/jdf2e/jdf/blob/master/doc/core_smarty.md)
* [tpl模版](https://github.com/jdf2e/jdf/blob/master/doc/core_tpl.md)
* [vm模版](https://github.com/jdf2e/jdf/blob/master/doc/core_vm.md)
* [widget说明](https://github.com/jdf2e/jdf/blob/master/doc/core_widget.md)
* [widgetOutputName标签](https://github.com/jdf2e/jdf/blob/master/doc/core_widgetoutputname.md)
* [插件模块](https://github.com/jdf2e/jdf/blob/master/doc/core_plugin.md)

## 使用攻略
* [文件路径拼写说明](https://github.com/jdf2e/jdf/issues/6)
* [移动端页面开发](https://github.com/jdf2e/jdf/issues/7)

## 功能介绍

#### 跨平台
* 完美支持windows、mac、linux三大系统

#### 项目构建
* 生成标准化的项目文件夹
* 支持本地联调，本地编译，测试预览等开发流程
* 每个项目拥有独立的配置文件，按选项统一编译

#### 模块开发
* 可快速方便的对模块进行创建，引用，预览，安装和发布
* 通过积累，可形成完全符合自己业务的模块云服务
* 支持将vm和smarty模版编译为html
* 支持将sass和less编译为css
* 支持velocity语法
* 支持ES6(需要在jdf项目根目录执行`npm install babel-preset-es2015`，es6文件后缀名为`.babel`)

#### 项目输出
* 自动将页面中的js、css引用转换成combo请求格式
* 自动压缩优化js、css、图片文件
* 默认给所有静态资源添加CDN域名
* 支持cmd规范，自动提取文件id和dependencies，压缩时保留require关键字
* 自动生成css精灵图，并更新background-position属性值
* 自动生成base64编码
* 自动给css样式添加相应的浏览器前缀
* 支持图片生成webp格式，并更新相关css图片链接
* 压缩css、js、图片文件，并且可根据当前项目中的文件数量自动决定是否启用多线程进行压缩，当前的数量阀值是`200`
* 自动给js，css文件的内容头部添加时间戳，方便查看
* 文件编码统一输出为utf8

#### 项目联调
* 一键上传文件到测试服务器，方便其他同学开发预览

#### 本地服务
* 支持开启本地服务器，方便调试
* 支持本地静态文件预览，内置本地开发调试服务器，以及当前目录浏览
* 支持实时监听文件，文件被修改时会自动编译成css，并刷新浏览器
* 内置browserSync
* [详细文档](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_build.md)

#### 辅助工具
* 支持html/js/css文件格式化
* 支持html/js/css代码压缩
* 支持html/js/css文件lint，代码质量检查

## 集成工具

* [在本地任意目录开启一个server静态服务器](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_server.md)
* [html/js/css文件lint代码质量检查](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_lint.md)
* [html/js/css文件格式化](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_format.md)
* [csssprite图片合并](https://github.com/jdf2e/jdf/blob/master/doc/a_tool_csssprite.md)

## widget组件

* 详情请参考[widget文档](https://github.com/jdf2e/jdf/blob/master/doc/core_widget.md)
* [vm模版文档](https://github.com/jdf2e/jdf/blob/master/doc/core_vm.md)
* [tpl模版文档](https://github.com/jdf2e/jdf/blob/master/doc/core_tpl.md)
* [smarty模版文档](https://github.com/jdf2e/jdf/blob/master/doc/core_smarty.md)

## 编译器插件
* [Sublime Text2 插件](https://sublime.wbond.net/packages/Jdf%20-%20Tool)

