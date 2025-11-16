export class Car {
    constructor(x, y, type = 'sedan') {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 70;
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 8;
        this.acceleration = 0.3;
        this.deceleration = 0.15;
        this.turnSpeed = 0.05;
        this.drag = 0.97;
        this.occupied = false;
        this.type = type;
        this.color = this.getColorByType(type);
    }
    
    getColorByType(type) {
        const colors = {
            sedan: '#3498db',
            sports: '#e74c3c',
            truck: '#95a5a6',
            taxi: '#f39c12'
        };
        return colors[type] || '#3498db';
    }
    
    update(input, world) {
        if (!this.occupied) {
            this.speed *= this.drag;
            if (Math.abs(this.speed) < 0.01) this.speed = 0;
            return;
        }
        
        const movement = input.getMovementInput();
        
        if (movement.dy < 0) {
            this.speed += this.acceleration;
        } else if (movement.dy > 0) {
            if (this.speed > 0) {
                this.speed -= this.deceleration * 2;
            } else {
                this.speed -= this.acceleration * 0.5;
            }
        } else {
            if (this.speed > 0) {
                this.speed -= this.deceleration;
            } else if (this.speed < 0) {
                this.speed += this.deceleration;
            }
        }
        
        this.speed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, this.speed));
        
        if (Math.abs(this.speed) > 0.5) {
            this.angle += movement.dx * this.turnSpeed * (this.speed / this.maxSpeed);
        }
        
        this.speed *= this.drag;
        
        const newX = this.x + Math.cos(this.angle) * this.speed;
        const newY = this.y + Math.sin(this.angle) * this.speed;
        
        if (!world.checkCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        } else {
            this.speed *= -0.3;
        }
        
        if (!world.checkCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        } else {
            this.speed *= -0.3;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 10, this.width - 10, this.height * 0.3);
        ctx.fillRect(-this.width / 2 + 5, this.height / 2 - 10 - this.height * 0.25, this.width - 10, this.height * 0.25);
        
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-this.width / 2, -this.height / 2 - 5, 8, 5);
        ctx.fillRect(this.width / 2 - 8, -this.height / 2 - 5, 8, 5);
        
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
    
    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
