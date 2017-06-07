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
        it('comboUrlPath()', function(){
            var case01 = f.read('test/urlReplace/comboUrlPath/case01.html');
            var result01 = f.read('test/urlReplace/comboUrlPath/result01.html');

            expect(urlReplace.comboUrlPath(case01)).to.equal(result01.replace(/\r/ig, "").replace(/\n{2,}/ig, "\n"));
        });
    });

    describe('cssImagesUrlReplace()', function(){
        it('the case "i/a.png"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/test/i/a.png)');
        });

        it('the case "/i/a.png"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("/i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/i/a.png)');
        });

        it('the case "./i/a.png"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("./i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/test/i/a.png)');
        });

        it('the case "../i/a.png"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("../i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/i/a.png)');
        });

        it('the case "../../i/a.png"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("../../i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/i/a.png)');
        });

        it('the case ".test{background-image:url(\"i/a.png\")"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.cssImagesUrlReplace(source, '.test{background-image:url("i/a.png")')).to.equal('.test{background-image:url(http://misc.360buyimg.com/jdf-test/widget/test/i/a.png)');
        });

        it('the case "i/iconfont.eot?#iefix"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com';

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.css');

            expect(urlReplace.addSourceCdn(source, 'i/iconfont.eot?#iefix')).to.equal('http://misc.360buyimg.com/jdf-test/widget/test/i/iconfont.eot?#iefix');
        })
    });

    describe('addSourceCdn()', function(){

        it('the case “a.js and loadType is not require"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, 'a.js')).to.equal('http://misc.360buyimg.com/jdf-test/widget/test/a.js');
        });

        it('the case “a.js and loadType is require"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, 'a.js', 'require')).to.equal('http://misc.360buyimg.com/a.js');
        });

        it('the case “jdf/1.0.0/ui/dialog/1.0.0/dialog.js and loadType is require"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, 'jdf/1.0.0/ui/dialog/1.0.0/dialog.js', 'require')).to.equal('//misc.360buyimg.com/jdf/1.0.0/ui/dialog/1.0.0/dialog.js');
        });

        it('the case “jdf/1.0.0/ui/dialog/1.0.0/dialog.js and loadType is use"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, 'jdf/1.0.0/ui/dialog/1.0.0/dialog.js', 'use')).to.equal('//misc.360buyimg.com/jdf/1.0.0/ui/dialog/1.0.0/dialog.js');
        });

        it('the case “felibs/animate.css/3.5.2/animate.min.css"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, 'felibs/animate.css/3.5.2/animate.min.css')).to.equal('//misc.360buyimg.com/felibs/animate.css/3.5.2/animate.min.css');
        });

        it('the case “/a.js”', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, '/a.js')).to.equal('http://misc.360buyimg.com/jdf-test/a.js');
        });

        it('the case "./a.js"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, './a.js')).to.equal('http://misc.360buyimg.com/jdf-test/widget/test/a.js');
        });

        it('the case "../a.js"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, '../a.js')).to.equal('http://misc.360buyimg.com/jdf-test/widget/a.js');
        });

        it('the case "../../a.js"', function(){
            jdf.config.projectPath = 'jdf-test';
            jdf.config.cdn = 'http://misc.360buyimg.com'

            var source = $.pathJoin(process.cwd(), 'build', jdf.config.projectPath, 'widget/test/test.js');

            expect(urlReplace.addSourceCdn(source, '../../a.js')).to.equal('http://misc.360buyimg.com/jdf-test/a.js');
        });
    })
});
