'use strict';

const cheerio = require('cheerio');
const walk = require('./walk');

const handler = module.exports = {};

handler.findEffectiveTag = function (ast, tagType) {
    let result = [];

    walk.dfs(ast, {
        text: function (node) {
            switch(tagType) {
                case 'widget':
                    result = result.concat(handler.extractWidget(node));
                    break;
                case 'widgetOutputName':
                    result = result.concat(handler.extractWidgetOutputName(node));
                    break;
            }
        }
    });
    return result;
}

handler.findWidget = function (html) {
    let ast = html;
    if (typeof html === 'string') {
        let $ = cheerio.load(html);
        if ($('body').length !== 0) {
            ast = $('body').get(0);
        } else {
            ast = $._root;
        }
    }
    return handler.findEffectiveTag(ast, 'widget');
}

handler.findWidgetOutputName = function (html) {
    let ast = html;
    if (typeof html === 'string') {
        let $ = cheerio.load(html);
        if ($('body').length !== 0) {
            ast = $('body').get(0);
        } else {
            ast = $._root;
        }
    }
    return handler.findEffectiveTag(ast, 'widgetOutputName');
}



handler.extractWidget = function (node) {
    let widgetReg = /{%widget .*?%}/gm;
    return node.data.match(widgetReg) || [];
}

handler.extractWidgetOutputName = function (node) {
    let outputNameReg = /{%widgetOutputName=.*?%}/gm;
    let result = node.data.match(outputNameReg) || [];
    return result;
}
