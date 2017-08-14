'use strict';

const expect = require('expect.js');
const logger = require('jdf-log');
const escapeStringRegexp = require('escape-string-regexp');

const buildWidget = require('../lib/buildWidget');

let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="keywords" content=""/>
<meta name="description" content="" />
<title></title>
<link rel="stylesheet" type="text/css" href="//misc.360buyimg.com/jdf/1.0.0/unit/ui-base/1.0.0/ui-base.css" media="all" />
<script type="text/javascript" src="//misc.360buyimg.com/jdf/lib/jquery-1.6.4.js"></script>
<script type="text/javascript" src="//misc.360buyimg.com/jdf/1.0.0/unit/base/1.0.0/base.js"></script>
</head>
<body>
{%widget name="nav" %}
{%widget   data='{"portal_floor_id": 0}'
floorname="运营商-菜单"
name="menu"
cmsdata='{"floorclass": "floor-201707311537"}'%}
{%widget name="slide" %}
{%widget name="slide"%} <!-- comment -->
{%widget name="slide"%}
</body>
</html>`;

describe('测试buildWidget', function () {
    logger.level(-1);
    let widgetList = buildWidget.parseWidget(html);
    describe('查找并解析{%widget %}标签', function () {
        it('共有5个widget', function () {
            expect(widgetList.length).to.eql(5);
        });
        it('widget写在单行', function () {
            expect(widgetList[0].name).to.equal('nav');
            expect(widgetList[2].name).to.equal('slide');
            expect(widgetList[3].name).to.equal('slide');
            expect(widgetList[4].name).to.equal('slide');
        });
        it('widget属性分多行写', function () {
            expect(widgetList[1].name).to.equal('menu');
            expect(JSON.parse(widgetList[1].data).portal_floor_id).to.equal(0);
            expect(widgetList[1].text).to.equal(`{%widget   data='{"portal_floor_id": 0}'
floorname="运营商-菜单"
name="menu"
cmsdata='{"floorclass": "floor-201707311537"}'%}`);
        });
        it('widget相关文件名的正则检测', function () {
            let widgetInfo = {
                name: 'test.a'
            }
            let oBasename = 'test.a.a.js';
            let oBasename1 = 'test.a.js';
            let widgetNameReg = new RegExp(escapeStringRegexp(widgetInfo.name) + '\.\\w+$');
            expect(widgetNameReg.test(oBasename)).to.equal(false);
            expect(widgetNameReg.test(oBasename1)).to.equal(true);
        });
    });

});
