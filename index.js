var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var MongoClient = require('mongodb').MongoClient,
    collection = null,
    test = require('assert');

var lastId = false;
var interval = setInterval(function() {
  MongoClient.connect('mongodb://user:pass@host:port/db', function(err, db) {
    collection = db.collection('coupons');
    var cursor = collection.find().limit(1).sort({ $natural : -1 });

    cursor.toArray(function(err, results) {
      if (err) throw err;
      console.log(lastId);
      console.log(results[0]['_id']);
      // io.emit('order notification', 'teste 123');
      if (lastId !== results[0]['_id']) {
        console.log('fa');

        lastId = results[0]['_id'];
      }
    });
  });
}, 1000);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/teste', function(req, res){
  io.emit('order notification', 'teste 123');
  res.send('done');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('order notification', function(msg){
    io.emit('order notification', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
