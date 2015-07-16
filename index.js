var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {

});

var ChatSchema = mongoose.Schema({
    name: String,
    message: String
});

var Message = mongoose.model('Message', ChatSchema);

/*
silence.save(function(err, silence) {
    if (err) return console.error(err);
    console.log("save");
});

*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/', function(req, res) {
    res.sendfile('login.html');
});

var arrayClent = [];
var nameClient = [];
var tempname = "";

app.post('/chat', function(req, res) {
    tempname = req.body.name;

    res.sendfile('index.html');
});


io.on('connection', function(socket) {
    console.log(tempname + ' connected');
    arrayClent[socket.id] = socket;
    nameClient[socket.id] = tempname;
    socket.on('disconnect', function() {
        console.log('user disconnect');
    });
    io.emit('join conversation', tempname);

    //chat message event
    socket.on('chat message', function(data) {
        var mychat = new Message({
            name: nameClient[socket.id],
            message: data
        });

        var listWord = data.split(" ");
        if (listWord[0].substr(0, 1) == "@") {
            for (var id in nameClient) {
                if (listWord[0].substr(1) == nameClient[id]) {
                    listWord.splice(0, 1);
                    mychat.message = listWord.join(" ")
                    mychat.save(function(err, mychat) {
                        arrayClent[id].emit('chat message', "<b>" + mychat.name + "</b>:" + mychat.message);
                    });

                };
            }
        } else {
            mychat.save(function(err, mychat) {
                io.emit('chat message', "<b>" + mychat.name + "</b>:" + mychat.message);
            });

        }



    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});