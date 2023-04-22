const CANVAS_WIDTH = 403, CANVAS_HEIGHT = 403;
let walls: Wall[] = [];
let bullets: Bullet[] = [];
let socket: io.Socket;
let restartGameButton: p5.Element;

type ServerWall = { x: number, y: number, width: number, height: number };
type ServerPlayer = { color: string, rotation: number, name: string, id: string, position: { x: number, y: number }, isHost: boolean };


let players: Tank[] = []
let player: Tank;

function setup() {
    socket = io.connect('http://localhost:8080');

    socket.on('connect', () => {
        console.log('🚀 - Socket is connected')
    });

    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

    restartGameButton = createButton('Restart Game');
    restartGameButton.mousePressed(() => {
        socket.emit(socketEventsDictonary.startGame);
    });


    socket.on(socketEventsDictonary.startGame, (data) => {
        walls = generateWallObjects(data.walls as ServerWall[]);
        players = setupPlayers(data.players as ServerPlayer[]);
        player = players.find(p => p.id === socket.id);
    });


    socket.on(socketEventsDictonary.moveTank, (data) => {
        const player = players.find(p => p.id === data.id);
        if (player) {
            player.setPosition({x: data.x, y: data.y}, data.rotation);
        }
    });

    socket.on(socketEventsDictonary.fireBullet, (data) => {
        const player = players.find(p => p.id === data.playerId);
        if (player) {
            player.shoot({emitEvent: false, bulletId: data.id});
        }
    });

    socket.on('bulletMoved', (data) => {
        const bullet = bullets.find(b => b.id === data.id);
        if (bullet) {
            bullet.setPosition({x: data.position.x, y: data.position.y});
        }
    });

}


function draw() {
    background(51);

    walls.forEach(wall => wall.show());
    players.forEach(player => player.update());
    bullets.forEach(bullet => bullet.update());
    bullets = bullets.filter(bullet => bullet.isAlive());
}


function keyPressed() {
    if (keyCode === UP_ARROW) {
        player.movingController.setControls({up: true});
    }
    if (keyCode === LEFT_ARROW) {
        player.movingController.setControls({left: true});
    }
    if (keyCode === RIGHT_ARROW) {
        player.movingController.setControls({right: true});
    }
    if (keyCode === DOWN_ARROW) {
        player.movingController.setControls({down: true});
    }
    if (keyCode === 32) {
        player.shoot({emitEvent: true});
    }
}

function keyReleased() {
    if (keyCode === UP_ARROW) {
        player.movingController.setControls({up: false});
    }
    if (keyCode === LEFT_ARROW) {
        player.movingController.setControls({left: false});
    }
    if (keyCode === RIGHT_ARROW) {
        player.movingController.setControls({right: false});
    }
    if (keyCode === DOWN_ARROW) {
        player.movingController.setControls({down: false});
    }
}