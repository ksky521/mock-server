var $ = require('./utils');
var path = require('path');
var url = require('url');
var curRoot = '';
var fs = require('fs');
var querystring = require('querystring');
var mockjs = require('mockjs');

var server = function(req, res, next) {
  var urlObj = url.parse(req.url, true);
  var extname = path.extname(urlObj.pathname);
  var absPath = path.join(curRoot, urlObj.pathname);
  var isMock = false;
  var data, html;

  if ($.isExists(absPath)) {
    switch (extname) {
      case '.html':
      case '.htm':
        data = fs.readFileSync(absPath);
        html = data.toString();
        html = $.getLrHtml(html);
        return res.end(html);
      case '.mock':
        data = fs.readFileSync(absPath);
        html = data.toString();
        isMock = true;
        eval('var tmpl = ' + data);
        data = JSON.stringify(mockjs.mock(tmpl));

        return res.end(getJsonData(data));

      case '.json':
        data = fs.readFileSync(absPath);
        data = data.toString();
        return res.end(getJsonData(data));

    }
  }
  next();

  function getJsonData(data) {
    var pobj = path.parse(absPath);
    var msfile = path.join(pobj.dir, pobj.name + '.ms');

    if ($.isExists(msfile)) {
      //存在ms文件
      var handler = require(msfile);

      if ($.isFunction(handler)) {
        return handler(data, urlObj.query || {});
      }
    }
    return data;
  }
}

server.setRoot = function(r) {
  curRoot = r;
}

module.exports = server;
