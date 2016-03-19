var Router = require('../lib/router');
var path = require('path');
var fs = require('fs');
var $ = require('../lib/utils');

module.exports = function (mapping, config) {
  var router = new Router(mapping);

  return function (req, res, next) {
    var route = '/' + req.params.pattern;
    var match = router.search(route, req.method);

    req._fds = {
      route: route,
      match: match,
      config: config,
      delay: 0,
      data: null
    };

    try {
      if (!match)
        throw new Error('No route defined in: ' + config.routeFile);

      if (match.searchType !== 'url') {
        var filePath = config.execDir;
        file = path.resolve(filePath, match.file);

        $.debug(file);
        if (!fs.existsSync(file))
          throw new Error('Template file: ' + file + ' is not found');
      }

      next();
    } catch (e) {
      req._err = 404;
      next(e);
    }
  };
};
