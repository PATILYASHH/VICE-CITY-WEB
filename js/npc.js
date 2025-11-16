export class NPC {
    constructor(x, y, type = 'pedestrian') {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 0.5 + Math.random() * 0.5;
        this.type = type;
        this.color = this.getColorByType(type);
        this.walkTimer = 0;
        this.walkDuration = 2000 + Math.random() * 3000; // Walk for 2-5 seconds
        this.idleTimer = 0;
        this.idleDuration = 1000 + Math.random() * 2000; // Idle for 1-3 seconds
        this.isWalking = Math.random() > 0.3; // 70% start walking
        this.targetAngle = this.angle;
        this.changeDirectionTimer = 0;
    }
    
    getColorByType(type) {
        const colors = {
            pedestrian: '#ff6b6b',
            shopkeeper: '#4ecdc4',
            worker: '#f7b731'
        };
        return colors[type] || '#ff6b6b';
    }
    
    update(deltaTime, world) {
        if (this.isWalking) {
            this.walkTimer += deltaTime;
            this.changeDirectionTimer += deltaTime;
            
            // Change direction occasionally while walking
            if (this.changeDirectionTimer > 1000) {
                if (Math.random() > 0.7) {
                    this.targetAngle = this.angle + (Math.random() - 0.5) * Math.PI * 0.5;
                }
                this.changeDirectionTimer = 0;
            }
            
            // Smoothly turn towards target angle
            const angleDiff = this.targetAngle - this.angle;
            this.angle += angleDiff * 0.05;
            
            // Move forward
            const newX = this.x + Math.cos(this.angle) * this.speed;
            const newY = this.y + Math.sin(this.angle) * this.speed;
            
            // Check collision and update position
            if (!world.checkCollision(newX, this.y, this.width, this.height)) {
                this.x = newX;
            } else {
                // Hit obstacle, turn around
                this.angle += Math.PI;
                this.targetAngle = this.angle;
            }
            
            if (!world.checkCollision(this.x, newY, this.width, this.height)) {
                this.y = newY;
            } else {
                // Hit obstacle, turn around
                this.angle += Math.PI;
                this.targetAngle = this.angle;
            }
            
            // Switch to idle after walking duration
            if (this.walkTimer > this.walkDuration) {
                this.isWalking = false;
                this.walkTimer = 0;
                this.idleDuration = 1000 + Math.random() * 2000;
            }
        } else {
            // Idle state
            this.idleTimer += deltaTime;
            
            if (this.idleTimer > this.idleDuration) {
                this.isWalking = true;
                this.idleTimer = 0;
                this.walkDuration = 2000 + Math.random() * 3000;
                this.targetAngle = Math.random() * Math.PI * 2;
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Head (direction indicator)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.width / 4, 0, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
        
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
