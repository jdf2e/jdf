"use strict";
/**
 * Created by wangshaoxing on 2014/12/12.
 */

const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const fork = require('child_process').fork;
const cpus = require('os').cpus();
const logger = require('jdf-log');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const jdf = require('../jdf');
const compress = require('./compress');

/**
 * compressScheduler 进程调度器
 */
let compressScheduler = module.exports = {};


/**
 * 获取文件夹中所有需要处理的文件
 * @param {string} folderPath
 * @returns {Array} tasks
 */
let getTasksArray = function (folderPath) {
    return shell.find(folderPath).filter(function (file) {
        let info = fs.statSync(file);
        if (info.isFile()) {
            return true;
        }
    });
}

/**
 * 子进程文件路径
 */
let childPath = path.normalize(__dirname + "/compressWorker.js");
/**
 * @param {string} srcDir
 * @returns Promise<any>
 */
compressScheduler.init = (srcDir, distDir) => {
    logger.profile('delete build-dir');
    shell.rm("-rf", distDir);
    logger.profile('delete build-dir');

    logger.profile('compress');
    let tasks = getTasksArray(srcDir);

    if (tasks.length <= cpus.length) {
        logger.info("tasks too few, using singleProcess");
        return compressScheduler.singleProcess(srcDir, distDir, tasks);
    }
    logger.info("using mutileProcess");
    return compressScheduler.mutileProcess(srcDir, distDir, tasks);


}


compressScheduler.mutileProcess = function (srcDir, distDir, tasks) {
    let promisePool = [];
    for (let i = 0; i < cpus.length; i++) {
        promisePool.push(new Promise((resolve, reject) => {
            let subProc = fork(childPath);
            subProc.jobDone = 0;
            subProc.on('message', data => {
                if (data.err) console.log(data);
                let task = tasks.pop();
                if (!task) {
                    subProc.disconnect()
                    resolve();
                } else {
                    logger.debug('compress file' + task);
                    let relativePath = path.relative(srcDir, task);
                    let distPath = path.join(distDir, relativePath)
                    shell.mkdir("-p", path.dirname(distPath))
                    subProc.send({
                        task: task,
                        config: jdf.config,
                        dist: distPath
                    });
                }
            });
        }));
    }
    return Promise.all(promisePool).then(v => {
        logger.profile('compress');
    })
}



/**
 * 以单进程方式 压缩文件
 */
compressScheduler.singleProcess = function (srcDir, distDir, tasks) {
    let promisePool = [];
    tasks.forEach((task, idx) => {

        let relativePath = path.relative(srcDir, task);
        let distPath = path.join(distDir, relativePath);
        shell.mkdir("-p", path.dirname(distPath))
        let singlePromise = compress.init(
            {
                task: task,
                config: jdf.config,
                dist: distPath
            }
        )
        promisePool.push(singlePromise);
    });
    return Promise.all(promisePool).then(val => {
    }, err => {
        console.log(err);
    })
}
