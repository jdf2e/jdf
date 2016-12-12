'use strict';

module.exports = `
@font-face {font-family: "iconfont";
  src: url('https://raw.githubusercontent.com/jdf2e/jdf/master/lib/server/middlewareVFS/res.dirView/iconfont.eot?t=1481534148992'); /* IE9*/
  src: url('https://raw.githubusercontent.com/jdf2e/jdf/master/lib/server/middlewareVFS/res.dirView/iconfont.eot?t=1481534148992#iefix') format('embedded-opentype'), /* IE6-IE8 */
  url('https://raw.githubusercontent.com/jdf2e/jdf/master/lib/server/middlewareVFS/res.dirView/iconfont.woff?t=1481534148992') format('woff'), /* chrome, firefox */
  url('https://raw.githubusercontent.com/jdf2e/jdf/master/lib/server/middlewareVFS/res.dirView/iconfont.ttf?t=1481534148992') format('truetype'), /* chrome, firefox, opera, Safari, Android, iOS 4.2+*/
  url('https://raw.githubusercontent.com/jdf2e/jdf/master/lib/server/middlewareVFS/res.dirView/iconfont.svg?t=1481534148992#iconfont') format('svg'); /* iOS 4.1- */
}
.iconfont {
  font-family:"iconfont" !important;
  font-size:16px;
  font-style:normal;
  -webkit-font-smoothing: antialiased;
  -webkit-text-stroke-width: 0.2px;
  -moz-osx-font-smoothing: grayscale;
}
.icon-file:before { content: "\e66f"; }
.icon-wenjianjia:before { content: "\e7a0"; }

html, body, div, span, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, address, big, cite, code, del, em, font, img, ins, small, strong, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend {
  margin: 0;
  padding: 0;
}

body {
  font-family: Consolas,Microsoft YaHei,Arial,sans-serif;
  font-size: 16px;
  line-height: 1.42857143;
  color: #333;
  background-color: #fff;
  padding-top: 72px;
  background: #fff;
}

ol, ul {
  list-style: none;
}

a {
  color: #666;
  text-decoration: none;
}

.header-wrap {
  background: #eee;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  z-index: 999;
}

.page-header {
  margin: 0 auto;
  width: 100%;
  max-width: 960px;
  padding-left: 15px;
  padding-top: 8px;
  box-sizing: border-box;
}

.page-header .header-text {
  line-height: 40px;
  font-size: 18px;
}

.page-content {
  margin: 0 auto;
  width: 100%;
  max-width: 960px;
}

.dir-list-header {
  padding: 10px 15px;
  font-weight: bold;
  font-size: 14px;
}

.dir-list {
    padding-bottom: 100px;
}

.dir-list li {
  display: block;
  margin-top: 2px;
  box-sizing: border-box;
}

.dir-list li a {
  position: relative;
  display: block;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  border-radius: 4px;
  text-decoration: none;
}

.dir-list li a:hover {
  background-color: #eee;
  text-decoration: none;
  color: #333;
}

.dir-list li .icon {
  display: inline-block;
  margin-right: 5px;
}

.dir-list li .icon.i-dir {
  color: #ff6309;
}
`;
