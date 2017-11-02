# api文档

## 安装使用

```javascript
npm install jdfx
```

```javascript
const jdfx = require('jdfx');

jdfx.build(port => {
    console.log(port);
});
```

## 方法说明

### jdf.server([options, callback])

```javascript
const jdfx = require('jdfx');

jdfx.server(() => {
    console.log('server is ok');
});
```

* `options`，当前服务配置
    * `open`，是否自动在浏览器中打开当前服务，默认为`false`
    * `watch`，是否实时监听当前项目的文件变动，默认为`false`
* `callback`，服务启动之后的回调函数

### jdf.build([options, callback])

```javascript
const jdfx = require('jdfx');

jdfx.build(port => {
    console.log(port);
});
```

* `options`，当前服务配置
    * `open`，是否自动在浏览器中打开当前服务，默认为`false`
* `callback`，服务启动之后的回调函数，当前参数为服务的端口号

### jdf.output([dir, options])

```javascript
const jdfx = require('jdfx');

jdfx.output();
```

* `dir`，指定需要单独输出的目录，类型为数组
* `options`，输出时的类型配置
    * `debug`，输出时不压缩文件，不对html文件中引用的资源进行combo，默认为`false`
    * `plain`，只对项目进行编译，不压缩文件，不对html文件中引用的资源进行combo，默认为`false`

### jdf.upload([dir, options])

上传的方法内部会默认调用`jdf.output()`方法，因此，不需要在上传之前单独调用输出方法

```javascript
const jdfx = require('jdfx');

jdfx.upload();
```

* `dir`，想要单独上传的文件目录，类型为数组
* `options`，上传时的配置参数
    * `type`，指定上传方式：`ftp|scp|http`，默认为`http`
    * `debug`，上传时不压缩文件，不对html文件中引用的资源进行combo，默认为`false`
    * `plain`，只对项目进行编译，不压缩文件，不对html文件中引用的资源进行combo，默认为`false`
    * `preview`，上传模版文件到服务器，默认为`false`

### jdf.clean()

清除当前项目的jdf缓存文件

### jdf.exit()

退出当前项目的jdf服务









