import { Car } from './car.js';

export class AICar extends Car {
    constructor(x, y, type = 'sedan') {
        super(x, y, type);
        this.isAI = true;
        this.targetSpeed = 2 + Math.random() * 2;
        this.pathTimer = 0;
        this.turnTimer = 0;
        this.turnDuration = 2000 + Math.random() * 3000;
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
    }
    
    updateAI(world, deltaTime) {
        if (this.occupied) return; // Don't control if player is driving
        
        this.pathTimer += deltaTime;
        this.turnTimer += deltaTime;
        
        // Check if stuck
        const distMoved = Math.sqrt(
            (this.x - this.lastX) ** 2 + 
            (this.y - this.lastY) ** 2
        );
        
        if (distMoved < 0.5 && Math.abs(this.speed) > 0.5) {
            this.stuckTimer += deltaTime;
            if (this.stuckTimer > 1000) {
                // Unstuck: reverse and turn
                this.speed = -2;
                this.angle += Math.PI * 0.5;
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }
        
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Change direction occasionally
        if (this.turnTimer > this.turnDuration) {
            const turnAmount = (Math.random() - 0.5) * Math.PI * 0.3;
            this.angle += turnAmount;
            this.turnTimer = 0;
            this.turnDuration = 2000 + Math.random() * 3000;
        }
        
        // Accelerate towards target speed
        if (this.speed < this.targetSpeed) {
            this.speed += this.acceleration * 0.5;
        } else {
            this.speed -= this.deceleration * 0.5;
        }
        
        // Apply drag
        this.speed *= this.drag;
        
        // Move forward
        const newX = this.x + Math.cos(this.angle) * this.speed;
        const newY = this.y + Math.sin(this.angle) * this.speed;
        
        // Check collision and update position
        if (!world.checkCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        } else {
            // Hit obstacle, slow down and turn
            this.speed *= 0.5;
            this.angle += (Math.random() - 0.5) * Math.PI * 0.5;
        }
        
        if (!world.checkCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        } else {
            // Hit obstacle, slow down and turn
            this.speed *= 0.5;
            this.angle += (Math.random() - 0.5) * Math.PI * 0.5;
        }
        
        // Keep within world bounds with margin
        const margin = 100;
        if (this.x < margin || this.x > world.width - margin) {
            this.angle = Math.PI - this.angle;
        }
        if (this.y < margin || this.y > world.height - margin) {
            this.angle = -this.angle;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw car body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Windows
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 10, this.width - 10, this.height * 0.3);
        ctx.fillRect(-this.width / 2 + 5, this.height / 2 - 10 - this.height * 0.25, this.width - 10, this.height * 0.25);
        
        // Headlights
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-this.width / 2, -this.height / 2 - 5, 8, 5);
        ctx.fillRect(this.width / 2 - 8, -this.height / 2 - 5, 8, 5);
        
        // AI indicator (small dot on roof)
        if (this.isAI) {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
