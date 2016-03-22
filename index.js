require('colors');
var $ = require('./lib/utils');
var http = require('http');
var path = require('path');
var ipv4 = require('ipv4');
global.express = require('express');
var cons = require('consolidate');
global.app = express();
var server = require('http').Server(app);
global.io = require('socket.io')(server, {
  log: false,
  origins: '*:*' //解决同源策略
});
var execDir = process.cwd();
var rootDir = path.join(__dirname);
var assetDir = path.join(rootDir, 'assets');
var projectConfig = {
  folders: [execDir],
  curDir: execDir
};
var config = {
  rootDir: rootDir,
  assetDir: assetDir,
  reloadJS: path.join(assetDir, 'reload.js'),
  settingsPath: '/_',
  port: 8800,
  execDir: execDir,
  hosts: ['127.0.0.1', ipv4],
  tmplDir: path.join(rootDir, '../vue-demo'),
  projectConfig: projectConfig
};


app.engine('html', cons.ejs);
app.engine('jade', cons.jade);
app.engine('hbs', cons.handlebars);
app.set('view engine', 'html');

//添加日志
app.use(require('morgan')('dev'));

//添加settings
app.all('/:pattern(*)',
  require('./lib/server')(config)
);


server.listen(config.port, function () {
  $.log(('Mock Server is listening on port ' + config.port).green);
});

process.on('uncaughtException', function (err) {
  if (err.errno === 'EADDRINUSE' || err.errno === 'EACCES') {
    $.log(('Mock Server:  Port ' + config.port + ' is already in use.').red);
    process.exit(1);
  } else
    $.log(err);
});
