define('a', function(require, exports, module) {
   var a = require('a'+1);
   var b = require('aaa');
});
define(function(require, exports, module) {
   var a = require('a'+1);
});
define('./a',function(require, exports, module) {
   var a = require('a');
});
define(['./a'],function(require, exports, module) {
   var a = require('a');
});
define('name1', a + './a',function(require, exports, module) {
   var a = require('a');
});
var a = 1;
require.async(a + './b'+1, function(b) {
   b.doSomething();
});
seajs.use('./a',function(){});
seajs.use('./a' + 1,function(){});
seajs.use(['./a']);
