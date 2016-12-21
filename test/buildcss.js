'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect.js');

const VFS = require('../lib/VFS/VirtualFileSystem');

describe('测试buildcss', function () {
    let cssfileDir = path.join(process.cwd(), 'test/vfs/files');
    describe('buildcss in VFS', function () {
        it('read files success', function () {
            VFS.setOriginDir(cssfileDir);
            VFS.setTargetDir(path.join(cssfileDir, 'build'));
            VFS.readFilesInOriginDirSync();
            expect(VFS.fileList.length).to.be.above(0);
        });
        it('#handleLess', )
    });
});
