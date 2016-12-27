'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const expect = require('expect.js');
const esr = require('escape-string-regexp');

const VFile = require('../../lib/VFS/VirtualFile');

describe('测试VFile', function () {
    describe('must be absolute path', function () {
        let relativePath = './files/css.css';
        it(`should return {}: ${relativePath} `, function () {
            let vfile = new VFile(relativePath);
            expect(vfile).to.eql({});
        });
        let absPath = path.join(process.cwd(), './test/vfs', relativePath);
        it(`should success: ${absPath}`, function () {
            let vfile = new VFile(absPath);
            expect(vfile.originContent.replace(new RegExp(esr(os.EOL), 'g'), '\n')).to.equal('.css {\n    display: flex;\n}');
        });
    });
});
