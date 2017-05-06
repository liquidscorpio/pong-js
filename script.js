document.addEventListener('DOMContentLoaded', function() {
  
  var World = Matter.World;
  var Render = Matter.Render;
  var Engine = Matter.Engine;
  var Bodies = Matter.Bodies;

  var Arena = function(width, height) {
    this.width = width;
    this.height = height;
  };

  var Bat = function(label, width, height, arena) {
    this.body = null;
    this.arena = arena;
    this.width = width;
    this.label = label;
    this.height = height;
    this.movement = parseInt(this.arena.width * 0.007);
  };

  Bat.prototype.draw = function(coords) {
    if (!this.bat) {
      var renderData = {
        label: this.label,
        isStatic: true,
        render: {
          fillStyle: 'white',
          strokeStyle: 'transparent',
          lineWidth: 0
        }
      };
      this.body = Bodies.rectangle(coords.x, coords.y, this.width,
          this.height, renderData);
      this.body.restitution = 1;
      this.body.friction = 0;
      this.body.frictionStatic = 1;
      this.body.frictionAir = 0;
    }
  };

  Bat.prototype.moveRight = function() {
    if (this.body) {
      var pos = this.body.position;
      if (this.body.bounds.min.x + this.width < this.arena.width) {
        Matter.Body.setPosition(this.body, { x: pos.x + this.movement, y: pos.y });
      }
    }
  };

  Bat.prototype.moveLeft = function() {
    if (this.body) {
      var pos = this.body.position;
      if (this.body.bounds.min.x > 0) {
        Matter.Body.setPosition(this.body, { x: pos.x - this.movement, y: pos.y });
      }
    }
  };

  var Ball = function(label, radius, arena) {
    this.body = null;
    this.label = label;
    this.arena = arena;
    this.radius = radius;
  };

  Ball.prototype.draw = function(coords) {
    if (!this.body) {
      var renderData = {
        label: this.label,
        render: {
          fillStyle: 'seagreen',
          strokeStyle: 'transparent',
          lineWidth: 0
        }
      };
      this.body = Bodies.circle(coords.x, coords.y, this.radius, renderData);
      this.body.restitution = 1;
      this.body.friction = 0;
      this.body.frictionStatic = 1;
      this.body.frictionAir = 0;
    }
  };

  init.apply({
    Bat: Bat,
    Arena: Arena,
    World: World,
    Bodies: Bodies,
    Render: Render,
    Engine: Engine,
    Ball: Ball
  });

});

var init = function() {
  var Game = this;
  var BAT_WIDTH = 300;
  var BAT_HEIGHT = 10;
  var BALL_RADIUS = 20;
  var MAX_WIDTH = document.body.clientWidth;
  var MAX_HEIGHT = document.body.clientHeight;

  var Keys = {
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN'
  };

  var ActiveKeys = {
    LEFT: false,
    UP: false,
    RIGHT: false,
    DOWN: false
  };

  var flipKey = function(e, state) {
    var code = e.which || e.keyCode;
    var activeKey = Keys[code];
    if (activeKey) {
      ActiveKeys[activeKey] = state;
    }
  };

  var engine = Game.Engine.create();
  var render = Game.Render.create({
    engine: engine,
    element: document.body,
    options: {
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      wireframes: false,
      background: "#222"
    }
  });

  var arena = new Game.Arena(MAX_WIDTH, MAX_HEIGHT);
  var playerBat = new Game.Bat('playerBat', BAT_WIDTH, BAT_HEIGHT, arena);
  playerBat.draw({
    x: (MAX_WIDTH - BAT_WIDTH) / 2,
    y: MAX_HEIGHT - BAT_HEIGHT * 2
  });

  var compBat = new Game.Bat('compBat', BAT_WIDTH, BAT_HEIGHT, arena);
  compBat.draw({
    x: (MAX_WIDTH - BAT_WIDTH) / 2 + 70,
    y: BAT_HEIGHT
  });

  var lFence = new Game.Bat('lFence', 2, MAX_HEIGHT, arena);
  lFence.draw({
    x: 0,
    y: MAX_HEIGHT / 2
  });

  var rFence = new Game.Bat('rFence', 2, MAX_HEIGHT, arena);
  rFence.draw({
    x: MAX_WIDTH,
    y: MAX_HEIGHT / 2
  });

  var ball = new Game.Ball('ball', BALL_RADIUS, arena);
  ball.draw({
    x: MAX_WIDTH / 2,
    y: MAX_HEIGHT / 2
  });

  Game.World.add(engine.world, [playerBat.body, compBat.body, 
    lFence.body, rFence.body, ball.body]);
  Game.Engine.run(engine);
  Game.Render.run(render);

  document.addEventListener('keydown', function(e) {
    flipKey(e, true);
  });

  document.addEventListener('keyup', function(e) {
    flipKey(e, false);
  });

  var CollisionState = {};

  Matter.Events.on(engine, 'beforeUpdate', function (e) {
    if (ActiveKeys.LEFT) {
      playerBat.moveLeft();
    } else if (ActiveKeys.RIGHT) {
      playerBat.moveRight();
    }
  });

  Matter.Events.on(engine, 'beforeUpdate', function (e) {
    var force = null;
    if (CollisionState.playerBat & CollisionState.ball) {
      force = { x: 0.004, y: -0.025 };
    } else if (CollisionState.compBat & CollisionState.ball) {
      force = { x: 0.004, y: 0.025 };
    }

    if (force) {
      Matter.Body.applyForce(ball.body, playerBat.body.position, force);
    }
  });


  Matter.Events.on(engine, 'collisionStart', function(e) {
    var pairs = e.pairs;
    for (var i = 0; i < pairs.length; i++) {
      var p = pairs[i];
      CollisionState[p.bodyA.label] = true;
      CollisionState[p.bodyB.label] = true;
    }
  });

  Matter.Events.on(engine, 'collisionEnd', function(e) {
    CollisionState = {
      playerBat: false,
      compBat: false,
      ball: false
    };
  });
};