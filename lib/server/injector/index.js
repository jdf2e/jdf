'use strict';
// TODO 可以从config.json里决定注入到哪个位置
const config = {
    inject: 'bodyStart' // bodyEnd, headStart, headEnd
}
const dumpSeajsCombo = require('./dumpSeajsCombo');

/**
 * server运行期间往html里注入脚本
 * @param {*} html 
 */
exports.injectHTML = function (html) {
    // injectors标准接口：getInjection:function, injectPosition:string
    let injectors = [dumpSeajsCombo];

    injectors.forEach(function (injector) {
        let scpt = injector.getInjection(),
            position = injector.injectPosition;
        
        switch (position) {
            case 'bodyStart': 
                html = html.replace(/(\<body.*\>)/, "$1" + scpt);
                break;
            case 'bodyEnd': 
                html = html.replace(/(\<\/body\>)/, scpt + "$1");
                break;
            case 'headStart': 
                html = html.replace(/(\<head.*\>)/, "$1" + scpt);
                break;
            case 'headEnd': 
                html = html.replace(/(\<\/head\>)/, scpt + "$1");
                break;
        }
    });

    return html;
}