#Getting Started
##欢迎使用jdf。
jdf是一个前端工程框架，通过提供若干命令行，jdf可以创建工程，编译，在线调试，输出压缩代码等。
### 安装jdf
```
npm install -g jdfx
```
安装完成后运行`jdf -h`，查看jdf所有命令。

### 新建工程
* 使用`jdf init xxx`来创建一个符合jdf规范目录的工程，比如创建一个名为helloworld的工程：

```
jdf init helloworld
```

* `cd helloworld`进入工程根目录，在工程根目录下运行如下命令创建一个widget：

```
~/jd/web$ cd helloworld/
~/jd/web/helloworld$ jdf widget --create myWidget 
```

根据提示一直输入`y`，创建myWidget包含的文件，默认提供模板vm,脚本js,样式scss,数据json，这些都是可选的，更多关于widget的信息请参见[widget](core_widget.md).
下面的命令在没有指明的情况下，都在helloworld目录下运行。
* 创建widget后，得到的目录结构如下：
```
helloworld/
├── config.json
├── css
│   └── i
├── html
│   └── index.html
├── js
└── widget
    └── myWidget
        ├── component.json
        ├── myWidget.js
        ├── myWidget.json
        ├── myWidget.scss
        └── myWidget.vm
```

这样，一个jdf工程的创建就完成了。

###进入开发阶段
####引用widget到html页面
* 新建html/myPage.html文件
* 将myWidget引入myPage.html

```
<body>
{%widget name="myWidget" %}
</body>
```

利用`{%widget %}`标签引用widget，jdf在执行编译和输出命令时会将widget里的信息编译进来。当然，如果只需要引用widget的css和vm文件，那么可以加`type`属性：

```
{%widget name="myWidget" type="css, vm" %}
```

####编写widget内容
* 在`myWidget.vm`中输入：

```
<p class="p1">welcome <span>FEer</span></p>
<p class="p2">hope you enjoy jdf!</p>
```

* 在`myWidget.scss`中输入：

```
.p1 {
    font-size: 18px;
    span {
        color: blue;
    }
}
.p2 {
    color: red;
}
```

####启动开发调试模式
欢迎进入欢快的开发阶段！

* 运行`jdf build -o`，编译工程并自动打开浏览器，假设打开的网址为:
`http://192.168.191.1:8080`，
可以通过点击页面的文件路径一直跳转到:
`http://192.168.191.1:8080/html/myPage.html`

* myPage.html页面显示效果
<span style="font-size: 18px;">welcome <span style="color:blue">FEer</span></span>
<p style="color: red;">hope you enjoy jdf</p>

* 随意改动html,vm,js,scss文件，保存，可以在浏览器中看到改动同步刷新了。

你的项目开发进度良好！


#### 输出项目
项目开发完以后，需要将编译后的文件放到线上服务器或者CDN，因此需要输出项目内容。

执行`jdf output`，jdf默认会将项目输出到`build`目录中，如果在config.json配置了`projectPath`，那么就会输出到`build/projectPath`中，例如

```
projectPath: 'helloworld/1.0.0'
```

那么输出的目录结构为：

```
build/
└── helloworld
    └── 1.0.0
        ├── html
        │   └── index.html
        │   └── myPage.html
        └── widget
            └── myWidget
                ├── component.json
                ├── myWidget.css  // scss -> css
                ├── myWidget.js
                └── myWidget.json
```

恭喜你的项目开发完毕，让我们启动服务器试试输出的项目能不能工作吧！

#### 启动服务器
进入build/helloworld/1.0.0目录，运行`jdf server`命令，开启一个静态服务器来查看输出结果是否正确。

```
~/jd/web/helloworld/build/helloworld/1.0.0$ jdf server -o
```

由于`jdf output`会根据你在config.json文件中的配置定制输出，通过`jdf server`来查看这些配置是否会影响页面效果是很有必要的。

检查完毕，页面和预期完全一致

#### 上传到测试服务器测试
代码开发完毕，后端和业务方需要查看效果，这个时候就可以把代码上传到测试服务器，让大家都能访问。

jdf上传的测试服务器可以是基于HTTP、FTP、SFTP协议的服务器，在config.json中配置好服务器地址：

```
host: xx.xx.xx.93
```

然后执行：
```
jdf upload
```

这样就上传到测试服务器了，邀请团队的小伙伴来查看你的成果吧。

##结语
通过上述操作，你已经掌握jdf的主要功能，可以进行完整的工程开发了。jdf还有很多特性，我们也提供了完善的说明文档，欢迎探索。


