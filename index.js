'use strict';

const path = require('path');
const program = require('commander');
const jdf = require('./lib/jdf.js');
const compress = require('./lib/compress.js');
const bs = require('./lib/server/browserSyncServer');
const widget = require("./lib/widget.js");
const upload = require('jdf-upload');
const lint = require('./lib/fileLint');
const format = require('./lib/fileFormat');
const f = require('jdf-utils').file;
const logger = require('jdf-log');

module.exports = {
	init: function (argv) {
		let config = jdf.init();
		if (config) {
			initCommandWithArgs(argv, config);
		}
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
		// 经debug发现，commander.js都会把options作为最后一个参数传递过来
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

function initCommandWithArgs(argv, config) {
	program
		.version(jdf.version())
		.usage('[commands] [options]')
		.option('-L, --logLevel [level]', `show more detail info. ['error', 'warn', 'info', 'verbose', 'debug', 'silly'] are candidates.`, 'info')
		.option('-v, --verbose', `show verbose info. a shortcut of '--logLevel verbose'`);

	// 所有命令入口初始化
	initInstall();
	initBuild();
	initOutput();
	initUpload(config);
	initWidget();
	initCompress();
	initClean();
	initServer();
	initLint();
	initFormat();
	initUncaught();

	program.parse(argv);

	if (argv.length <= 2) {
		program.help();
	}
}
/**
 * 初始化install命令
 */
function initInstall() {
	program
		.command('install [projectName]')
		.alias('i')
		.description('create new project with template or not')
		.option('-t, --template [name]', 'specify template name (widget|empty) [empty]', 'empty')
		.action(mergeOptions((projectName, options) => {
			var type = options.template;
			projectName = projectName || (type == 'widget' ? 'jdf_widget' : 'jdf_init');
			switch (type) {
				case 'widget':
					jdf.install('widget', projectName);
					break;
				case 'empty':
					jdf.install('init', projectName);
					break;
				default:
					console.log('You can "jdf install projectPath or "jdf install -t widget projectPath"');
			}
		}))
		.on('--help', function () {
			outputHelp([
				'$ jdf install myProj',
				'$ jdf install --template widget myProj'
			]);
		});
}

function initBuild() {
	program
		.command('build')
		.alias('b')
		.description('build project')
		.option('-o, --open', 'auto open html/index.html')
		.option('-C, --combo', 'combo debug for online/RD debug')
		.option('-c, --css', 'compile less/scss file in current dir')
		.option('-p, --plain', 'output project with plain')
		.action(mergeOptions((options) => {
			jdf.build(options);
		}))
		.on('--help', function () {
			outputHelp([
				'$ jdf build',
				'$ jdf build --combo',
				'$ jdf build --open',
				'$ jdf build --css',
				'$ jdf build --plain'
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

function initUpload(config) {
	program
		.command('upload [dir|file]')
		.alias('u')
		.description('upload local resources to remote sever')
		.option('-t, --type [name]', 'which transfer type to use (ftp|scp|http) [ftp]', 'http')
		.option('-d, --debug', 'uncompressed js,css,images for test')
		.option('-p, --preview', 'upload html dir to preview server dir')
		.option('-c, --nc', 'upload css/js dir to preview server dir use newcdn url')
		.option('-H, --nh', 'upload html dir to preview server dir use newcdn url')
		.option('-l, --list', 'upload file list from config.json to server')
		.action(mergeOptions((dir, options) => {
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
		.option('-a, --all', 'preview all local widgets')
		.option('-l, --list', 'get widget list from server')
		.option('-f, --force')
		.option('-p, --preview <widgetName>', 'preview a widget')
		.option('-i, --install <widgetName>', 'install a widget to local')
		.option('-P, --publish <widgetName>', 'publish a widget to server')
		.option('-c, --create <widgetName>', 'create a widget to local')
		.action(mergeOptions((options) => {
			options.force = options.force || false;
			if (options.all) {
				widget.all();
			}

			if (options.list) {
				widget.list();
			}

			if (options.preview) {
				widget.preview(options.preview);
			}

			if (options.install) {
				widget.install(options.install, options.force);
			}

			if (options.publish) {
				widget.publish(options.publish, options.force);
			}

			if (options.create) {
				widget.create(options.create);
			}
		}))
		.on('--help', function () {
			outputHelp([
				'$ jdf widget --all',
				'$ jdf widget --list',
				'$ jdf widget --preview myWidget',
				'$ jdf widget --install ui-header --force',
				'$ jdf widget --publish myWidget',
				'$ jdf widget --create myWidget'
			])
		});
}

function initCompress() {
	program
		.command('compress <srcPath> [destPath]')
		.alias('c')
		.description('compress js/css (jdf compress input output)')
		.action(mergeOptions((srcPath, destPath) => {
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
		.description('debug for online/RD debug')
		.action(function () {
			bs.startup();
		})
		.on('--help', function () {
			outputHelp(['$ jdf server']);
		});
}

function initLint() {
	program
		.command('lint [dir|file]')
		.alias('l')
		.description('file lint')
		.action(function (dir) {
			var filename = (typeof (dir) == 'undefined') ? f.currentDir() : dir;
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
			var filename = (typeof (dir) == 'undefined') ? f.currentDir() : dir;
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
			console.log('jdf error, invalid option: ' + env + '\nType "jdf -h" for usage.');
		});
}

function outputHelp(helpItems) {
	console.log('  Examples:');
	console.log('');
	helpItems.forEach(function (item) {
		console.log('    ' + item);
	})
}
