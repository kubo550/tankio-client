var socketEventsDictonary;
(function (socketEventsDictonary) {
    socketEventsDictonary["setNickname"] = "setNickname";
    socketEventsDictonary["joinRoom"] = "joinRoom";
    socketEventsDictonary["leaveRoom"] = "leaveRoom";
    socketEventsDictonary["startGame"] = "startGame";
    socketEventsDictonary["moveTank"] = "moveTank";
    socketEventsDictonary["fireBullet"] = "fireBullet";
    socketEventsDictonary["hitTarget"] = "hitTarget";
    socketEventsDictonary["endGame"] = "endGame";
    socketEventsDictonary["playerConnected"] = "playerConnected";
})(socketEventsDictonary || (socketEventsDictonary = {}));
var Bullet = (function () {
    function Bullet(id, x, y, color, rotation, shooterId) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = color;
        this.rotation = rotation;
        this.shooterId = shooterId;
        this.speed = 2.25;
        this.size = 4.5;
        this.pos = createVector(x, y);
        this.vel = p5.Vector.fromAngle(rotation - TWO_PI / 4).mult(this.speed);
        this.lifespan = 255;
    }
    Bullet.prototype.show = function () {
        push();
        ellipseMode(CENTER);
        noStroke();
        stroke(0);
        strokeWeight(1);
        fill(this.color);
        translate(this.pos.x, this.pos.y);
        rotate(this.rotation);
        ellipse(0, 0, this.size, this.size);
        pop();
    };
    Bullet.prototype.update = function () {
        this.handleCollision(walls);
        this.handleCollision(players);
        this.pos.add(this.vel);
        this.show();
        this.lifespan -= 0.5;
        if (!this.isAlive()) {
            this.pop();
        }
    };
    Bullet.prototype.isAlive = function () {
        return this.lifespan >= 0;
    };
    Bullet.prototype.pop = function () { };
    Bullet.prototype.handleCollision = function (others) {
        var _this = this;
        others.forEach(function (other) {
            if (other.isPolygonInside(_this.getPolygon())) {
                if (other instanceof Wall) {
                    _this.lifespan = 0;
                }
                if (other instanceof Tank) {
                    var isOwnBullet = other.id === _this.shooterId;
                    if (!other.isAlive || isOwnBullet) {
                        return;
                    }
                    _this.vel.mult(0);
                    _this.lifespan = 0;
                    other.explode();
                    if (other.id === socket.id) {
                        socket.emit(socketEventsDictonary.hitTarget, { hitTankId: other.id, bulletId: _this.id });
                    }
                }
            }
        });
    };
    Bullet.prototype.getPolygon = function () {
        return new SAT.Polygon(new SAT.Vector(this.pos.x - this.size / 2, this.pos.y - this.size / 2), [
            new SAT.Vector(0, 0),
            new SAT.Vector(this.size, 0),
            new SAT.Vector(this.size, this.size),
            new SAT.Vector(0, this.size)
        ]);
    };
    Bullet.prototype.setPosition = function (pos) {
        this.pos = createVector(pos.x, pos.y);
    };
    return Bullet;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Particle = (function () {
    function Particle(position, velocity) {
        this.pos = position;
        this.vel = velocity;
        this.acc = createVector(0, 0);
        this.life = 255;
        this.lifespan = 255;
    }
    Particle.prototype.update = function () {
        this.show();
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.vel.mult(0.98);
        this.life -= 5;
    };
    Particle.prototype.isAlive = function () {
        return this.life > 0;
    };
    Particle.prototype.show = function () {
        push();
        fill(120, 120, 120, this.life / this.lifespan * 200);
        noStroke();
        ellipse(this.pos.x, this.pos.y, 5);
        pop();
    };
    return Particle;
}());
var TankExplosionParticle = (function (_super) {
    __extends(TankExplosionParticle, _super);
    function TankExplosionParticle(position, velocity, color) {
        if (color === void 0) { color = "red"; }
        var _this = _super.call(this, position, velocity) || this;
        _this.color = color;
        _this.total = random(5, 15);
        _this.radius = random(1.5, 3.5);
        _this.life = 1000;
        _this.offset = [];
        for (var i = 0; i < _this.total; i++) {
            _this.offset[i] = random(-_this.radius * 0.5, _this.radius * 0.5);
        }
        return _this;
    }
    TankExplosionParticle.prototype.show = function () {
        push();
        stroke('black');
        fill(this.color);
        translate(this.pos.x, this.pos.y);
        beginShape();
        for (var i = 0; i < this.total; i++) {
            var angle = map(i, 0, this.total, 0, TWO_PI);
            var r = this.radius + this.offset[i];
            var x = r * cos(angle);
            var y = r * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);
        pop();
    };
    return TankExplosionParticle;
}(Particle));
var Tank = (function () {
    function Tank(x, y, color, rotation, id, name, stats) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.rotateSpeed = 0.09;
        this.speed = 1.3;
        this.shootingTime = 500;
        this.displayNameOffset = 800;
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.movingController = new MovingControls();
        this.rotation = rotation;
        this.id = id;
        this.name = name;
        this.stats = stats;
        this.width = 15;
        this.height = 20;
        this.particles = [];
        this.barrelLength = 10;
        this.isShooting = false;
        this.isAlive = true;
    }
    Tank.prototype.update = function () {
        if (this.movingController.up) {
            this.moveForward();
        }
        if (this.movingController.down) {
            this.moveForward(-this.speed / 2);
        }
        if (this.movingController.left) {
            this.rotation -= this.rotateSpeed;
            this.emitMove();
            if (random() > 0.8) {
                this.showSmokeParticles();
            }
        }
        if (this.movingController.right) {
            this.rotation += this.rotateSpeed;
            this.emitMove();
            if (random() > 0.8) {
                this.showSmokeParticles();
            }
        }
        if (this.isShooting) {
            this.showSmokeParticles();
            this.barrelLength -= 0.35;
        }
        this.particles.forEach(function (particle) {
            particle.update();
        });
        this.checkWallCollision(walls);
        this.particles = this.particles.filter(function (particle) { return particle.isAlive(); });
        this.show();
        this.displayName();
    };
    Tank.prototype.shoot = function (_a) {
        var _this = this;
        var _b = _a === void 0 ? {} : _a, _c = _b.emitEvent, emitEvent = _c === void 0 ? true : _c, bulletId = _b.bulletId;
        if (!this.isShooting) {
            this.barrelLength = 20;
            this.isShooting = true;
            var positionBeforeTank = p5.Vector.fromAngle(this.rotation - TWO_PI / 4);
            var position = p5.Vector.add(this.pos, positionBeforeTank);
            bulletId = bulletId || random(100000).toString();
            var bullet = new Bullet(bulletId, position.x, position.y, this.color, this.rotation, this.id);
            emitEvent && socket.emit(socketEventsDictonary.fireBullet, {
                id: bullet.id,
                position: { x: bullet.pos.x, y: bullet.pos.y }
            });
            bullets.push(bullet);
            setTimeout(function () {
                _this.barrelLength = 10;
                _this.isShooting = false;
            }, this.shootingTime);
        }
    };
    Tank.prototype.checkWallCollision = function (walls) {
        var _this = this;
        walls.forEach(function (wall) {
            if (wall.isPolygonInside(_this.getPolygon())) {
                _this.pos.sub(_this.vel);
                if (random() > 0.55) {
                    _this.showSmokeParticles();
                }
            }
        });
    };
    Tank.prototype.isPolygonInside = function (otherPolygon) {
        var itsPolygon = this.getPolygon();
        return SAT.testPolygonPolygon(otherPolygon, itsPolygon);
    };
    Tank.prototype.explode = function () {
        this.isAlive = false;
        this.speed = 0.5;
        this.rotateSpeed = 0.04;
        this.particles = [];
        this.showTankExplosionParticles();
    };
    Tank.prototype.setPosition = function (pos, rotation) {
        this.pos = createVector(pos.x, pos.y);
        this.rotation = rotation;
    };
    Tank.prototype.setStats = function (stats) {
        this.stats = stats;
    };
    Tank.prototype.getStats = function () {
        return this.stats;
    };
    Tank.prototype.show = function () {
        push();
        rectMode(CENTER);
        translate(this.pos.x, this.pos.y);
        rotate(this.rotation);
        fill(this.isAlive ? this.color : 'white');
        rect(0, 0, this.width, this.height);
        fill(0);
        rect(0, -this.height / 3, 5, this.barrelLength);
        pop();
    };
    Tank.prototype.displayName = function () {
        if (this.displayNameOffset < 50)
            return;
        push();
        fill(this.displayNameOffset > 255 ? 255 : this.displayNameOffset);
        textAlign(CENTER);
        textSize(10);
        text(this.name, this.pos.x, this.pos.y + this.height / 2 + 12);
        pop();
        this.displayNameOffset -= 1;
    };
    Tank.prototype.moveForward = function (dir) {
        if (dir === void 0) { dir = 1; }
        this.vel = p5.Vector.fromAngle(this.rotation - TWO_PI / 4).mult(this.speed * dir);
        this.pos.add(this.vel);
        this.emitMove();
    };
    Tank.prototype.emitMove = function () {
        socket.emit(socketEventsDictonary.moveTank, {
            x: this.pos.x,
            y: this.pos.y,
            rotation: this.rotation,
            id: this.id
        });
    };
    Tank.prototype.getPolygon = function () {
        return new SAT.Polygon(new SAT.Vector(this.pos.x - this.width / 2, this.pos.y - this.height / 2), [
            new SAT.Vector(0, 0),
            new SAT.Vector(this.width / 2, 0),
            new SAT.Vector(this.width, this.height),
            new SAT.Vector(0, this.height),
        ]);
    };
    Tank.prototype.showSmokeParticles = function () {
        var oppositeDirectionVector = p5.Vector.fromAngle(random((this.rotation + PI / 2) - PI / 8, (this.rotation + PI / 2) + PI / 8));
        this.particles.push(new Particle(this.pos.copy(), oppositeDirectionVector));
    };
    Tank.prototype.showTankExplosionParticles = function () {
        for (var i = 0; i < 100; i++) {
            var randomDirectionVector = p5.Vector.fromAngle(random(TWO_PI)).mult(random(0.2, 1));
            this.particles.push(new Particle(this.pos.copy(), randomDirectionVector));
        }
        for (var i = 0; i < 7; i++) {
            var randomDirectionVector = p5.Vector.fromAngle(random(TWO_PI)).mult(random(0.3, 1.3));
            this.particles.push(new TankExplosionParticle(this.pos.copy(), randomDirectionVector, this.color));
        }
    };
    Tank.prototype.setName = function (name) {
        this.name = name;
    };
    return Tank;
}());
var MovingControls = (function () {
    function MovingControls() {
        this.up = false;
        this.left = false;
        this.right = false;
        this.down = false;
    }
    MovingControls.prototype.setControls = function (_a) {
        var up = _a.up, left = _a.left, right = _a.right, down = _a.down;
        this.up = up !== null && up !== void 0 ? up : this.up;
        this.left = left !== null && left !== void 0 ? left : this.left;
        this.right = right !== null && right !== void 0 ? right : this.right;
        this.down = down !== null && down !== void 0 ? down : this.down;
    };
    return MovingControls;
}());
var Wall = (function () {
    function Wall(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    Wall.prototype.show = function () {
        push();
        noStroke();
        fill(this.color);
        image(wallImg, this.x, this.y, this.width, this.height);
        pop();
    };
    Wall.prototype.isPolygonInside = function (otherPolygon) {
        var itsPolygon = this.getPolygon();
        var testPolygonPolygon = SAT.testPolygonPolygon(otherPolygon, itsPolygon);
        if (testPolygonPolygon) {
            push();
            noStroke();
            fill('pink');
            rect(this.x, this.y, this.width, this.height);
            pop();
        }
        return testPolygonPolygon;
    };
    Wall.prototype.getPolygon = function () {
        return new SAT.Polygon(new SAT.Vector(this.x, this.y), [
            new SAT.Vector(0, 0),
            new SAT.Vector(this.width, 0),
            new SAT.Vector(this.width, this.height),
            new SAT.Vector(0, this.height),
        ]);
    };
    Wall.prototype.toString = function () {
        return 'wall';
    };
    return Wall;
}());
var CANVAS_WIDTH = 403, CANVAS_HEIGHT = 403 + 50;
var walls = [];
var bullets = [];
var socket;
var restartGameButton;
var renamingButton;
var floorImg;
var wallImg;
var players = [];
var player;
var isLobby = true;
var serverBaseUrl = 'http://localhost:8080';
function preload() {
    floorImg = loadImage('./img/floor.png');
    wallImg = loadImage('./img/wall.jpeg');
}
function setup() {
    socket = io.connect(serverBaseUrl);
    socket.on('connect', function () {
        console.log('🚀 - Socket is connected');
    });
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    restartGameButton = createButton('Restart Game');
    restartGameButton.mousePressed(function () {
        socket.emit(socketEventsDictonary.startGame);
    });
    renamingButton = createButton('Rename');
    renamingButton.mousePressed(function () {
        var nickname = prompt('Enter new name').trim();
        if (nickname) {
            localStorage.setItem('nickname', nickname);
            socket.emit(socketEventsDictonary.setNickname, { nickname: nickname.trim() });
        }
    });
    var nickname = localStorage.getItem('nickname');
    if (nickname) {
        socket.emit(socketEventsDictonary.setNickname, { nickname: nickname.trim() });
    }
    socket.on(socketEventsDictonary.setNickname, function (data) {
        var player = players.find(function (p) { return p.id === data.id; });
        if (player) {
            player.setName(data.nickname);
        }
    });
    socket.on(socketEventsDictonary.startGame, function (data) {
        isLobby = false;
        walls = generateWallObjects(data.walls);
        players = setupPlayers(data.players);
        player = players.find(function (p) { return p.id === socket.id; });
        bullets = [];
    });
    socket.on(socketEventsDictonary.moveTank, function (data) {
        var player = players.find(function (p) { return p.id === data.id; });
        if (player) {
            player.setPosition({ x: data.x, y: data.y }, data.rotation);
        }
    });
    socket.on(socketEventsDictonary.fireBullet, function (data) {
        var player = players.find(function (p) { return p.id === data.playerId; });
        if (player) {
            player.shoot({ emitEvent: false, bulletId: data.id });
        }
    });
    socket.on(socketEventsDictonary.hitTarget, function (data) {
        var player = players.find(function (p) { return p.id === data.hitTankId; });
        if (player) {
            player.explode();
        }
        players.forEach(function (p) { return p.setStats(data.players.find(function (pl) { return pl.id === p.id; }).stats); });
    });
    socket.on(socketEventsDictonary.playerConnected, function (data) {
        console.log('player connected', data);
        players = players.filter(function (p) { return p.id !== data.socketId; });
    });
}
function displayLobbyInfo() {
    push();
    fill(255);
    textAlign(CENTER);
    textSize(18);
    text('You are in lobby', CANVAS_WIDTH / 2, 100);
    textSize(14);
    text('While you are waiting you can rename your tank', CANVAS_WIDTH / 2, 120);
    textSize(12);
    text('Press space to shoot', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    text('Use arrows to move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    pop();
}
function showFloor() {
    push();
    imageMode(CORNER);
    for (var i = 0; i < CANVAS_WIDTH; i += 50) {
        for (var j = 0; j < CANVAS_HEIGHT; j += 50) {
            image(floorImg, i, j, 50, 50);
        }
    }
    pop();
}
function draw() {
    background(51);
    if (isLobby) {
        displayLobbyInfo();
    }
    else {
        showFloor();
    }
    walls.forEach(function (wall) { return wall.show(); });
    bullets.forEach(function (bullet) { return bullet.update(); });
    bullets = bullets.filter(function (bullet) { return bullet.isAlive(); });
    players.forEach(function (player) { return player.update(); });
    showStats(players);
}
function keyPressed() {
    var _a, _b, _c, _d;
    if (keyCode === UP_ARROW) {
        (_a = player === null || player === void 0 ? void 0 : player.movingController) === null || _a === void 0 ? void 0 : _a.setControls({ up: true, down: false });
    }
    if (keyCode === LEFT_ARROW) {
        (_b = player === null || player === void 0 ? void 0 : player.movingController) === null || _b === void 0 ? void 0 : _b.setControls({ left: true });
    }
    if (keyCode === RIGHT_ARROW) {
        (_c = player === null || player === void 0 ? void 0 : player.movingController) === null || _c === void 0 ? void 0 : _c.setControls({ right: true });
    }
    if (keyCode === DOWN_ARROW) {
        (_d = player === null || player === void 0 ? void 0 : player.movingController) === null || _d === void 0 ? void 0 : _d.setControls({ down: true, up: false });
    }
    if (keyCode === 32) {
        if (!(player === null || player === void 0 ? void 0 : player.isAlive))
            return;
        player.shoot({ emitEvent: true });
    }
}
function keyReleased() {
    var _a, _b, _c, _d;
    if (keyCode === UP_ARROW) {
        (_a = player === null || player === void 0 ? void 0 : player.movingController) === null || _a === void 0 ? void 0 : _a.setControls({ up: false });
    }
    if (keyCode === LEFT_ARROW) {
        (_b = player === null || player === void 0 ? void 0 : player.movingController) === null || _b === void 0 ? void 0 : _b.setControls({ left: false });
    }
    if (keyCode === RIGHT_ARROW) {
        (_c = player === null || player === void 0 ? void 0 : player.movingController) === null || _c === void 0 ? void 0 : _c.setControls({ right: false });
    }
    if (keyCode === DOWN_ARROW) {
        (_d = player === null || player === void 0 ? void 0 : player.movingController) === null || _d === void 0 ? void 0 : _d.setControls({ down: false });
    }
}
function showStats(players) {
    if (players.length <= 10) {
        players.forEach(function (player, i) {
            push();
            var x = 40 * i + 20;
            fill(255);
            textSize(8);
            textAlign(CENTER);
            text(limitNameChars(player.name, 8), x, CANVAS_HEIGHT - 40);
            textSize(10);
            fill(0, 255, 0);
            text(player.getStats().kills, x - 10, CANVAS_HEIGHT - 10);
            fill(255, 40, 40);
            text(player.getStats().deaths, x + 10, CANVAS_HEIGHT - 10);
            rectMode(CENTER);
            fill(player.color);
            rect(x, CANVAS_HEIGHT - 30, 16, 12);
            fill(0);
            rect(x - 6, CANVAS_HEIGHT - 30, 8, 5);
            pop();
        });
    }
    else {
        players.forEach(function (player, i) {
            push();
            var x = i >= 10 ? 40 * (i - 10) + 20 : 40 * i + 20;
            var y = i >= 10 ? CANVAS_HEIGHT - 20 : CANVAS_HEIGHT - 40;
            fill(255);
            textSize(8);
            textAlign(CENTER);
            var textStat = limitNameChars(player.name, 5) + ": " + player.getStats().kills + "/" + player.getStats().deaths;
            text(textStat, x, y);
            pop();
        });
    }
}
function limitNameChars(str, end) {
    return str.length > end ? str.slice(0, end) + '.' : str;
}
function generateWallObjects(walls) {
    return walls.map(function (wall) { return new Wall(wall.x, wall.y, wall.width, wall.height, 'gray'); });
}
function setupPlayers(players) {
    return players.map(function (player) { return new Tank(player.position.x, player.position.y, player.color, player.rotation, player.id, player.name, player.stats); });
}
//# sourceMappingURL=build.js.map