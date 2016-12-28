'use strict';

/**
 * 参考https://github.com/seajs/seajs/issues/266
 * 处理seajs的use，define，require的模块引用
 */

const path = require('path');
const lodash = require('lodash');
const logger = require('jdf-log');
const typeCheck = require('./type-check');

const replace = module.exports = {};

let defineStack = []; // define stack，包含{defineNode，name，elements}
let requireStack = [];
let useStack = []; // use stack: elements 里的对象
replace.currentDefine = {};
replace.defineStack = defineStack;
replace.useStack = useStack;

/**
 * 处理define() ==> define(name, [], function(){})
 * 处理的结果更新obj，并返回obj
 */
replace.handleDefine = function (callback) {
    for (let defineNode of defineStack) {
        for (let element of defineNode.elements) {
            let dependStr = this.getDependStr(element);

            if (!dependStr) {
                continue;
            }

            let handledObj = callback({str: dependStr, name: defineNode.name});
            defineNode.name = handledObj.name || '';
            this.setDependStr(element, handledObj.str);
        }

        let elements = lodash.cloneDeep(defineNode.elements);
        let args = defineNode.node.arguments;

        args.splice(0, args.length - 1);
        let arrayExp = {
            "type": "ArrayExpression",
            "elements": elements
        }
        args.unshift(arrayExp);
        if (defineNode.name) {
            args.unshift({
                "type": "Literal",
                "value": defineNode.name,
                "raw": "'" + defineNode.name + "'"
            });
        }
    }
}

replace.handleUse = function (callback) {
    for (let useNode of useStack) {
        let str = this.getDependStr(useNode);
        let handledStr = callback({str: str});
        this.setDependStr(useNode, handledStr.str);
    }
}


function searchLeft(node) {
    if (node.left) {
        return searchLeft(node.left);
    } else {
        return node;
    }
}

replace.getDependStr = function (node) {
    if (node.type === 'Literal') {
        return node.value;
    }

    if (node.type === 'BinaryExpression') {
        return searchLeft(node.left).value || '';
    }
}

replace.setDependStr = function (node, handledStr) {
    if (node.type === 'Literal') {
        node.value = handledStr;
        return;
    }

    if (node.type === 'BinaryExpression') {
        let leftNode = searchLeft(node.left);
        if (leftNode.value) {
            leftNode.value = handledStr;
            return;
        }
    }
}


replace.collectDefine = function (node) {
    // require 存入 requireStack;
    if (typeCheck.calleeIsSeajsRequire(node)) {
        logger.verbose(`push seajs require module to requireStack`);
        this.pushRequire(node);
    }

    // 遇到define 弹出所有require，生成defineObj，push到defineStack
    if (typeCheck.calleeIsSeajsDefine(node)) {
        let defineNode = this.genCurrentDefine(node);
        // 剔除不处于define模块里面的require
        let canBreak = false;
        while (requireStack.length > 0 && !canBreak) {
            let requireNode = requireStack[0];
            if (requireNode.start > defineNode.node.start && requireNode.end < defineNode.node.end) {
                canBreak = true;
            } else {
                requireStack.shift();
            }
        }
        defineNode.elements = defineNode.elements.concat(requireStack);
        requireStack = [];
        logger.verbose(`push seajs define module to defineStack`);
        defineStack.push(defineNode);
    }
}

/**
 * define(function(require, exports, module) {
 *    // 模块代码
 *    var a = require('./a');
 * });
 * or
 * define([elements], function(require, exports, module) {
 *    // 模块代码
 *    var a = require('./a');
 * });
 * to ==>
 * define(name, [elements], function(require, exports, module) {
 *    // 模块代码
 *    var a = require('./a');
 * });
 */
replace.genCurrentDefine = function (node) {
    if (!typeCheck.calleeIsSeajsDefine(node)) {
        return;
    }

    let normalizedNode = {
        node: node,
        name: '',  // string
        elements: [] // {type:Literal value: raw: }
    };

    let argsLength = node.arguments.length;
    let deps = {};
    if (argsLength === 2 && node.arguments[1].type === 'FunctionExpression') {
        deps = node.arguments[0];
    }
    else if (argsLength === 3 && node.arguments[2].type === 'FunctionExpression') {
        normalizedNode.name = node.arguments[0].value;
        deps = node.arguments[1];
    }

    if (deps.type === 'ArrayExpression') {
        normalizedNode.elements = normalizedNode.elements.concat(deps.elements);
    } else if (deps.type === 'Literal' || deps.type === 'BinaryExpression') {
        normalizedNode.elements.push(deps);
    }

    return normalizedNode;
}

replace.pushRequire = function (node) {
    if (!typeCheck.calleeIsSeajsRequire(node)) {
        return;
    }

    // require只可能含有一个Literal String，直接写进elements数组
    if (node.arguments.length === 1) {
        let args = node.arguments[0];
        if (args.type === 'BinaryExpression') {
            let val = searchLeft(args.left).value;
            if (!val) {
                return;
            }
        }
        requireStack.push(args);
    }
}

/**
 * require.async('./b', function(b) {
 *   b.doSomething();
 * });
 * ==>
 * require.async(['path/b'], function(b) {
 *   b.doSomething();
 * });
 */
replace.collectRequireAsync = function (node) {
    if (!typeCheck.calleeIsRequireAsync(node)) {
        return;
    }

    const argsLength = node.arguments.length;
    if (argsLength === 0) {
        return;
    }

    const firstNode = node.arguments[0];
    if (firstNode.type === 'ArrayExpression') {
        for (let child of firstNode.elements) {
            useStack.push(child);
        }
    }
    else if (firstNode.type === 'Literal' || firstNode.type === 'BinaryExpression') {
        useStack.push(firstNode);
    }
}

/**
 * seajs.use('./a');
 * seajs.use('./a', function(a) {a.doSomething();});
 * seajs.use(['./a', './b'], function(a) {a.doSomething();});
 * ==>
 * seajs.use(['path/a', 'path/b'], function(a) {a.doSomething();});
 */
replace.collectUse = function (node) {
    if(!typeCheck.calleeIsSeajsUse(node)) {
        return;
    }

    const argsLength = node.arguments.length;
    if (argsLength === 0) {
        return;
    }

    const firstNode = node.arguments[0];
    if (firstNode.type === 'ArrayExpression') {
        for (let child of firstNode.elements) {
            useStack.push(child);
        }
    }
    else if (firstNode.type === 'Literal'  || firstNode.type === 'BinaryExpression') {
        useStack.push(firstNode);
    }
}
