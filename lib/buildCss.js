"use strict";
/**
* @build less/sass to css
* @ctime 2014-3-5
*
* @less 文档 http://lesscss.org/#using-less-configuration syncImport
* @npm https://npmjs.org/package/less
* @Dist folder file size is big  ==> https://github.com/less/less.js/issues/1918
*
* @sass 文档 https://www.npmjs.org/package/node-sass
* @github https://github.com/andrew/node-sass
* @npm https://npmjs.org/package/node-sass
* @Compatibility @mixin has "};"   ==>  https://github.com/andrew/node-sass/issues/254
*
*/

const path = require('path');
const fs = require('fs');

//lib自身组件
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

const jdf = require('./jdf.js');
const fileLint = require('./fileLint.js');

//外部组件
const Sass = require('node-sass');
const Less = require('less');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

//exports
const buildCss = module.exports = {};

/**
 * @init
 */
buildCss.init = function (rSource, target) {
	var allTag = true;
	var source = f.realpath(rSource);
	if (!source) {
		return allTag;
	}

	if (f.isDir(source)) {
		fs.readdirSync(source).forEach(function (name) {
			if (name != '.' && name != '..' && !(/.svn/.test(name))) {
				allTag = buildCss.init(source + '/' + name, target + '/' + name) && allTag;
			}
		});
	} else if (f.isFile(source) && IsCssRelative(source)) {
		var sourceContent = f.read(source);
		var cssString = '';
		//为空 "node-sass": "0.9.3" 编译会报错 https://github.com/sass/node-sass/issues/381
		if (sourceContent == '') {
			return allTag;
		}

		target = $.getCssExtname(target);
		// less
		if ($.is.less(source) && jdf.config.build.less){
			try {
				Less.render(sourceContent, {filename: source, syncImport: true}, function (error, output) {
					if (error) {
						console.log(error);
					} else {
						if (jdf.config.build.csslint) fileLint.init(source);
						cssString = output.css;
						if (jdf.config.output.cssAutoPrefixer) {
							cssString = postCSSProcess(cssString.toString());
						}
						f.write(target, cssString);
					}
				});
			} catch (e) {
				console.log('jdf error [jdf.buildCss] - less\r\n'+source);
				console.log(e);
				return allTag;
			}
		}

		// sass
		if ($.is.sass(source) && jdf.config.build.sass){
			try {
				var css = Sass.renderSync({
					data: sourceContent,
					includePaths: [path.dirname(source)],
					// outputStyle: 'compressed'
					outputStyle: 'expanded'
				});
				if (jdf.config.build.csslint) fileLint.init(source);

				cssString = css.css;
				if (jdf.config.output.cssAutoPrefixer) {
					cssString = postCSSProcess(cssString.toString());
				}
				f.write(target, cssString);
			} catch (e) {
				console.log('jdf error [jdf.buildCss] - sass\r\n'+source);
				console.log(e);
				return allTag;
			}
		}

		// css
		if ($.is.css(source)) {
			cssString = sourceContent;
			if (jdf.config.output.cssAutoPrefixer) {
				cssString = postCSSProcess(cssString.toString());
			}
			f.write(target, cssString);
		}
		// because of less's async handle
		// if (jdf.config.output.cssAutoPrefixer) {
		// 	cssString = postCSSProcess(cssString.toString());
		// }
		// f.write(target, cssString);
	} else {
		allTag = false;
	}
	return allTag;
}

/**
 * Postcss processing entry
 * @param  {String} css     css string
 * @param  {Array} plugins  postcss plugins
 * @return css
 */
function postCSSProcess(css, plugins) {
	var plugins = plugins || [];
	return postcss([autoprefixer].concat(plugins))
	.process(css).css;
}
function IsCssRelative(source) {
	if (!($.is.less(source) || $.is.sass(source) || $.is.css(source))) {
		return false;
	}
	return true;
}
