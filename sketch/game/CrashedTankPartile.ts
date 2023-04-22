class Particle {
    public pos: p5.Vector;
    public vel: p5.Vector;
    public acc: p5.Vector;
    public life: number;
    public lifespan: number;

    constructor(position: p5.Vector, velocity: p5.Vector) {
        this.pos = position
        this.vel = velocity;
        this.acc = createVector(0, 0);
        this.life = 255;
        this.lifespan = 255;
    }

    public update() {
        this.show();

        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.vel.mult(0.98);
        this.life-= 5;
    }

    public isAlive() {
        return this.life > 0;
    }

    public show() {
        push();
        fill(120, 120, 120, this.life / this.lifespan * 200);
        noStroke();
        ellipse(this.pos.x, this.pos.y, 5);
        pop();
    }
}

class TankExplosionParticle extends Particle {
    private readonly total: number;
    private readonly radius: number;
    private readonly offset: number[];

    constructor(position: p5.Vector, velocity: p5.Vector, private color: string = "red") {
        super(position, velocity);
        this.total = random(5, 15);
        this.radius = random(1.5, 3.5);


        this.life = 1000

        this.offset = [];
        for (let i = 0; i < this.total; i++) {
            this.offset[i] = random(-this.radius * 0.5, this.radius * 0.5);
        }
    }

    public show() {
        push();
        stroke('black');
        fill(this.color);
        translate(this.pos.x, this.pos.y);
        beginShape();
        for (let i = 0; i < this.total; i++) {
            const angle = map(i, 0, this.total, 0, TWO_PI);
            const r = this.radius + this.offset[i];
            const x = r * cos(angle);
            const y = r * sin(angle);
            vertex(x, y);
        }
        endShape(CLOSE);
        pop();
    }

}