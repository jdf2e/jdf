# css优化策略

## combo策略

```
{%widget name="a"%}
{%widget name="b"%}
```

编译后

```
<link type="text/css" rel="stylesheet" href="http://cdn/??widget/a/a.css,widget/b/b.css" />
```

相关配置参数

```
"output":{		
	"comboItemCount":2, //在同一个文件夹中，如果js或css文件数多余次数字，则会 combo
	"cssCombo": true, //css进行combo
	"jsCombo": true, //js进行combo
}
```

## 压缩css代码

```
.test1{
    background: url(i/test1.png);
}
```

压缩后

```
.test1{background:url(i/test1.png)}
```

