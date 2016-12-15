#jdf server

##简介
在本地开发时，需要利用谷歌插件辅助开发或需要调试ajax，jsonp，这个时候就需要将开发文件置于服务器中。
`jdf server | jdf s`命令用于开启一个静态服务器，类似[http-server](https://github.com/indexzero/http-server)，可以在任何目录即使该目录下不是JDF工程开启一个静态服务器。

##命令参数

* `--open` 或 `-o`，在开启静态服务器的同时，自动在浏览器中打开当前目录文件列表页面
* `--watch` 或 `-w`，监听当前目录的文件改动，并实时在浏览器中刷新改动内容
* `--help` 或 `-h`，查看jdf server帮助

##控制台信息

编译成功后，控制台中会打印如下信息：

    [JDFX] Access URLs:
     --------------------------------------
           Local: http://localhost:80
        External: http://192.168.191.1:80
     --------------------------------------
              UI: http://localhost:3001
     UI External: http://192.168.191.1:3001
     --------------------------------------

* `Local`，本地服务器地址
* `External`，同网段内其他机器访问地址，用于移动端访问
* `UI`，jdf服务器控制面板地址
* `UI External`，同网段内访问服务器控制面板地址，从这个入口可开启weinre，模拟网络限流等功能

## TIPS
* `jdf server`只提供静态服务和部分类型文件监听功能，不对任何文件进行编译，如果需要编译sass,es6,tpl，请使用[`jdf build`](a_tool_build.md)。
* 建议使用`jdf server`来做简单的原型开发，demo测试，开发项目选用`jdf build`。
* 利用`jdf server -w`开发过程中在浏览器实时预览静态文件的改动，解放F5。

## THANKS
* 感谢[browserSync](https://github.com/browsersync/browser-sync)提供底层服务支持

