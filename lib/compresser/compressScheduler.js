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
let getTasksArray = function(folderPath) {
    return shell.find(folderPath).filter(function(file) {
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
    logger.profile('compress');
    let tasks = getTasksArray(srcDir);


    // 统计出所有费时的压缩任务数量
    let annoyingTaskCount = tasks.filter(item => {
        let reg = new RegExp(`\.(js|css|png|jpg|gif)$`, `ig`);
        if (item.match(reg)) {
            return true;
        }
    }).length;

    if (annoyingTaskCount <= jdf.config.compressThreadCrisis) {
        logger.info(`with a few tasks ${annoyingTaskCount} ,  => 1 process using`);
        return compressScheduler.singleProcess(srcDir, distDir, tasks);
    }

    logger.info(`too many tasks ${annoyingTaskCount} ,  => ${cpus.length} process using`);
    return compressScheduler.mutileProcess(srcDir, distDir, tasks);
}


compressScheduler.mutileProcess = function(srcDir, distDir, tasks) {
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
                    logger.verbose(`compress file: ${task}`);
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
compressScheduler.singleProcess = function(srcDir, distDir, tasks) {
    let singlePromise = Promise.resolve();
    tasks.forEach((task, idx) => {
        let relativePath = path.relative(srcDir, task);
        let distPath = path.join(distDir, relativePath);
        shell.mkdir("-p", path.dirname(distPath))
        singlePromise = singlePromise.then(e => {
            logger.verbose(`compress file: ${task}`);
            return compress.init({
                task: task,
                config: jdf.config,
                dist: distPath
            })
        });
        logger.verbose(`compress file: ${task}`);
    });
    return singlePromise.then(val => {
        logger.profile('compress');
    }, err => {
        console.log(err);
    })
}