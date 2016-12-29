'use strict';

const walk = module.exports = {};

walk.dfs(node, nodeHandlers) {
    if (!node) {
        return;
    }

    nodeHandlers = nodeHandlers || {};

    if (typeof nodeHandlers[node.type] === 'function') {
        nodeHandlers[node.type](node);
    }

    if (node.type === 'tag' && node.children && node.children.length > 0) {
        for (let child of node.children) {
            this.dfs(node, nodeHandlers);
        }
    }
}
