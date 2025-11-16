export class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = 100;
        this.buildings = [];
        this.roads = [];
        this.generateWorld();
    }
    
    generateWorld() {
        const gridWidth = Math.ceil(this.width / this.tileSize);
        const gridHeight = Math.ceil(this.height / this.tileSize);
        
        for (let i = 0; i < gridWidth; i++) {
            for (let j = 0; j < gridHeight; j++) {
                const x = i * this.tileSize;
                const y = j * this.tileSize;
                
                if (i % 3 === 0 || j % 3 === 0) {
                    this.roads.push({
                        x: x,
                        y: y,
                        width: this.tileSize,
                        height: this.tileSize,
                        type: 'road'
                    });
                } else if (Math.random() > 0.3) {
                    const buildingWidth = this.tileSize * 0.8;
                    const buildingHeight = this.tileSize * 0.8;
                    this.buildings.push({
                        x: x + (this.tileSize - buildingWidth) / 2,
                        y: y + (this.tileSize - buildingHeight) / 2,
                        width: buildingWidth,
                        height: buildingHeight,
                        color: this.getRandomBuildingColor()
                    });
                }
            }
        }
    }
    
    getRandomBuildingColor() {
        const colors = ['#8e44ad', '#2c3e50', '#34495e', '#7f8c8d', '#16a085'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    checkCollision(x, y, width, height) {
        const bounds = {
            x: x - width / 2,
            y: y - height / 2,
            width: width,
            height: height
        };
        
        if (bounds.x < 0 || bounds.y < 0 || 
            bounds.x + bounds.width > this.width || 
            bounds.y + bounds.height > this.height) {
            return true;
        }
        
        for (const building of this.buildings) {
            if (this.rectanglesIntersect(bounds, building)) {
                return true;
            }
        }
        
        return false;
    }
    
    rectanglesIntersect(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw(ctx, camera) {
        const startX = Math.max(0, Math.floor((camera.x - camera.width / 2) / this.tileSize));
        const endX = Math.min(Math.ceil(this.width / this.tileSize), Math.ceil((camera.x + camera.width / 2) / this.tileSize));
        const startY = Math.max(0, Math.floor((camera.y - camera.height / 2) / this.tileSize));
        const endY = Math.min(Math.ceil(this.height / this.tileSize), Math.ceil((camera.y + camera.height / 2) / this.tileSize));
        
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, 0, this.width, this.height);
        
        for (let i = startX; i < endX; i++) {
            for (let j = startY; j < endY; j++) {
                const x = i * this.tileSize;
                const y = j * this.tileSize;
                
                if (i % 3 === 0 || j % 3 === 0) {
                    ctx.fillStyle = '#7f8c8d';
                    ctx.fillRect(x, y, this.tileSize, this.tileSize);
                    
                    ctx.strokeStyle = '#f39c12';
                    ctx.lineWidth = 2;
                    if (i % 3 === 0 && j % 3 !== 0) {
                        ctx.beginPath();
                        ctx.moveTo(x + this.tileSize / 2, y);
                        ctx.lineTo(x + this.tileSize / 2, y + this.tileSize);
                        ctx.stroke();
                    } else if (j % 3 === 0 && i % 3 !== 0) {
                        ctx.beginPath();
                        ctx.moveTo(x, y + this.tileSize / 2);
                        ctx.lineTo(x + this.tileSize, y + this.tileSize / 2);
                        ctx.stroke();
                    }
                    
                    ctx.fillStyle = '#95a5a6';
                    if (i % 3 === 0 && j % 3 !== 0) {
                        ctx.fillRect(x, y, 10, this.tileSize);
                        ctx.fillRect(x + this.tileSize - 10, y, 10, this.tileSize);
                    } else if (j % 3 === 0 && i % 3 !== 0) {
                        ctx.fillRect(x, y, this.tileSize, 10);
                        ctx.fillRect(x, y + this.tileSize - 10, this.tileSize, 10);
                    }
                }
            }
        }
        
        for (const building of this.buildings) {
            if (building.x + building.width >= camera.x - camera.width / 2 &&
                building.x <= camera.x + camera.width / 2 &&
                building.y + building.height >= camera.y - camera.height / 2 &&
                building.y <= camera.y + camera.height / 2) {
                
                ctx.fillStyle = building.color;
                ctx.fillRect(building.x, building.y, building.width, building.height);
                
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 2;
                ctx.strokeRect(building.x, building.y, building.width, building.height);
                
                const windowSize = 8;
                const windowSpacing = 15;
                ctx.fillStyle = '#f39c12';
                for (let wx = building.x + 10; wx < building.x + building.width - 10; wx += windowSpacing) {
                    for (let wy = building.y + 10; wy < building.y + building.height - 10; wy += windowSpacing) {
                        ctx.fillRect(wx, wy, windowSize, windowSize);
                    }
                }
            }
        }
    }
}
