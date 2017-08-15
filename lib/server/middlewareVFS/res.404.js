'use strict';

const res404 = module.exports = {};

res404.res404 = function () {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="keywords" content=""/>
<meta name="description" content="" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
<title>访问的资源不存在</title>
<link rel="icon" href="//jdf.jd.com/favicon.ico" mce_href="//jdf.jd.com/favicon.ico" type="image/x-icon">
</head>
<body style="text-align: center;">
<h1>404 Not Found</h1>
<hr>
<a href="/">返回主页</a>
</body>
</html>`;
}
