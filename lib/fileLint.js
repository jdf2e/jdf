"use strict";
/**
 * @filellint
 * @ctime 2014-10-8
 */

var os = require('os');
var Htmllint = require('htmllint');
var Csslint = require('csslint').CSSLint;
var Jslint = require('atropa-jslint');

var $ = require('jdf-file').base;
var f = require('jdf-file').file;
var logger = require('jdf-log');

/**
 * @init
 * @param {String} filename 文件名称
 */
exports.init = function(filename){
	if(!typeof(filename) !== 'undefined'){
		if(f.isDir(filename)){
			var filelist = f.getdirlist(filename, '(html|vm|tpl|css|scss|less|js)$');

			filelist.forEach(function(file){
				route(file);
			});

		}else{
			route(filename);
		}
	}

	function route(file){
		var exists = f.exists(file);

		if($.is.httpLink(file)){
			httpLinkLint(file);
			return;
		}

		if(exists){
			if($.is.html(file) || $.is.vm(file) || $.is.tpl(file)){
				htmlLint(file);

			}else if($.is.css(file) || $.is.less(file) || $.is.sass(file)){
				cssLint(file);

			}else if($.is.js(file)){
				jsLint(file);

			}else{
				logger.warn('can not lint the [' + file + '].\n');
			}
		}else{
			logger.error(file + ' may be not exist.');
		}
	}
}

function htmlLint(filename){
	var content = f.read(filename);
	logger.info('jdf htmllint: ', filename);

	Htmllint(content).forEach(function(item, index){
		logger.info('#' + (index+1));
		logger.info('line: ' + item.line + ', column: ' + item.column);
		logger.info('msg: ' + item.msg);
	});
}

function cssLint(filename){
	var content = f.read(filename);
	var result = Csslint.verify(content);

	if(result && result.messages.length){
		var n = 0;
		var messagesType = function (type){
			 return type == 'error' || type == 'warning';
		}
		result.messages.forEach(function (message, i){
			var type = message.type;
			if(messagesType(type)){
				n += 1;
			}
		});

		logger.info('jdf csslint: ' + filename);

		result.messages.forEach(function (message, index){
			var type = message.type;

			if(messagesType(type)){
				logger.info('#'+(index+1));
                logger.info('line: ' + message.line + ', column: ' + message.col);
                logger.info('msg: ' + message.message);
                logger.info('at: ' + message.evidence);
            }
		});

	}else{
		logger.info('jdf csslint: ' + filename + ' is ok' );
	}
}

function jsLint(filename){
	var result = Jslint.JSLINT(f.read(filename));

    if(result) {
        logger.info(os.EOL+filename+' is OK.');
    }else{
        logger.info('jdf jslint: ' + filename);
        Jslint.JSLINT.errors.forEach(function (error, index) {
            if(error){
                logger.info('#'+(index+1));
                logger.info('line: ' + $.getVar(error.line) + ', column: ' + $.getVar(error.character));
                logger.info('msg: ' + $.getVar(error.reason));
                logger.info('at: ' + $.getVar(error.evidence).replace(/\t/g,''));
            }
        });
    }
}

function httpLinkLint(link){
	$.httpget(link, function(data){
		logger.info('jdf http-link-lint: ', link);
		Htmllint(data).forEach(function(item, index){
			logger.info('#' + (index+1));
			logger.info('line: ' + item.line + ', column: ' + item.column);
			logger.info('msg: ' + item.msg);
		});
	});
}
