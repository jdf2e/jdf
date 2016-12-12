"use strict";
/**
 * @filellint
 * @ctime 2014-10-8
 */

const os = require('os');
const Htmllint = require('htmllint');
const Csslint = require('csslint').CSSLint;
const Jslint = require('atropa-jslint');
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;
const logger = require('jdf-log');

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
				logger.warn('can not lint file ' + file);
			}
		}else{
			logger.error(file + ' may be not exist.');
		}
	}
}

function htmlLint(filename){
	var content = f.read(filename);
	console.log(filename);

	Htmllint(content).forEach(function(item, index){
        console.log(`\t${item.line},${item.column}\t${item.msg}`);
	});
    console.log();
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

		console.log(filename);

		result.messages.forEach(function (message, index){
			var type = message.type;

			if(messagesType(type)){
                // console.log('#'+(index+1));
                // console.log('line: ' + message.line + ', column: ' + message.col);
                // console.log('msg: ' + message.message);
                // console.log('at: ' + message.evidence);
                console.log(`\t${message.line},${message.col}\t${message.message}\t${message.evidence}`)
            }
		});

	}
	console.log();
}

function jsLint(filename){
	var result = Jslint.JSLINT(f.read(filename));

    if(!result) {
        console.log(filename);
        Jslint.JSLINT.errors.forEach(function (error, index) {
            if(error){
                // console.log('#'+(index+1));
                // console.log('line: ' + $.getVar(error.line) + ', column: ' + $.getVar(error.character));
                // console.log('msg: ' + $.getVar(error.reason));
                // console.log('at: ' + $.getVar(error.evidence).replace(/\t/g,''));
                console.log(`\t${$.getVar(error.line)},${$.getVar(error.character)}\t${$.getVar(error.reason)}`);
            }
        });
        console.log();
    }
}

function httpLinkLint(link){
	$.httpget(link, function(data){
		logger.info('http-link-lint: ', link);
		Htmllint(data).forEach(function(item, index){
			console.log('#' + (index+1));
			console.log('line: ' + item.line + ', column: ' + item.column);
			console.log('msg: ' + item.msg);
		});
	});
}
