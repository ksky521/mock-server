var express = require('express');
var $ = require('./utils');
var url = require('url');
var fs = require('fs');
var path = require('path');
var serveStatic = express.static;
var mockServer = require('./mock-serve');
var revProxy = require('./rev-proxy');
var chokidar = require('chokidar');
const CACHE_FILE_PATH = path.join($.getHomeDir(), '.mock-server-tmp/config.json');

var cache = require('./file-cache')(CACHE_FILE_PATH);

function getDirFiles(cPath, pPath) {
  var files = $.getDirIndexData(cPath);
  var mutedFiles = cache.get('mutedFiles.' + pPath);
  return files.map(function (v) {
    v.isMuted = !!~mutedFiles.indexOf(v.absPath);
    return v;
  });
}

module.exports = function (config) {
  var timeout = 0; //设置刷新间隔
  var folders = cache.get('folderList') || [config.execDir];
  var curFolder = cache.get('curFolder') || folders[0];
  //反向代理
  var curRevProxy = cache.get('revProxy') || [];
  var lastServer; //最后的static-server
  var watcher; //fswatch

  watchFolder(curFolder);

  var projectConfig = config.projectConfig;
  //设置页面配置
  var tmplServer = express.static(config.tmplDir, {
    index: 'index.html'
  });

  //添加serverFolder
  function watchFolder(f) {
    lastServer = express.static(f, {
      setHeaders: function (res, p) {
        var extname = path.extname(p);
        //兼容mock
        if (extname === '.mock') {
          res.setHeader('Content-Type', 'text/plain');
        }
      }
    });
    if (watcher && $.isFunction(watcher.close)) {
      $.debug('prev folder: ' + curFolder);
      watcher.unwatch(curFolder);
      watcher.close();
    }
    curFolder = f;
    $.debug('now folder: ' + f);

    cache.set('curFolder', curFolder);
    var mutedFiles = cache.get('mutedFiles.' + curFolder);
    if (!$.isArray(mutedFiles)) {
      cache.set('mutedFiles.' + curFolder, []);
      mutedFiles = [];
    }

    watcher = chokidar.watch(curFolder, {
      ignored: mutedFiles,
      interval: 10
    }).on('change', function (p) {
      setTimeout(function () {
        io.emit('fileChangePleaseReloadIt!', p);
      }, timeout);
    });

  }

  io.on('connection', function (socket) {
    socket.on('sayHi', function (d) {
      $.debug('socket msg: ', JSON.stringify(d));
    });
    //发送列表
    socket.emit('init', {
      folderList: folders,
      curFolder: curFolder,
      files: getDirFiles(curFolder, curFolder),
      hosts: config.hosts,
      port: config.port,
      revProxy: curRevProxy,
      subFolders: [],
      compileMock: true,
      compileMs: true
    });

    //////////////监听------------>
    socket.on('sendSubFolder', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));
      var folders = Array.isArray(data.subFolders) ? data.subFolders.join('/') : String(data.subFolders);

      var absPath = path.join(data.curFolder, folders, data.newSubFolder);
      if (absPath && $.isExists(absPath)) {
        socket.emit('subFolderStatus', {
          errno: 0,
          newSubFolder: data.newSubFolder,
          files: getDirFiles(absPath, curFolder)
        });
      } else {
        socket.emit('subFolderStatus', {
          errno: 1
        });
      }
    });

    //切换，获取index
    socket.on('changeFolder', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));

      if (data.folder && $.isExists(data.folder)) {
        //更换server路径
        watchFolder(data.folder);
        socket.emit('folderList', {
          errno: 0,
          folder: data.folder,
          data: getDirFiles(data.folder, curFolder)
        });
      } else {
        socket.emit('folderList', {
          errno: 1
        });
      }

    });

    //增加
    socket.on('addFolder', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));

      var status = 1;
      var files;
      if (data.folder && $.isExists(data.folder)) {
        //更换server路径
        watchFolder(data.folder);

        status = 0;
        files = getDirFiles(data.folder, curFolder);
        folders.unshift(data.folder);
        cache.set('folderList', folders);
      }
      socket.emit('folderStatus', {
        errno: status,
        folder: data.folder,
        files: files
      });
    });

    //删除
    socket.on('delFolder', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));
      var index = folders.indexOf(data.folder);
      var status = 1;
      if (index !== -1) {
        folders.splice(index, 1);
        cache.set('folderList', folders);
        status = 0;
      }
      socket.emit('deleteStatus', {
        errno: status
      });
    });
    socket.on('watchTimeInterval', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));

      var t = parseInt(data.timeout);
      if (t) {
        timeout = t;
      }
    });

    //编译设置
    socket.on('complie:mock', function (b) {
      mockServer.setCompile('mock', b);
    });
    socket.on('complie:mock', function (b) {
      mockServer.setCompile('ms', b);
    });

    //不监控
    socket.on('unwatch', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));
      var absPath = path.join(curFolder, data.subFolders.join(path.sep), data.file);

      var mutedFiles = cache.get('mutedFiles.' + curFolder);
      if (!$.isArray(mutedFiles)) {
        mutedFiles = [];
      }
      if (mutedFiles.indexOf(absPath) === -1) {
        mutedFiles.push(absPath);
        cache.set('mutedFiles.' + curFolder, mutedFiles);
        watcher.unwatch(absPath);
      }

    });

    //不监控
    socket.on('addWatch', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));
      var absPath = path.join(curFolder, data.subFolders.join(path.sep), data.file);
      var mutedFiles = cache.get('mutedFiles.' + curFolder);
      if (!$.isArray(mutedFiles)) {
        mutedFiles = [];
      }
      var index = mutedFiles.indexOf(absPath);
      if (index !== -1) {
        mutedFiles.splice(index, 1);
        cache.set('mutedFiles.' + curFolder, mutedFiles);
        watcher.watch(absPath);
      }

    });


    //反向代理
    socket.on('addRevProxy', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));
      if (data.url && data.path) {
        data.path = data.path.indexOf('/') === 0 ? data.path : ('/' + data.path);

        curRevProxy.push(data);
        cache.set('revProxy', curRevProxy);
        data.errno = 0;
        socket.emit('addRevProxyCallback', data);
      }
    }).on('delRevProxy', function (index) {
      $.debug('socket msg: ' + JSON.stringify(index));

      if (index !== -1) {
        curRevProxy.splice(index, 1);
        cache.set('revProxy', curRevProxy);
        socket.emit('delRevProxyCallback', index);
      }
    });
  });

  return function (req, res, next) {
    var p = path.parse(req.url);
    if (p.dir.indexOf(config.settingsPath) === 0 || req.url === config.settingsPath + '/') {
      //进入设置页面
      req.url = req.url.substr(config.settingsPath.length);
      if (req.url === '/reload.js') {
        var js = fs.readFileSync(config.reloadJS);
        return res.end(js);
      }
      tmplServer(req, res, next);
    } else {

      mockServer.setRoot(curFolder);
      mockServer(req, res, function (e) {
        if (e) {
          return next(e);
        }
        lastServer(req, res, function () {
          //反向代理
          revProxy(curRevProxy, req, res, next);
        });
      });
    }
  };
};
