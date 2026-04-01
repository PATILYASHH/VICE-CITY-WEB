export class Car {
    constructor(x, y, type = 'sedan') {
        this.x = x;
        this.y = y;
        // angle=0 → faces right (+x). Increasing angle turns clockwise on canvas.
        this.angle = 0;
        this.vx = 0;   // world-space velocity
        this.vy = 0;
        this.speed = 0; // forward speed (signed), kept in sync for HUD

        this.occupied = false;
        this.type = type;

        const s = Car.SPECS[type] || Car.SPECS.sedan;
        this.width       = s.width;
        this.height      = s.height;
        this.maxSpeed    = s.maxSpeed;
        this.accel       = s.accel;
        this.braking     = s.braking;
        this.turnSpeed   = s.turnSpeed;
        this.traction    = s.traction;   // lateral friction (0=full drift, 1=no drift)
        this.color       = s.color;
        this.roofColor   = s.roofColor;
    }

    // ─── type specs ──────────────────────────────────────────────────────────
    static get SPECS() {
        return {
            sedan:  { width:28, height:52, maxSpeed:7,   accel:0.25, braking:0.42, turnSpeed:0.065, traction:0.87, color:'#3498db', roofColor:'#1a5276' },
            sports: { width:26, height:48, maxSpeed:12,  accel:0.48, braking:0.58, turnSpeed:0.082, traction:0.80, color:'#e74c3c', roofColor:'#922b21' },
            truck:  { width:36, height:66, maxSpeed:5.5, accel:0.18, braking:0.30, turnSpeed:0.045, traction:0.92, color:'#95a5a6', roofColor:'#616a6b' },
            taxi:   { width:28, height:52, maxSpeed:7.5, accel:0.28, braking:0.44, turnSpeed:0.070, traction:0.86, color:'#f39c12', roofColor:'#9a6010' },
            suv:    { width:32, height:58, maxSpeed:8,   accel:0.22, braking:0.38, turnSpeed:0.060, traction:0.90, color:'#2ecc71', roofColor:'#1a6b3b' },
            police: { width:28, height:52, maxSpeed:9,   accel:0.32, braking:0.52, turnSpeed:0.072, traction:0.85, color:'#2c3e50', roofColor:'#e8f4f8' }
        };
    }

    // ─── physics update ──────────────────────────────────────────────────────
    update(input, world) {
        if (!this.occupied) {
            // Parked cars stay still
            this.vx *= 0.92;
            this.vy *= 0.92;
            if (Math.hypot(this.vx, this.vy) < 0.01) { this.vx = 0; this.vy = 0; }
            return;
        }

        const mv = input.getMovementInput();

        // Forward / lateral unit vectors
        const fx =  Math.cos(this.angle);
        const fy =  Math.sin(this.angle);
        const lx = -Math.sin(this.angle);   // lateral (left of car)
        const ly =  Math.cos(this.angle);

        // Decompose velocity
        let fwdSpd = this.vx * fx + this.vy * fy;
        let latSpd = this.vx * lx + this.vy * ly;

        // Steer (only with enough speed)
        const absSpd = Math.abs(fwdSpd);
        if (absSpd > 0.5) {
            const sf = Math.min(1, absSpd / this.maxSpeed + 0.25);
            this.angle += mv.dx * this.turnSpeed * Math.sign(fwdSpd) * sf;
        }

        // Throttle / brake
        if (mv.dy < 0) {
            fwdSpd += this.accel;
        } else if (mv.dy > 0) {
            if (fwdSpd > 0.1) {
                fwdSpd -= this.braking;
            } else {
                fwdSpd -= this.accel * 0.55;
            }
        } else {
            fwdSpd *= 0.975; // rolling friction
        }

        // Clamp speed
        fwdSpd = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, fwdSpd));

        // Apply traction to lateral component
        latSpd *= this.traction;

        // Recalculate forward vectors after possible angle change
        const fx2 =  Math.cos(this.angle);
        const fy2 =  Math.sin(this.angle);
        const lx2 = -Math.sin(this.angle);
        const ly2 =  Math.cos(this.angle);

        this.vx = fwdSpd * fx2 + latSpd * lx2;
        this.vy = fwdSpd * fy2 + latSpd * ly2;

        // General drag
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Sync speed field for HUD (forward component of velocity)
        this.speed = this.vx * fx2 + this.vy * fy2;

        // Try to move, bounce off walls/buildings
        const nx = this.x + this.vx;
        const ny = this.y + this.vy;

        if (!world.checkCollision(nx, this.y, this.width, this.height)) {
            this.x = nx;
        } else {
            this.vx *= -0.25;
        }
        if (!world.checkCollision(this.x, ny, this.width, this.height)) {
            this.y = ny;
        } else {
            this.vy *= -0.25;
        }
    }

    // ─── rendering ───────────────────────────────────────────────────────────
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // +PI/2 corrects the drawing so the car nose faces the movement direction
        // (car body is drawn "portrait" with nose at local -y, movement = cos/sin(angle))
        ctx.rotate(this.angle + Math.PI / 2);

        const w = this.width, h = this.height;
        const hw = w / 2, hh = h / 2;

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(4, 5, hw + 3, hh + 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Car body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, w, h, [5, 5, 4, 4]);
        ctx.fill();

        // Windshield (front = top of portrait shape = -y direction)
        ctx.fillStyle = 'rgba(170, 225, 255, 0.88)';
        ctx.beginPath();
        ctx.roundRect(-hw + 4, -hh + 9, w - 8, h * 0.21, 2);
        ctx.fill();

        // Rear window
        ctx.fillStyle = 'rgba(120, 190, 230, 0.75)';
        ctx.beginPath();
        ctx.roundRect(-hw + 4, hh - 9 - h * 0.17, w - 8, h * 0.17, 2);
        ctx.fill();

        // Roof / cabin
        ctx.fillStyle = this.roofColor;
        ctx.beginPath();
        ctx.roundRect(-hw + 5, -hh + h * 0.28, w - 10, h * 0.44, 3);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, w, h, [5, 5, 4, 4]);
        ctx.stroke();

        // Headlights (front)
        ctx.fillStyle = '#fffde0';
        ctx.fillRect(-hw + 2, -hh,     7, 4);
        ctx.fillRect( hw - 9, -hh,     7, 4);

        // Taillights (rear)
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(-hw + 2, hh - 4,  7, 4);
        ctx.fillRect( hw - 9, hh - 4,  7, 4);

        // Wheels – four corners
        ctx.fillStyle = '#111';
        ctx.fillRect(-hw - 4, -hh + 7,   5, 12);  // front-left
        ctx.fillRect( hw - 1, -hh + 7,   5, 12);  // front-right
        ctx.fillRect(-hw - 4,  hh - 19,  5, 12);  // rear-left
        ctx.fillRect( hw - 1,  hh - 19,  5, 12);  // rear-right

        // Wheel rims
        ctx.fillStyle = '#777';
        ctx.fillRect(-hw - 3, -hh + 10,  3, 6);
        ctx.fillRect( hw,     -hh + 10,  3, 6);
        ctx.fillRect(-hw - 3,  hh - 16,  3, 6);
        ctx.fillRect( hw,      hh - 16,  3, 6);

        // Police light bar
        if (this.type === 'police') {
            const blink = Math.floor(Date.now() / 300) % 2;
            ctx.fillStyle = blink ? '#0044ff' : '#ff0000';
            ctx.fillRect(-6, -hh + 3, 5, 5);
            ctx.fillStyle = blink ? '#ff0000' : '#0044ff';
            ctx.fillRect(1,  -hh + 3, 5, 5);
        }

        ctx.restore();
    }

    // ─── helpers ──────────────────────────────────────────────────────────────
    distanceTo(x, y) {
        return Math.hypot(this.x - x, this.y - y);
    }

    getBounds() {
        return { x: this.x - this.width/2, y: this.y - this.height/2, width: this.width, height: this.height };
    }
}
