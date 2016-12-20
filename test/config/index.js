'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect.js');

const jdf = require('../../lib/jdf.js');
const config = jdf.config;

describe('读取配置文件', function () {
    let npmRoot = process.cwd();

    let userConfigPath = path.join(npmRoot, 'test/config/config.json');
    let userConfig = jdf.getUserConfig(userConfigPath);
    describe('jdf.getUserConfig()', function () {
        it('user projectPath in config.json should be test/1.0.1', function () {
            expect(userConfig.projectPath).to.equal('test/1.0.1');
        });
    });

    describe('jdf.mergeConfig()', function () {
        let env = path.join(npmRoot, 'test/config');
        process.chdir(env);
        let mergeConfig = jdf.mergeConfig();
        it('projectPath should be test/1.0.1', function () {
            expect(mergeConfig.projectPath).to.equal('test/1.0.1');
        });
        it('excludeFiles should be ["psd", "doc"]', function () {
            expect(mergeConfig.output.excludeFiles.length).to.equal(2);
            expect(mergeConfig.output.excludeFiles).to.eql(['psd', 'doc']);
        });
        process.chdir(npmRoot);
    });

    describe('jdf.init()', function () {
        let env = path.join(npmRoot, 'test/config');
        process.chdir(env);
        let mergeConfig = jdf.init();
        it('projectPath should be test/1.0.1', function () {
            expect(mergeConfig.projectPath).to.equal('test/1.0.1');
        });
        it('excludeFiles should be ["psd", "doc"]', function () {
            expect(mergeConfig.output.excludeFiles.length).to.equal(2);
            expect(mergeConfig.output.excludeFiles).to.eql(['psd', 'doc']);
        });
        it('jdf.currentDir should be ./test/config', function () {
            expect(jdf.currentDir.replace(/\\/g, '/')).to.match(/test\/config$/);
        });
        it('jdf.transferDir should be os.tmpdir() join jdf-temp/project/config', function () {
            expect(jdf.transferDir.replace(/\\/g, '/')).to.match(/\.jdf-temp\/project\/config$/);
        });
        it('jdf.outputDir should be relative to currentDir: build/test/1.0.1', function () {
            let relativePath = path.relative(jdf.currentDir, jdf.outputDir);
            expect(relativePath.replace(/\\/g, '/')).to.equal('build/test/1.0.1');
        });
        process.chdir(npmRoot);
    });
});
