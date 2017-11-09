var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/teste', function(req, res){
  io.emit('chat message', 'teste 123');
  res.send('done');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  setTimeout(function(){
    io.emit('chat message', 'teste 123'); 
  }, 5);
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
