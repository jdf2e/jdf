const UglifyJS = require("uglify-js");
const shelljs = require('shelljs');
const path = require('path');
//jdf-lib
const jdfUtils = require('jdf-utils');
const $ = jdfUtils.base;
const f = jdfUtils.file;

module.exports = {
    /**
     * 压缩 js 字符串
     * @param {string} source  js string
     */
    jsSourceMinify: function (source) {
        var options = {
            remove: [], //
            except: ['require', 'define'], //不压缩的字符名
            ascii_only: true, //输出Unicode characters
            beautify: false, //美化代码
            warnings: false //显示压缩报错
            //,mangle: false//是否压缩 失效的参数
        };

        if (config.output.jsRemove) {
            options.remove = config.output.jsRemove;
        }

        var result = '';

        //parse
        UglifyJS.base54.reset();
        var toplevel = UglifyJS.parse(source);
        toplevel.figure_out_scope();
        var compressorOption = {
            hoist_funs: false, //函数声明至顶端
            //fromString: true,  //说明代码源的格式是否为字符串
            //mangle: true,      //是否压缩,只要配置就不压缩了
            warnings: false, //显示压缩报错
            join_vars: false
        }
        if (options.warnings) {
            compressorOption.warnings = options.warnings;
        }

        //remove console.log
        var matchRemoveOption = function (host, method) {
            return !options.remove.every(function (element) {
                if (element.indexOf(".") == -1) {
                    return element != host;
                }
                return element != host + '.' + method;
            });
        }
        var removeConsoleTransformer = new UglifyJS.TreeTransformer(function (node, descend) {
            if (node instanceof UglifyJS.AST_Call) {
                var host, method;
                try {
                    host = node.expression.start.value;
                    method = node.expression.end.value;
                } catch (err) {

                }

                if (host && method) {
                    if (matchRemoveOption(host, method)) {
                        return new UglifyJS.AST_Atom();
                    }
                }
            }
            descend(node, this);
            return node;
        });
        toplevel = toplevel.transform(removeConsoleTransformer);

        var compressor = UglifyJS.Compressor(compressorOption);
        toplevel = toplevel.transform(compressor);
        toplevel.mangle_names({ except: options.except });

        //output, has /*$ */ comments
        var stream = UglifyJS.OutputStream({
            comments: function (scope, comment) {
                if (comment.type == 'comment2' && comment.value.charAt(0) === '$' && options.copyright) {
                    return comment;
                }
                return false;
            },
            space_colon: false,
            //quote_keys: true, object keys加引号
            beautify: options.beautify,
            ascii_only: options.ascii_only
        });

        toplevel.print(stream);
        result = stream.get();

        return result;
    },
    /**
     * 压缩整个 js 文件 并生成一个新文件
     */
    jsFileMinify: function (srcPath, distPath) {

        let jsString = f.read(srcPath);
        f.write(distPath, this.jsSourceMinify(jsString));
    }
};

