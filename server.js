var util = require('util');
var http = require('http');
var ecstatic = require('ecstatic');
var io = require('socket.io');
var Player = require('./lib/Player');

var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080;
var socket;	// Socket controller
var players;	// Array of connected players
var forcePolling = false;

// Parse application arguments
process.argv.forEach(function (val, index, array) {
  if (index === 2 && val === 'polling') {
    forcePolling = true;
  }
});

// Create and start the http server
var server = http.createServer(
  ecstatic({ root: __dirname + '/public' })
).listen(port, function (err) {
  if (err) {
    throw err;
  }

  init();
})

function init () {
  players = [];
  socket = initSocket();
  // Start listening for events
  setEventHandlers();
}

function initSocket() {
  var options = {};

  if (forcePolling) {
    options.transports = 'polling'
  }

  return io.listen(server, options);
}

var setEventHandlers = function () {
  socket.sockets.on('connection', onSocketConnection);
}

function onSocketConnection (client) {
  util.log('New player has connected: ' + client.id);
  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect);
  // Listen for new player message
  client.on('new player', onNewPlayer);
  // Listen for move player message
  client.on('move player', onMovePlayer);
}

function onClientDisconnect () {
  
  util.log('Player has disconnected: ' + this.id);
  var removePlayer = playerById(this.id);
  // Player not found
  if (!removePlayer) {
    util.log('Player not found: ' + this.id);
    return ;
  }
  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1);
  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id});
}

function onNewPlayer (data) {
  // Create a new player
  var newPlayer = new Player(data.x, data.y);
  newPlayer.id = this.id;
  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});
  // Send existing players to the new player
  var i, existingPlayer;
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i];
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
  }
  // Add new player to the players array
  players.push(newPlayer);
}

function onMovePlayer (data) {
  console.log(data);
  // Find player in array
  var movePlayer = playerById(this.id);
  // Player not found
  if (!movePlayer) {
    util.log('Player not found: ' + this.id);
    return ;
  }
  // Update player position
  movePlayer.setX(data.x);
  movePlayer.setY(data.y);
  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY()});
}

function playerById (id) {
  var i;
  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i];
    }
  }

  return false;
}