'use strict';
const fs = require('fs');
const path = require('path');
const reply = require('../reply');

module.exports = function (req) {
    let body = req.body;
    
    if (!body.config) {
        return reply().message('config.json配置无效').failed();
    }

    let configpath = path.resolve(process.cwd(), 'config.json');
    try {
        let configjson = body.config;
        configjson = JSON.parse(configjson)
        fs.writeFileSync(configpath, JSON.stringify(configjson, null, 4));
        return reply().message('更新config.json成功，请重启jdf b生效').successful();
    } catch (e) {
        return reply().message(e.toString()).failed();

    }
}