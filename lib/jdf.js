"use strict";
/**
 * @jdf
 */
var path = require('path');
var util = require('util');
//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
var logger = require('jdf-log');

var Compress = require('./compress.js');
var Config = require("./config.js");
var BuildCss = require("./buildCss.js");
var BuildWidget = require("./buildWidget.js");
var BuildES6 = require('./buildES6.js');
var Output = require("./output.js");
var bs = require('./server/browserSyncServer');

//外部组件
var Node_watch = require('node-watch');

//define
var jdf = module.exports;

/**
 * @配置项
 */
jdf.config = Config;

/**
 * @总的初始化函数 from ../index.js
 * @commander
 */
jdf.init = function(cb) {
    //设置全局时间戳
    jdf.config.suffix = $.getTimestamp();

    //读取配置文件
    jdf.getConfig(function(configData) {
        // var cmd2 = argv[2];
        jdf.currentDir = f.currentDir();
        cb && cb(configData)
    });
};

jdf.build = function(options, callback) {
    if (options.css) {
        jdf.buildCss();
    }
    else {
        jdf.release(options, callback, 'build');
    }
}

jdf.release = function(options, callback, type) {
    var autoOpenurl = false,
        comboDebug = false;

    if (options.open) {
        autoOpenurl = true;
    }

    if (options.combo) {
        comboDebug = true;
    }

    jdf.bgMkdir();
    jdf.bgCopyDir();
    jdf.buildMain(type, options);

    //plain mode
    if(options.plain){
        var outputdirName = jdf.config.outputDirName;
        var outputdir = outputdirName+'/'+jdf.getProjectPath();
        f.copy(jdf.bgCurrentDir, outputdir);

        logger.info('jdf build plain success!');
    }else{
        var bsOptions = {
            autoOpen: autoOpenurl,
            port: jdf.config.localServerPort,
            watchDir: jdf.currentDir
        };
        bs.startup(jdf.bgCurrentDir, bsOptions, function (port) {
            if (!jdf.config.build.livereload) {
                return;
            }
            bs.watch(function (event, filename, reloadIt) {
                jdf.buildChangeFile(type, event, filename, reloadIt);
            });
        });
    }
}

jdf.output = function(dir, options, callback) {
    jdf.bgMkdir();
    f.del(jdf.bgCurrentDir, function() {
        jdf.bgCopyDir();
        jdf.buildMain('output');
        //默认
        var outputType = 'default',
            outputList,
            isbackup = false,
            isdebug = false;

        if(options.debug){
            isdebug = true;
        }

        if(dir){
            outputType = 'custom';
            outputList = dir;
        }else if (jdf.config.outputCustom) {
            outputType = 'custom';
            outputList = jdf.config.outputCustom;
        }

        try {
            Output.init({
                type: outputType,
                list: outputList,
                isdebug: isdebug,
                callback: callback
            });
        } catch (e) {
            logger.error(e);
        }

    });
}

/**
 * @读取jdf version
 */
jdf.version = function() {
    var pkg = require('../package.json');
    return pkg.version;
}

/**
 * @读取配置文件config.json, 覆盖默认配置
 */
jdf.getConfig = function(callback) {
    var res = null;
    var url = f.currentDir() + '/' + jdf.config.configFileName;
    if (f.exists(url)) {
        try {
            var data = f.read(url);
            if (data) {
                data = JSON.parse(data);
                if (typeof(data) == 'object') {
                    data = $.merageObj(jdf.config, data);
                }
                res = data;
            }
            if (callback) callback(res);
        } catch (e) {
            logger.error('config.json format error');
            if (callback) callback(res);
        }
    } else {
        if (callback) callback(res);
    }
}

/**
 * @工程后台文件夹生成
 * @jdf.bgCurrentDir 为后台文件根目录
 */
