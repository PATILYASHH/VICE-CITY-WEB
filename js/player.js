export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 3;
        this.sprintSpeed = 5;
        this.angle = 0;
        this.inVehicle = false;
        this.vehicle = null;
    }
    
    update(input, world) {
        if (this.inVehicle) {
            this.x = this.vehicle.x;
            this.y = this.vehicle.y;
            this.angle = this.vehicle.angle;
            return;
        }
        
        const movement = input.getMovementInput();
        const isSprinting = input.isSprinting();
        const currentSpeed = isSprinting ? this.sprintSpeed : this.speed;
        
        if (movement.dx !== 0 || movement.dy !== 0) {
            this.angle = Math.atan2(movement.dy, movement.dx);
            
            const newX = this.x + movement.dx * currentSpeed;
            const newY = this.y + movement.dy * currentSpeed;
            
            if (!world.checkCollision(newX, this.y, this.width, this.height)) {
                this.x = newX;
            }
            if (!world.checkCollision(this.x, newY, this.width, this.height)) {
                this.y = newY;
            }
        }
    }
    
    enterVehicle(vehicle) {
        this.inVehicle = true;
        this.vehicle = vehicle;
        vehicle.occupied = true;
    }
    
    exitVehicle() {
        if (this.inVehicle && this.vehicle) {
            this.vehicle.occupied = false;
            this.x = this.vehicle.x + Math.cos(this.vehicle.angle) * 50;
            this.y = this.vehicle.y + Math.sin(this.vehicle.angle) * 50;
            this.inVehicle = false;
            this.vehicle = null;
        }
    }
    
    draw(ctx) {
        if (this.inVehicle) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.width / 4, -this.height / 4, this.width / 4, this.height / 2);
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
