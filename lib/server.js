require('colors');
var $ = require('./utils');
var http = require('http');
var path = require('path');
var express = require('express');
var cons = require('consolidate');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, {
    log: false,
    origins: '*:*' //解决同源策略
});
var execDir = process.cwd();
var rootDir = path.join(__dirname, '..');

var projectConfig = {
    folders: [execDir],
    curDir: execDir
};

var config = {
    port: 8800,
    execDir: execDir,
    tmplDir: path.join(rootDir, 'assets'),
    projectConfig: projectConfig
};


app.engine('html', cons.ejs);
app.engine('jade', cons.jade);
app.engine('hbs', cons.handlebars);
app.set('view engine', 'html');

//添加日志
app.use(require('morgan')('dev'));

//添加settings
app.all('*', require('./settings')(app, io, config));


server.listen(config.port, function() {
    $.log(('Mock Server is listening on port ' + config.port).green);
});

process.on('uncaughtException', function(err) {
    if (err.errno === 'EADDRINUSE' || err.errno === 'EACCES') {
        $.log(('Mock Server:  Port ' + config.port + ' is already in use.').red);
        process.exit(1);
    } else
        $.log(err);
});
