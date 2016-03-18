module.exports = function(rootFolder, port) {
    console.log(rootFolder, port);
    return function(req, res, next) {
        next();
    }
}
