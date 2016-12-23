'use strict';

const expect = require('expect.js');
const urlReplace = require('../../lib/urlReplace');
const jdf = require('../../lib/jdf.js');
const f = require('jdf-utils').file;

describe('replace url', function(){
    describe('comboUrlPath()', function(){
        it('comboUrlPath is ok', function(){
            var case01 = f.read('test/urlReplace/comboUrlPath/case01.html');
            var result01 = f.read('test/urlReplace/comboUrlPath/result01.html');

            expect(urlReplace.comboUrlPath(case01)).to.equal(result01);
        });
    });

    describe('js_cmd_define', function(){
        var source = '/Users/chenxiaochun/Documents/MyProject/jdf/build/jdf-test/widget/js_cmd_define/js_cmd_define.js';

        it('case01 is ok', function(){
            var case01 = f.read('test/urlReplace/js_cmd_define/case01.js');
            var result01 = f.read('test/urlReplace/js_cmd_define/result01.js');

            jdf.config.projectPath = 'jdf-test';

            expect(urlReplace.addJsDepends(source, case01)).to.equal(result01);
        });

        it('case02 is ok', function(){
            var case02 = f.read('test/urlReplace/js_cmd_define/case02.js');
            var result02 = f.read('test/urlReplace/js_cmd_define/result02.js');

            jdf.config.projectPath = 'jdf-test';

            expect(urlReplace.addJsDepends(source, case02)).to.equal(result02);
        });
    })
});
