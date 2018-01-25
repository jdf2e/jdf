/**
 * 所有以 /jdf-api/{xxx**} 的路径均为服务端接口
 */
'use strict';
const reply = require('./reply');
const routes = {
    saveJdfConfig: require('./routes/saveJdfConfig')
}

exports.route = function (routePath, req) {
    var api = routePath.replace('/jdf-api/', '');
    var res = routes[api](req) || reply({}).message('请求接口错误，找不到该接口').failed();

    if (res.done) {
        return res.done();
    } else {
        return res;
    }
}
