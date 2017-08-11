'use strict';
/**
 * @jdf
 */
const path = require('path');
const os = require('os');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');

//外部组件
const stripJsonComments = require('strip-json-comments');
const VFS = require('./VFS/VirtualFileSystem');

//define
const jdf = module.exports;

/**
 * @配置项
 */
jdf.config = require('./config.js');

/**
 * @当前运行命令
 */
jdf.currentCommand = '';

/**
 * @总的初始化函数 from ../index.js
 * @commander
 */
jdf.init = function () {
    //读取配置文件 如果没有 config.json 则直接退出。
    let jdfConfig = jdf.mergeConfig();
    if (!jdfConfig) {
        return false;
    }
    // 工程所在目录
    jdf.currentDir = path.normalize(f.currentDir());

    // 中转目录，现在的.jdf-temp/project/projectname。旧版本中的.jdf-temp/temp/projectname,
    jdf.transferDir = jdf.getTransferDir(path.basename(jdf.currentDir))
    jdf.transferDir = path.normalize(jdf.transferDir);

    // output输出目录
    jdf.outputDir = path.join(jdf.currentDir, jdf.config.outputDirName, jdf.config.projectPath);
    if (!path.relative(jdf.outputDir, jdf.currentDir)) {
        logger.error('output dir equal project dir, will cover project');
        return;
    }
    return jdfConfig;
};

jdf.build = function (options, callback) {
    logger.profile('build');

    var buildType = 'default';
    if (options.open) {
        buildType = 'open';
    }

    logger.profile('require build modules');
    const build = require('./build');
    logger.profile('require build modules');

    VFS.setOriginDir(jdf.currentDir);
    VFS.setTargetDir(jdf.outputDir);
    VFS.addIgnore(jdf.config.outputDirName, 'dir');

    VFS.readFilesInOriginDirSync();
    VFS.go().then(() => {
        return build.init({
            buildType: buildType,
            serverDir: jdf.transferDir,
            projectDir: jdf.currentDir,
            profileText: 'build'
        });
    }).then(() => {
        console.log('......');
    }).catch(err => {
        logger.error(err);
    });
}

jdf.server = function (options, callback) {
    const bs = require('./server/browserSyncServer');
    bs.startup('', {autoOpen: options.open}, function () {
        if (!options.watch) {
            return;
        }

        bs.watch({watcher: 'local'});
    });
}

jdf.output = function (outputList, options) {
    logger.profile('output');

    for(let source of outputList){
        if(!f.exists(source)){
            logger.error(`${source} is not found!`);
            return;
        }
    }

    var ignoreFiles = [];
    if (jdf.config.output.excludeFiles.length > 0) {
        ignoreFiles = jdf.config.output.excludeFiles.split(',');
    }

    var outputType = 'default';
    var outputCustom = jdf.config.outputCustom;

    if (options.debug) {
        outputType = 'debug';
    } else if (options.plain) {
        outputType = 'plain';
    }

    if (outputCustom.length > 0 && outputList.length == 0) {
        outputList = outputCustom.split(',');
    }

    VFS.setOriginDir(jdf.currentDir);
    VFS.setTargetDir(jdf.outputDir);
    VFS.addIgnore(jdf.config.outputDirName, 'dir');
    VFS.addIgnore(ignoreFiles, 'glob');

    VFS.readFilesInOriginDirSync(outputList);
    return VFS.go().then(function () {
        const output = require('./output');
        return output.init({
            outputType: outputType,
            outputList: outputList
        });
    }).then(() => {
        logger.profile('output');
    }).catch(err => {
        logger.error(err);
    });
}

// 中转目录，现在的.jdf-temp/project/projectname。旧版本中的.jdf-temp/temp/projectname,
jdf.getTransferDir = function (projectname) {
    return path.join(os.tmpdir(), '.jdf-temp/project', projectname);
}

/** 获取用户自定义的配置
 * return {object} userConfig
 */
jdf.getUserConfig = function (userConfigPath) {
    if (f.exists(userConfigPath)) {
        try {
            var data = f.read(userConfigPath);
            data = JSON.parse(stripJsonComments(data));
            if (typeof (data) == 'object') {
                return data;
            }
        } catch (e) {
            logger.error('config.json format error');
        }
    }
}

