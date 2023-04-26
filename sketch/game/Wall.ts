class Wall {

    constructor(public x: number, public y: number, public width: number, public height: number, public color: string) {
    }

    public show() {
        push();
        noStroke()
        fill(this.color);
        image(wallImg, this.x, this.y, this.width, this.height);
        pop();
    }

    public isPolygonInside(otherPolygon: SAT.Polygon) {
        const itsPolygon = this.getPolygon();

        const testPolygonPolygon = SAT.testPolygonPolygon(otherPolygon, itsPolygon);
        if (testPolygonPolygon) {
            push();
            noStroke()
            fill('pink');
            rect(this.x, this.y, this.width, this.height);
            pop();
        }
        return testPolygonPolygon;
    }

    private getPolygon() {
        return new SAT.Polygon(new SAT.Vector(this.x, this.y), [
            new SAT.Vector(0, 0),
            new SAT.Vector(this.width, 0),
            new SAT.Vector(this.width, this.height),
            new SAT.Vector(0, this.height),
        ]);
    }
    public toString() {
        return 'wall'
    }
}