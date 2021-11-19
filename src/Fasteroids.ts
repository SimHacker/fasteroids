////////////////////////////////////////////////////////////////////////
// Fasteroids.ts
// By Don Hopkins.


////////////////////////////////////////////////////////////////////////
// Imports


import * as Pie from './Pie';


////////////////////////////////////////////////////////////////////////
// Class Fasteroids


class Fasteroids {


    ////////////////////////////////////////////////////////////////////////
    // Instance Variables


    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    width: number = 0;
    height: number = 0;
    paused: boolean = true;
    timer: any = null;
    timerInterval: number = 1000 / 60;
    sprites: any[] = [];
    targets: any[] = [];
    ships: any[] = [];
    rocks: any[] = [];
    blasts: any[] = [];
    currentShipIndex: number = 0;
    timeStep: number = 0.25;
    time: number = 0;
    minCollisionTime: number = 5;
    initialShipCount: number = 1;
    maxShips: number = 4;
    shipWidth: number = 20;
    shipHeight: number = 20;
    shipDensity: number = 0.25;
    shipRestitution: number = 1.0;
    shipTurn: number = 0.1;
    shipAccel: number = 4.0;
    shipTractor: number = 2.0;
    shipBrake: number = 0.75;
    rockDensity: number = 1;
    rockRestitution: number = 1.0;
    rockBlastHeat: number = 0.6;
    rockShipHeat: number = 0.8;
    rockBounceHeat: number = 0.05;
    rockCool: number = 0.99;
    rockInhibitTime: number = 5;
    rockMinSplitHeat: number = 1.0;
    rockMinMergeHeat: number = 0.5;
    minRockSplitSize: number = 30;
    maxRockMergeSize: number = 200;
    rockBlastCount: number = 8;
    rockBlastVel: number = 16;
    rockBlastSpread: number = 10;
    initialRockCount: number = 5;
    initialRockSize: number = 50;
    initialRockSpeed: number = 5.0;
    initialRockDDir: number = 0.75;
    spriteSmoosh: number = 1.0;
    accelProb: number = 0.0;
    accelRate: number = 15.0;
    shipBlastAccel: number = -1.0;
    turnSign: number = 1;
    turnSignProb: number = 0.02;
    turnProb: number = 0.0;
    turnRate: number = (2 * Math.PI) / 100;
    blastWidth: number = 1;
    blastHeight: number = 1;
    blastDensity: number = 100.0;
    blastRestitution: number = 1.0;
    blastProb: number = 0.0;
    blastSpeed: number = 20.0;
    blastTime: number = 50;
    highRockMark: number = 20;
    highBlastMark: number = 20;
    wrap: boolean = false;
    initRound: boolean = true;
    inRound: boolean = true;
    round: number = 0;

    spaceFillColor = '#000000';

    shipFillColor = '#8080ff';
    shipStrokeColor = '#0000ff';
    shipStrokeWidth = 2;
    shipNoseX = 20;
    shipWingX = -20;
    shipWingY = 10;
    shipEngineX = -10

    rockStrokeColor = '#ffffff';
    rockStrokeWidth = 2;

    blastFillColor = '#ffff80';
    blastStrokeColor = '#ffff00';
    blastStrokeWidth = 2;
    blastRadius = 5;

