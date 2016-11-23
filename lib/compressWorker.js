"use strict";
/**
 * Created by wangshaoxing on 2014/12/12.
 */

const path = require('path');
const fs = require('fs');

//lib自身组件
const $ = require('jdf-file').base;
const f = require('jdf-file').file;
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
