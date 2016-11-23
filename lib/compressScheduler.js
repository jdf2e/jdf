"use strict";
/**
 * Created by wangshaoxing on 2014/12/12.
 */

const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const fork = require('child_process').fork;
const cpus = require('os').cpus();

//lib自身组件
const $ = require('jdf-file').base;
const f = require('jdf-file').file;
const jdf = require('./jdf.js');
const compress = require('./compress.js');

/**
 * compressScheduler 进程调度器
 */
let compressScheduler = module.exports = {};


/**
 * 获取文件夹中所有需要处理的文件
 * @param {string} folderPath
 * @param {bool} isdebug
 * @returns {Array} tasks
 */
let getTasksArray = function (folderPath, isdebug) {
    return shell.find(folderPath).filter(function (file) {
        return file.match(/\.(js|jpg|png|gif|css|html|scss|sass)$/);
    });
}
/**
 * @param {string} outputdirName
 * @param {bool} isdebug
 * @returns Promise<any>
 */
compressScheduler.init = (outputdirName, isdebug) => {
    let arr = getTasksArray(outputdirName);
    let childPath = path.normalize(__dirname + "/compressWorker.js");
    let threadCount = cpus.length;
    let promisePool = [];
    for (let i = 0; i < threadCount; i++) {
        promisePool.push(new Promise((resolve, reject) => {
            let subProc = fork(childPath);
            subProc.jobDone = 0;
            subProc.on('message', data => {
                if(data.err)console.log(data);
                let task = arr.pop();
                if (!task) {
                    subProc.disconnect()
                    resolve();
                } else {
                    subProc.send({
                        task: task,
                        isdebug: isdebug,
                        config: jdf.config
                    });
                }
            });
        }));
    }
    return Promise.all(promisePool);

    /**
     * wangshaoxing 2016-11-22
     * 下面这些是在单进程下 调试使用的代码. 误删..
     */

    // arr.forEach((val, idx) => {
    //     var singlePromise = compress.init(
    //         val,
    //         isdebug,
    //         jdf.config
    //     )
    //     promisePool.push(singlePromise);
    // });
    // return Promise.all(promisePool).then(val => {
    // }, err => {
    //     console.log(err);
    // })


}
