'use strict';

const walk = module.exports = {};

walk.dfs = function (node, nodeHandlers) {
    if (!node) {
        return;
    }
    nodeHandlers = nodeHandlers || {};

    if (node.type === 'text' && typeof nodeHandlers[node.type] === 'function') {
        nodeHandlers[node.type](node);
    }

    if (node.type === 'root' || node.type === 'tag') {
        if (node.children && node.children.length > 0) {
            for (let child of node.children) {
                this.dfs(child, nodeHandlers);
            }
        }
    }

}
