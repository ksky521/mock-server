var express = require('express');
var $ = require('./utils');
var url = require('url');
var path = require('path');
var ST = require('st');

module.exports = function(app, io, config) {
    var projectConfig = config.projectConfig;
    //设置默认根目录
    var st = ST({
        path: projectConfig.curDir,
        url: '/'
    });
    //设置页面配置
    var tmplServer = ST({
        path: config.tmplDir,
        url: '/_'
    });
    io.on('connection', function(socket) {
        socket.on('changeFolder', function(data) {
            $.debug('socket msg: ' + JSON.stringify(data));
            st = ST({
                path: data.folder,
                url: '/'
            });
        });
        socket.on('addFolder', function(data) {
            //todo:判断是否存在，存在则存入
            $.debug(data);
        });
    });

    return function(req, res, next) {
        if (!tmplServer(req, res) && !st(req, res))
            next();
    };
};
