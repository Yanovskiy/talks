var express = require('express')
    , swig = require('swig')
    , http = require('http')
    , path = require('path')
    , passport = require('passport')
    , mongoose = require('mongoose');

var app = express();

// all environments
app.set('port', process.env.PORT || 8050);

// configure view
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);
app.engine('html', swig.renderFile);

// app.set('db-uri', 'mongodb://127.0.0.1/pastepic')
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: 'seriously'}));
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// connection to mongoose
// var db = mongoose.connect(app.get('db-uri'));

// include all routes after Fbody parser
require('./routes')(app);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

/* creating a server */
var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});


var io = require('socket.io').listen(server);
io.set('log level', 1);

io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});

io.sockets.on('connection', function (socket) {
    var ID = (socket.id).toString().substr(0, 5);
    var time = (new Date).toLocaleTimeString();
    var params = {
        'name': ID,
        'time': time,
    };

    socket.emit('connected', params);

    /*
     * The way is to send from client a message witch contain a picture id.
     * In response to this message user get the number of online picture viewers.
     */

    socket.on('groupIn', function(data){
        /*
         * Add this socket to room with same picture id.
         * Info other sockets in the room about new picture viewer.
         * Count the number of online viewers.
         */
        var groupId = data.groupId ? data.groupId : false;

        /*
         * Check if client already in room.
         * If not, join the room.
         */

        var clients = io.sockets.clients(groupId);
        socket.join(groupId);

        var clientsCount = clients.length;
        /* Info all clients in room about new member. */
        io.sockets.in(groupId).emit('groupInResp', {groupId: groupId, clientsCount: clientsCount});

        socket.on('message', function(data){
            /* Leave the room then disconnected. */
            var groupId = data.groupId ? data.groupId : false;
            if(!groupId) return;
            var time = (new Date).toLocaleTimeString();
            var name = (socket.id).toString().substr(0, 5);

            socket.emit('msgSent', {picId: groupId, status: 1});
            io.sockets.in(groupId).json.send({text: data.text, from: name, time: time});
        });

        socket.on('disconnect', function(data){
            /* Leave the picture room then disconnected. */
            var groupId = data.groupId ? data.groupId : false;
            if(!groupId) return;
            socket.leave(groupId);
            var clients = io.sockets.clients(groupId),
                clientsCount = clients.length;
            io.sockets.in(groupId).emit('userOut', {groupId: groupId, clientsCount: clientsCount});
        });
    });


});