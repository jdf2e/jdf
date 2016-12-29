'use strict';
/**
 * 检查ast的node是不是所需的node
 */

const typeCheck = module.exports = {
    // seajs.use(node)
    calleeIsSeajsUse: function (node) {
        let ce = node.callee;
        return ce.type === 'MemberExpression' &&
            ce.object.name === 'seajs' &&
            ce.property.name === 'use';
    },
    calleeIsSeajsDefine: function (node) {
        let ce = node.callee;
        return ce.type === 'Identifier' &&
            ce.name === 'define';
    },
    calleeIsRequireAsync: function (node) {
        let ce = node.callee;
        return ce.type === 'MemberExpression' &&
            ce.object.name === 'require' &&
            ce.property.name === 'async';
    },
    calleeIsSeajsRequire: function (node) {
        let ce = node.callee;
        return node.type === "CallExpression" &&
            ce.type === "Identifier" &&
            ce.name === "require"
    }
};