    hexDigits: string[] = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'
    ];


    ////////////////////////////////////////////////////////////////////////
    // Methods


    ////////////////////////////////////////////////////////////////////////
    // Utilities


    square(x: number): number {
        return x * x;
    }


    angle(dx: number, dy: number): number {
        if ((dx == 0) && (dy == 0)) {
            return 0;
        } else {
            return Math.atan2(dy, dx);
        } // if
    }


    dist(dx: number, dy: number): number {
        return Math.sqrt(this.square(dx) + this.square(dy));
    }


    distance2(x1: number, y1: number, x2: number, y2: number): number {
        return this.square(x1 - x2) + this.square(y1 - y2);
    }


    distance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(this.distance2(x1, y1, x2, y2));
    }


    lineDistance(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
        const dist2 = this.distance2(x1, y1, x2, y2);
        if (dist2 === 0) return this.distance(x, y, x1, y1);
        const t = Math.max(0, Math.min(1,
            (((x - x1) * (x2 - x1)) + ((y - y1) * (y2 - y1))) /
            dist2));
        return this.distance(
            x,
            y,
            x1 + (t * (x2 - x1)),
            y1 + (t * (y2 - y1)));
    }


    randInt(n: number): number {
        return Math.floor(Math.random() * n);
    }


    clampFloatToByte(f: number): number {
        var b = Math.floor(f * 256);
        if (b < 0) {
            b = 0;
        } else if (b > 255) {
            b = 255;
        }
        return b;
    }


    byteToHex(b: number): string {
        return this.hexDigits[(b >> 4) & 15] + this.hexDigits[b & 15];
    }


    ////////////////////////////////////////////////////////////////////////
    // Initialization


    init(canvas: any) {

        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d');

        if (this.canvas) {

            window.addEventListener(
                'resize',
                () => this.handleResizeCanvas());

            window.addEventListener(
                'keydown',
                (event: KeyboardEvent) => this.handleKeyPress(event.key));

            this.handleResizeCanvas();

        }

    }


    handleResizeCanvas() {

        if (!this.canvas || !this.canvas.parentElement) {
            //console.log('Fasteroids.ts: handleResizeCanvas: no canvas');
            return;
        }

        const lastWidth = this.width;
        const lastHeight = this.height;
        const width = this.width = this.canvas.parentElement.offsetWidth;
        const height = this.height = this.canvas.parentElement.offsetHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        //console.log('Fasteroids.ts: handleResizeCanvas:', 'lastWidth:', lastWidth, 'lastHeight:', lastHeight, 'width:', this.width, 'height:', this.height);

        if (((lastWidth !== 0) && (lastWidth !== width)) ||
            ((lastHeight != 0) && (lastHeight != height))) {

            const xScale = this.width / lastWidth;
            const yScale = this.height / lastHeight;

            //console.log('Fasteroids.ts: handleResizeCanvas:', 'xScale:', xScale, 'yScale:', yScale);

            this.sprites.forEach((sprite: any) => {
                sprite.x *= xScale;
                sprite.y *= yScale;
            });

        }

    }


    ////////////////////////////////////////////////////////////////////////
    // Game Rounds


    startGame() {

        //console.log('Fasteroids.ts: startGame');

        this.sprites = [];
        this.targets = [];

        for (var i = 0; i < this.initialShipCount; i++) {
            this.makeRandomShip();
        } // for i

        this.round = 1;
        this.initRound = true;

        this.setPaused(false);

    }


    stopGame() {
        this.setPaused(true);
    }

    checkRound() {

        if (!this.initRound &&
            this.inRound &&
            (this.rocks.length == 0) &&
            (this.blasts.length == 0)) {

            this.round++;
            this.initRound = true;

        } // if

        if (this.initRound) {

            this.initRound = false;
            this.initNewRound();

        } // if

    }


    initNewRound() {

        this.inRound = true;

        const extraRocks = Math.floor(this.round / 2.0);

        for (var i = 0; i < (this.initialRockCount + extraRocks); i++) {
            this.makeRandomRock(this.initialRockSize);
        } // for i

        while (this.ships.length < this.initialShipCount) {
            this.makeRandomShip();
        } // for i

    }


    resetToRound(round: number) {

        this.resetWorld();

        this.round = round;
        this.inRound = true;
        this.initRound = true;

    }


    resetWorld() {

        while (this.blasts.length > 0) {
            this.removeSprite(this.blasts[0]);
        } // while

        while (this.ships.length > 0) {
            this.removeSprite(this.ships[0]);
        } // while

        while (this.rocks.length > 0) {
            this.removeSprite(this.rocks[0]);
        } // while

        this.inRound = false;

    }


    drawRound(ctx: CanvasRenderingContext2D) {
    }


    ////////////////////////////////////////////////////////////////////////
    // Sprites


    makeSprite(
        type: string,
        x: number,
        y: number,
        width: number,
        height: number,
        orientation: number,
        velocityX: number,
        velocityY: number,
        angularVelocity: number,
        density: number,
        restitution: number): any {

        const sprite = {
            type,
            x,
            y,
            width,
            height,
            orientation,
            velocityY,
            velocityX,
            angularVelocity,
            density,
            restitution,
            owner: null,
            forceX: 0,
            forceY: 0,
            torque: 0,
            temperature: 0,
        };

        this.initSpriteDynamics(sprite);
        this.setSpriteOrientation(sprite, orientation);

        this.sprites.push(sprite);

        return sprite;
    }


    initSpriteDynamics(sprite: any) {

        const width = sprite.width;
        const height = sprite.height;

        sprite.size = Math.max(width, height);
        sprite.mass = sprite.density * width * height;
        sprite.massInverse = 1.0 / sprite.mass;
        sprite.moment = (sprite.mass / 12.0) * ((width * width) + (height * height));
        sprite.momentInverse = 1.0 / sprite.moment;

    }


    setSpriteOrientation(sprite: any, orientation: number) {

        while (orientation < 0) {
            orientation += Math.PI * 2;
        } // while

        while (orientation >= (Math.PI * 2)) {
            orientation -= Math.PI * 2;
        } // while

        sprite.orientation = orientation;
        sprite.orientationDX = Math.cos(orientation);
        sprite.orientationDY = Math.sin(orientation);

    }


    turnSprite(sprite: any, twist: number) {
        this.setSpriteOrientation(sprite, twist + sprite.orientation);
    }


    accelerateSprite(sprite: any, accel: number) {
        this.tractorSprite(
            sprite,
            sprite.orientationDX * accel,
            sprite.orientationDY * accel);
    }


    tractorSprite(sprite: any, dx: number, dy: number) {
        sprite.velocityX += dx;
        sprite.velocityY += dy;
    }


    brakeSprite(sprite: any, friction: number) {
        sprite.velocityX *= friction;
        sprite.velocityY *= friction;
    }


    removeSprite(sprite: any) {
        switch (sprite.type) {

            case 'rock':
                this.removeSpriteFromList(this.targets, sprite);
                this.removeSpriteFromList(this.rocks, sprite);
                break;

            case 'ship':
                this.removeSpriteFromList(this.targets, sprite);
                this.removeSpriteFromList(this.ships, sprite);
                break;

            case 'blast':
                this.removeSpriteFromList(this.blasts, sprite);
                break;

        }
    }


    removeSpriteFromList(list: any[], sprite: any) {
        const index = list.indexOf(sprite);

        if (index < 0) {
            return;
        }

        list.splice(index, 1);
    }


    ////////////////////////////////////////////////////////////////////////
    // Rocks


    makeRock(x: number, y: number, velocityX: number, velocityY: number, dir: number, size: number): any {
        var rock =
            this.makeSprite(
                'rock',
                x, y,
                size, size,
                dir,
                velocityX, velocityY,
                0.0,
                this.rockDensity,
                this.rockRestitution);

        this.targets.push(rock);

        this.randomizeRock(rock);

        rock.startTime = this.time;
        rock.endTime = null;

        this.rocks.push(rock);

        return rock;
    }


    makeRandomRock(size: number): any {
        return this.makeRock(
            Math.random() * this.width,
            Math.random() * this.height,
            (Math.random() - 0.5) * 2 * this.initialRockSpeed,
            (Math.random() - 0.5) * 2 * this.initialRockSpeed,
            Math.random() * (Math.PI * 2),
            size);
    }


    randomizeRock(rock: any) {
        rock.velocityX = rock.orientationDX * Math.random() * this.initialRockSpeed;
        rock.velocityY = rock.orientationDY * Math.random() * this.initialRockSpeed;
        rock.angularVelocity = (Math.random() - 0.5) * this.initialRockDDir;
        rock.path = this.makeRockPath(rock.size);
    }


    makeRockPath(size: number): number[][] {
        const verts: number[][] = [];
        const slop = 1.0;
        const jitter = 0.5;
        const center = Math.floor(size / 2);
        const r = center * slop;
        const corners = 16;
        const turn = (Math.PI * 2) / corners;
        var ang = 0;

        for (var i = 0; i < corners; i++) {
            var x =
                Math.floor(
                    (r * Math.cos(ang)) +
                    ((Math.random() - 0.5) * r * jitter));
            var y =
                Math.floor(
                    (r * Math.sin(ang)) +
                    ((Math.random() - 0.5) * r * jitter));
            if (x < -center) x = -center;
            if (x > center) x = center;
            if (y < -center) y = -center;
            if (y > center) y = center;
            verts.push([x, y]);
            ang += turn;
        } // for i

        return verts;
    }


    rockTemperatureToColor(rock: any) {
        const temperature = rock.temperature;
        return (
            '#' +
            this.byteToHex(this.clampFloatToByte(0.25 + (temperature * 0.75))) +
            this.byteToHex(this.clampFloatToByte(0.25 - (temperature * 0.25))) +
            this.byteToHex(this.clampFloatToByte(0.25 - (temperature * 0.25))));
    }


    checkRocks() {
        for (var i = this.rocks.length - 1; i >= 0; i--) {
            const rock = this.rocks[i];

            rock.temperature *= this.rockCool;

            if ((rock.endTime !== null) &&
                (rock.endTime <= this.time)) {
                this.removeSprite(rock);
            } // if

        } // for i
    }


    drawRocks(ctx: CanvasRenderingContext2D) {

        this.rocks.forEach(
            (rock: any) => this.drawRock(ctx, rock));

    }


    drawRock(ctx: CanvasRenderingContext2D, rock: any) {

        //console.log('Fasteroids.ts: drawRock', 'rock:', rock);

        ctx.save();
        {

            ctx.translate(rock.x, rock.y);
            ctx.rotate(rock.orientation);

            this.drawRockPath(ctx, rock);

            ctx.save();
            {

                ctx.fillStyle = this.rockTemperatureToColor(rock);
                ctx.fill();

            }
            ctx.restore();

            ctx.strokeStyle = this.rockStrokeColor;
            ctx.lineWidth = this.rockStrokeWidth;
            ctx.lineJoin = 'round';
            ctx.stroke();

        }
        ctx.restore();

    }


    drawRockPath(ctx: CanvasRenderingContext2D, rock: any) {

        var first = false;

        ctx.beginPath();

        rock.path.forEach(
            (vert: number[]) => {
                if (first) {
                    ctx.moveTo(vert[0], vert[1]);
                    first = false;
                } else {
                    ctx.lineTo(vert[0], vert[1]);
                }
            });

        ctx.closePath();

    }


    ////////////////////////////////////////////////////////////////////////
    // Ships


    makeShip(x: number, y: number, dir: number): any {
        const ship =
            this.makeSprite(
                'ship',
                x, y,
                this.shipWidth,
                this.shipHeight,
                dir,
                0.0, 0.0,
                0.0,
                this.shipDensity,
                this.shipRestitution);

        this.targets.push(ship);

        ship.startTime = this.time;
        ship.endTime = null;

        this.ships.push(ship);

        this.accelerateSprite(ship, this.shipAccel);

        return ship;
    }


    makeRandomShip(): any {
        return this.makeShip(
            Math.random() * this.width,
            Math.random() * this.height,
            Math.random() * Math.PI * 2);
    }


    checkShips() {

        for (var i = this.ships.length - 1; i >= 0; i--) {
            const ship = this.ships[i];
            if ((ship.endTime !== null) &&
                (ship.endTime <= this.time)) {
                this.removeSprite(ship);
            } // if
        } // for i

        const n = this.ships.length;
        for (var i = 0; i < n; i++) {
            const ship = this.ships[i];

            if (Math.random() < this.accelProb) {
                this.accelerateSprite(ship, (Math.random() - 0.5) * this.accelRate);
            } // if

            if (Math.random() < this.turnSignProb) {
                this.turnSign = -this.turnSign;
            } // if

            if (Math.random() < this.turnProb) {
                this.turnSprite(ship, Math.random() * this.turnRate * this.turnSign);
            } // if

            if ((this.rocks.length > 0) &&
                (this.blasts.length < this.highBlastMark) &&
                (Math.random() < this.blastProb)) {
                this.makeShipBlast(ship);
            } // if

        } // for i
    }


    drawShips(ctx: CanvasRenderingContext2D) {
        this.ships.forEach(
            (ship: any) => this.drawShip(ctx, ship));
    }


    drawShip(ctx: CanvasRenderingContext2D, ship: any) {

        //console.log('Fasteroids.ts: drawShip:', 'ship:', ship);

        ctx.save();
        {

            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.orientation);

            this.drawShipPath(ctx, ship);

            ctx.save();
            {

                ctx.fillStyle = this.shipFillColor;
                ctx.fill();

            }
            ctx.restore();

            ctx.strokeStyle = this.shipStrokeColor;
            ctx.lineWidth = this.shipStrokeWidth;
            ctx.lineJoin = 'round';
            ctx.stroke();

        }
        ctx.restore();

    }


    drawShipPath(ctx: CanvasRenderingContext2D, ship: any) {

        ctx.beginPath();
        ctx.moveTo(this.shipNoseX, 0);
        ctx.lineTo(this.shipWingX, this.shipWingY);
        ctx.lineTo(this.shipEngineX, 0);
        ctx.lineTo(this.shipWingX, -this.shipWingY);
        ctx.closePath();

    }


    ////////////////////////////////////////////////////////////////////////
    // Blasts


    makeBlastAt(x: number, y: number, velocityX: number, velocityY: number): any {
        const blast =
            this.makeSprite(
                'blast',
                x, y,
                this.blastWidth,
                this.blastHeight,
                0,
                velocityX,
                velocityY,
                0,
                this.blastDensity,
                this.blastRestitution);

        blast.startTime = this.time;
        blast.endTime = this.time + this.blastTime;

        this.blasts.push(blast);

        return blast;
    }


    makeShipBlast(ship: any): any {
        const r = this.shipWidth / 2.0;
        const offsetX = (ship.orientationDX * r);
        const offsetY = (ship.orientationDY * r);
        const blastVelocityX = (ship.orientationDX * this.blastSpeed) + ship.velocityX;
        const blastVelocityY = (ship.orientationDY * this.blastSpeed) + ship.velocityY;
        const x = Math.round(ship.x + offsetX);
        const y = Math.round(ship.y + offsetY);
        const blast =
            this.makeBlastAt(
                x, y,
                blastVelocityX,
                blastVelocityY);

        blast.owner = ship;

        this.accelerateSprite(ship, this.shipBlastAccel);

        return blast;
    }


    checkBlasts() {

        for (var i = this.blasts.length - 1; i >= 0; i--) {

            const blast = this.blasts[i];
            const x = blast.x;
            const y = blast.y;

            for (var j = this.targets.length - 1; j >= 0; j--) {

                const sprite = this.targets[j];

                if (blast.owner != sprite) {

                    const dx = x - sprite.x;
                    const dy = y - sprite.y;
                    const dist = this.dist(dx, dy);

                    if ((dist <= (sprite.size / 2)) &&
                        (blast.owner != sprite)) {

                        switch (sprite.type) {

                            case 'rock':

                                // Blast hits other rock: blow it up, if it's not scheduled to disappear.

                                if ((sprite.endTime === null) ||
                                    (sprite.endTime > this.time)) {

                                    // Blast hits Rock: blast disappears, rock splits or explodes.

                                    sprite.temperature = Math.min(sprite.temperature + this.rockBlastHeat, 1.0);

                                    if ((sprite.temperature >= this.rockMinSplitHeat) &&
                                        ((sprite.startTime + this.rockInhibitTime) < this.time)) {

                                        if (sprite.size < this.minRockSplitSize) {

                                            // Explode small rocks.

                                            sprite.endTime = this.time - 1;

                                            for (var k = 0; k < this.rockBlastCount; k++) {
                                                const x = sprite.x + ((Math.random() - 0.5) * this.rockBlastSpread);
                                                const y = sprite.y + ((Math.random() - 0.5) * this.rockBlastSpread);
                                                const velocityX = ((Math.random() - 0.5) * 2 * this.rockBlastVel) + sprite.velocityX;
                                                const velocityY = ((Math.random() - 0.5) * 2 * this.rockBlastVel) + sprite.velocityY;
                                                this.makeBlastAt(
                                                    x,
                                                    y,
                                                    velocityX,
                                                    velocityY);

                                            } // for k

                                        } else {

                                            // Split big rocks.

                                            const area = sprite.size * sprite.size;
                                            const split = (Math.random() * 0.8) + 0.1;
                                            const newSize1 = Math.sqrt(area * split);
                                            const newSize2 = Math.sqrt(area * (1.0 - split));
                                            const newDir1 = Math.random() * (Math.PI * 2);
                                            const newDir2 = newDir1 + Math.PI;
                                            const newVelocityX = (Math.random() - 0.5) * 2 * this.initialRockSpeed;
                                            const newVelocityY = (Math.random() - 0.5) * 2 * this.initialRockSpeed;

                                            const r1 =
                                                this.makeRock(
                                                    sprite.x + Math.random() - 0.5,
                                                    sprite.y + Math.random() - 0.5,
                                                    newVelocityX,
                                                    newVelocityY,
                                                    newDir1,
                                                    newSize1);
                                            r1.temperature = sprite.temperature;

                                            const r2 =
                                                this.makeRock(
                                                    sprite.x + Math.random() - 0.5,
                                                    sprite.y + Math.random() - 0.5,
                                                    -newVelocityX,
                                                    -newVelocityY,
                                                    newDir2,
                                                    newSize2);
                                            r2.temperature = sprite.temperature;

                                            sprite.endTime = this.time - 1;

                                        } // if

                                    } // if

                                    blast.endTime = this.time - 1;

                                } // if

                                break;

                            case 'ship':

                                // Blast hits Ship: blast disappears.
                                blast.endTime = this.time - 1;

                                break;

                            case 'blast':

                                // Blast hits other blast: nothing happens. 

                                break;

                        }

                    } // if

                } // if

            } // for j

        } // for i

        for (var i = this.blasts.length - 1; i >= 0; i--) {
            const blast = this.blasts[i];

            if ((blast.endTime !== null) &&
                (blast.endTime <= this.time)) {

                this.removeSprite(blast);

            } // if

        } // for i

    }


    drawBlasts(ctx: CanvasRenderingContext2D) {
        this.blasts.forEach(
            (blast: any) => this.drawBlast(ctx, blast));
    }


    drawBlast(ctx: CanvasRenderingContext2D, blast: any) {

        //console.log('Fasteroids.ts: drawBlast:', 'blast:', blast);

        ctx.save();
        {

            ctx.translate(blast.x, blast.y);
            ctx.rotate(blast.orientation);

            this.drawBlastPath(ctx, blast);

            ctx.save();
            {

                ctx.fillStyle = this.blastFillColor;
                ctx.fill();

            }
            ctx.restore();

            ctx.strokeStyle = this.blastStrokeColor;
            ctx.lineWidth = this.blastStrokeWidth;
            ctx.lineJoin = 'round';
            ctx.stroke();

        }
        ctx.restore();

    }


    drawBlastPath(ctx: CanvasRenderingContext2D, blast: any) {

        ctx.beginPath();
        ctx.ellipse(0, 0, this.blastRadius, this.blastRadius, 0, 0, Math.PI * 2);
        ctx.closePath();

    }


    ////////////////////////////////////////////////////////////////////////
    // Keyboard


    handleKeyPress(key: string) {

        const ship = this.ships[this.currentShipIndex];
        if (!ship) {
            return;
        }

        //console.log('Fasteroids.ts: handleKeyPress:', 'key:', key);

        switch (key) {

            case 'h':
            case 'ArrowLeft':
                this.tractorSprite(ship, -this.shipTractor, 0);
                break;

            case 'j':
            case 'ArrowDown':
                this.tractorSprite(ship, 0, this.shipTractor);
                break;

            case 'k':
            case 'ArrowUp':
                this.tractorSprite(ship, 0, -this.shipTractor);
                break;

            case 'l':
            case 'ArrowRight':
                this.tractorSprite(ship, this.shipTractor, 0);
                break;

            case 'x':
                this.brakeSprite(ship, 0);
                break;

            case 'z':
                this.brakeSprite(ship, this.shipBrake);
                break;

            case 'a':
                this.turnSprite(ship, -this.shipTurn);
                break;

            case 's':
                this.accelerateSprite(ship, this.shipAccel);
                break;

            case 'd':
                this.turnSprite(ship, this.shipTurn);
                break;

            case 'q':
                this.turnSprite(ship, (Math.PI * 2) * -0.25);
                break;

            case 'w':
                this.turnSprite(ship, (Math.PI * 2) * 0.5);
                break;

            case 'e':
                this.turnSprite(ship, (Math.PI * 2) * 0.25);
                break;

            case 'r':
                this.makeRandomRock(this.initialRockSize);
                break;

            case ' ':
                this.makeShipBlast(ship);
                break;

        }
    }


    ////////////////////////////////////////////////////////////////////////
    // Animation


    setPaused(paused: boolean) {

        //console.log('Fasteroids.ts: setPaused: paused:', paused, 'this.paused:', this.paused);

        if (paused == this.paused) {
            return;
        }

        this.paused = paused;

        if (this.paused) {
            this.stopTimer();
        } else {
            this.startTimer();
        }

    }


    startTimer() {

        //console.log('Fasteroids.ts: startTimer:', 'timer:', this.timer);

        if (this.timer !== null) {
            return;
        }

        this.timer = setTimeout(
            () => this.handleTimer(), this.timerInterval);

    }


    stopTimer() {

        //console.log('Fasteroids.ts: stopTimer:', 'timer:', this.timer);

        if (this.timer === null) {
            return;
        }

        this.timer = clearTimeout(this.timer);
        this.timer = null;

    }


    handleTimer() {

        this.timer = null;
        this.doPhysics();
        this.draw();

        if (this.paused) {
            this.stopTimer();
        } else {
            this.startTimer();
        }
    }


    ////////////////////////////////////////////////////////////////////////
    // Drawing


    draw() {

        //console.log('Fasteroids.ts: draw:', 'time:', this.time);

        const ctx = this.ctx;
        if (!ctx) {
            return;
        }

        this.drawSpace(ctx);
        this.drawRocks(ctx);
        this.drawBlasts(ctx);
        this.drawShips(ctx);
        this.drawRound(ctx);

    }


    drawSpace(ctx: CanvasRenderingContext2D) {

        ctx.beginPath();
        ctx.fillStyle = this.spaceFillColor;
        ctx.fillRect(0, 0, this.width, this.height);

    }

    ////////////////////////////////////////////////////////////////////////
    // Physics Simulation


    doPhysics() {

        //console.log('Fasteroids.ts: doPhysics: time:', this.time, 'width:', this.width, 'height:', this.height);

        this.computeForces();
        this.integrate(this.timeStep);
        this.checkCollisions();
        this.checkShips();
        this.checkBlasts();
        this.checkRocks();
        this.checkRound();

        this.time += this.timeStep;
    }


    computeForces() {
    }


    integrate(deltaTime: number) {

        const n = this.sprites.length;
        this.sprites.forEach(
            (sprite: any) => {

                const width = sprite.width;
                const height = sprite.height;
                const halfWidth = sprite.width / 2.0;
                const halfHeight = sprite.height / 2.0;
                var x = sprite.x;
                var y = sprite.y;
                var orientation = sprite.orientation;
                var velocityX = sprite.velocityX;
                var velocityY = sprite.velocityY;
                var angularVelocity = sprite.angularVelocity;
                var forceX = sprite.forceX;
                var forceY = sprite.forceY;
                var torque = sprite.torque;

                //console.log('Fasteroids.ts: integrate: time:', this.time, 'deltaTime:', deltaTime, 'type:', sprite.type, 'x:', sprite.x, 'y:', sprite.y, 'orientation:', sprite.orientation, 'velocityX:', sprite.velocityX, 'velocityY:', sprite.velocityY, 'angularVelocity:', sprite.angularVelocity, 'forceX:', sprite.forceX, 'forceY:', sprite.forceY, 'torque:', sprite.torque, 'sprite:', sprite);

                if ((velocityX !== 0) ||
                    (velocityY !== 0)) {

                    x += deltaTime * velocityX;
                    y += deltaTime * velocityY;

                    if (this.wrap) {

                        if (x < halfWidth) {
                            x += this.width - width;
                        } // if

                        if (y < halfHeight) {
                            y += this.height - height;
                        } // if

                        if (x >= (this.width - halfWidth)) {
                            x -= this.width - width;
                        } // if

                        if (y >= (this.height - halfHeight)) {
                            y -= this.height - height;
                        } // if

                    } else {

                        if (x < halfWidth) {

                            x = halfWidth;
                            velocityX = -velocityX;
                            sprite.velocityX = velocityX;

                        } else if (x >= (this.width - halfWidth)) {

                            x = (this.width - halfWidth - 1);
                            velocityX = -velocityX;
                            sprite.velocityX = velocityX;

                        } // if

                        if (y < halfHeight) {

                            y = halfHeight;
                            velocityY = -velocityY;
                            sprite.velocityY = velocityY;

                        } else if (y >= (this.height - halfHeight)) {

                            y = (this.height - halfHeight - 1);
                            velocityY = -velocityY;
                            sprite.velocityY = velocityY;

                        } // if

                    } // if

                    sprite.x = x;
                    sprite.y = y;

                } // if

                if (angularVelocity != 0.0) {

                    orientation += deltaTime * angularVelocity;
                    this.setSpriteOrientation(sprite, orientation);

                } // if

                if ((forceX != 0.0) && (forceY != 0.0)) {

                    const massInverse = sprite.massInverse;
                    sprite.velocityX = velocityX + (deltaTime * massInverse * forceX);
                    sprite.velocityY = velocityY + (deltaTime * massInverse * forceY);

                } // if

                if (torque != 0.0) {

                    const momentInverse = sprite.momentInverse;
                    sprite.angularVelocity = angularVelocity + (deltaTime * momentInverse * torque);

                } // if

            });
    }


    checkCollisions() {

        const n = this.targets.length;
        for (var i = 0; i < n - 1; i++) {

            const r1 = this.targets[i];
            const r1r = r1.size / 2;
            const r1x = r1.x;
            const r1y = r1.y;

            for (var j = i + 1; j < n; j++) {

                const r2 = this.targets[j];
                const r2r = r2.size / 2;
                const r2x = r2.x;
                const r2y = r2.y;
                const dx = r1x - r2x;
                const dy = r1y - r2y;
                const dist = this.dist(dx, dy);
                const minDist = (r1r + r2r) * this.spriteSmoosh;

                if (dist < minDist) {
                    this.resolveCollision(r1, r1x, r1y, r1r, r2, r2x, r2y, r2r, dx, dy, dist);
                } // if

            } // for j

        } // for i

    }


    resolveCollision(r1: any, r1x: number, r1y: number, r1r: number, r2: any, r2x: number, r2y: number, r2r: number, dx: number, dy: number, dist: number) {

        if (((r1.endTime !== null) && (r1.endTime <= this.time)) ||
            ((r2.endTime !== null) && (r2.endTime <= this.time))) {
            return;
        } // if

        var ship = null;
        var other = null;

        if (r1.type == 'ship') {

            ship = r1;
            other = r2;

        } else {

            if (r2.type == 'ship') {

                ship = r2;
                other = r1;

            } // if

        } // if

        if (ship != null) {

            if (other.type == 'rock') {

                other.velocityX += ((Math.random() - 0.5) * this.accelRate * 2);
                other.velocityY += ((Math.random() - 0.5) * this.accelRate * 2);
                ship.velocityX = -other.velocityX;
                ship.velocityY = -other.velocityY;
                other.temperature = 1;

                const blast = this.makeBlastAt(
                    other.x,
                    other.y,
                    other.velocityX,
                    other.velocityY);
                blast.endTime = this.time + 1;

                return;

            } // if

        } // if

        if ((r1.type == 'rock') &&
            (r2.type == 'rock')) {

            const temperature1 = r1.temperature;
            const temperature2 = r2.temperature;

            const averageTemperature =
                Math.max(0, Math.min(1, (temperature1 + temperature2 + this.rockBounceHeat) / 2.0));

            //console.log('Fasteroids.ts: resolveCollision:', 'averageTemperature:', averageTemperature, 'r1:', r1.temperature, 'r2:', r2.temperature);

            r1.temperature = averageTemperature;
            r2.temperature = averageTemperature;

            if ((averageTemperature >= this.rockMinMergeHeat) ||
                (this.rocks.length >= this.highRockMark)) {

                const area = (r1.size * r1.size) + (r2.size * r2.size);
                const newSize = Math.sqrt(area);

                if ((newSize < this.maxRockMergeSize) &&
                    (r1.startTime + this.rockInhibitTime < this.time) &&
                    (r2.startTime + this.rockInhibitTime < this.time)) {

                    // Merge rocks

                    const newVelocityX = (r1.velocityx + r2.velocityx) / 2;
                    const newVelocityY = (r1.velocityy + r2.velocityy) / 2;

                    const newRock =
                        this.makeRock(
                            ((r1.x + r2.x) / 2.0) + (Math.random() - 0.5),
                            ((r1.y + r2.y) / 2.0) + (Math.random() - 0.5),
                            newVelocityX,
                            newVelocityY,
                            Math.random() * (Math.PI * 2),
                            newSize);
                    newRock.temperature = averageTemperature;

                    r1.endTime = this.time - 1;
                    r2.endTime = this.time - 1;

                    return;

                } // if

            } // if

        } // if

        var velocityX1 = r1.velocityX;
        var velocityY1 = r1.velocityY;
        var velocityX2 = r2.velocityX;
        var velocityY2 = r2.velocityY;

        const d1 =
            this.dist(
                (r1.x - r2.y),
                (r1.y - r2.y));

        const d2 =
            this.dist(
                ((r1.x + r1.velocityX) - (r2.y + r2.velocityY)),
                ((r1.y + r1.velocityY) - (r2.y + r2.velocityY)));

        var relativeVelocity = d2 - d1;

        if (relativeVelocity > 0) {

            if (dist == 0) { dist = 1; }

            const goalDist = (r1.size / 2) + (r2.size / 2);
            const penetration = goalDist - dist;
            const penetrationNorm = penetration / goalDist;

            if (penetrationNorm > 0) {
                const normX = dx / dist;
                const normY = dy / dist;
                const repel = penetration * 0.5;
                const slow = 0.9;
                const noise = 1;
                r1.velocityX = (slow * r1.velocityX) + (normX * repel) + ((Math.random() - 0.5) * noise);
                r1.velocityY = (slow * r1.velocityY) + (normY * repel) + ((Math.random() - 0.5) * noise);
                r2.velocityX = (slow * r2.velocityX) + (-normX * repel) + ((Math.random() - 0.5) * noise);
                r2.velocityY = (slow * r2.velocityY) + (-normY * repel) + ((Math.random() - 0.5) * noise);
                return;

            } // if

        } // if

        const rTotal = r1r + r2r;
        const r1Weight = r1r / rTotal;
        const r2Weight = 1.0 - r1Weight;
        const collisionX = (r1Weight * r1x) + (r2Weight * r2x);
        const collisionY = (r1Weight * r1y) + (r2Weight * r2y);

        const distToCornerX1 = collisionX - r1x;
        const distToCornerY1 = collisionY - r1y;
        const distToCornerX2 = collisionX - r2x;
        const distToCornerY2 = collisionY - r2y;

        const distToCornerPerpX1 = -distToCornerY1;
        const distToCornerPerpY1 = distToCornerX1;
        const distToCornerPerpX2 = -distToCornerY2;
        const distToCornerPerpY2 = distToCornerX2;

        const angularVelocity1 = r1.angularVelocity;
        const angularVelocity2 = r2.angularVelocity;

        velocityX1 += (angularVelocity1 * distToCornerPerpX1);
        velocityY1 += (angularVelocity1 * distToCornerPerpY1);
        velocityX2 += (angularVelocity2 * distToCornerPerpX2);
        velocityY2 += (angularVelocity2 * distToCornerPerpY2);

        const collisionDist1 =
            Math.sqrt(
                (distToCornerX1 * distToCornerX1) +
                (distToCornerY1 * distToCornerY1));
        const collisionDist2 =
            Math.sqrt(
                (distToCornerX2 * distToCornerX2) +
                (distToCornerY2 * distToCornerY2));

        const collisionNormalX1 = distToCornerX1 / collisionDist1;
        const collisionNormalY1 = distToCornerY1 / collisionDist1;
        const collisionNormalX2 = distToCornerX2 / collisionDist2;
        const collisionNormalY2 = distToCornerY2 / collisionDist2;

        const impulseNumerator1 =
            -(1 + r1.restitution) *
            ((velocityX1 * collisionNormalX1) +
                (velocityY1 * collisionNormalY1));
        const impulseNumerator2 =
            -(1 + r2.restitution) *
            ((velocityX2 * collisionNormalX2) +
                (velocityY2 * collisionNormalY2));

        const perpDot1 =
            ((distToCornerPerpX1 * collisionNormalX1) +
                (distToCornerPerpY1 * collisionNormalY1));
        const perpDot2 =
            ((distToCornerPerpX2 * collisionNormalX2) +
                (distToCornerPerpY2 * collisionNormalY2));

        const impulseDenominator1 =
            r1.massInverse +
            (r1.momentInverse * perpDot1 * perpDot1);
        const impulseDenominator2 =
            r2.massInverse +
            (r2.momentInverse * perpDot2 * perpDot2);

        const impulse1 =
            impulseNumerator1 / impulseDenominator1;
        const impulse2 =
            impulseNumerator2 / impulseDenominator2;

        r1.velocityX += impulse1 * r1.massInverse * collisionNormalX1;
        r1.velocityY += impulse1 * r1.massInverse * collisionNormalY1;
        r1.angularVelocity += impulse1 * r1.momentInverse * perpDot1;
        r2.velocityX += impulse2 * r2.massInverse * collisionNormalX2;
        r2.velocityY += impulse2 * r2.massInverse * collisionNormalY2;
        r2.angularVelocity += impulse2 * r2.momentInverse * perpDot2;

    }


};


////////////////////////////////////////////////////////////////////////


export default Fasteroids;


////////////////////////////////////////////////////////////////////////
