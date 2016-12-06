'use strict';
const expect = require('expect.js');
const path = require('path');
const os = require('os');
const utils = require('jdf-utils');
const f = utils.file;
const VFile = require('../lib/VFS/VirtualFile.js');

describe('VFile', () => {
    describe('originPath is relative', () => {
        let relativeVMPath = './widget/jdf_vfs_virtualfile/jdf_vfs_virtualfile.vm';
        let vfile = new VFile(relativeVMPath);
        it('should return {} when new VFile(relativeVMPath)', () => {
            expect(vfile).to.eql({});
        });
    });

    describe('originPath is not found', () => {
        let cwd = process.cwd();
        let smartyPath = cwd + '/widget/jdf_vfs_virtualfile/jdf_vfs_virtualfile.smarty';
        smartyPath = path.normalize(smartyPath);
        let vfile = new VFile(smartyPath, '');

        it('should _originContent equal \'\'', () => {
            expect(vfile._originContent).to.equal('');
        });
        it('should originContent equal undefined', () => {
            expect(vfile.originContent).to.equal(undefined);
        });
        it('then should _originContent equal undefined', () => {
            expect(vfile._originContent).to.equal(undefined);
        });
        it('should _fetched equal true', () => {
            vfile.originContent;
            expect(vfile._fetched).to.be(true);
        });
    })

    let relativeVMPath = process.cwd() + '/widget/jdf_vfs_virtualfile/jdf_vfs_virtualfile.vm';
    let absPath = path.normalize(relativeVMPath);
    let vmcontent = '<div id="h" class="ss">' + os.EOL
                    + '    <p>write in vm, try to change color</p>' + os.EOL
                    + '    <p>${name}</p>' + os.EOL
                    + '</div>' + os.EOL;
    describe('read originContent', () => {
        let vfile = new VFile(absPath);
        it('should have originContent', () => {
            expect(vfile.originContent).to.match(/[a-z0-9]/i);
            expect(vfile.originContent).to.equal(vmcontent);
        });
        it('should be string', () => {
            expect(vfile.originContent).to.be.a('string');
            expect(vfile.originContent.length).to.be.above(0);
        });
    });

    describe('read targetContent', () => {
        let vfile = new VFile(absPath);

        it('should targetPath equal originPath if targetPath not changed manually.', () => {
            expect(vfile.targetPath).to.equal(vfile.originPath);
        });
        it('should have targetContent', () => {
            expect(vfile.targetContent).to.match(/[a-z0-9]/i);
            expect(vfile.targetContent).to.equal(vmcontent);
            expect(vfile.targetContent).to.equal(vfile.originContent);
            expect(vfile._fetched).to.be(true);
        });

    });

    describe('set originContent', () => {
        let vfile = new VFile(absPath);

        it('changed manually, then not read the file anymore', () => {
            vfile.originContent = 'changed';
            expect(vfile._fetched).to.be(true);
            expect(vfile.originContent).to.equal('changed');
            expect(vfile.originContent).not.to.equal(f.read(vfile.originPath));
        });
    });

    describe('set targetContent', () => {
        let vfile = new VFile(absPath);

        it('changed manually, then not copy from originContent anymore', () => {
            vfile.targetContent = 'changed';
            expect(vfile._fetched).to.be(true);
            expect(vfile.targetContent).to.equal('changed');
            expect(vfile.targetContent).not.to.equal(vmcontent);
            expect(vfile.targetContent).not.to.equal(vfile.originContent);
        });
    });

    describe('fetch method', () => {
        let emptyvfile = new VFile();

        it('fetch should not have side effect', () => {
            emptyvfile.fetch();
            expect(emptyvfile._fetched).to.be(true);
            expect(emptyvfile.originContent).to.equal(undefined);
        });

        let vfile = new VFile(absPath);

        describe('fetched', () => {
            vfile.fetch();
            it('should _originContent equal vmcontent', () => {
                expect(vfile._originContent).to.equal(vmcontent);
            });
            it('should _targetContent equal undefined', () => {
                expect(vfile._targetContent).to.equal(undefined);
            });
            it('should targetContent equal vmcontent', () => {
                expect(vfile.targetContent).to.equal(vmcontent);
                expect(vfile.targetContent).to.equal(vfile.originContent);
            });
            it('should _targetContent equal vmcontent now', () => {
                expect(vfile._targetContent).to.equal(vmcontent);
                expect(vfile._targetContent).to.equal(vfile.originContent);
            });
        });
    });

    describe('get and change type', () => {
        let vfile = new VFile(absPath);

        it('should origin type equal vm', () => {
            expect(vfile.getType()).to.equal('vm');
        });
        it('should targetType equal vm', () => {
            console.log(vfile.getTargetType());
            expect(vfile.getTargetType()).to.equal('vm');
        });
        describe('change .vm to .tpl', () => {
            let vfile = new VFile(absPath);
            vfile.changeTargetType('tpl');
            it('should targetPath not equal originPath', () => {
                expect(vfile.originPath).not.to.equal(vfile.targetPath);
            });
            it('should targetPath\'s extname equal tpl', () => {
                expect(path.extname(vfile.targetPath)).to.equal('.tpl');
            });
            it('should vm.vm.vm -> vm.vm.tpl', () => {
                expect(VFile.changeType('tpl', 'vm.vm.vm')).to.equal('vm.vm.tpl');
            });
        })
    });

});
