"use strict";

const path = require('path');
const fs = require('fs');
const axios = require('axios');

const logger = require('jdf-log');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const componentsData = require('./componentsData');
const install = module.exports = {};

install.download = function(componentName){
    const componentsDir = `${f.currentDir()}/components`;
    if(!f.exists(componentsDir)){
        f.mkdir(componentsDir);
    }

    if(!componentName){
        logger.error('you must type a component name.');
        return;
    }

    if(!componentsData[componentName]){
        logger.error(`the component ${componentName} is not exists.`);
        return;
    }

    var version = componentsData[componentName].version || '1.0.0';
    var componentPath = `${componentsDir}/${componentName}/${version}`;
    var downloadList = [];
    f.mkdir(componentPath);

    logger.info(`${componentName} is downloading.`);
    for(let url of componentsData[componentName].urls){
        let item = axios({
            url: url,
            method: 'get',
            responseType:'stream'
        })
        .then(response => {
            var basename = path.basename(url);
            response.data.pipe(fs.createWriteStream(`${componentPath}/${basename}`));
            logger.verbose(`${url} download success.`);
        })
        .catch(e => {
            logger.error(`${url} download fail.`);
        })
        downloadList.push(item);
    }

    axios.all(downloadList).then(() => {
        logger.info(`${componentName} download success.`);
        var configFile = `${f.currentDir()}/config.json`;
        f.readJSON(configFile, data => {
            if(!data.components){
                data.components = {};
            }
            data.components[componentName] = version;
            f.write(configFile, JSON.stringify(data, null , '    '));
        });
    })
    .catch(e => {
        logger.error(`${componentName} download fail.`);
    })
}

install.list = function(){
    var i = 1;
    let str = '';

    console.log('All components:');
    console.log(''.padEnd(68, '-'));
    for(let component in componentsData){
        str += `${component}`.padEnd(18);
        if(i % 4 == 0){
            console.log(str);
            str = '';
        }
        i++;
    }
    console.log(''.padEnd(68, '-'));
}

