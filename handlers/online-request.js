var request = require('request');
var $ = require('../lib/utils');

module.exports = function (req, res, next) {
  var match = req._fds.match;

  if (match.searchType !== 'url') {
    return next();
  }

  var url = match.file + (match.params.pattern || '') + (req.query ? '?' + utils.serialize(req.query) : '');

  req.pipe(request({
    url: url,
    method: req.method
  })).pipe(res);
};
