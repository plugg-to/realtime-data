var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var lastId = false;
var products = null;
var orders = null;
var order = false;
var keyMaps = '';
var constMongoDB = '';

async function orderCallBack(err, orderResult) {
	let address = orderResult[0]['receiver_zipcode'] + ',' + orderResult[0]['receiver_country'];
	let maps = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&key=' + keyMaps;
	
	request(
		{
	    	url: maps,
	    	json: true
	  	}, 
	  	function (error, response, body) {
			if (String(lastId) !== String(orderResult[0]['_id'])) {
				order = {
					'id': orderResult[0]['_id'],
					'lat': body['results'][0]['geometry']['location']['lat'],
					'lng': body['results'][0]['geometry']['location']['lng'],
					'total': orderResult[0]['total'],
					'items': []
				}

				if ('sku' in orderResult[0]['items'][0]) {
					products.find({'sku': orderResult[0]['items'][0]['sku'], 'user_id': orderResult[0]['user_id']}).limit(1).toArray(function(err, results) {
						if (results == undefined) {
							console.log(results);
							return;
						}

						photos = [];

						
						try {
							photos = results[0]['photos'];
						} catch (error) {
							photos = [];
						}

					    order.items.push(
					    	{
					    		'name': orderResult[0]['items'][0]['name'],
					    		'photos': photos
					    	}
					    );

						if (String(lastId) !== String(orderResult[0]['_id'])) {
							console.log(order);

							io.emit('order notification', order);

							lastId = orderResult[0]['_id'];
						}
					});
				}
			}  
		}
	);
};

var interval = setInterval(function() {
  MongoClient.connect(constMongoDB, function(err, db) {
    orders = db.collection('orders');
    products = db.collection('products');

    cursor = orders.find().limit(1).sort({ $natural : -1 });

    cursor.toArray(orderCallBack);
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