jdf.bgMkdir = function() {

    var list = ['LOCALAPPDATA', 'HOME', 'APPDATA'];
    var temp;
    for (var i = 0, len = list.length; i < len; i++) {
        if (temp = process.env[list[i]]) {
            break;
        }
    }
    if (temp) {
        temp = temp || __dirname + '/../';
        temp += '/.jdf-temp/';
        temp = path.normalize(temp);
        f.mkdir(temp);

        //创建文件夹
        var creatDir = function(filename) {
            var dir = path.normalize(temp + '/' + filename + '/');
            f.mkdir(dir);
            jdf[filename + 'Dir'] = dir;
        };

        //项目缓存文件夹
        creatDir('cache');
        //项目temp文件夹
        creatDir('temp');
        //项目lib文件夹
        //todo:自动从服务器下载最新版的jdj和jdm,现在是需要install手动下载
        creatDir('lib');
        //creatDir('jdj');
        //creatDir('jdm');

        creatDir('backup');

        //复制当前项目至temp文件夹(除outputdir)
        //取得当前工程名
        var currentDirName = path.basename(jdf.currentDir);
        jdf.bgCurrentDir = path.normalize(jdf.tempDir + '/' + currentDirName);

        jdf.bgCurrentDirName = currentDirName;
        f.mkdir(jdf.bgCurrentDir);
    }
}
/**
 * @复制当前项目至工程后台目录
 * @仅copy app,html,widget, config文件
 */
jdf.bgCopyDir = function() {
    if (jdf.config.baseDir != '' || jdf.config.outputCustom) {
        f.copy(jdf.currentDir + '/' + jdf.config.baseDir, jdf.bgCurrentDir + '/' + jdf.config.baseDir);
    }

    f.copy(jdf.currentDir + '/' + jdf.config.cssDir, jdf.bgCurrentDir + '/' + jdf.config.cssDir);
    f.copy(jdf.currentDir + '/' + jdf.config.imagesDir, jdf.bgCurrentDir + '/' + jdf.config.imagesDir);
    f.copy(jdf.currentDir + '/' + jdf.config.jsDir, jdf.bgCurrentDir + '/' + jdf.config.jsDir);

    f.copy(jdf.currentDir + '/' + jdf.config.htmlDir, jdf.bgCurrentDir + '/' + jdf.config.htmlDir);
    f.copy(jdf.currentDir + '/' + jdf.config.widgetDir, jdf.bgCurrentDir + '/' + jdf.config.widgetDir);
    f.copy(jdf.currentDir + '/' + jdf.config.configFileName, jdf.bgCurrentDir + '/' + jdf.config.configFileName);

}

/**
 * @屏幕打点器
 * @time 2014-3-14 07:08
 * @example
 *	begin: jdf.dot.begin()  end: jdf.dot.end();
 */
jdf.dot = {
    timer: null,
    begin: function() {
        this.date = new Date();
        process.stdout.write('.');
        this.timer = setInterval(function() {
            process.stdout.write('.');
        }, 1000);
    },
    end: function(haslog) {
        var haslog = typeof(haslog) == 'undefined' ? true : haslog;
        if (this.timer) {
            var date = new Date();
            clearInterval(this.timer);
            if (haslog) {
                logger.info('jdf spend ' + (date - this.date) / 1000 + 's');
            }
        }
    }
}

/**
 * @从服务器端下载文件 todo:检查版本号
 */
jdf.download = function(pathItem, targetDir, targetName) {
    var url = jdf.config[pathItem];
    var cacheDir = path.normalize(jdf.cacheDir + '/' + pathItem + '.tar');

    logger.info('jdf downloading');
    jdf.dot.begin();

    f.download(url, cacheDir, function(data) {
        if (data == 'ok') {
            f.tar(cacheDir, targetDir, function() {
                //强制改项目名同时修改config.json中的projectPath字段
                f.renameFile(path.resolve(targetDir, 'jdf_demo'), path.resolve(targetDir, targetName))
                var configFilePath = path.resolve(targetDir, targetName, 'config.json');
                f.readJSON(configFilePath, function(json) {
                    json.projectPath = targetName;
                    f.write(configFilePath, JSON.stringify(json, null, '\t'));
                    logger.info(targetName + ' install done');
                    jdf.dot.end(false);
                })
            });
        } else if (data == 'error') {
            jdf.dot.end(false);
        }
    })
}

