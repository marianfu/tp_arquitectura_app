/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update, render: render })

var socsoket;
var land
var player;
var enemies;
var currentSpeed = 0;
var cursors;
var upKey;

function preload() {

    game.load.image('chunk', 'assets/chunk.png');
    game.load.image('arrow', 'assets/asteroids_ship.png');
}

var bmd;

var posiblePos = {player:null,x: null, y: null};

function create() {

    game.time.advancedTiming = true;

    game.physics.startSystem(Phaser.Physics.ARCADE);

    //socket = io.connect({'transports': ['websocket']});
    socket = io.connect();
  
    //  io.set('transports', 'websocket');

    //  Click on the left or right of the game to shoot the space ship in that direction

    game.stage.backgroundColor = '#so124184';

    bmd = game.add.bitmapData(800, 600);
    bmd.context.fillStyle = '#ffffff';

    var bg = game.add.sprite(0, 0, bmd);

    game.physics.arcade.gravity.y = 100;

    player = game.add.sprite(32, 450, 'arrow');
    player.anchor.set(0.5);

    game.physics.enable(player, Phaser.Physics.ARCADE);

    enemies = [];

    player.body.collideWorldBounds = true;
    player.body.bounce.set(0.8);

    game.input.onDown.add(launch, this);

    var upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);


    setEventHandlers();
}

function launch() {

    if (game.input.x < player.x)
    {
        player.body.velocity.setTo(-200, -200);
    }
    else
    {
        player.body.velocity.setTo(200, -200);
    }

}

function update() {

   

    player.rotation = player.body.angle;

    bmd.context.fillRect(player.x, player.y, 2, 2);

    bmd.dirty = true;

    if (posiblePos.player) {
      var movePlayer = posiblePos.player
      movePlayer.player.x = posiblePos.x
      movePlayer.player.y = posiblePos.y 
    }

    socket.emit('move player', { x: player.x, y: player.y });
}

function render() {

    game.debug.bodyInfo(player, 32, 32);

}

var setEventHandlers = function () {
  // Socket connection successful
  socket.on('connect', onSocketConnected)

  // Socket disconnection
  socket.on('disconnect', onSocketDisconnect)

  // New player message received
  socket.on('new player', onNewPlayer)

  // Player move message received
  socket.on('move player', onMovePlayer)

  // Player removed message received
  socket.on('remove player', onRemovePlayer)
}

// Socket connected
function onSocketConnected () {
  console.log('Connected to socket server')

  // Reset enemies on reconnect
  enemies.forEach(function (enemy) {
    enemy.player.kill()
  })
  enemies = []

  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y })
}

// Socket disconnected
function onSocketDisconnect () {
  console.log('Disconnected from socket server')
}

// New player
function onNewPlayer (data) {
  console.log('New player connected:', data.id)

  // Avoid possible duplicate players
  var duplicate = playerById(data.id)
  if (duplicate) {
    console.log('Duplicate player!')
    return
  }
  // Add new player to the remote players array
  enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y, 'arrow'));
}

// Move player
function onMovePlayer (data) {
  var movePlayer = playerById(data.id)

  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  // Update player position
  posiblePos.player = movePlayer;
   posiblePos.x = data.x
    posiblePos.y = data.y
}

// Remove player
function onRemovePlayer (data) {
  var removePlayer = playerById(data.id)

  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return
  }

  removePlayer.player.kill()

  // Remove player from array
  enemies.splice(enemies.indexOf(removePlayer), 1)
}
/*
function update () {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].alive) {
      enemies[i].update()
      game.physics.arcade.collide(player, enemies[i].player)
    }
  }

  if (cursors.left.isDown) {
    player.angle -= 4
  } else if (cursors.right.isDown) {
    player.angle += 4
  }

  if (cursors.up.isDown) {
    // The speed we'll travel at
    currentSpeed = 300
  } else {
    if (currentSpeed > 0) {
      currentSpeed -= 4
    }
  }
  
  game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity)

  if (currentSpeed > 0) {
    player.animations.play('move')
  } else {
    player.animations.play('stop')
  }

  land.tilePosition.x = -game.camera.x
  land.tilePosition.y = -game.camera.y

  if (game.input.activePointer.isDown) {
    if (game.physics.arcade.distanceToPointer(player) >= 10) {
      currentSpeed = 300

      player.rotation = game.physics.arcade.angleToPointer(player)
    }
  }

  socket.emit('move player', { x: player.x, y: player.y })
}*/

// Find player by ID
function playerById (id) {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i].player.name === id) {
      return enemies[i]
    }
  }

  return false
}
