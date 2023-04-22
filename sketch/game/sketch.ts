const CANVAS_WIDTH = 403, CANVAS_HEIGHT = 403 + 50;
let walls: Wall[] = [];
let bullets: Bullet[] = [];
let socket: io.Socket;
let restartGameButton: p5.Element;

type ServerWall = { x: number, y: number, width: number, height: number };
type ServerPlayer = {
    id: string,
    name: string,
    color: string,
    rotation: number,
    position: { x: number, y: number },
    stats: { kills: number, deaths: number }
};


let players: Tank[] = []
let player: Tank;

const serverBaseUrl = 'http://localhost:8080';


function setup() {
    socket = io.connect(serverBaseUrl);

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
        console.log('other player fired')
        const player = players.find(p => p.id === data.playerId);
        if (player) {
            player.shoot({emitEvent: false, bulletId: data.id});
        }
    });

    socket.on(socketEventsDictonary.hitTarget, (data: { hitTankId: string, bulletId: string } & {players: ServerPlayer[]}) => {
        console.log('hit target')
        const player = players.find(p => p.id === data.hitTankId);
        if (player) {
            player.explode();
        }
        console.log('hit target', data.players.map(p => p.stats));
        players.forEach(p => p.setStats(data.players.find(pl => pl.id === p.id).stats));
        console.log('hit target', players.map(p => p.getStatsText()));
    });

    socket.on(socketEventsDictonary.playerConnected, (data) => {
        console.log('player connected', data);
        players = players.filter(p => p.id !== data.socketId);
    });
}


function draw() {
    background(51);

    walls.forEach(wall => wall.show());
    players.forEach(player => player.update());
    bullets.forEach(bullet => bullet.update());
    bullets = bullets.filter(bullet => bullet.isAlive());

    showStats(players);
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