jdf.checkValidDir = function () {
   let isJDFDir = jdf.mergeConfig();
    if (!isJDFDir) {
        logger.error(`${f.currentDir()} is not a jdf root dir, please check the right path or use "jdf s -o" to run a local server.`);
        logger.info(`jdf exit.`);
        process.exit();
    }
}

/**
 * @读取配置文件config.json, 覆盖默认配置
 */
jdf.mergeConfig = function () {
    var userConfigPath = path.join(f.currentDir(), jdf.config.configFileName);
    var userConfig = jdf.getUserConfig(userConfigPath);
    if (userConfig) {
        return $.merageObj(jdf.config, userConfig);
    }
}

/**
 * @从服务器端下载文件 todo:检查版本号
 */
jdf.download = function (pathItem, targetDir, targetName) {
    var url = jdf.config[pathItem];
    var cacheDir = path.normalize(jdf.cacheDir + '/' + pathItem + '.tar');

    logger.info('jdf downloading');

    f.download(url, cacheDir, function (data) {
        if (data == 'ok') {
            f.tar(cacheDir, targetDir, function () {
                //强制改项目名同时修改config.json中的projectPath字段
                f.renameFile(path.resolve(targetDir, 'jdf_demo'), path.resolve(targetDir, targetName))
                var configFilePath = path.resolve(targetDir, targetName, jdf.config.configFileName);
                f.readJSON(configFilePath, function (json) {
                    json.projectPath = targetName;
                    f.write(configFilePath, JSON.stringify(json, null, '\t'));
                    logger.info(targetName + ' install done');
                })
            });
        }
    })
}

/**
 * @获取项目前缀名字
 * @仅从配置文件中取,不再支持branch/trunk 2014-5-24
 * @del --> 1. d:\product\index\trunk ===> product/index
 * @del --> 2. d:\product\index\branches\homebranches ===> product/index
 * @del --> 3. d:\product\index\homebranches ===> product
 */
jdf.getProjectPath = function () {
    var currentDir = f.currentDir(),
        nowDir = '',
        result = '';
    if (jdf.config.projectPath != null) {
        result = jdf.config.projectPath;
    } else {
        //当前文件夹的文件夹命名为projectPath 2014-6-9
        result = path.basename(f.currentDir());
    }
    return result;
}


/**
 * @项目工程目录初始化
 * @time 2014-2-19 10:21:37
 */
jdf.createStandardDir = function (dir, options) {
    // 如果准备在当前文件夹下创建jdf工程，则至少要保证不存在config.json
    if (!dir && options.current) {
        if (f.exists('./config.json')) {
            logger.error('This directory may already be a jdf project, please check if there is a `' + jdf.config.configFileName +'` file.')
            return;
        }
    }

    var dirArray = [];
    dirArray.push(jdf.config.cssDir);
    dirArray.push(jdf.config.imagesDir);
    dirArray.push(jdf.config.jsDir);
    dirArray.push(jdf.config.htmlDir);
    dirArray.push(jdf.config.widgetDir);

    if (dir) {
        dir += '/';
        if (options.current) {
            logger.warn('Ignored the --current option');
        }
    } else {
        if (options.current) {
            dir = './';
        } else {
            dir = 'jdf_init/';
        }
    }

    for (var i = 0; i < dirArray.length; i++) {
        f.mkdir(path.resolve(dir, dirArray[i]));
    }

    var fileArray = [];
    fileArray[0] = jdf.config.configFileName;
    fileArray[1] = path.join(jdf.config.htmlDir, 'index.html');

    var templateDir = path.resolve(__dirname, '../template/');

    for (var i = 0; i < fileArray.length; i++) {
        if (!f.exists(path.resolve(dir, fileArray[i]))) {
            f.write(path.resolve(dir, fileArray[i]), f.read(path.resolve(templateDir, fileArray[i])));
        }
    }
    logger.info('jdf project directory init done!');
}

/**
 * @清除项目缓存文件夹
 */
jdf.clean = function () {
    logger.profile('clean');
    const shell = require('shelljs');
    const tmpRootPath = path.resolve(os.tmpdir(), '.jdf-temp');
    shell.rm('-rf', tmpRootPath);
    logger.info('cache dir clean done');
    logger.profile('clean');
}
