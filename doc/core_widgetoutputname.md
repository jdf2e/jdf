# widgetOutputName标签

## 介绍

widgetOutputName可以将页面中引用的`widget的js/css`内容合并，并在js文件夹或css文件夹中生成指定名称(myOutputName)的js/css文件，这样页面针对widget就只会引入一个资源文件。在服务器没有部署combo服务，或者前端需要频繁改动css文件时特别有用。

## 示例

```
 page1.html                               page1.html(jdf output --debug)
+-------------------------------------+  +----------------------------------+
| head                                |  | head                             |
| link.href=jdf/unit/2.0.0/base.css   |  | link.href=jdf/unit/2.0.0/base.css|
| /head                               |  | link.href=../css/myPureSource.css|
| body                                |  | /head                            |
| {%widget="pureWidget1"%}            |  | body                             |
| {%widget="pureWidget2"%}            +->|                                  |
| {%widget="pureWidget3"%}            |  | script.src=../js/myPureSource.js |
| {%widgetOutputName="myPureSource" %}|  | /body                            |
| /body                               |  |                                  |
|                                     |  |                                  |
|                                     |  |                                  |
+-------------------------------------+  +----------------------------------+
```

如果给widgetOutputName指定type属性(css或js)，那么只会将对应的type合并成myPureSource文件并引入。比如：

```
{%widgetOutputName="myPureSource" type="css" %}
```

那么生成的页面就只会引用myPureSource.css，而不会引用myPureSource.js，js依旧引用widget中的js。

## 如何在多个页面引用同一个widgetOutputName？

jdf会将各个页面设置的widgetOutputName都生成至./css目录中，因此，如果两个页面的widget不一致，而widgetOutputName同名的话，两个页面就会生成两个不同内容的css文件，就会导致后面生成的文件覆盖前面生成的文件。

从正常开发角度来说，如果两个页面引用了同名css，那么两个页面访问的css内容是一致的。如果想为每个页面单独生成一份独立的文件，请保证页面间widgetOutputName名不一致。如果想为页面引用同一个widgetOutputName，jdf也提供了一个配置选项。

jdf提供在`config.json`文件中配置一个全局widgetOutputName的能力。所有页面均可以引用这个全局widgetOutputName。

config.json

```
{
    "projectPath": "myProject",
    "widgetOutputName": "globalPureSource",
    "widgetOutputMode": 2, // 1: all widgets|2: white list|3: black list
    "widgetWhiteList": ["pureWidget1", "pureWidget3"],
    "widgetBlackList": ["pureWidget1", "pureWidget3"], 
}
```

myPage.html

```
{%widgetOutputName="globalPureSource" type="js,css" %}
```

我们在config.json中定义了widgetOutputName字段，同时提供三个控制字段：widgetOutputMode, widgetWhiteList, widgetBlackList来控制全局widgetOutputName的文件生成。

widgetOutputMode这个属性值可选`1|2|3`，1代表合并所有widget，2代表合并widgetWhiteList，3代表合并排除widgetBlackList的其他widget。
