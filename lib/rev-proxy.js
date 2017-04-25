var $ = require('./utils')
var path = require('path')
var fs = require('fs-extra')
var request = require('request')
var minimatch = require('minimatch')

var revProxy = function (conf, req, res, next) {
  var rUrl = req.url
  var oUrl = ''
  $.debug('revProxy:' + rUrl)

  ;(conf || []).some(function (v) {
    var path = v.path
    var url = v.url
    var match
    var reg = new RegExp(v.path)
    if (minimatch(rUrl, v.path)) {
      oUrl = v.url
      return true
    } else if (match = rUrl.match(reg)) {
      oUrl = v.url
      match.forEach(function (m, i) {
        oUrl = oUrl.replace(new RegExp('\\$' + i, 'g'), m)
      })
      return true
    }
  })

  if (!oUrl) {
    return next()
  }

  req.pipe(request({
    url: oUrl,
    // headers: req.headers,
    method: req.method
  })).pipe(res)
}

module.exports = revProxy