/**
 * @从服务器端下载jdj, jdm, demo 或其它文件
 */
jdf.install = function(type, dir) {
    jdf.bgMkdir();

    /**
	widget模块安装走jdf widget -install widget/header
	jdf.download('jdj', jdf.libDir);
	jdf.download('jdm', jdf.libDir);
	*/
    if (type == 'widget') {
        jdf.download('demo', jdf.currentDir, dir);
    } else if (type == 'init') {
        jdf.createStandardDir(dir);
    }
}

/**
 * @检测路径是否为项目文件夹内路径 即 baseDir htmlDir widgetDir configFile
 * @param {String} filename 文件路径
 */
jdf.checkProjectDir = function(filename) {
    var dirname = filename.replace(jdf.currentDir, '');
    dirname = dirname.replace(/\\/, '');
    if (/^\//.test(dirname)) dirname = dirname.replace(/\//, '');

    var checkTag = false;
    var checkProjectDir = function(i, j) {
        var reg = new RegExp('^' + i);
        if (reg.test(j)) {
            return true;
        } else {
            return false;
        }
    }

    if (checkProjectDir(jdf.config.baseDir, dirname) || checkProjectDir(jdf.config.htmlDir, dirname) || checkProjectDir(jdf.config.widgetDir, dirname) || checkProjectDir(jdf.config.configFileName, dirname)) {
        checkTag = true;
    }
    return checkTag;
}

jdf.buildChangeFile = function (type, event, filename, reloadIt) {
    // 监听不仅仅是符合watch传递进来的通配符，还必须是以下几项的change，下一期改动可以去掉
    var regStr = '\\.(vm|tpl|shtml|html|smarty|js|css|less|sass|scss|json|babel|' + $.imageFileType() + ')$';
    var reg = new RegExp(regStr);

    if (f.isFile(filename)) {
        if (!reg.test(filename)) return;
    }

    var target = path.normalize(jdf.bgCurrentDir + '/' + filename.replace(jdf.currentDir, ''));
    if (jdf.checkProjectDir(filename)) {
        if (f.exists(filename)) {
            f.copy(filename, target, regStr);
            //only for build
            jdf.buildMain(type);
            reloadIt();
        } else {
            f.del(target);
        }
    }
}


/**
* @自动刷新
* @todo

	jdf.refresh = function(){

	}
*/

/**
 * @获取当前项目父级目录
 * @1. d:\product\index\trunk ===> d:\product/index
 * @2. d:\product\index\branches\homebranches ===> d:\product/index
 * @3. d:\product\index\homebranches ===> d:\product
 */
jdf.getProjectParentPath = function(currentDir) {
    var nowDir = '';
    if (/branches/.test(currentDir)) {
        nowDir = path.resolve(currentDir, '../', '../');
    } else if (/trunk/.test(currentDir)) {
        nowDir = path.resolve(currentDir, '../');
    }
    return nowDir;
}

/**
 * @获取项目前缀名字
 * @仅从配置文件中取,不再支持branch/trunk 2014-5-24
 * @del --> 1. d:\product\index\trunk ===> product/index
 * @del --> 2. d:\product\index\branches\homebranches ===> product/index
 * @del --> 3. d:\product\index\homebranches ===> product
 */
jdf.getProjectPath = function() {
    var currentDir = f.currentDir(),
        nowDir = '',
        result = '';
    if (jdf.config.projectPath != null) {
        result = jdf.config.projectPath;
    } else {
        //当前文件夹的文件夹命名为projectPath 2014-6-9
        result = path.basename(f.currentDir());
        /*
		nowDir = jdf.getProjectParentPath(currentDir);

		if (nowDir) {
			nowDir = nowDir.split(path.sep);
			var nowDirArrayLength = nowDir.length;
			result = nowDir[nowDirArrayLength-2] +'/'+ nowDir[nowDirArrayLength-1];
		}*/
    }
    return result;
}



/**
 * @当含有jdj jdm 模块时写放当前文件一次*/
var writeJMOnce = false;


/**
 * @build widget, css(sass, less)
 */
jdf.buildMain = function(type, param) {
    var builddir = '/' + jdf.config.buildDirName + '/';
    var basedir = jdf.currentDir + builddir;
    var encoding = jdf.config.output.encoding;
logger.profile('build all');
    //build css
    BuildCss.init(jdf.config.cssDir, jdf.bgCurrentDir + '/' + jdf.config.cssDir);
    BuildCss.init(jdf.config.widgetDir, jdf.bgCurrentDir + '/' + jdf.config.widgetDir);
logger.profile('build all');
    //build html
    if (f.exists(basedir)) {
        var basedirlist = f.getdirlist(basedir, '.html$');
        basedirlist.forEach(function(source) {
            var target = path.normalize(jdf.bgCurrentDir + builddir + source.replace(basedir, ''));
            BuildWidget.init(source, f.read(source), type, function(data) {
                if(f.excludeFiles(target)){
                    f.write(target, data.tpl, encoding);
                }

                if (writeJMOnce) {
                    f.write(source, data.origin, encoding);
                }
                return 'ok';

            }, param);
        });
    }

    // build ES6 code(.babel files)
    BuildES6.init(jdf.config.jsDir, jdf.bgCurrentDir + '/' + jdf.config.jsDir);
    BuildES6.init(jdf.config.widgetDir, jdf.bgCurrentDir + '/' + jdf.config.widgetDir);
}

/**
 * @项目工程目录初始化
 * @time 2014-2-19 10:21:37
 */
jdf.createStandardDir = function(dir) {
    var dirArray = [];
    dirArray[0] = jdf.config.baseDir;
    dirArray[1] = jdf.config.cssDir;
    dirArray[2] = jdf.config.imagesDir;
    dirArray[3] = jdf.config.jsDir;
    dirArray[4] = jdf.config.htmlDir;
    dirArray[5] = jdf.config.widgetDir;

    if(dir){
        dir += '/';
    }else{
        dir = 'jdf_init/';
    }

    for (var i = 0; i < dirArray.length; i++) {
        f.mkdir(dir+dirArray[i]);
    }

    var fileArray = [];
    fileArray[0] = jdf.config.configFileName;
    fileArray[1] = jdf.config.htmlDir + '/index.html';

    var templateDir = path.resolve(__dirname, '../template/');

    for (var i = 0; i < fileArray.length; i++) {
        if (!f.exists(fileArray[i])) f.write(dir+'/'+fileArray[i], f.read(templateDir + '/' + fileArray[i]));
    }
    logger.info('jdf project directory init done!');
}

/**
 * @清除项目缓存文件夹
 */
jdf.clean = function() {
    jdf.bgMkdir();
    f.del(jdf.tempDir, function() {
        logger.info('jdf cache dir clean done');
    });
}


/**
 * @在当前文件下编译less/sass
 */
jdf.buildCss = function() {
    logger.info('jdf buildCss ...');
    var currentDir = jdf.currentDir;
    BuildCss.init(currentDir, currentDir);

    var regStr = '\\.(less|sass|scss)$';
    var reg = new RegExp(regStr);

    Node_watch(currentDir, function(filename) {
        if (f.isFile(filename)) {
            if (!reg.test(filename)) return;
        }

        logger.info(filename.replace(currentDir, ''));
        BuildCss.init(currentDir, currentDir);
    });
}
