module.exports = function (data, q) {
  var cb = q.callback;
  if (cb) {
    return cb + '(' + data + ')';
  }
  return data;
}
