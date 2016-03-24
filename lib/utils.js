var $ = require('lodash');
var url = require('url');
var fs = require('fs');
var path = require('path');
$.debug = require('debug')('mock-server');
$.log = console.log;

var lsScript = "<script>document.write('<script src=\"/_/reload.js\"></' + 'script>')</script>";
$.isExists = function (f) {
  return fs.existsSync(f);
};
$.getHomeDir = function(){
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
};
$.getDirIndexData = function (f) {
  var dirs = [],
    files = [];
  if ($.isExists(f)) {
    var index = fs.readdirSync(f);
    index.map(function (v) {
      var absPath = path.join(f, v);
      var stat = fs.statSync(absPath);
      if (stat.isDirectory()) {
        dirs.push({
          name: v,
          type: 'DIR',
          absPath: absPath,
          rePath: v
        });
      } else {
        var type = path.extname(v);
        type = type ? type : '';
        type = type.indexOf('.') === 0 ? type.slice(1) : type;

        files.push({
          name: v,
          type: type,
          rePath: v,
          absPath: absPath
        });
      }
    });
  }
  return dirs.concat(files);
};
$.getLrHtml = function (html) {
  html = html.split('</body>');
  if (html.length === 1) {
    html = html[0] + lsScript;
  } else {
    html = html.join(lsScript + '</body>');
  }
  return html;
};

$.isContainBodyData = function (method) {
  if (!method) {
    return false;
  }
  method = method.toUpperCase();

  var white_list = ['POST', 'PUT'];
  return white_list.some(function (i) {
    return i === method;
  });
};
$.parseUrl = function (req) {
  var hostArr = req.headers.host.split(':');
  var hostname = hostArr[0];
  var port = hostArr[1];

  var parsedUrl = url.parse(req.url, true);
  parsedUrl.protocol = parsedUrl.protocol || req.protocol + ':';
  parsedUrl.hostname = parsedUrl.hostname || hostname;

  if (!parsedUrl.port && port) {
    parsedUrl.port = port;
  }

  return url.format(parsedUrl);
};
module.exports = $;
