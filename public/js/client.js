var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameDiv');

var player;
var enemies;
var bmd;
var possiblePos = {player:null,x: null, y: null};
var socket;
var inBenchmarker;
var outBenchmarker;
var resourceBenchmarker;

var gameState = {

    preload: function () {
        game.load.image('chunk', 'assets/chunk.png');
        game.load.image('player', 'assets/asteroids_ships.png');
        game.load.image('enemy', 'assets/asteroids_ships_enemy.png');
    },

    create: function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 100;
        game.time.advancedTiming = true;
        game.stage.backgroundColor = '#0D47A1';
        game.stage.disableVisibilityChange = true;

        connect();

        bmd = game.add.bitmapData(800, 600);
        bmd.context.fillStyle = '#E1F5FE';

        player = game.add.sprite(32, 450, 'player');
        player.anchor.set(0.5);
        player.scale.set(0.6);
        game.physics.enable(player, Phaser.Physics.ARCADE);
        player.body.bounce.set(0.8);
        player.body.collideWorldBounds = true;

        enemies = [];
        game.input.onDown.add(this.launch, this);

        setEventHandlers();
    },

    launch: function () {
        if (game.input.x < player.x) {
            player.body.velocity.setTo(-200, -200);
        }
        else {
            player.body.velocity.setTo(200, -200);
        }
    },

    update: function () {

        player.rotation = player.body.angle;

        bmd.context.fillRect(player.x, player.y, 2, 2);

        bmd.dirty = true;

        if (possiblePos.player) {
            var movePlayer = possiblePos.player;
            //movePlayer.player.x = possiblePos.x;
            //movePlayer.player.y = possiblePos.y;
            movePlayer.update(possiblePos.x, possiblePos.y);
        }

		var benchmarkData = {
			clientSendTime: Date.now(),
			clientTransport: socket.io.engine.transports[0]
		};
			
        socket.emit('move player', {
            x: player.x,
            y: player.y,
			benchmarkData: benchmarkData
        });
		
		outBenchmarker.add('move player', benchmarkData);
    },

    render: function () {
        game.debug.bodyInfo(player, 32, 32);
    }
};

game.state.add('gameState', gameState);
game.state.start('gameState');

function connect() {
    if (socket) {
        socket.disconnect();
    }
    socket = io.connect({transports: getTransports()});
    setupBenchmarkers();
}

function setEventHandlers() {
    // Socket connection successful
    socket.on('connect', onSocketConnected);

    // Socket disconnection
    socket.on('disconnect', onSocketDisconnect);

    // New player message received
    socket.on('new player', onNewPlayer);

    // Player move message received
    socket.on('move player', onMovePlayer);

    // Player removed message received
    socket.on('remove player', onRemovePlayer);

    // Resource update message received
    socket.on('resource update', onResourceUpdate);


    // Window hash change
    window.onhashchange = connect;

    // Bind buttons
    document.getElementsByName('button-websocket')[0].onclick = function() {
        location.hash = 'websocket';
    };
    document.getElementsByName('button-polling')[0].onclick = function() {
        location.hash = 'polling';
    };
};

// Socket connected
function onSocketConnected () {
    console.log('Connected to socket server');

    // Reset enemies on reconnect
    enemies.forEach(function (enemy) {
        enemy.player.kill();
    });
    enemies = [];

    // Send local player data to the game server
    socket.emit('new player', { x: player.x, y: player.y });
}

// Socket disconnected
function onSocketDisconnect () {
    console.log('Disconnected from socket server');
}

// New player
function onNewPlayer (data) {
    console.log('New player connected:', data.id);

    // Avoid possible duplicate players
    var duplicate = playerById(data.id);
    if (duplicate) {
        console.log('Duplicate player!');
        return;
    }
    // Add new player to the remote players array
    enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, "enemy"));
}

// Move player
function onMovePlayer (data) {
	data.benchmarkData.serverTransport = socket.io.engine.transports[0];
	inBenchmarker.add('move player', data.benchmarkData);
	
    var movePlayer = playerById(data.id);
    // Player not found
    if (!movePlayer) {
        console.log('Player not found: ', data.id);
        return;
    }
    // Update player position
    possiblePos.player = movePlayer;
    possiblePos.x = data.x;
    possiblePos.y = data.y;
}

// Remove player
function onRemovePlayer (data) {

    var removePlayer = playerById(data.id);
    // Player not found
    if (!removePlayer) {
        console.log('Player not found: ', data.id);
        return;
    }

    removePlayer.player.kill();
    // Remove player from array
    enemies.splice(enemies.indexOf(removePlayer), 1);
}

// Update resources
function onResourceUpdate(data) {
    resourceBenchmarker.add(data);
}

// Find player by id
function playerById (id) {
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].player.name === id) {
            return enemies[i];
        }
    }
    return false;
}

function getTransports() {
	var hash = location.hash;
	var transports = [];

    var wsButton = document.getElementsByName('button-websocket')[0];
    var pButton = document.getElementsByName('button-polling')[0];
	
	switch (hash) {
		case '#xhr':
		case '#polling':
			transports.push('polling');
            pButton.className += ' active';
            wsButton.className = wsButton.className.replace(' active', '');
			break;
		case '#ws':
		case '#websocket':
		default:
			transports.push('websocket');
            wsButton.className += ' active';
            pButton.className = pButton.className.replace(' active', '');
			break;
	}
	
	return transports;
}

function setupBenchmarkers() {
	inBenchmarker = new Benchmarker('benchmark-in', 'in');
	outBenchmarker = new Benchmarker('benchmark-out', 'out');
	resourceBenchmarker = new Benchmarker('benchmark-resource', 'resource');
}
