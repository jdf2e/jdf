'use strict';

const expect = require('expect.js');
const urlReplace = require('../../lib/urlReplace');
const f = require('jdf-utils').file;

describe('replace url', function(){
    describe('comboUrlPath', function(){
        it('comboUrlPath is ok', function(){
            var origin = f.read('test/urlReplace/comboUrl_origin.html');
            var result = f.read('test/urlReplace/comboUrl_result.html');

            expect(urlReplace.comboUrlPath(origin)).to.equal(result);
        });
    });
});
