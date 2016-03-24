var fs = require('fs-extra');
var $ = require('./utils');
var path = require('path');

function Cache(filepath) {
  this.path = filepath;
  this._getNew();
  var p = path.dirname(this.path);

  if ($.isExists(p)) {
    var stats = fs.statSync(p);
    if (stats && !stats.isDirectory()) {
      fs.mkdir(p);
    }
  } else {
    fs.mkdir(p);
  }

}
Cache.prototype._getNew = function() {
  try {
    this.config = require(this.path);
  } catch (e) {
    this.config = {};
  }
};
Cache.prototype.get = function(key) {
  return $.get(this.config, key);
};

Cache.prototype.set = function(key, value) {
  $.set(this.config, key, value);
  this._write();
};
Cache.prototype._write = function() {
  var data = JSON.stringify(this.config, true, 4);
  var code = fs.writeFileSync(this.path, data);
  $.debug('write cache msg: ' + code);
};

Cache.prototype.clear = function() {
  this.config = {};
  this._write();
};
Cache.prototype.remove = function(key) {
  delete this.config[key];
  this._write();
};
Cache.prototype.del = Cache.prototype.remove;

module.exports = function(filepath) {
  return new Cache(filepath);
};
