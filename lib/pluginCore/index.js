"use strict";

const jdf = require('../jdf');
const VFS = require('../VFS/VirtualFileSystem');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const logger = require('jdf-log');


const core = module.exports = {};

core.VFS = VFS;

core.plugins = [];

core.isAddedFromConfiguration = false;

// 增加plugin
core.addPlugin = function (pluginName) {
    if ($.isArray(pluginName)) {
        this.plugins = this.plugins.concat(pluginName)
    } else {
        this.plugins.push(pluginName);
    }
};

// 删除plugin
core.deletePlugin = function (pluginName) {
    this.plugins = this.plugins.filter(function (name) {
        return pluginName !== name
    });
};

core.excuteBeforeBuild = function () {
    let all = [];
    try {
        this.plugins.forEach(function(pluginName) {
            logger.verbose(`excute plugin ${pluginName} -> before build`);

            let plugin = require(pluginName).Plugin;

            if (typeof plugin.beforeBuild === 'function') {
                // plugin的执行环境需要切换到工程跟目录，遇到问题再改
                all.push(plugin.beforeBuild(jdf, VFS));
            }
            else {
                // TODO 配置编译前编译后的开关
                logger.warn(`插件${pluginName}没有beforeBuild方法`);
            }
        });
        return all;
    } catch (error) {
        return Promise.reject(error);
    }
}

core.addPluginFromConfiguration = function () {
    if (this.isAddedFromConfiguration) {
        logger.verbose(`have added the plugin to system`);
        return;
    }
    this.addPlugin(jdf.config.plugins);
}
