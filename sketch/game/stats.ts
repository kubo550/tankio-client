function showStats(players: Tank[]) {
    players.forEach((player, i) => {
        push();
        const x = 40 * i + 20;
        fill(255)
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

function limitNameChars(str: string, end: number) {
    return str.length > end ? str.slice(0, end) + '..' : str;
}