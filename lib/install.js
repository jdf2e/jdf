"use strict";

const path = require('path');
const fs = require('fs');
const axios = require('axios');

const logger = require('jdf-log');
const jdf = require('./jdf.js');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const install = module.exports = {};

install.init = function(componentName, options){
    const componentsDir = `${f.currentDir()}/components`;
    if(!f.exists(componentsDir)){
        f.mkdir(componentsDir);
    }

    if(!componentName){
        logger.error('you must type a component name.');
        return;
    }

    axios.get('http://misc.360buyimg.com/jdf/1.0.0/componentsData.js')
    // axios.get('http://misc.360buyimg.com/jdf/1.0.0/ui/accordion/1.0.0/accordion.js')
        .then(response => {
            var data = JSON.parse(response.data);
            if(!data[componentName]){
                logger.error(`the ${componentName} is not exists.`);
                return;
            }

            var version = data[componentName].version || '1.0.0';
            var componentPath = `${componentsDir}/${componentName}/${version}`;
            var downloadList = [];
            f.mkdir(componentPath);

            logger.info(`${componentName} is downloading.`);
            for(let url of data[componentName].urls){
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
        })
        .catch(e => {
            logger.error('could not load the components data.');
        })
}

