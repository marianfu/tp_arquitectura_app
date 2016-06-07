var util = require('util');
var http = require('http');
var ecstatic = require('ecstatic');
var io = require('socket.io');
var monitor = require('os-monitor');
var Player = require('./lib/Player');

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080;

var __socket;	// Socket controller
var __players;	// Array of connected players
var __forcePolling = false;
var __resources = {
  updates: 0,
  load: 0,
  totalLoad: 0,
  freeMemory: 0,
  totalFreeMemory: 0,
  systemMemory: 0
};

// Parse application arguments
process.argv.forEach(function (val, index, array) {
  if (index === 2 && val === 'polling') {
    __forcePolling = true;
  }
});


// Create and start the http server
var server = http.createServer(
  ecstatic({ root: __dirname + '/public' })
).listen(port, ipaddress, function (err) {
  if (err) {
    throw err;
  }
  init();
})

function init() {
  initMonitor();
  __players = [];
  __socket = initSocket();
  // Start listening for events
  setEventHandlers();
}

function initMonitor() {
  // Start resource monitor
  monitor.start();
  monitor.on('monitor', function(event) {
    __resources.updates++;
    __resources.load = event.loadavg[0];
    __resources.totalLoad += event.loadavg[0];
    __resources.freeMemory = event.freemem;
    __resources.totalFreeMemory += event.freemem;
    __resources.systemMemory = event.totalmem;
  });
}

function initSocket() {
  var options = {};

  if (__forcePolling) {
    options.transports = 'polling'
  }

  return io.listen(server, options);
}

var setEventHandlers = function () {
  __socket.sockets.on('connection', onSocketConnection);
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
  __players.splice(__players.indexOf(removePlayer), 1);
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
  for (i = 0; i < __players.length; i++) {
    existingPlayer = __players[i];
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
  }
  // Add new player to the players array
  __players.push(newPlayer);
}

function onMovePlayer (data) {
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

  var data = {
    id: movePlayer.id,
    x: movePlayer.getX(),
    y: movePlayer.getY(),
    load: __resources.load,
    averageLoad: __resources.totalLoad / __resources.updates,
    freeMemory: __resources.freeMemory,
    averageFreeMemory: __resources.totalFreeMemory / __resources.updates,
    systemMemory: __resources.systemMemory,
    startTime: data.startTime
  };
  
  this.broadcast.emit('move player', data);
}

function playerById (id) {
  var i;
  for (i = 0; i < __players.length; i++) {
    if (__players[i].id === id) {
      return __players[i];
    }
  }

  return false;
}
