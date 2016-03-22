var fs = require('fs');
var $ = require('./utils');

function Cache(filepath) {
    this.path = filepath;
    this._getNew();
}
Cache.prototype._getNew = function() {
    try {
        this.config = require(this.path);
    } catch (e) {
        this.config = {};
    }
};
Cache.prototype.get = function(key) {
    return this.config[key];
};

Cache.prototype.set = function(key, value) {
    this.config[key] = value;
    console.log(this.path);
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
