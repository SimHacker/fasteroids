
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_binding_callback(fn) {
        binding_callbacks.push(fn);
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                $$.fragment.l(children(options.target));
            }
            else {
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    ////////////////////////////////////////////////////////////////////////
    // Fasteroids.ts
    // By Don Hopkins.
    ////////////////////////////////////////////////////////////////////////
    // Class Fasteroids
    class Fasteroids {
        constructor() {
            ////////////////////////////////////////////////////////////////////////
            // Instance Variables
            this.canvas = null;
            this.ctx = null;
            this.width = 0;
            this.height = 0;
            this.paused = true;
            this.timer = null;
            this.timerInterval = 1000 / 60;
            this.sprites = [];
            this.targets = [];
            this.ships = [];
            this.rocks = [];
            this.blasts = [];
            this.currentShipIndex = 0;
            this.timeStep = 0.25;
            this.time = 0;
            this.minCollisionTime = 5;
            this.initialShipCount = 1;
            this.maxShips = 4;
            this.shipWidth = 20;
            this.shipHeight = 20;
            this.shipDensity = 0.25;
            this.shipRestitution = 1.0;
            this.shipTurn = 0.1;
            this.shipAccel = 4.0;
            this.shipTractor = 2.0;
            this.shipBrake = 0.75;
            this.rockDensity = 1;
            this.rockRestitution = 1.0;
            this.rockBlastHeat = 0.6;
            this.rockShipHeat = 0.8;
            this.rockBounceHeat = 0.05;
            this.rockCool = 0.99;
            this.rockInhibitTime = 5;
            this.rockMinSplitHeat = 1.0;
            this.rockMinMergeHeat = 0.5;
            this.minRockSplitSize = 30;
            this.maxRockMergeSize = 200;
            this.rockBlastCount = 8;
            this.rockBlastVel = 16;
            this.rockBlastSpread = 10;
            this.initialRockCount = 5;
            this.initialRockSize = 50;
            this.initialRockSpeed = 5.0;
            this.initialRockDDir = 0.75;
            this.spriteSmoosh = 1.0;
            this.accelProb = 0.0;
            this.accelRate = 15.0;
            this.shipBlastAccel = -1.0;
            this.turnSign = 1;
            this.turnSignProb = 0.02;
            this.turnProb = 0.0;
            this.turnRate = (2 * Math.PI) / 100;
            this.blastWidth = 1;
            this.blastHeight = 1;
            this.blastDensity = 100.0;
            this.blastRestitution = 1.0;
            this.blastProb = 0.0;
            this.blastSpeed = 20.0;
            this.blastTime = 50;
            this.highRockMark = 20;
            this.highBlastMark = 20;
            this.wrap = false;
            this.initRound = true;
            this.inRound = true;
            this.round = 0;
            this.spaceFillColor = '#000000';
            this.shipFillColor = '#8080ff';
            this.shipStrokeColor = '#0000ff';
            this.shipStrokeWidth = 2;
            this.shipNoseX = 20;
            this.shipWingX = -20;
            this.shipWingY = 10;
            this.shipEngineX = -10;
            this.rockStrokeColor = '#ffffff';
            this.rockStrokeWidth = 2;
            this.blastFillColor = '#ffff80';
            this.blastStrokeColor = '#ffff00';
            this.blastStrokeWidth = 2;
            this.blastRadius = 5;
            this.hexDigits = [
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'
            ];
        }
        ////////////////////////////////////////////////////////////////////////
        // Methods
        ////////////////////////////////////////////////////////////////////////
        // Utilities
        square(x) {
            return x * x;
        }
        angle(dx, dy) {
            if ((dx == 0) && (dy == 0)) {
                return 0;
            }
            else {
                return Math.atan2(dy, dx);
            } // if
        }
        dist(dx, dy) {
            return Math.sqrt(this.square(dx) + this.square(dy));
        }
        distance2(x1, y1, x2, y2) {
            return this.square(x1 - x2) + this.square(y1 - y2);
        }
        distance(x1, y1, x2, y2) {
            return Math.sqrt(this.distance2(x1, y1, x2, y2));
        }
        lineDistance(x, y, x1, y1, x2, y2) {
            const dist2 = this.distance2(x1, y1, x2, y2);
            if (dist2 === 0)
                return this.distance(x, y, x1, y1);
            const t = Math.max(0, Math.min(1, (((x - x1) * (x2 - x1)) + ((y - y1) * (y2 - y1))) /
                dist2));
            return this.distance(x, y, x1 + (t * (x2 - x1)), y1 + (t * (y2 - y1)));
        }
        randInt(n) {
            return Math.floor(Math.random() * n);
        }
        clampFloatToByte(f) {
            var b = Math.floor(f * 256);
            if (b < 0) {
                b = 0;
            }
            else if (b > 255) {
                b = 255;
            }
            return b;
        }
        byteToHex(b) {
            return this.hexDigits[(b >> 4) & 15] + this.hexDigits[b & 15];
        }
        ////////////////////////////////////////////////////////////////////////
        // Initialization
        init(canvas) {
            this.canvas = canvas;
            this.width = canvas.width;
            this.height = canvas.height;
            this.ctx = canvas.getContext('2d');
            if (this.canvas) {
                window.addEventListener('resize', () => this.handleResizeCanvas());
                window.addEventListener('keydown', (event) => this.handleKeyPress(event.key));
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
                this.sprites.forEach((sprite) => {
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
        resetToRound(round) {
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
        drawRound(ctx) {
        }
        ////////////////////////////////////////////////////////////////////////
        // Sprites
        makeSprite(type, x, y, width, height, orientation, velocityX, velocityY, angularVelocity, density, restitution) {
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
        initSpriteDynamics(sprite) {
            const width = sprite.width;
            const height = sprite.height;
            sprite.size = Math.max(width, height);
            sprite.mass = sprite.density * width * height;
            sprite.massInverse = 1.0 / sprite.mass;
            sprite.moment = (sprite.mass / 12.0) * ((width * width) + (height * height));
            sprite.momentInverse = 1.0 / sprite.moment;
        }
        setSpriteOrientation(sprite, orientation) {
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
        turnSprite(sprite, twist) {
            this.setSpriteOrientation(sprite, twist + sprite.orientation);
        }
        accelerateSprite(sprite, accel) {
            this.tractorSprite(sprite, sprite.orientationDX * accel, sprite.orientationDY * accel);
        }
        tractorSprite(sprite, dx, dy) {
            sprite.velocityX += dx;
            sprite.velocityY += dy;
        }
        brakeSprite(sprite, friction) {
            sprite.velocityX *= friction;
            sprite.velocityY *= friction;
        }
        removeSprite(sprite) {
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
        removeSpriteFromList(list, sprite) {
            const index = list.indexOf(sprite);
            if (index < 0) {
                return;
            }
            list.splice(index, 1);
        }
        ////////////////////////////////////////////////////////////////////////
        // Rocks
        makeRock(x, y, velocityX, velocityY, dir, size) {
            var rock = this.makeSprite('rock', x, y, size, size, dir, velocityX, velocityY, 0.0, this.rockDensity, this.rockRestitution);
            this.targets.push(rock);
            this.randomizeRock(rock);
            rock.startTime = this.time;
            rock.endTime = null;
            this.rocks.push(rock);
            return rock;
        }
        makeRandomRock(size) {
            return this.makeRock(Math.random() * this.width, Math.random() * this.height, (Math.random() - 0.5) * 2 * this.initialRockSpeed, (Math.random() - 0.5) * 2 * this.initialRockSpeed, Math.random() * (Math.PI * 2), size);
        }
        randomizeRock(rock) {
            rock.velocityX = rock.orientationDX * Math.random() * this.initialRockSpeed;
            rock.velocityY = rock.orientationDY * Math.random() * this.initialRockSpeed;
            rock.angularVelocity = (Math.random() - 0.5) * this.initialRockDDir;
            rock.path = this.makeRockPath(rock.size);
        }
        makeRockPath(size) {
            const verts = [];
            const slop = 1.0;
            const jitter = 0.5;
            const center = Math.floor(size / 2);
            const r = center * slop;
            const corners = 16;
            const turn = (Math.PI * 2) / corners;
            var ang = 0;
            for (var i = 0; i < corners; i++) {
                var x = Math.floor((r * Math.cos(ang)) +
                    ((Math.random() - 0.5) * r * jitter));
                var y = Math.floor((r * Math.sin(ang)) +
                    ((Math.random() - 0.5) * r * jitter));
                if (x < -center)
                    x = -center;
                if (x > center)
                    x = center;
                if (y < -center)
                    y = -center;
                if (y > center)
                    y = center;
                verts.push([x, y]);
                ang += turn;
            } // for i
            return verts;
        }
        rockTemperatureToColor(rock) {
            const temperature = rock.temperature;
            return ('#' +
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
        drawRocks(ctx) {
            this.rocks.forEach((rock) => this.drawRock(ctx, rock));
        }
        drawRock(ctx, rock) {
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
        drawRockPath(ctx, rock) {
            ctx.beginPath();
            rock.path.forEach((vert) => {
                {
                    ctx.lineTo(vert[0], vert[1]);
                }
            });
            ctx.closePath();
        }
        ////////////////////////////////////////////////////////////////////////
        // Ships
        makeShip(x, y, dir) {
            const ship = this.makeSprite('ship', x, y, this.shipWidth, this.shipHeight, dir, 0.0, 0.0, 0.0, this.shipDensity, this.shipRestitution);
            this.targets.push(ship);
            ship.startTime = this.time;
            ship.endTime = null;
            this.ships.push(ship);
            this.accelerateSprite(ship, this.shipAccel);
            return ship;
        }
        makeRandomShip() {
            return this.makeShip(Math.random() * this.width, Math.random() * this.height, Math.random() * Math.PI * 2);
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
        drawShips(ctx) {
            this.ships.forEach((ship) => this.drawShip(ctx, ship));
        }
        drawShip(ctx, ship) {
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
        drawShipPath(ctx, ship) {
            ctx.beginPath();
            ctx.moveTo(this.shipNoseX, 0);
            ctx.lineTo(this.shipWingX, this.shipWingY);
            ctx.lineTo(this.shipEngineX, 0);
            ctx.lineTo(this.shipWingX, -this.shipWingY);
            ctx.closePath();
        }
        ////////////////////////////////////////////////////////////////////////
        // Blasts
        makeBlastAt(x, y, velocityX, velocityY) {
            const blast = this.makeSprite('blast', x, y, this.blastWidth, this.blastHeight, 0, velocityX, velocityY, 0, this.blastDensity, this.blastRestitution);
            blast.startTime = this.time;
            blast.endTime = this.time + this.blastTime;
            this.blasts.push(blast);
            return blast;
        }
        makeShipBlast(ship) {
            const r = this.shipWidth / 2.0;
            const offsetX = (ship.orientationDX * r);
            const offsetY = (ship.orientationDY * r);
            const blastVelocityX = (ship.orientationDX * this.blastSpeed) + ship.velocityX;
            const blastVelocityY = (ship.orientationDY * this.blastSpeed) + ship.velocityY;
            const x = Math.round(ship.x + offsetX);
            const y = Math.round(ship.y + offsetY);
            const blast = this.makeBlastAt(x, y, blastVelocityX, blastVelocityY);
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
                                                    this.makeBlastAt(x, y, velocityX, velocityY);
                                                } // for k
                                            }
                                            else {
                                                // Split big rocks.
                                                const area = sprite.size * sprite.size;
                                                const split = (Math.random() * 0.8) + 0.1;
                                                const newSize1 = Math.sqrt(area * split);
                                                const newSize2 = Math.sqrt(area * (1.0 - split));
                                                const newDir1 = Math.random() * (Math.PI * 2);
                                                const newDir2 = newDir1 + Math.PI;
                                                const newVelocityX = (Math.random() - 0.5) * 2 * this.initialRockSpeed;
                                                const newVelocityY = (Math.random() - 0.5) * 2 * this.initialRockSpeed;
                                                const r1 = this.makeRock(sprite.x + Math.random() - 0.5, sprite.y + Math.random() - 0.5, newVelocityX, newVelocityY, newDir1, newSize1);
                                                r1.temperature = sprite.temperature;
                                                const r2 = this.makeRock(sprite.x + Math.random() - 0.5, sprite.y + Math.random() - 0.5, -newVelocityX, -newVelocityY, newDir2, newSize2);
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
        drawBlasts(ctx) {
            this.blasts.forEach((blast) => this.drawBlast(ctx, blast));
        }
        drawBlast(ctx, blast) {
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
        drawBlastPath(ctx, blast) {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.blastRadius, this.blastRadius, 0, 0, Math.PI * 2);
            ctx.closePath();
        }
        ////////////////////////////////////////////////////////////////////////
        // Keyboard
        handleKeyPress(key) {
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
        setPaused(paused) {
            //console.log('Fasteroids.ts: setPaused: paused:', paused, 'this.paused:', this.paused);
            if (paused == this.paused) {
                return;
            }
            this.paused = paused;
            if (this.paused) {
                this.stopTimer();
            }
            else {
                this.startTimer();
            }
        }
        startTimer() {
            //console.log('Fasteroids.ts: startTimer:', 'timer:', this.timer);
            if (this.timer !== null) {
                return;
            }
            this.timer = setTimeout(() => this.handleTimer(), this.timerInterval);
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
            }
            else {
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
        drawSpace(ctx) {
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
        integrate(deltaTime) {
            const n = this.sprites.length;
            this.sprites.forEach((sprite) => {
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
                    }
                    else {
                        if (x < halfWidth) {
                            x = halfWidth;
                            velocityX = -velocityX;
                            sprite.velocityX = velocityX;
                        }
                        else if (x >= (this.width - halfWidth)) {
                            x = (this.width - halfWidth - 1);
                            velocityX = -velocityX;
                            sprite.velocityX = velocityX;
                        } // if
                        if (y < halfHeight) {
                            y = halfHeight;
                            velocityY = -velocityY;
                            sprite.velocityY = velocityY;
                        }
                        else if (y >= (this.height - halfHeight)) {
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
        resolveCollision(r1, r1x, r1y, r1r, r2, r2x, r2y, r2r, dx, dy, dist) {
            if (((r1.endTime !== null) && (r1.endTime <= this.time)) ||
                ((r2.endTime !== null) && (r2.endTime <= this.time))) {
                return;
            } // if
            var ship = null;
            var other = null;
            if (r1.type == 'ship') {
                ship = r1;
                other = r2;
            }
            else {
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
                    const blast = this.makeBlastAt(other.x, other.y, other.velocityX, other.velocityY);
                    blast.endTime = this.time + 1;
                    return;
                } // if
            } // if
            if ((r1.type == 'rock') &&
                (r2.type == 'rock')) {
                const temperature1 = r1.temperature;
                const temperature2 = r2.temperature;
                const averageTemperature = Math.max(0, Math.min(1, (temperature1 + temperature2 + this.rockBounceHeat) / 2.0));
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
                        const newRock = this.makeRock(((r1.x + r2.x) / 2.0) + (Math.random() - 0.5), ((r1.y + r2.y) / 2.0) + (Math.random() - 0.5), newVelocityX, newVelocityY, Math.random() * (Math.PI * 2), newSize);
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
            const d1 = this.dist((r1.x - r2.y), (r1.y - r2.y));
            const d2 = this.dist(((r1.x + r1.velocityX) - (r2.y + r2.velocityY)), ((r1.y + r1.velocityY) - (r2.y + r2.velocityY)));
            var relativeVelocity = d2 - d1;
            if (relativeVelocity > 0) {
                if (dist == 0) {
                    dist = 1;
                }
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
            const collisionDist1 = Math.sqrt((distToCornerX1 * distToCornerX1) +
                (distToCornerY1 * distToCornerY1));
            const collisionDist2 = Math.sqrt((distToCornerX2 * distToCornerX2) +
                (distToCornerY2 * distToCornerY2));
            const collisionNormalX1 = distToCornerX1 / collisionDist1;
            const collisionNormalY1 = distToCornerY1 / collisionDist1;
            const collisionNormalX2 = distToCornerX2 / collisionDist2;
            const collisionNormalY2 = distToCornerY2 / collisionDist2;
            const impulseNumerator1 = -(1 + r1.restitution) *
                ((velocityX1 * collisionNormalX1) +
                    (velocityY1 * collisionNormalY1));
            const impulseNumerator2 = -(1 + r2.restitution) *
                ((velocityX2 * collisionNormalX2) +
                    (velocityY2 * collisionNormalY2));
            const perpDot1 = ((distToCornerPerpX1 * collisionNormalX1) +
                (distToCornerPerpY1 * collisionNormalY1));
            const perpDot2 = ((distToCornerPerpX2 * collisionNormalX2) +
                (distToCornerPerpY2 * collisionNormalY2));
            const impulseDenominator1 = r1.massInverse +
                (r1.momentInverse * perpDot1 * perpDot1);
            const impulseDenominator2 = r2.massInverse +
                (r2.momentInverse * perpDot2 * perpDot2);
            const impulse1 = impulseNumerator1 / impulseDenominator1;
            const impulse2 = impulseNumerator2 / impulseDenominator2;
            r1.velocityX += impulse1 * r1.massInverse * collisionNormalX1;
            r1.velocityY += impulse1 * r1.massInverse * collisionNormalY1;
            r1.angularVelocity += impulse1 * r1.momentInverse * perpDot1;
            r2.velocityX += impulse2 * r2.massInverse * collisionNormalX2;
            r2.velocityY += impulse2 * r2.massInverse * collisionNormalY2;
            r2.angularVelocity += impulse2 * r2.momentInverse * perpDot2;
        }
    }
    ////////////////////////////////////////////////////////////////////////

    /* src/App.svelte generated by Svelte v3.4.4 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	var div2, div0, a0, t1, a1, t3, t4, div1, t6, canvas_1;

    	return {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Fasteroids";
    			t1 = text(":\n    a Space Rock Lava Lamp Shoot-Em-Up Game, by \n    ");
    			a1 = element("a");
    			a1.textContent = "Don Hopkins";
    			t3 = text(".");
    			t4 = space();
    			div1 = element("div");
    			div1.textContent = "Tractor: h j k l, arrows; Accelerate: s; Slow: z; Stop: z; Turn: a d, 90: q e, 180: w; Fire: space; Rock: r";
    			t6 = space();
    			canvas_1 = element("canvas");
    			a0.href = "https://github.com/SimHacker/fasteroids";
    			a0.target = "_new";
    			add_location(a0, file, 2, 4, 69);
    			a1.href = "https://medium.com/@donhopkins";
    			a1.target = "_new";
    			add_location(a1, file, 7, 4, 220);
    			div0.className = "fasteroids-title svelte-1mdkigb";
    			add_location(div0, file, 1, 2, 34);
    			div1.className = "fasteroids-instructions svelte-1mdkigb";
    			add_location(div1, file, 12, 2, 320);
    			div2.className = "fasteroids-header svelte-1mdkigb";
    			add_location(div2, file, 0, 0, 0);
    			canvas_1.className = "fasteroids-canvas svelte-1mdkigb";
    			add_location(canvas_1, file, 17, 0, 487);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div0, a0);
    			append(div0, t1);
    			append(div0, a1);
    			append(div0, t3);
    			append(div2, t4);
    			append(div2, div1);
    			insert(target, t6, anchor);
    			insert(target, canvas_1, anchor);
    			add_binding_callback(() => ctx.canvas_1_binding(canvas_1, null));
    		},

    		p: function update(changed, ctx) {
    			if (changed.items) {
    				ctx.canvas_1_binding(null, canvas_1);
    				ctx.canvas_1_binding(canvas_1, null);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    				detach(t6);
    				detach(canvas_1);
    			}

    			ctx.canvas_1_binding(null, canvas_1);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	
    let canvas = null;
    let fasteroids = null;
    onMount(() => {
        fasteroids = new Fasteroids();
        fasteroids.init(canvas);
        fasteroids.startGame();
        return () => {
            if (fasteroids !== null) {
                fasteroids.stopGame();
            }
        };
    });

    	function canvas_1_binding($$node, check) {
    		canvas = $$node;
    		$$invalidate('canvas', canvas);
    	}

    	return { canvas, canvas_1_binding };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    const app = new App({
        target: document.body,
        props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
