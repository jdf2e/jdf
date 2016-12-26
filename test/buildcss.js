'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect.js');

const VFS = require('../lib/VFS/VirtualFileSystem');
const buildCss = require('../lib/buildCss');

describe('测试编译css', function () {
    let cssfileDir = path.join(process.cwd(), 'test/vfs/files');
    describe('buildcss in VFS', function () {
        it('#handleLess', function (done) {
            let filename = path.join(cssfileDir, 'less.less');
            let vfile = VFS.queryFile(filename);
            let tContent = vfile.targetContent;
            buildCss.handleLess(vfile).then(function () {
                expect(tContent).not.to.equal(vfile.targetContent);
                done();
            });
        });
        it('#handleSass', function (done) {
            let filename = path.join(cssfileDir, 'sass.scss');
            let vfile = VFS.queryFile(filename);
            let tContent = vfile.targetContent;
            buildCss.handleSass(vfile).then(function () {
                expect(tContent).not.to.equal(vfile.targetContent);
                done();
            });
        });
        it('#postCSSProcess', function (done) {
            let filename = path.join(cssfileDir, 'css.css');
            let vfile = VFS.queryFile(filename);
            let tContent = vfile.targetContent;
            buildCss.postCSSProcess(vfile).then(function () {
                expect(tContent).not.to.equal(vfile.targetContent);
                done();
            });
        });
    });
});
