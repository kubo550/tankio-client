const CANVAS_WIDTH = 403, CANVAS_HEIGHT = 403 + 50;
let walls: Wall[] = [];
let bullets: Bullet[] = [];
let socket: io.Socket;
let restartGameButton: p5.Element;
let renamingButton: p5.Element;

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
let isLobby = true

// const serverBaseUrl = 'http://localhost:8080';
const serverBaseUrl = 'https://a36b-83-29-123-120.ngrok-free.app';


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
    renamingButton = createButton('Rename');
    renamingButton.mousePressed(() => {
        const nickname = prompt('Enter new name').trim();
        if (nickname) {
            socket.emit(socketEventsDictonary.setNickname, {nickname: nickname.trim()});
        }
    });

    socket.on(socketEventsDictonary.setNickname, (data: {id: string, nickname: string}) => {
        const player = players.find(p => p.id === data.id);
        if (player) {
            player.setName(data.nickname);
        }

    });

    socket.on(socketEventsDictonary.startGame, (data) => {
        isLobby = false;
        walls = generateWallObjects(data.walls as ServerWall[]);
        players = setupPlayers(data.players as ServerPlayer[]);
        player = players.find(p => p.id === socket.id);
        bullets = [];

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

    socket.on(socketEventsDictonary.hitTarget, (data: { hitTankId: string, bulletId: string } & {players: ServerPlayer[]}) => {
        const player = players.find(p => p.id === data.hitTankId);
        if (player) {
            player.explode();
        }
        players.forEach(p => p.setStats(data.players.find(pl => pl.id === p.id).stats));
    });

    socket.on(socketEventsDictonary.playerConnected, (data) => {
        console.log('player connected', data);
        players = players.filter(p => p.id !== data.socketId);
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

function draw() {
    background(51);

    if (isLobby) {
        displayLobbyInfo();
    }

    walls.forEach(wall => wall.show());
    players.forEach(player => player.update());
    bullets.forEach(bullet => bullet.update());
    bullets = bullets.filter(bullet => bullet.isAlive());

    showStats(players);
}


function keyPressed() {
    if (keyCode === UP_ARROW) {
        player?.movingController?.setControls({up: true});
    }
    if (keyCode === LEFT_ARROW) {
        player?.movingController?.setControls({left: true});
    }
    if (keyCode === RIGHT_ARROW) {
        player?.movingController?.setControls({right: true});
    }
    if (keyCode === DOWN_ARROW) {
        player?.movingController?.setControls({down: true});
    }
    if (keyCode === 32) {
        if(!player?.isAlive) return;
        player.shoot({emitEvent: true});
    }
}

function keyReleased() {
    if (keyCode === UP_ARROW) {
        player?.movingController?.setControls({up: false});
    }
    if (keyCode === LEFT_ARROW) {
        player?.movingController?.setControls({left: false});
    }
    if (keyCode === RIGHT_ARROW) {
        player?.movingController?.setControls({right: false});
    }
    if (keyCode === DOWN_ARROW) {
        player?.movingController?.setControls({down: false});
    }
}