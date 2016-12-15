# jdf集成的weinre使用

[weinre](http://people.apache.org/~pmuellr/weinre/)是一个远程调试工具，可以在PC端的开发者工具中远程调试移动设备浏览器上的页面。
单独配置weinre比较麻烦，jdf集成weinre，提供一个简便的方式来使用weinre。

##使用步骤
####1、用`jdf build`或`jdf server`开启jdf服务
####2、在移动设备上打开调试页面
* 使用命令行控制台显示的`External`地址
* 或者扫描`jdf b -o`弹出页面上的二维码
####3、在PC浏览器上打开jdf服务管理界面
1. 使用命令行控制台显示的`UI External`地址
2. 选择管理界面左侧的Remote Debug
3. 开启Remote Debugger(weinre)开关
4. 点击开关下的Access remote debugger红色链接，弹出weinre调试界面
####4、使用weinre
1. 弹出的调试界面上有Targets、Clients，Server Properties三个属性
2. Targets，可调试的移动页面列表，检测不到显示none，如果检测不到看操作是否是按上述步骤进行的。
3. 点击Targets上需要调试的链接，变绿后选择Elements选项卡，把鼠标移到DOM节点上即可看到在移动设备上显示选中的框。
4. 完成上述步骤就可以像在F12中调试PC页面一样调试移动端页面了。

##使用不便的地方
* weinre的链接很脆弱，如果修改了本地文件，那么就需要重新执行上述步骤


