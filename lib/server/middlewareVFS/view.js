'use strict';

const envConfig = require('./envConfig');
const dirView = require('./res.dirView');
const comboRes = require('./res.comboContent.js');
const notfound = require('./res.404.js');
const fileRes = require('./res.file.js');

const view = module.exports = {};
view.config = envConfig;

view.dirView = dirView;
view.comboRes = comboRes;
view.res404 = notfound.res404;
view.fileRes = fileRes;
