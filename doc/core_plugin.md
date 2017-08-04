# 插件系统

## 目的
为jdf编译流程加入自定义的一些功能

## 可选插件
* [jdf-cms](https://www.npmjs.com/package/jdf-cms)
* [jdf-extract-template](https://www.npmjs.com/package/jdf-extract-template)

## 使用方法
### 插件集成
#### 本地安装
在jdf工程根目录下执行`npm install pluginName --save-dev`，方便快捷，但是每新建一个工程就需要重新install。

#### 全局安装
执行`npm install -g pluginName`全局安装后，环境变量中添加NODE_PATH，这样jdf就可以读取全局的plugin了

[如何添加NODE_PATH](https://stackoverflow.com/questions/15636367/nodejs-require-a-global-module-package)

### 添加到jdf配置
详见“config.json配置项说明”

## 暴露的编译节点
* 编译开始前`beforeBuild`
* 编译完成后`afterBuild`
* widget模板编译前`beforeTplRender`
* widget模板插入html页面前`beforeTplInsert`

后续可以提供更多的编译节点。

## `config.json`配置项说明
在json文件顶层新增plugins属性，plugins是一个数组列表，每一个数组元素为一个插件配置，插件配置可以直接写插件名，也可以以对象的形式传递，目前受到规范的只有`name`属性，代表了插件名。

插件在各个节点的执行顺序为plugins数组声明顺序

``` JSON
{
    "plugins": [
        {
            "name": "jdf-cms"
        },
        "jdf-extract-template"
    ]
}

```

## 插件约束
编写插件要遵循一些规范，以便被jdf模块系统初始化。
### 暴露方法
插件必须要暴露一个名为`Plugin`的函数，这个函数返回一个对象，对象里必须包含`setConfig`方法，该方法会在插件`require`到jdf中时第一时间执行，因此该方法也是插件的初始化方法，初始化工作可以放在这里执行。`setConfig`的`option`参数在下面单独说明。

除了`setConfig`方法以外，jdf编译节点钩子方法的声明也处于其中，可以只声明需要的钩子方法。

示例：
```
export const Plugin = function () {
    return {
        setConfig: function (option) {
            Object.assign(config, option || {})
        },
        beforeBuild: function () {
            return Promise.resolve()
        },
        afterBuild: function () {
            return Promise.resolve()
        },
        beforeTplRender: function (tpl, widgetInfo) {
            return tpl
        },
        beforeTplInsert: function (tpl, widgetInfo) {
            return tpl
        }
    }
}
```

## jdf提供属性
jdf工具提供了几个内部变量给插件使用。

通过`setConfig`传递。当前提供的属性有两个`jdf`, `VFS`，前者包含jdf配置项，后者为jdf的文件系统。
 