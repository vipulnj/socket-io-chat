var express = require('express'),
	bodyParser = require('body-parser'),
	path = require('path'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	jade = require('jade');

var usernames = [],
	username_sockets = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/', express.static(__dirname+'/public/'));

app.get('/chat', function (req, res) {
	res.render('checkUsername', {title:'Socket IO Chat'});
});

io.sockets.on('connection', function (socket) {
	console.log("Connected from " + socket.id);

	socket.on('disconnect', function () {
		var user = username_sockets[socket.id];
		var index = usernames.indexOf(user);
		usernames.splice(index, 1);
		delete username_sockets[socket.id];
		console.log("Disconnected from " + socket.id);
	});

	socket.on('newusr', function (newusrname) {
		console.log("New user name request:: " + newusrname);
		if(usernames.indexOf(newusrname) >= 0)
		{
			console.log("Already used username..");
			console.log(usernames);
			socket.emit('usernameTaken', newusrname);
		}
		else
		{
			socket.emit('usernameavlbl', newusrname);
		}
	});

	socket.on('startchat', function (usernameAvailable) {
		if(usernames.indexOf(usernameAvailable) >= 0)
		{
			console.log("Username just taken..");
			socket.emit('usernameJustTaken', usernameAvailable);	//returning the usernae that just got taken
		}
		else
		{
			usernames.push(usernameAvailable);
			console.log("Opening chat window for "+usernameAvailable);

			var fn = jade.compileFile('views/chatwindow.jade', {pretty: true});

		   // Render function
		   var html = fn();
		   //console.log(html);

		   socket.emit('openchatwindow', html);
		}
	});

	socket.on('registerusername_chatwindow', function (usernameRecieved) {
		username_sockets[socket.id] = usernameRecieved;
		console.log(username_sockets);
	});

	socket.on('sndmsg', function (message, usernameSentFrom) {
		console.log("Message from " + usernameSentFrom + " :::: " + message);
		/*console.log(socket.handshake);*/
		socket.broadcast.emit('msgreceive', message, usernameSentFrom);
		console.log(username_sockets);
		console.log("Sending socket id ::::", socket.id);
	});

	socket.on('typing', function (username) {
		socket.broadcast.emit('usertyping', username);
	});

	socket.on('stoppedtyping', function (username) {
		socket.broadcast.emit('userstoppedtyping', username);
	});
});

server.listen(8080,'0.0.0.0');
console.log("Listening on 8080..");
