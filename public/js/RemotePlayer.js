/**
* Jugador remoto
*/
var RemotePlayer = function (index, game, player, posX, posY, key) {

  this.game = game; // Game reference
  this.startPos = {
    x: posX,
    y: posY
  };
  this.player = player;
  this.alive = true;

  this.player = game.add.sprite(posX, posY, key);
  this.player.scale.set(0.6);

  this.player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true);
  this.player.animations.add('stop', [3], 20, true);
  this.player.anchor.setTo(0.5, 0.5);

  this.player.name = index.toString();
  this.game.physics.enable(this.player, Phaser.Physics.ARCADE);
  this.player.body.immovable = true;
  this.player.body.collideWorldBounds = true;

  this.player.angle = game.rnd.angle();
  this.lastPosition = { x: posX, y: posY };
};

RemotePlayer.prototype.update = function (x, y) {
  if (this.player.x !== this.lastPosition.x || this.player.y !== this.lastPosition.y) {

    this.player.x = x;
    this.player.y = y;
    this.lastPosition.x = this.player.x;
    this.lastPosition.y = this.player.y;
    this.player.angle = Math.PI + this.game.physics.arcade.angleToXY(this.player, this.lastPosition.x, this.lastPosition.y);
  }
};

window.RemotePlayer = RemotePlayer;
