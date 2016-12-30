'use strict';

const path = require('path');
const expect = require('expect.js');
const urlReplace = require('../../lib/urlReplace');
const jdf = require('../../lib/jdf.js');

const jdfUtils = require('jdf-utils');
const f = jdfUtils.file;
const $ = jdfUtils.base;

const VFS = require('../../lib/VFS/VirtualFileSystem');

describe('replace url', function(){
    describe('comboUrlPath()', function(){
        it('comboUrlPath is ok', function(){
            var case01 = f.read('test/urlReplace/comboUrlPath/case01.html');
            var result01 = f.read('test/urlReplace/comboUrlPath/result01.html');

            expect(urlReplace.comboUrlPath(case01)).to.equal(result01.replace(/\r/ig, "").replace(/\n{2,}/ig, "\n"));
        });
    });

    describe('cssImagesUrlReplace()', function(){
        it('the case "i/a.png" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/test/i/a.png)');
        });

        it('the case "/i/a.png" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("/i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/i/a.png)');
        });

        it('the case "./i/a.png" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("./i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/test/i/a.png)');
        });

        it('the case "../i/a.png" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("../i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/i/a.png)');
        });

        it('the case "../../i/a.png" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("../../i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/i/a.png)');
        });

        it('the case ".test{background-image:url(\"i/a.png\")" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/test/i/a.png)');
        });
    });

    describe('addSourceCdn()', function(){

        it('the case “a.js” is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, 'a.js')).to.equal('http://misc.360buyimg.com/jdf-test/widget/test/a.js');
        });

        it('the case “/a.js” is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, '/a.js')).to.equal('http://misc.360buyimg.com/jdf-test/a.js');
        });

        it('the case "./a.js" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, './a.js')).to.equal('http://misc.360buyimg.com/jdf-test/widget/test/a.js');
        });

        it('the case "../a.js" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, '../a.js')).to.equal('http://misc.360buyimg.com/jdf-test/widget/a.js');
        });

        it('the case "../../a.js" is ok', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, '../../a.js')).to.equal('http://misc.360buyimg.com/jdf-test/a.js');
        });
    })
});
