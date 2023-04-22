class Tank {
    public pos: p5.Vector;
    public vel: p5.Vector;

    public movingController: MovingControls;

    public width: number;
    public height: number;
    public rotation: number;
    public readonly id: string;
    public particles: Particle[];
    public isAlive: boolean;
    private readonly name: string;
    private readonly bulletLimit: number;
    private readonly rotateSpeed = 0.09;
    private readonly speed = 1.3;
    private barrelLength: number;
    private isShooting: boolean;

    constructor(public x: number, public y: number, public color: string, rotation: number, id: string, name: string) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);

        this.movingController = new MovingControls();

        this.rotation = rotation
        this.id = id;
        this.name = name;
        this.width = 15;
        this.height = 20;
        this.particles = [];
        this.bulletLimit = 100;
        this.barrelLength = 10;
        this.isShooting = false;
        this.isAlive = true;
    }

    update() {
        if (this.movingController.up) {
            this.moveForward();
        }
        if (this.movingController.down) {
            this.moveForward(-this.speed / 2);
        }
        if (this.movingController.left) {
            this.rotation -= this.rotateSpeed;
            this.emitMove()
            if (random() > 0.8) {
                this.showSmokeParticles();
            }

        }
        if (this.movingController.right) {
            this.rotation += this.rotateSpeed;
            this.emitMove()
            if (random() > 0.8) {
                this.showSmokeParticles();
            }

        }

        if (this.isShooting) {
            this.showSmokeParticles();
            this.barrelLength -= 0.5;
        }


        this.particles.forEach(particle => {
            particle.update()
        });

        this.checkWallCollision(walls);
        this.particles = this.particles.filter(particle => particle.isAlive());

        this.show();
        this.displayName();

    }

    shoot({emitEvent = true, bulletId}: { emitEvent?: boolean, bulletId?: string } = {}) {
        if (bullets.length < this.bulletLimit && !this.isShooting) {
            this.barrelLength = 20;
            this.isShooting = true;

            const positionBeforeTank = p5.Vector.fromAngle(this.rotation - TWO_PI / 4).mult(this.height / 2 + 7);
            const position = p5.Vector.add(this.pos, positionBeforeTank);
            bulletId = bulletId || random(100000).toString();
            const bullet = new Bullet(bulletId, position.x, position.y, this.color, this.rotation);
            emitEvent && socket.emit('playerShoot', {id: bullet.id, position: {x: bullet.pos.x, y: bullet.pos.y}});

            bullets.push(bullet);
            setTimeout(() => {

                this.barrelLength = 10;
                this.isShooting = false;
            }, 200);

        }
    }

    checkWallCollision(walls: Wall[]) {
        walls.forEach(wall => {
            if (wall.isPolygonInside(this.getPolygon())) {
                this.pos.sub(this.vel);
                this.emitMove();
                this.rotation -= this.rotateSpeed / 2;

                if (random() > 0.75) {
                    this.showSmokeParticles();
                }
            }
        });
    }

    public isPolygonInside(otherPolygon: SAT.Polygon) {
        const itsPolygon = this.getPolygon();

        const testPolygonPolygon = SAT.testPolygonPolygon(otherPolygon, itsPolygon);

        if (testPolygonPolygon) {
            push();
            rectMode(CENTER)
            translate(this.pos.x, this.pos.y);
            rotate(this.rotation);
            fill('pink');
            rect(0, 0, this.width, this.height);
            fill(0);
            rect(0, -this.height / 3, 5, 8);
            pop()
        }
        return testPolygonPolygon;
    }

    public explode() {
        this.isAlive = false;
        this.particles = [];
        this.showTankExplosionParticles();

    }

    public setPosition(pos: { x: number, y: number }, rotation: number) {
        this.pos = createVector(pos.x, pos.y);
        this.rotation = rotation;
    }

    private show() {
        push();
        rectMode(CENTER)
        translate(this.pos.x, this.pos.y);
        rotate(this.rotation);
        fill(this.isAlive ? this.color : 'white');
        rect(0, 0, this.width, this.height);
        fill(0);
        rect(0, -this.height / 3, 5, this.barrelLength);
        pop();

    }

    private displayName() {
        push();
        fill(255);
        textAlign(CENTER);
        textSize(10)
        text(this.name, this.pos.x, this.pos.y + this.height / 2 + 12);
        pop();
    }

    private moveForward(dir = 1) {
        this.vel = p5.Vector.fromAngle(this.rotation - TWO_PI / 4).mult(this.speed * dir);
        this.pos.add(this.vel);
        this.emitMove();
    }

    private emitMove() {
        socket.emit('playerMoved', {x: this.pos.x, y: this.pos.y, rotation: this.rotation, id: this.id});
    }

    private getPolygon() {
        return new SAT.Polygon(new SAT.Vector(this.pos.x - this.width / 2, this.pos.y - this.height / 2), [
            new SAT.Vector(0, 0),
            new SAT.Vector(this.width / 2, 0),
            new SAT.Vector(this.width, this.height),
            new SAT.Vector(0, this.height),
        ]);
    }

    private showSmokeParticles() {
        const oppositeDirectionVector = p5.Vector.fromAngle(random((this.rotation + PI / 2) - PI / 8, (this.rotation + PI / 2) + PI / 8))
        this.particles.push(new Particle(this.pos.copy(), oppositeDirectionVector));
    }

    private showTankExplosionParticles() {
        for (let i = 0; i < 100; i++) {
            const randomDirectionVector = p5.Vector.fromAngle(random(TWO_PI)).mult(random(0.2, 1))
            this.particles.push(new Particle(this.pos.copy(), randomDirectionVector));
        }
        for (let i = 0; i < 5; i++) {
            const randomDirectionVector = p5.Vector.fromAngle(random(TWO_PI)).mult(random(0.3, 1))
            this.particles.push(new TankExplosionParticle(this.pos.copy(), randomDirectionVector, this.color));
        }
    }
}

class MovingControls {
    up: boolean;
    left: boolean;
    right: boolean;
    down: boolean;

    constructor() {
        this.up = false;
        this.left = false;
        this.right = false;
        this.down = false;
    }

    setControls({up, left, right, down}: Partial<Pick<MovingControls, 'left' | 'right' | 'up' | 'down'>>) {
        this.up = up ?? this.up;
        this.left = left ?? this.left;
        this.right = right ?? this.right;
        this.down = down ?? this.down;
    }

}
