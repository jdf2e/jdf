var url = require('url');
var fs = require('fs');
var path = require('path');

var mime = require('./mime');
var f = require('./file');

var server = module.exports = {};

var config = server.config = {};

var pathType = {
    combo: 'combo',
    dir: 'dir',
    file: 'file',
    empty: 'empty'
};

server.init = function (serverCurrentDir, port, cdn, 
                        replacePath, comboDebug, addJsDepends) {
    port = port || 8080;

    comboDebug = !!comboDebug;

    if (serverCurrentDir === undefined) {
        config.serverCurrentDir = fs.realpathSync('.');
    }else {
        config.serverCurrentDir = serverCurrentDir;
    }

    return function (request, response, next) {
        var requestUrl = request.url;
        
        var resource = server.getResource(requestUrl);

        var responseText;
        
        if (resource.type === pathType.empty) {
            // 404 
        } else if (resource.type === pathType.combo) {
            // combo
        } else if (resource.type === pathType.dir) {
            // dir
        } else if (resource.type === pathType.file) {
            // file
        } else {
            // 未知情况
        }

        // 早
        // 上
        // 来
        // 从
        // 这
        // 里
        // 开
        // 始
        // 文档读取并输出

            var ext = path.extname(realPath);
            ext = ext.replace('.', '');
            var contentType = mime[ext] || "text/plain";
            var content = fs.readFileSync(realPath);

            response.writeHead(200, {
                'Content-Type': contentType
            });
            response.write(content);
            response.end();
     

        next();
    }
}

// 没有在Linux环境下测试
server.getResource = function (requestUrl) {
    requestUrl = requestUrl || '';
    // example /a/b/c/
    var parsedUrl = url.parse(requestUrl);
    var pathname = parsedUrl.pathname;
    var isComboUrl = /^\?\?/.test(parsedUrl.search);
    var fileNameList = [];
    var resource = {};

    if (isComboUrl) {
        // ['a.js', 'b.js']
        fileNameList = parsedUrl.query.slice(1).split(',');
    } else {
        // ['/a/b/c/']
        fileNameList = [pathname];
    }

    fileNameList = fileNameList.map(function (item) {
        // ['C://Users/xxx/AppData/Local/Temp/a.js']
        return path.normalize(config.serverCurrentDir + '/' + item);
    });

    // type: combo
    if (isComboUrl) {
        resource.type = pathType.combo; 
        resource.isExist = !!fileNameList.length;
        resource.filelist = fileNameList;
        return resource;
    }

    var filepath = fileNameList[0];

    // not exist
    if (!fs.existsSync(filepath)) {
        resource.type = pathType.empty;
        resource.isExist = false;
        resource.filelist = [];
        return resource;
    }

    // type: 目录
    if (f.isDir(filepath)) {
        resource.type = pathType.dir;
        resource.isExist = true;
        resource.filelist = fileNameList;
        return resource;
    }

    // type: 文件
    if (f.isFile(filepath)) {
        resource.type = pathType.file;
        resource.isExist = true;
        resource.filelist = fileNameList;
        return resource;
    }

    return resource;
}

server.getIp = function(){
    var net = require('os').networkInterfaces();
    for(var key in net){
        if(net.hasOwnProperty(key)){
            var items = net[key];
            if(items && items.length){
                for(var i = 0; i < items.length; i++){
                    var ip = String(items[i].address).trim();
                    if(ip && /^\d+(?:\.\d+){3}$/.test(ip) && ip !== '127.0.0.1'){
                        return ip;
                    }
                }
            }
        }
    }
    return '127.0.0.1';
};

server.joinbuffers = function(bufferStore) {
    var length = bufferStore.reduce(function(previous, current) {
        return previous + current.length;
    }, 0);

    var data = new Buffer(length);
    var startPos = 0;
    bufferStore.forEach(function(buffer){
        buffer.copy(data, startPos);
        startPos += buffer.length;
    });
    return data;
};

server.copyright = function (port){
    var serverIp = server.getIp()+':'+port;
    var copyright = '<p><strong style="font-size:1.2em">jdf server </strong>'+
        ' <strong>IP</strong> <a href="http://'+serverIp+'">'+serverIp+'</a>   '+   
        //'<span style="font-size:0.8em">'+new Date()+'</span>  '+
    '</p>';
    return copyright;
}

