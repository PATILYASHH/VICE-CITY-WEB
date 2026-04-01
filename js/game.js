import { InputManager }   from './input.js';
import { Player }         from './player.js';
import { Car }            from './car.js';
import { World }          from './world.js';
import { MobileControls } from './controls.js';

// ─── Camera ───────────────────────────────────────────────────────────────────
class Camera {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width  = width;
        this.height = height;
        this.smoothing = 0.12;
    }

    follow(target) {
        this.x += (target.x - this.x) * this.smoothing;
        this.y += (target.y - this.y) * this.smoothing;
    }

    applyTransform(ctx) {
        ctx.translate(-this.x + this.width / 2, -this.y + this.height / 2);
    }
}

// ─── Game ─────────────────────────────────────────────────────────────────────
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx    = this.canvas.getContext('2d');
        this.running = false;

        this.worldWidth  = 6000;
        this.worldHeight = 6000;

        this.input   = null;
        this.player  = null;
        this.cars    = [];
        this.world   = null;
        this.camera  = null;
        this.controls = null;

        // HUD elements
        this.elSpeed   = document.getElementById('speed-meter');
        this.elState   = document.getElementById('state-info');
        this.elMoney   = document.getElementById('money-display');
        this.elHealth  = document.getElementById('health-bar-fill');
        this.elWanted  = document.getElementById('wanted-stars');

        // Game state
        this.money      = 0;
        this.health     = 100;
        this.wantedLevel = 0;
        this._wantedTimer = 0;
        this._hintTimer   = 5;  // seconds to show controls hint

        this.lastTime = 0;
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.input  = new InputManager();
        this.world  = new World(this.worldWidth, this.worldHeight);

        // Spawn player on the road intersection at the centre of the map
        const cx = Math.round(this.worldWidth  / 2 / this.world.roadSpacing) * this.world.roadSpacing;
        const cy = Math.round(this.worldHeight / 2 / this.world.roadSpacing) * this.world.roadSpacing;
        this.player = new Player(cx + 30, cy + 30);

        this.camera = new Camera(this.player.x, this.player.y, this.canvas.width, this.canvas.height);

        this.spawnCars();
        this.controls = new MobileControls(this.input);

        this.running  = true;
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.gameLoop(t));
    }

    resizeCanvas() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.camera) {
            this.camera.width  = this.canvas.width;
            this.camera.height = this.canvas.height;
        }
    }

    // ─── Car spawning ─────────────────────────────────────────────────────────
    spawnCars() {
        const sp  = this.world.roadSpacing;  // 500
        const lo  = 22;                      // lane offset from centre-line
        const types = ['sedan','sports','truck','taxi','suv','police','sedan','taxi','sedan','sports'];

        // Generate spawn positions distributed across the map on actual roads
        const positions = [];
        for (let gx = 1; gx < 12; gx++) {
            for (let gy = 1; gy < 12; gy++) {
                // Skip beach area
                if (gx * sp >= this.world.beachStart) continue;
                // Horizontal road at y = gy*sp, driving east
                positions.push({ x: gx*sp + sp*0.3, y: gy*sp + lo,  angle: 0 });
                // Horizontal road, driving west
                positions.push({ x: gx*sp + sp*0.7, y: gy*sp - lo,  angle: Math.PI });
                // Vertical road at x = gx*sp, driving south
                positions.push({ x: gx*sp + lo,  y: gy*sp + sp*0.3, angle: Math.PI / 2 });
                // Vertical road, driving north
                positions.push({ x: gx*sp - lo,  y: gy*sp + sp*0.7, angle: -Math.PI / 2 });
            }
        }

        // Shuffle and pick 22 cars
        positions.sort(() => Math.random() - 0.5);
        const chosen = positions.slice(0, 22);

        chosen.forEach((pos, i) => {
            const type = types[i % types.length];
            const car  = new Car(pos.x, pos.y, type);
            car.angle  = pos.angle;
            this.cars.push(car);
        });
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    update(dt) {
        const active = this.player.inVehicle ? this.player.vehicle : this.player;

        if (this.input.isEnterCarPressed()) this._handleVehicleInteraction();

        if (this.player.inVehicle) {
            this.player.vehicle.update(this.input, this.world);
        } else {
            this.player.update(this.input, this.world);
        }

        for (const car of this.cars) {
            if (!car.occupied) {
                // parked cars just apply drag — pass a null-input stub
                car.update({ getMovementInput: () => ({ dx:0, dy:0 }) }, this.world);
            }
        }

        this.camera.follow(active);

        // Hint timer countdown
        if (this._hintTimer > 0) this._hintTimer -= dt;

        this._updateHUD();
    }

    _handleVehicleInteraction() {
        if (this.player.inVehicle) {
            this.player.exitVehicle();
        } else {
            const nearest = this._findNearestCar();
            if (nearest && nearest.distanceTo(this.player.x, this.player.y) < 65) {
                this.player.enterVehicle(nearest);
            }
        }
    }

    _findNearestCar() {
        let best = null, minD = Infinity;
        for (const car of this.cars) {
            if (!car.occupied) {
                const d = car.distanceTo(this.player.x, this.player.y);
                if (d < minD) { minD = d; best = car; }
            }
        }
        return best;
    }

    _updateHUD() {
        if (this.player.inVehicle) {
            const spd = Math.abs(this.player.vehicle.speed);
            const kmh = Math.round(spd * 18);
            if (this.elSpeed) this.elSpeed.textContent = `${kmh} km/h`;
            if (this.elState) this.elState.textContent = `🚗 ${this.player.vehicle.type.toUpperCase()}`;
        } else {
            if (this.elSpeed) this.elSpeed.textContent = `0 km/h`;
            const nearest = this._findNearestCar();
            if (nearest && nearest.distanceTo(this.player.x, this.player.y) < 65) {
                if (this.elState) this.elState.textContent = '[ E ] Enter Vehicle';
            } else {
                if (this.elState) this.elState.textContent = '🚶 On Foot';
            }
        }
        if (this.elMoney)  this.elMoney.textContent  = `$${this.money.toLocaleString()}`;
        if (this.elHealth) this.elHealth.style.width  = `${this.health}%`;
        if (this.elWanted) {
            this.elWanted.textContent = '★'.repeat(this.wantedLevel) + '☆'.repeat(5 - this.wantedLevel);
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    render() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // World + entities
        ctx.save();
        this.camera.applyTransform(ctx);

        this.world.draw(ctx, this.camera);

        for (const car of this.cars) car.draw(ctx);
        this.player.draw(ctx);

        ctx.restore();

        // Overlaid HUD (mini-map + controls hint)
        this._drawMinimap(ctx);
        if (this._hintTimer > 0) this._drawControlsHint(ctx);
    }

    // ─── Mini-map ─────────────────────────────────────────────────────────────
    _drawMinimap(ctx) {
        const mmW = 160, mmH = 160;
        const pad  = 14;
        const mmX  = this.canvas.width  - mmW - pad;
        const mmY  = this.canvas.height - mmH - pad;
        const scX  = mmW / this.worldWidth;
        const scY  = mmH / this.worldHeight;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(mmX, mmY, mmW, mmH, 4);
        ctx.fill();
        ctx.stroke();

        // Roads
        const sp  = this.world.roadSpacing;
        const rhw = this.world.roadHalfWidth;
        ctx.fillStyle = '#555';
        for (let gx = 0; gx * sp <= this.worldWidth; gx++) {
            const rx = mmX + gx * sp * scX;
            ctx.fillRect(rx - rhw*scX, mmY, rhw*2*scX + 1, mmH);
        }
        for (let gy = 0; gy * sp <= this.worldHeight; gy++) {
            const ry = mmY + gy * sp * scY;
            ctx.fillRect(mmX, ry - rhw*scY, mmW, rhw*2*scY + 1);
        }

        // Beach
        ctx.fillStyle = 'rgba(58,142,194,0.5)';
        const bsX = mmX + this.world.beachStart * scX;
        ctx.fillRect(bsX, mmY, mmW - (bsX - mmX), mmH);

        // Parked cars (dots)
        ctx.fillStyle = '#aaa';
        for (const car of this.cars) {
            if (!car.occupied) {
                ctx.fillRect(mmX + car.x*scX - 1, mmY + car.y*scY - 1, 2.5, 2.5);
            }
        }

        // Player dot
        const px = mmX + this.player.x * scX;
        const py = mmY + this.player.y * scY;
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Camera view box
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth   = 1;
        ctx.strokeRect(
            mmX + (this.camera.x - this.camera.width/2)  * scX,
            mmY + (this.camera.y - this.camera.height/2) * scY,
            this.camera.width  * scX,
            this.camera.height * scY
        );

        // Label
        ctx.fillStyle = '#ccc';
        ctx.font = 'bold 9px Arial';
        ctx.fillText('MAP', mmX + 5, mmY + 11);
    }

    // ─── Controls hint ────────────────────────────────────────────────────────
    _drawControlsHint(ctx) {
        const alpha = Math.min(1, this._hintTimer);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = 'rgba(0,0,0,0.55)';
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth   = 1.5;
        const bx = this.canvas.width/2 - 145, by = this.canvas.height - 70;
        ctx.beginPath();
        ctx.roundRect(bx, by, 290, 48, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#eee';
        ctx.font = '12px Arial';
        ctx.fillText('WASD / Arrows: Move   E: Enter/Exit Car   Shift: Sprint', bx + 14, by + 20);
        ctx.fillText('On mobile: use joystick + action buttons', bx + 14, by + 38);
        ctx.restore();
    }

    // ─── Game loop ────────────────────────────────────────────────────────────
    gameLoop(currentTime) {
        if (!this.running) return;
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // seconds, capped at 50ms
        this.lastTime = currentTime;
        this.update(dt);
        this.render();
        requestAnimationFrame(t => this.gameLoop(t));
    }
}

const game = new Game();
game.init();
export default game;
