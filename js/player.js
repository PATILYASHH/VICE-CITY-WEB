export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width  = 18;
        this.height = 18;
        this.speed      = 3;
        this.sprintSpeed = 5.5;
        this.angle = -Math.PI / 2; // start facing up
        this.inVehicle = false;
        this.vehicle   = null;
    }

    update(input, world) {
        if (this.inVehicle) {
            this.x     = this.vehicle.x;
            this.y     = this.vehicle.y;
            this.angle = this.vehicle.angle;
            return;
        }

        const mv  = input.getMovementInput();
        const spd = input.isSprinting() ? this.sprintSpeed : this.speed;

        if (mv.dx !== 0 || mv.dy !== 0) {
            this.angle = Math.atan2(mv.dy, mv.dx);

            const nx = this.x + mv.dx * spd;
            const ny = this.y + mv.dy * spd;

            if (!world.checkCollision(nx, this.y, this.width, this.height)) this.x = nx;
            if (!world.checkCollision(this.x, ny, this.width, this.height)) this.y = ny;
        }
    }

    enterVehicle(vehicle) {
        this.inVehicle = true;
        this.vehicle   = vehicle;
        vehicle.occupied = true;
    }

    exitVehicle() {
        if (this.inVehicle && this.vehicle) {
            this.vehicle.occupied = false;
            this.x = this.vehicle.x + Math.cos(this.vehicle.angle + Math.PI / 2) * 50;
            this.y = this.vehicle.y + Math.sin(this.vehicle.angle + Math.PI / 2) * 50;
            this.inVehicle = false;
            this.vehicle   = null;
        }
    }

    draw(ctx) {
        if (this.inVehicle) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        const r = this.width / 2;

        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(2, 3, r, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body circle
        ctx.fillStyle = '#e8b87a'; // skin
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#b07030';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Shirt – triangle pointing in movement direction (angle points in +x when angle=0)
        ctx.rotate(this.angle);
        ctx.fillStyle = '#e74c3c'; // red shirt
        ctx.beginPath();
        ctx.moveTo(r * 0.92, 0);          // nose (forward direction = +x in local)
        ctx.lineTo(-r * 0.45, -r * 0.55);
        ctx.lineTo(-r * 0.45,  r * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.width/2, y: this.y - this.height/2, width: this.width, height: this.height };
    }
}
