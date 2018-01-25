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
                    name: 'compressThreadCrisis',
                    type: 'number',
                    changed: false,
                    tips: '开启多线程压缩的文件数',
                    value: config.compressThreadCrisis
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
    },
    computed: {
        changedPropList: function () {
            var list = [];
            var block = this.server.concat(this.dev);
            for (var key in block) {
                if (block[key].changed) {
                    list.push({
                        name: block[key].name,
                        value: block[key].type === 'number' ? Number(block[key].value) : block[key].value
                    });
                }
            }

            block = this.urlreplace.concat(this.combo).concat(this.compress).concat(this.optimization);
            for (var key in block) {
                if (block[key].changed) {
                    list.push({
                        name: 'output.' + block[key].name,
                        value: block[key].type === 'number' ? Number(block[key].value) : block[key].value
                    });
                }
            }
            
            return list;
        }
    },
    methods: {
        save: function () {
            var list = this.changedPropList;
            var rootMap = {};
            for (key in list) {
                var item = list[key];
                var propPath = item.name.split('.');
                if (propPath.length == 1) {
                    rootMap[propPath[0]] = formatValue(item.value);
                }
                else if (propPath.length == 2) {
                    if (!rootMap[propPath[0]]) {
                        rootMap[propPath[0]] = {};
                    }
                    rootMap[propPath[0]][propPath[1]] = formatValue(item.value);
                }
            }

            console.log(window.userConfig, rootMap)
            var newUserConfig = mergeConfig(window.userConfig, rootMap);
            console.log(newUserConfig);
            // 请求
            var wrap = document.querySelector('.wrap');
            var msgTip = document.querySelector('.msg-tip');
            $.ajax({
                url: '/jdf-api/saveJdfConfig',
                type: 'post',
                data: {config: JSON.stringify(newUserConfig)},
                success: function(data){
                    if(data.success){
                        msgTip.innerHTML = data.msg;
                        msgTip.classList.add('msg-tip-success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else {
                        msgTip.innerHTML = data.msg;
                        msgTip.classList.add('msg-tip-fail');
                        setTimeout(() => {
                            msgTip.classList.remove('msg-tip-fail');
                        }, 2000);
                    }
                },
                error: function(){
                    msgTip.innerHTML = '保存配置失败！';
                    msgTip.classList.add('msg-tip-fail');
                    setTimeout(() => {
                        msgTip.classList.remove('msg-tip-fail');
                    }, 2000);
                }
            })
        }
    }
});

function mergeConfig(dc, uc) {
    var build = dc.build || {};
    var output = dc.output || {};

    uc = Object.assign({}, dc, uc);

    uc.build && (uc.build = Object.assign({}, build, uc.build));
    uc.output && (uc.output = Object.assign({}, output, uc.output));

    return uc;
}

function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function formatValue(val) {
    if (typeof val === 'string') {
        return trim(val);
    }
    return val;
}