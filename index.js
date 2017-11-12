var MongoClient = require('mongodb').MongoClient;
var request 	= require('request');
var numeral 	= require('numeral');
var http 		= require('http').Server(app);
var app		    = require('express')();
var io 			= require('socket.io')(http);

var constMongoDB = '';
var keyMaps 	 = '';
var products 	 = null;
var lastId 		 = false;
var orders 		 = null;
var order 		 = false;

async function orderCallBack(err, orderResult) {
	let address = orderResult[0]['receiver_zipcode'] + ',' + orderResult[0]['receiver_country'];
	let maps = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&key=' + keyMaps;
	
	if (String(lastId) !== String(orderResult[0]['_id'])) {
		request(
			{
		    	url: maps,
		    	json: true
		  	}, 
		  	function (error, response, body) {
		  		console.log(body);
				if (String(lastId) !== String(orderResult[0]['_id'])) {
					try {
						order = {
							'id': orderResult[0]['_id'],
							'lat': body['results'][0]['geometry']['location']['lat'],
							'lng': body['results'][0]['geometry']['location']['lng'],
							'total': orderResult[0]['total'],
							'channel': orderResult[0]['channel'],
							'items': []
						};
					} catch (error) {
						return;
					}

					try {
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

							io.emit('order notification', order);

							lastId = orderResult[0]['_id'];
						});
					} catch (error) {
						io.emit('order notification', order);

						lastId = orderResult[0]['_id'];
					}
				}  
			}
		);
	}
};

var interval = setInterval(function() {
  MongoClient.connect(constMongoDB, function(err, db) {
    orders = db.collection('orders');
    products = db.collection('products');

    cursor = orders.find({}).limit(1).sort({ $natural : -1 });

    cursor.toArray(orderCallBack);
  });
}, 1000);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.get('/total', function(req, res){
	MongoClient.connect(constMongoDB, function(err, db) {
    	orders = db.collection('orders');
    	
    	cursor = orders.aggregate([
		   {
		     $group: {
		        _id: null,
		        total: { $sum: "$total" }
		     }
		   }
		]);

		cursor.toArray(function(err, results) {
			res.send({
				'total': numeral(results[0]['total']).format('0,0')
			});
		});
	});
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
