/**
*
*
* Servidor (node.js)
*
* @author Álvaro Calace
* @author Mariano Furriel
* @author Gabriel Rodriguez
* @author Octavio Zamudio
*
*
*/
var util = require('util');
var http = require('http');
var ecstatic = require('ecstatic');
var io = require('socket.io');
var monitor = require('os-monitor');
var Player = require('./lib/Player');

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080;

var __socket;   // Controlador de Socket
var __players;	// Array de jugadores conectados
var __forcePolling = false;
var __resources = {
  updates: 0,
  load: 0,
  totalLoad: 0,
  freeMemory: 0,
  totalFreeMemory: 0,
  systemMemory: 0
};

/**
* Parsing de argumentos de la aplicación.
* Puede forzarse el polling inicializando la aplicación como:
* $ node server.js polling
*/
process.argv.forEach(function (val, index, array) {
  if (index === 2 && val === 'polling') {
    __forcePolling = true;
  }
});


/**
* Crear e inicializar servidor HTTP
*/
var server = http.createServer(
  ecstatic({ root: __dirname + '/public' })
).listen(port, ipaddress, function (err) {
  if (err) {
    throw err;
  }
  init();
})

/**
* Inicializar listeners y eventos
*/
function init() {
  initMonitor();
  __players = [];
  __socket = initSocket();
  setEventHandlers();
}

/**
* Inicializar Socket.io
*/
function initSocket() {
  var options = {};

  if (__forcePolling) {
    options.transports = 'polling'
  }

  return io.listen(server, options);
}

/**
* Inicializar monitor de recursos de la máquina host
*/
function initMonitor() {
  monitor.start({
    delay: 1000
  });
  monitor.on('monitor', function(event) {
    __resources.updates++;
    __resources.load = event.loadavg[0];
    __resources.totalLoad += event.loadavg[0];
    __resources.freeMemory = event.freemem;
    __resources.totalFreeMemory += event.freemem;
    __resources.systemMemory = event.totalmem;

    __socket.sockets.emit('resource update', {
      load: __resources.load,
      averageLoad: __resources.totalLoad / __resources.updates,
      freeMemory: __resources.freeMemory,
      averageFreeMemory: __resources.totalFreeMemory / __resources.updates,
      systemMemory: __resources.systemMemory,
    });
  });
}

var setEventHandlers = function () {
  __socket.sockets.on('connection', onSocketConnection);
}

function onSocketConnection (client) {
  util.log('Jugador conectado: ' + client.id);

  // Listener de desconexión
  client.on('disconnect', onClientDisconnect);

  // Listener de nuevo jugador
  client.on('new player', onNewPlayer);

  // Listener de movimiento de un jugador
  client.on('move player', onMovePlayer);
}

/**
* Listener de desconexión
*/
function onClientDisconnect () {
  util.log('El jugador se desconectó: ' + this.id);
  var removePlayer = playerById(this.id);

  // Jugador no encontrado
  if (!removePlayer) {
    util.log('No se encontró al jugador: ' + this.id);
    return ;
  }

  // Eliminar jugadores de la lista
  __players.splice(__players.indexOf(removePlayer), 1);

  // Emitir el mensaje de desconexión a todos los sockets
  this.broadcast.emit('remove player', {id: this.id});
}

function onNewPlayer (data) {
  // Crear un nuevo jugador
  var newPlayer = new Player(data.x, data.y);
  newPlayer.id = this.id;

  // Emitir vía broadcast la conexión del nuevo jugador
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

  // Enviar a conexión a todos los jugadores conectados
  var i, existingPlayer;
  for (i = 0; i < __players.length; i++) {
    existingPlayer = __players[i];
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
  }

  // Agregar jugador a la lista
  __players.push(newPlayer);
}

function onMovePlayer (data) {
  var now = Date.now();
  var benchmarkData = data.benchmarkData;
  
  // Encontrar jugador en la lista
  var movePlayer = playerById(this.id);

  // Jugador no encontrado
  if (!movePlayer) {
    util.log('No se encontró al jugador: ' + this.id);
    return ;
  }

  // Actualizar la posición del jugador
  movePlayer.setX(data.x);
  movePlayer.setY(data.y);

  // Emitir la posición actualizada vía broadcast
  var data = {
    id: movePlayer.id,
    x: movePlayer.getX(),
    y: movePlayer.getY(),
	benchmarkData: {
		clientSendTime: data.benchmarkData.clientSendTime,
		serverSendTime: now,
		clientTransport: data.benchmarkData.clientTransport
	}
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
