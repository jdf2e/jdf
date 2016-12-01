"use strict";
/**
 * Created by wangshaoxing on 2014/12/12.
 */

const path = require('path');
const fs = require('fs');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

const compress = require('./compress.js');
const jdf = require('./jdf.js');

process.on('message', data=> {
        compress.init(
            data.task,
            data.isdebug,
            data.config
        ).then(val=>{
            process.send({ tag: 1, job: data.task });
        },err=>{
            process.send({ err: ex });
        });
});
process.send({ tag: 0, job: null });
