'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect.js');
const logger = require('jdf-log');

const VFS = require('../lib/VFS/VirtualFileSystem');
const buildOutputWidget = require('../lib/buildOutputWidget');

describe('测试widgetOutputName', function () {
    logger.level(-1);
    describe('查找并解析{%widgetOutputName %}标签', function () {
        it('单行注释标签返回{}', function () {
            let comment1 = '<!-- {%widgetOutputName="name1"%} -->';
            let info = buildOutputWidget.parseOutputName(comment1);
            expect(info).to.eql({});

            let comment2 = `<!-- {%widgetOutputName="name1"%} {%widgetOutputName="name2"%} -->`;
            let info2 = buildOutputWidget.parseOutputName(comment2);
            expect(info2).to.eql({});
        });
        it('多行注释标签返回{}', function () {
            let comment1 = `<!--
                {%widgetOutputName="name1"%}
                {%widgetOutputName="name2"%}{%widgetOutputName="name3"%}
                -->`;
            let info = buildOutputWidget.parseOutputName(comment1);
            expect(info).to.eql({});

            let comment2 = `<!--
                {%widgetOutputName="name1"%}
                {%widgetOutputName="name2"%}
                -->`;
            let info2 = buildOutputWidget.parseOutputName(comment2);
            expect(info2).to.eql({});
        });
        it('widgetOutputName标签解析', function () {
            let comment = `{%widgetOutputName="name1"%}`;
            let info2 = buildOutputWidget.parseOutputName(comment);
            expect(info2.name).to.equal('name1');
        });
        it('注释非注释写在一起', function () {
            let comment = `ap<p>aaab<a>www.jd.com</a></p>
                {%widgetOutputName="name1"%}
                <!-- {%widgetOutputName="name2"%} -->
                <div>ad</div>
                {%widgetOutputName="name3"%}
            `;
            let info2 = buildOutputWidget.parseOutputName(comment);
            expect(info2.name).to.equal('name1');
        });
        it('一个html文档', function () {
            let html = `<!DOCTYPE html>
                    <html>
                    <head>
                    <meta charset="utf-8">
                    <title></title>
                    <script type="text/javascript" src="//misc.360buyimg.com/jdf/lib/jquery-1.6.4.js"></script>
                    <link rel="stylesheet" type="text/css" href="//misc.360buyimg.com/css/browser-sync-watch.css">
                    </head>
                    <body>
                    <div class="style-in-html">write in html, yes changed....</div>
                    <!--
                    {%widget name="dir-web" data=""%}
                    {%widgetOutputName="output1" %}
                    {%widgetOutputName="output2" %} -->
                    {%widgetOutputName='output' %}
                    <!-- {%widgetOutputName="output3" %} -->
                    </body>
                    </html>`;
            let info = buildOutputWidget.parseOutputName(html);
            expect(info.name).to.equal('output');

        });
    });
});
