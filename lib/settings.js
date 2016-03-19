var express = require('express');
var $ = require('./utils');
var url = require('url');
var path = require('path');
var ST = require('st');

module.exports = function (app, config) {
  var folders = $.getCache('folderList') || [config.execDir];
  var curFolder = $.getCache('curFolder') || '';

  var projectConfig = config.projectConfig;
  //设置页面配置
  var tmplServer = ST({
    path: config.tmplDir,
    url: '/_'
  });
  var files = $.getDirIndexData(config.tmplDir);

  io.on('connection', function (socket) {
    //发送列表
    socket.emit('initFolderList', {
      folderList: folders,
      curFolder: curFolder
    });

    //切换，获取index
    socket.on('changeFolder', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));

      if (data.folder && $.isExists(data.folder)) {} else {
        return socket.emit('folderList', {
          errno: 1
        });
      }
      socket.emit('folderList', {
        errno: 0,
        data: $.getDirIndexData(data.folder)
      });
    });

    //增加
    socket.on('addFolder', function (data) {
      $.debug('socket msg: ' + JSON.stringify(data));

      var status = 1;
      if (data.folder && $.isExists(data.folder)) {
        st = ST({
          path: data.folder,
          url: '/'
        });
        status = 0;
        folders.unshift(data.folder);
      }
      socket.emit('folderStatus', {
        errno: status,
        folder: data.folder
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
