'use strict';

const path = require('path');
const program = require('commander');
const jdf = require('./lib/jdf');
const logger = require('jdf-log');

module.exports = {
	init: function (argv) {
		jdf.init();
		initCommandWithArgs(argv);
	}
};

/**
 * 把一级命令的options转化成二级命令的options
 * @param fn
 * @returns {Function}
 */
function mergeOptions(fn) {
	return function () {
		const args = Array.prototype.slice.call(arguments);
		// commander.js会把options作为最后一个参数传递过来
		const lastArgv = args[args.length - 1];
		if (program.verbose) {
			lastArgv.logLevel = 'verbose';
		} else if (program.logLevel) {
			lastArgv.logLevel = program.logLevel;
		}
		logger.level(lastArgv.logLevel);
		fn.apply(null, args);
	}
}

function initCommandWithArgs(argv) {
	program
		.version(require('./package.json').version)
		.usage('[commands] [options]')
		.option('-L, --logLevel [level]', `show more detail info. ['error', 'warn', 'info', 'verbose', 'debug', 'silly'] are candidates.`, 'info')
		.option('-v, --verbose', `show verbose info. a shortcut of '--logLevel verbose'`);

	// 所有命令入口初始化
	initStandardDir();
	initBuild();
    initServer();
	initOutput();
	initUpload();
	initWidget();
	initLint();
    initCompress();
	initFormat();
    initClean();
	initUncaught();

	program.parse(argv);

	if (argv.length <= 2) {
		program.help();
	}
}
/**
 * 初始化init命令
 */
function initStandardDir() {
	program
		.command('init [projectName]')
		.alias('i')
		.description('create a new jdf project')
        .option('-c, --current', 'make this directory as a jdf project')
		.action(mergeOptions((projectName, options) => {
            jdf.createStandardDir(projectName, options);
		}))
		.on('--help', function () {
			outputHelp([
                '$ jdf init',
				'$ jdf init [projectName]'
			]);
		});
}

function initBuild() {
	program
		.command('build')
		.alias('b')
		.description('build project')
		.option('-o, --open', 'auto open html/index.html')
		.action(mergeOptions((options) => {
            jdf.checkValidDir();
			jdf.build(options);
		}))
		.on('--help', function () {
			outputHelp([
				'$ jdf build',
				'$ jdf build --open',
			])
		});
}

function initOutput() {
	program
		.command('output [dir...]')
		.alias('o')
		.description('output project')
		.option('-d, --debug', 'uncompressed js,css,images for test')
		.option('-p, --plain', 'output project by plain')
		.action(mergeOptions((dir, options) => {
            jdf.checkValidDir();
			jdf.output(dir, options);
		}))
		.on('--help', function () {
			outputHelp([
				'$ jdf output srcPath',
				'$ jdf output --debug --backup srcPath',
				'$ jdf output --plain'
			]);
		});
}

function initUpload() {
	program
		.command('upload [dir...]')
		.alias('u')
		.description('upload local resources to remote sever')
		.option('-t, --type [name]', 'which transfer type to use (ftp|scp|http) [ftp]', 'http')
		.option('-d, --debug', 'uncompressed js,css,images for test')
		.option('-p, --plain', 'output project by plain')
		.option('-P, --preview', 'upload html dir to preview server dir')
		.action(mergeOptions((dir, options) => {
            jdf.checkValidDir();
            const upload = require('jdf-upload');
			upload(dir, options, jdf);
		}))
		.on('--help', function () {
			outputHelp([
				'$ jdf upload',
				'$ jdf upload srcPath',
				'$ jdf upload --nc',
				'$ jdf upload --nh',
				'$ jdf upload --debug --preview srcPath'
			]);
		});
}

function initWidget() {
	program
		.command('widget')
		.alias('w')
		.description('create/install/preview/publish widgets')
        .option('-c, --create <widgetName>', 'create a widget to local')
        .option('-s, --smarty', 'create a smarty widget to local when use --create.')
		.option('-a, --all', 'preview all local widgets')
		.option('-l, --list', 'get widget list from server')
		.option('-i, --install <widgetName>', 'install a widget to local')
		.option('-p, --publish <widgetName>', 'publish a widget to server')
        .option('-f, --force', 'force corver when publish or install widget')
		.action(mergeOptions((options) => {
            jdf.checkValidDir();
            const widget = require('./lib/widget');
			options.force = options.force || false;
			if (options.all) {
				widget.all();
			}

            if (options.list) {
				widget.list();
			}

			if (options.install) {
				widget.install(options.install, options.force);
			}

			if (options.publish) {
				widget.publish(options.publish, options.force);
			}

			if (options.create) {
				widget.create(options.create, options.smarty);
			}
		}))
		.on('--help', function () {
			outputHelp([
                '$ jdf widget --create widgetName',
                '$ jdf widget --create widgetName --smarty',
				'$ jdf widget --all',
				'$ jdf widget --list',
				'$ jdf widget --install ui-header --force',
				'$ jdf widget --publish myWidget',
                '$ jdf widget --force'
			])
		});
}

function initCompress() {
	program
		.command('compress <srcPath> [destPath]')
		.alias('c')
		.description('compress js/css (jdf compress input output)')
		.action(mergeOptions((srcPath, destPath) => {
            const compress = require('./lib/urlReplace');
            compress.dir(srcPath, destPath);
		}))
		.on('--help', function () {
			outputHelp([
				'$ jdf compress ./js ./js-dest',
				'$ jdf compress ./css'
			])
		});
}

function initClean() {
	program
		.command('clean')
		.description('clean cache folder')
		.action(function () {
			jdf.clean();
		})
		.on('--help', function () {
			outputHelp(['$ jdf clean']);
		});
}

function initServer() {
	program
		.command('server')
		.alias('s')
        .option('-o, --open', 'auto open browser when server started successfully.')
        .option('-w, --watch', 'watch html file change and reload browser automatically.')
		.description('debug for online/RD debug')
		.action(mergeOptions((options) => {
            jdf.server(options);
		}))
		.on('--help', function () {
			outputHelp([
                '$ jdf server',
                '$ jdf server --open',
                '$ jdf server --watch',
                '$ jdf server -ow  auto open and watch html file change'
            ]);
		});
}

function initLint() {
	program
		.command('lint [dir|file]')
		.alias('l')
		.description('file lint')
		.action(function (dir) {
            const lint = require('./lib/fileLint');
			const filename = (typeof dir === 'undefined') ? process.cwd() : dir;
			lint.init(filename);
		})
		.on('--help', function () {
			outputHelp([
				'$ jdf lint file.js',
				'$ jdf lint ./src'
			]);
		});
}

function initFormat() {
	program
		.command('format [dir|file]')
		.alias('f')
		.description('file formater')
		.action(function (dir) {
            const format = require('./lib/fileFormat');
			const filename = (typeof dir === 'undefined') ? process.cwd() : dir;
			format.init(filename);
		})
		.on('--help', function () {
			outputHelp([
				'$ jdf format file.js',
				'$ jdf format ./src'
			]);
		});
}

function initUncaught() {
	program
		.command('*')
		.action(function (env) {
			console.log('jdf error, invalid option: ' + env + '\nType "jdf -h" for help.');
		});
}

function outputHelp(helpItems) {
	console.log('  Examples:');
	console.log('');
	helpItems.forEach(function (item) {
		console.log('    ' + item);
	})
}
