Vue.component('config-text', {
    template: document.getElementById('textconfig'),
    props: {
        direction: {
            type: String,
            default: 'right'
        },
        propObj: String
    },
    data: function () {
        return {
            value: this.propObj.value.toString()
        }
    },
    watch: {
        'propObj.value': function () {
            if (this.value != this.propObj.value.toString()) {
                this.propObj.changed = true;
            } else {
                this.propObj.changed = false;
            }
        }
    }
});
Vue.component('config-number', {
    template: document.getElementById('numberconfig'),
    props: {
        direction: {
            type: String,
            default: 'right'
        },
        propObj: String
    },
    data: function () {
        return {
            value: this.propObj.value.toString()
        }
    },
    watch: {
        'propObj.value': function () {
            console.log(this.value, this.propObj.value.toString())
            if (this.value != this.propObj.value.toString()) {
                this.propObj.changed = true;
            } else {
                this.propObj.changed = false;
            }
        }
    }
});
Vue.component('config-bool', {
    template: document.getElementById('boolselectconfig'),
    props: {
        direction: {
            type: String,
            default: 'right'
        },
        propObj: String
    },
    data: function () {
        return {
            value: this.propObj.value.toString()
        }
    },
    watch: {
        'propObj.value': function () {
            if (this.value != this.propObj.value.toString()) {
                this.propObj.changed = true;
            } else {
                this.propObj.changed = false;
            }
        }
    }
});
Vue.component('config-select', {
    template: document.getElementById('selectconfig'),
    props: {
        direction: {
            type: String,
            default: 'right'
        },
        propObj: String
    },
    data: function () {
        return {
            value: this.propObj.value.toString()
        }
    },
    watch: {
        'propObj.value': function () {
            if (this.value != this.propObj.value.toString()) {
                this.propObj.changed = true;
            } else {
                this.propObj.changed = false;
            }
        }
    }
});
Vue.component('config-group', {
    template: document.getElementById('groupconfig'),
    props: {
        group: Array
    }
});

var config = mergeConfig(defaultConfig, userConfig);

new Vue({
    el: '#app',
    data: function () {
        return {
            // type: text|bool|number|select
            server: [
                {
                    name: 'cdn',
                    type: 'text',
                    changed: false,
                    tips: 'js/css线上访问域名，如//misc.360buyimg.com，//static.360buy.com',
                    value: config.cdn
                },
                {
                    name: 'host',
                    type: 'text',
                    changed: false,
                    tips: 'js/css上传测试服务器',
                    value: config.host
                },
                {
                    name: 'serverDir',
                    type: 'text',
                    changed: false,
                    tips: 'js/css测试访问域名(配host)，如//misc.360buyimg.com，//static.360buy.com',
                    value: config.serverDir
                },
                {
                    name: 'previewServerDir',
                    type: 'text',
                    changed: false,
                    tips: '预览html访问域名',
                    value: config.previewServerDir
                },
                {
                    name: 'widgetServerDir',
                    type: 'text',
                    changed: false,
                    tips: 'widget仓库地址',
                    value: config.widgetServerDir
                }
            ],
            dev: [
                {
                    name: 'outputDirName',
                    type: 'text',
                    changed: false,
                    tips: '自定义output输出文件夹',
                    value: config.outputDirName
                },
                {
                    name: 'projectPath',
                    type: 'text',
                    changed: false,
                    tips: '自定义输出路径（相对于根域名）',
                    value: config.projectPath
                },
                {
                    name: 'output.excludeFiles',
                    type: 'text',
                    changed: false,
                    tips: '忽略指定目录或文件，以英文逗号分隔，比如`doc/**,test/**,readme.docx`',
                    value: config.output.excludeFiles
                },
                {
                    name: 'localServerPort',
                    type: 'number',
                    changed: false,
                    tips: '手动指定默认build端口（被占用将自动改变）',
                    value: config.localServerPort
                },
                {
                    name: 'build.jsPlace',
                    type: 'select',
                    changed: false,
                    options: [
                        {label: 'insertBody',value: 'insertBody'},
                        {label: 'insertHead',value: 'insertHead'}
                    ],
                    tips: 'js文件插入位置',
                    value: config.build.jsPlace
                }
            ],
            urlreplace: [
                {
                    name: 'linkReplace',
                    type: 'bool',
                    changed: false,
                    tips: 'link标签的href属性添加cdn前缀',
                    value: config.output.linkReplace
                },
                {
                    name: 'cssImagesUrlReplace',
                    type: 'bool',
                    changed: false,
                    tips: 'css文件图片url添加cdn前缀',
                    value: config.output.cssImagesUrlReplace
                },
                {
                    name: 'jsUrlReplace',
                    type: 'bool',
                    changed: false,
                    tips: 'script标签的src属性和seajs deps添加cdn前缀',
                    value: config.output.jsUrlReplace
                }
            ],
            combo: [
                {
                    name: 'cssCombo',
                    type: 'bool',
                    changed: false,
                    tips: 'widget的css组成combo路径',
                    value: config.output.cssCombo
                },
                {
                    name: 'jsCombo',
                    type: 'bool',
                    changed: false,
                    tips: 'widget的js组成combo路径',
                    value: config.output.jsCombo
                }
            ],
            compress: [
                {
                    name: 'hasBanner',
                    type: 'bool',
                    changed: false,
                    tips: '给文件打时间戳',
                    value: config.output.hasBanner
                },
                {
                    name: 'compressJs',
                    type: 'bool',
                    changed: false,
                    tips: '是否开启压缩js文件',
                    value: config.output.compressJs
                },
                {
                    name: 'compressCss',
                    type: 'bool',
                    changed: false,
                    tips: '是否开启压缩css文件',
                    value: config.output.compressCss
                },
                {
                    name: 'compressImage',
                    type: 'bool',
                    changed: false,
                    tips: '是否开启压缩图片',
                    value: config.output.compressImage
                },
                {
                    name: 'compresshtml',
                    type: 'bool',
                    changed: false,
                    tips: '是否开启压缩html文件(不建议开启)',
                    value: config.output.compresshtml
                }
            ],
            optimization: [
                {
                    name: 'cssAutoPrefixer',
                    type: 'bool',
                    changed: false,
                    tips: '是否开启自动添加css浏览器前缀',
                    value: config.output.cssAutoPrefixer
                },
                {
                    name: 'base64',
                    type: 'bool',
                    changed: false,
                    tips: '是否开启base64编码',
                    value: config.output.base64
                },
                {
                    name: 'webp',
                    type: 'bool',
                    changed: false,
                    tips: '是否生成对应webp图片',
                    value: config.output.webp
                }
            ]
        }
    }
})

function mergeConfig(defaultConfig, userConfig) {
    var build = defaultConfig.build;
    var output = defaultConfig.output;

    userConfig = Object.assign({}, defaultConfig, userConfig);

    userConfig.build = Object.assign({}, build, userConfig.build);
    userConfig.output = Object.assign({}, output, userConfig.output);

    return userConfig;
}