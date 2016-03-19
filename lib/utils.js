var $ = require('lodash');
var url = require('url');

$.debug = require('debug')('mock-server');
$.log = console.log;

var lsScript = "<script>document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':" + 35729 + "/livereload.js?snipver=1\"></' + 'script>')</script>";

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
