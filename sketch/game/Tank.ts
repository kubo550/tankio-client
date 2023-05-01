class Tank {
    public pos: p5.Vector;
    public vel: p5.Vector;

    public movingController: MovingControls;

    public readonly id: string;
    public width: number;
    public height: number;
    public rotation: number;
    public particles: Particle[];
    public isAlive: boolean;
    public name: string;
    private stats: { kills: number, deaths: number };
    private rotateSpeed = 0.09;
    private speed = 1.3;
    private barrelLength: number;
    private isShooting: boolean;
    private readonly shootingTime = 500;
    private displayNameOffset = 800;

    constructor(public x: number, public y: number, public color: string, rotation: number, id: string, name: string, stats: { kills: number, deaths: number }) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);

        this.movingController = new MovingControls();

        this.rotation = rotation
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
            this.barrelLength -= 0.35;
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
        if (!this.isShooting) {
            this.barrelLength = 20;
            this.isShooting = true;

            const positionBeforeTank = p5.Vector.fromAngle(this.rotation - TWO_PI / 4)
            const position = p5.Vector.add(this.pos, positionBeforeTank);
            bulletId = bulletId || random(100000).toString();
            const bullet = new Bullet(bulletId, position.x, position.y, this.color, this.rotation, this.id);
            emitEvent && socket.emit(socketEventsDictonary.fireBullet, {
                id: bullet.id,
                position: {x: bullet.pos.x, y: bullet.pos.y}
            });

            bullets.push(bullet);
            setTimeout(() => {
                this.barrelLength = 10;
                this.isShooting = false;
            }, this.shootingTime);

        }
    }

    checkWallCollision(walls: Wall[]) {
        walls.forEach(wall => {
            if (wall.isPolygonInside(this.getPolygon())) {
                this.pos.sub(this.vel);

                if (random() > 0.55) {
                    this.showSmokeParticles();
                }
            }
        });
    }

    public isPolygonInside(otherPolygon: SAT.Polygon) {
        const itsPolygon = this.getPolygon();

        return SAT.testPolygonPolygon(otherPolygon, itsPolygon);
    }

    public explode() {
        this.isAlive = false;
        this.speed = 0.5;
        this.rotateSpeed = 0.04;
        this.particles = [];
        this.showTankExplosionParticles();

    }

    public setPosition(pos: { x: number, y: number }, rotation: number) {
        this.pos = createVector(pos.x, pos.y);
        this.rotation = rotation;
    }

    public setStats(stats: { kills: number, deaths: number }) {
        this.stats = stats;
    }

    public getStats() {
        return this.stats;
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
        if (this.displayNameOffset < 50) return
        push();

        fill(this.displayNameOffset > 255 ? 255 : this.displayNameOffset);
        textAlign(CENTER);
        textSize(10)
        text(this.name, this.pos.x, this.pos.y + this.height / 2 + 12);
        pop();
        this.displayNameOffset -= 1;
    }

    private moveForward(dir = 1) {
        this.vel = p5.Vector.fromAngle(this.rotation - TWO_PI / 4).mult(this.speed * dir);
        this.pos.add(this.vel);
        this.emitMove();
    }

    private emitMove() {
        socket.emit(socketEventsDictonary.moveTank, {
            x: this.pos.x,
            y: this.pos.y,
            rotation: this.rotation,
            id: this.id
        });
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
        for (let i = 0; i < 7; i++) {
            const randomDirectionVector = p5.Vector.fromAngle(random(TWO_PI)).mult(random(0.3, 1.3))
            this.particles.push(new TankExplosionParticle(this.pos.copy(), randomDirectionVector, this.color));
        }
    }
    public setName(name: string) {
        this.name = name;
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
