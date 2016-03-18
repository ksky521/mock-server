(function($) {
    var port = location.port;
    var ioUrl = port ? (location.host + ':' + port) : location.host;
    var socket = io(ioUrl);

}(jQuery));
