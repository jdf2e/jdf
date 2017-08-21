# widget说明

## 什么是widget

在一个比较大型的项目中，一定会拥有很多页面，页面之间会有很多相似的模块，我们就可以把这些功能相似或者样式相似的模块抽离出来，形成一个widget。在需要的html页面中引入即可，引用语法如下：

```
{%widget name="test"%}
```

在jdf工程中，创建一个widget使用`jdf widget --create xxx`命令，它会默认存在于当前项目的`widget`目录中，创建过程如下所示：

```
if you want to create it, type 'y', else 'n'
vm: y
js: y
scss: y
json: y
```

一个标准的`widget`模块会默认包含上面四种文件，并且文件名默认和当前`widget`同名。如果只想引用vm文件，使用语法：

```
{%widget name="test" type="vm"%}
```

只想引用css文件，使用语法：

```
{%widget name="test" type="css"%}
```

同时只引用`vm`和`css`文件，使用语法：

```
{%widget name="test" type="vm,css"%}
```

## vm文件

`vm`是widget的模版文件，可以把其扩展名自行改成`tpl`，默认都支持`velocity`，`smarty`等模版引擎，当然，你也可以直接在其中编写html代码。

## css文件

jdf默认创建的是scss文件，你可以使用less语法来编写css代码。

## js文件

在js文件中编写与此widget相关的js代码逻辑，支持使用ES6，jdf会自动编译成ES5。

## json文件

widget的数据文件，直接书写`json`数据结构，在`vm`模版中使用类似`${name}`或者`<%=name%>`语法即可引用，具体需要看你使用的是哪种模版语法。

## 相关命令

* `widget --preview [xxx]` - 预览所有项目中所有widget或部分widget
* `widget --install xxx` - 安装一个widget模块到当前工程
* `widget --publish xxx` - 发布一个widget模块到服务端
* `widget --create xxx` - 在本地项目新建一个widget,会生成widget文件夹和vm,css,js,json文件
* `widget --list` - 取得服务端所有widget列表