server.getDirList = function(realPath, pathname, port){
    // console.log(realPath);
    var dirname = '/';
    var html = '<li style="padding-bottom:5px;"><a href="../">../</a></li>';
    realPath = path.normalize(realPath);
    pathname += '/';
    pathname = pathname.replace(/\/\//,'');

    fs.readdirSync(realPath).forEach(function(name){
        if( !/.Ds_Store$/.test(name) ){
            // console.log(name);
            var url = pathname +'/'+name;
            url = url.replace(/\/\//g,'/');
            url = encodeURI(url);
            dirname = path.dirname(url);
            if(f.isDir('.'+url)){
                url = url + '/';
                name = name + '/';
            }

            html += '<li style="padding-bottom:0.2em;"><a href="'+url+'">'+name+'</a></li>';
        }
    })

    html = '<ul>' +html+ '</ul>';
    html = '<h1>Index of '+dirname+'</h1><hr/>'+html+'<hr/> '+server.copyright(port);
    return html;
}

server.getComboFilesContent = function (comboName, rootDirPath) {
    var comboBuffer;
    return comboBuffer;
    // //cdn检测同名文件
    // //todo增加短路径支持 requestUrl
    // cdnUrl = requestUrl;

    // var contentType = mine[ext] || "text/plain";
    // var fileContent = '';

    // //以??先分隔为数组
    // var comboUrl = requestUrl.split('??');
    // var comboFile = [];

    // if(comboUrl.length > 0){
    //     //将头尾的斜杠去掉
    //     // comboUrl[0] = comboUrl[0].replace(/^\//, '').replace(/\/$/, '');

    //     if(comboUrl[1]){
    //         //以逗号将文件名称分隔为数组
    //         comboFile = comboUrl[1].split(',');
    //     }
    // }

    // comboFile.forEach(function(file){
    //     var fileDir = '';
    //     var content = '';

    //     //将头尾的斜杠去掉
    //     file = file.replace(/^\//, '').replace(/\/$/, '');
    //     if(comboUrl[0] !== ''){
    //         fileDir = comboUrl[0] + '/' + file;
    //     }else{
    //         fileDir = file;
    //     }

    //     var currentDir = serverCurrentDir + fileDir;
    //     if(f.exists(currentDir)){
    //         content = f.read(currentDir);
    //         if( typeof(addJsDepends) == 'function' ){
    //             content = addJsDepends(currentDir);
    //         }

    //         //如果代码的末尾没有分号，则自动添加一个。以避免代码合并出现异常。
    //         if(!/[;\r\n]$/.test(content) && ext == 'js'){
    //             content += ';';
    //         }
    //         fileContent += content;
    //     }else{
    //         fileDir = cdnUrl + fileDir;
    //         response404();
    //     }
    // });

    // response.writeHead(200, {
    //     'Content-Type': contentType
    // });
    // response.write(fileContent);
    // response.end();
}


// server.response404 = function () {
//     response.writeHead(404, {
//         'Content-Type': 'text/html'
//     });
//     response.write('<center><h1>404 Not Found</h1></center><hr><center>'+server.copyright(port)+'</center>');
//     response.end();
// }

// server.generalFileListHTML = ;
// if(f.isDir(realPath)){
//             fs.readdir(realPath, function (err, file) {
//                 if (err) {
//                     response.writeHead(500, {
//                         'Content-Type': mine.html
//                     });
//                     response.end(err);
//                 } else {
//                     response.writeHead(200, {
//                         'Content-Type': "text/html"
//                     });

//                     var html = server.getDirList(realPath, pathname, port);
//                     response.end(html, "binary");
//                 }
//             });
//         }
//         
//         // 获取文件后缀名
        // var ext = path.extname(realPath);
        // ext = ext ? ext.slice(1) : 'unknown';

        // if(isComboUrl){
        //     var comboUrlTemp = requestUrl.split(',');
        //     ext = path.extname(comboUrlTemp[comboUrlTemp.length-1]);
        //     ext = ext ? ext.slice(1) : 'unknown';
        // }
