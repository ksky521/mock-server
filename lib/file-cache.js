var fs = require('fs');
var $ = require('./utils');

function Cache(filepath) {
    this.path = filepath;
    this._getNew();
}
Cache.prototype._getNew = function() {
    try {
        this.config = require(filepath);
    } catch (e) {
        this.config = {};
    }
};
Cache.prototype.get = function(key) {
    return this.config[key];
};

Cache.prototype.set = function(key, value) {
    this.config[key] = value;

};
Cache.prototype._write = function() {
    return fs.writeSync(this.filepath, JSON.stringify(this.config, true, 4));
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
