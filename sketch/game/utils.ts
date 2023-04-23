function generateWallObjects(walls: { x: number; y: number; width: number; height: number }[]) {
    return walls.map(wall => new Wall(wall.x, wall.y, wall.width, wall.height, 'gray'));
}

function setupPlayers(players: ServerPlayer[]) {
    return players.map(player => new Tank(player.position.x, player.position.y, player.color, player.rotation, player.id, player.name, player.stats));
}