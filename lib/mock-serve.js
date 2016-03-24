var $ = require('./utils');
var path = require('path');
var url = require('url');
var curRoot = '';
var fs = require('fs');
var mockjs = require('mockjs');
var cheerio = require('cheerio');

var isCompile = {
  mock: true,
  ms: true
};

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
        if (isCompile.mock) {
          data = fs.readFileSync(absPath);
          html = data.toString();
          isMock = true;
          eval('var tmpl = ' + data);
          data = JSON.stringify(mockjs.mock(tmpl));

          return res.end(isCompile.ms ? getJsonData(data) : data);
        }

      case '.json':
        if (isCompile.ms) {
          data = fs.readFileSync(absPath);
          data = data.toString();
          return res.end(getJsonData(data));
        }

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
        return handler(data, urlObj.query || {}, cheerio);
      }
    }
    return data;
  }
};
server.getCompile = function(r){
  return isCompile[r];
};
server.setRoot = function(r) {
  curRoot = r;
};
server.setCompile = function(n, r) {
  isCompile[n] = r;
};

module.exports = server;
