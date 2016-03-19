var $ = require('lodash');
var url = require('url');
var fs = require('fs');
var path = require('path');
$.debug = require('debug')('mock-server');
$.log = console.log;
var flatCache = require('flat-cache').load('mock-server');
$.getCache = function (key) {
  flatCache.getKey(key);
};
$.setCache = function (key, val) {
  flatCache.setKey(key, val);
  flatCache.save();
};
$.removeKey = function (key) {
  flatCache.removeKey(key);
  flatCache.save();
}
var lsScript = "<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':" + 35729 + "/livereload.js?snipver=1\"></' + 'script>')</script>";
$.isExists = function (f) {
  return fs.existsSync(f);
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
$.parserUrl = function (req) {
  var hostArr = req.headers.host.split(':');
  var hostname = hostArr[0];
  var port = hostArr[1];

  var parsedUrl = url.parse(req.url, true);

  parsedUrl.protocol = parsedUrl.protocol || req.type + ":";
  parsedUrl.hostname = parsedUrl.hostname || hostname;

  if (!parsedUrl.port && port) {
    parsedUrl.port = port;
  }

  return url.format(parsedUrl);
};
module.exports = $;
