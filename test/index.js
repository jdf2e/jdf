'use strict';

const path = require('path');
const expect = require('expect.js');

require('./vfs/virtual-file');

const VFS = require('../lib/VFS/VirtualFileSystem');
// npm run test
const testDir = path.join(process.cwd(), './test');
VFS.setOriginDir(testDir);
VFS.setTargetDir(path.join(testDir, './build'));
VFS.addIgnore('build', 'dir');
VFS.readFilesInOriginDirSync();

describe('加载文件到VFS', function () {
    it('read files success', function () {
        expect(VFS.fileList.length).to.be.above(0);
    });
});

require('./config');

require('./buildcss');

require('./urlReplace');

require('./buildOutputWidget');


