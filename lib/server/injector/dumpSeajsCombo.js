'use strict';
function content() {
    if (seajs && seajs.config && typeof seajs.config === 'function') {
        seajs.config({comboExcludes: /\.js$/});
    }
}

exports.getInjection = function () {
    var target = content.toString().split(/\r\n|\n/);
    target = target.splice(1, target.length-2);
    return '<script>' + target.join('') + '</script>';
}

exports.injectPosition = 'bodyStart';