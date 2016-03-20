var express = require('express');
var $ = require('./utils');
var url = require('url');
var path = require('path');
var ST = require('st');

module.exports = function (app, config) {
  var folders = $.getCache('folderList') || [config.execDir];
  var curFolder = $.getCache('curFolder') || folders[0];

  var projectConfig = config.projectConfig;
  //设置页面配置
  var tmplServer = ST({
    path: config.tmplDir,
    url: '/_'
  });
  var st = ST({
    path: curFolder,
    url: '/'
  });

  io.on('connection', function (socket) {
    //发送列表
    socket.emit('init', {
      folderList: folders,
      curFolder: curFolder,
      files: $.getDirIndexData(curFolder),
      hosts: config.hosts,
      port: config.port
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
          files: $.getDirIndexData(absPath)
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
        st = ST({
          path: data.folder,
          url: '/'
        });
        socket.emit('folderList', {
          errno: 0,
          folder: data.folder,
          data: $.getDirIndexData(data.folder)
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
        st = ST({
          path: data.folder,
          url: '/'
        });
        status = 0;
        files = $.getDirIndexData(data.folder);
        folders.unshift(data.folder);
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
        $.setCache('folderList', folders);
        status = 0;
      }
      socket.emit('deleteStatus', {
        errno: status
      });
    });
  });

  return function (req, res, next) {
    if (!tmplServer(req, res) && !st(req, res))
      next();
  };
};
