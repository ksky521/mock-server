var path = require('path');
var fs = require('fs');
var $ = require('../lib/utils');

module.exports = function (folder) {
  return function (req, res, next) {
    var file = path.join(folder, req.url);
    if (req.url.match(/\.html$/) && fs.existsSync(file)) {
      var html = fs.readFileSync(file).toString();
      html = $.getLrHtml(html);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } else {
      next();

    }
  };
};
