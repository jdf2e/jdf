'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect.js');

const VFS = require('../lib/VFS/VirtualFileSystem');
const buildOutputWidget = require('../lib/buildOutputWidget');

describe('测试widgetOutputName', function () {
    describe('查找{%widgetOutputName %}标签', function () {
        it('单行注释标签', function () {
            // let comment1 = '<!-- {%widgetOutputName="name1"%} -->';
            // let info = buildOutputWidget.parseOutputName(comment1);
            // expect(info).to.eql({});

            // let comment2 = `<!-- {%widgetOutputName="name1"%} {%widgetOutputName="name2"%} -->`;
            // let info2 = buildOutputWidget.parseOutputName(comment2);
            // expect(info2).to.eql({});
        });
        it('多行注释标签', function () {
            let comment1 = `{%widgetOutputName="name2"%}{%widgetOutputName="name2"%}<!--
                {%widgetOutputName="name1"%}
                -->`;
            let info = buildOutputWidget.parseOutputName(comment1);
            //expect(info).to.eql({});

            // let comment2 = `<!--
            //     {%widgetOutputName="name1"%}
            //     {%widgetOutputName="name2"%}
            //     -->`;
            // let info2 = buildOutputWidget.parseOutputName(comment2);
            // expect(info2).to.eql({});
        });
    });
});
