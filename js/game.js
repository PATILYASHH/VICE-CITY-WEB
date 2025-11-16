import { InputManager } from './input.js';
import { Player } from './player.js';
import { Car } from './car.js';
import { AICar } from './aicar.js';
import { NPC } from './npc.js';
import { World } from './world.js';
import { MobileControls } from './controls.js';

class Camera {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.smoothing = 0.15;
        this.lookAheadDistance = 100;
    }
    
    follow(target) {
        // Calculate look-ahead position based on target's angle and speed
        let lookAheadX = 0;
        let lookAheadY = 0;
        
        if (target.speed && Math.abs(target.speed) > 1) {
            lookAheadX = Math.cos(target.angle) * this.lookAheadDistance * (target.speed / target.maxSpeed);
            lookAheadY = Math.sin(target.angle) * this.lookAheadDistance * (target.speed / target.maxSpeed);
        }
        
        const targetX = target.x + lookAheadX;
        const targetY = target.y + lookAheadY;
        
        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
    }
    
    applyTransform(ctx) {
        ctx.translate(-this.x + this.width / 2, -this.y + this.height / 2);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap ? this.minimap.getContext('2d') : null;
        
        this.worldWidth = 4000;
        this.worldHeight = 4000;
        
        this.input = null;
        this.player = null;
        this.cars = [];
        this.aiCars = [];
        this.npcs = [];
        this.world = null;
        this.camera = null;
        this.controls = null;
        
        this.speedMeter = document.getElementById('speed-meter');
        this.stateInfo = document.getElementById('state-info');
        this.moneyDisplay = document.getElementById('money-display');
        this.healthFill = document.getElementById('health-fill');
        
        this.playerMoney = 1000;
        this.playerHealth = 100;
        
        this.lastTime = 0;
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.input = new InputManager();
        this.world = new World(this.worldWidth, this.worldHeight);
        this.player = new Player(this.worldWidth / 2, this.worldHeight / 2);
        
        this.camera = new Camera(
            this.player.x,
            this.player.y,
            this.canvas.width,
            this.canvas.height
        );
        
        this.spawnCars();
        this.spawnAICars();
        this.spawnNPCs();
        
        this.controls = new MobileControls(this.input);
        
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.minimap) {
            this.minimap.width = 200;
            this.minimap.height = 200;
        }
        
        if (this.camera) {
            this.camera.width = this.canvas.width;
            this.camera.height = this.canvas.height;
        }
    }
    
    spawnCars() {
        const carTypes = ['sedan', 'sports', 'truck', 'taxi'];
        const positions = [
            { x: 400, y: 400 },
            { x: 800, y: 600 },
            { x: 1200, y: 800 },
            { x: 1600, y: 400 },
            { x: 600, y: 1200 },
            { x: 1000, y: 1000 },
            { x: 2400, y: 1200 },
            { x: 3000, y: 2000 },
            { x: 2000, y: 3200 },
            { x: 3400, y: 2800 }
        ];
        
        for (const pos of positions) {
            const type = carTypes[Math.floor(Math.random() * carTypes.length)];
            const car = new Car(pos.x, pos.y, type);
            car.angle = Math.random() * Math.PI * 2;
            this.cars.push(car);
        }
    }
    
    spawnAICars() {
        const carTypes = ['sedan', 'sports', 'truck', 'taxi'];
        const numAICars = 15;
        
        for (let i = 0; i < numAICars; i++) {
            let x, y;
            let validPosition = false;
            
            // Try to spawn on roads
            while (!validPosition) {
                x = Math.random() * this.worldWidth;
                y = Math.random() * this.worldHeight;
                
                if (!this.world.checkCollision(x, y, 40, 70)) {
                    validPosition = true;
                }
            }
            
            const type = carTypes[Math.floor(Math.random() * carTypes.length)];
            const aiCar = new AICar(x, y, type);
            aiCar.angle = Math.random() * Math.PI * 2;
            this.aiCars.push(aiCar);
        }
    }
    
    spawnNPCs() {
        const npcTypes = ['pedestrian', 'shopkeeper', 'worker'];
        const numNPCs = 30;
        
        for (let i = 0; i < numNPCs; i++) {
            let x, y;
            let validPosition = false;
            
            // Spawn NPCs in safe areas (not on roads, not in buildings)
            while (!validPosition) {
                x = 200 + Math.random() * (this.worldWidth - 400);
                y = 200 + Math.random() * (this.worldHeight - 400);
                
                if (!this.world.checkCollision(x, y, 15, 15)) {
                    validPosition = true;
                }
            }
            
            const type = npcTypes[Math.floor(Math.random() * npcTypes.length)];
            const npc = new NPC(x, y, type);
            this.npcs.push(npc);
        }
    }
    
    update(deltaTime) {
        const activeEntity = this.player.inVehicle ? this.player.vehicle : this.player;
        
        if (this.input.isEnterCarPressed()) {
            this.handleVehicleInteraction();
        }
        
        if (this.player.inVehicle) {
            this.player.vehicle.update(this.input, this.world);
        } else {
            this.player.update(this.input, this.world);
        }
        
        for (const car of this.cars) {
            if (!car.occupied) {
                car.update(this.input, this.world);
            }
        }
        
        // Update AI cars
        for (const aiCar of this.aiCars) {
            aiCar.updateAI(this.world, deltaTime);
        }
        
        // Update NPCs
        for (const npc of this.npcs) {
            npc.update(deltaTime, this.world);
        }
        
        this.camera.follow(activeEntity);
        
        this.updateUI();
    }
    
    handleVehicleInteraction() {
        if (this.player.inVehicle) {
            this.player.exitVehicle();
        } else {
            const nearestCar = this.findNearestCar();
            if (nearestCar && nearestCar.distanceTo(this.player.x, this.player.y) < 60) {
                this.player.enterVehicle(nearestCar);
            }
        }
    }
    
    findNearestCar() {
        let nearest = null;
        let minDistance = Infinity;
        
        // Check regular cars
        for (const car of this.cars) {
            if (!car.occupied) {
                const distance = car.distanceTo(this.player.x, this.player.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = car;
                }
            }
        }
        
        // Check AI cars
        for (const aiCar of this.aiCars) {
            if (!aiCar.occupied) {
                const distance = aiCar.distanceTo(this.player.x, this.player.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = aiCar;
                }
            }
        }
        
        return nearest;
    }
    
    updateUI() {
        if (this.player.inVehicle) {
            const speed = Math.abs(this.player.vehicle.speed);
            this.speedMeter.textContent = `Speed: ${Math.round(speed * 10)}`;
            this.stateInfo.textContent = `Driving ${this.player.vehicle.type}`;
        } else {
            this.speedMeter.textContent = `Speed: 0`;
            this.stateInfo.textContent = 'On Foot';
            
            const nearestCar = this.findNearestCar();
            if (nearestCar && nearestCar.distanceTo(this.player.x, this.player.y) < 60) {
                this.stateInfo.textContent = 'Press E to enter vehicle';
            }
        }
        
        // Update money display
        this.moneyDisplay.textContent = `$${this.playerMoney}`;
        
        // Update health bar
        this.healthFill.style.width = `${this.playerHealth}%`;
    }
    
    render() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.camera.applyTransform(this.ctx);
        
        this.world.draw(this.ctx, this.camera);
        
        // Draw NPCs
        for (const npc of this.npcs) {
            // Only draw NPCs in camera view
            if (Math.abs(npc.x - this.camera.x) < this.camera.width / 2 + 100 &&
                Math.abs(npc.y - this.camera.y) < this.camera.height / 2 + 100) {
                npc.draw(this.ctx);
            }
        }
        
        // Draw regular cars
        for (const car of this.cars) {
            car.draw(this.ctx);
        }
        
        // Draw AI cars
        for (const aiCar of this.aiCars) {
            aiCar.draw(this.ctx);
        }
        
        this.player.draw(this.ctx);
        
        this.ctx.restore();
        
        // Draw minimap
        this.renderMinimap();
    }
    
    renderMinimap() {
        if (!this.minimapCtx) return;
        
        const mmCtx = this.minimapCtx;
        const mmWidth = this.minimap.width;
        const mmHeight = this.minimap.height;
        const scale = mmWidth / this.worldWidth;
        
        // Clear minimap
        mmCtx.fillStyle = '#2ecc71';
        mmCtx.fillRect(0, 0, mmWidth, mmHeight);
        
        // Draw roads on minimap
        mmCtx.fillStyle = '#7f8c8d';
        const gridSize = 100 * scale;
        for (let i = 0; i < this.worldWidth / 100; i++) {
            for (let j = 0; j < this.worldHeight / 100; j++) {
                if (i % 3 === 0 || j % 3 === 0) {
                    mmCtx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize);
                }
            }
        }
        
        // Draw buildings on minimap
        mmCtx.fillStyle = '#34495e';
        for (const building of this.world.buildings) {
            mmCtx.fillRect(
                building.x * scale,
                building.y * scale,
                building.width * scale,
                building.height * scale
            );
        }
        
        // Draw AI cars on minimap
        mmCtx.fillStyle = '#3498db';
        for (const aiCar of this.aiCars) {
            mmCtx.fillRect(
                aiCar.x * scale - 2,
                aiCar.y * scale - 2,
                4, 4
            );
        }
        
        // Draw regular cars on minimap
        mmCtx.fillStyle = '#e74c3c';
        for (const car of this.cars) {
            mmCtx.fillRect(
                car.x * scale - 2,
                car.y * scale - 2,
                4, 4
            );
        }
        
        // Draw player on minimap
        const activeEntity = this.player.inVehicle ? this.player.vehicle : this.player;
        mmCtx.fillStyle = '#ffcc00';
        mmCtx.beginPath();
        mmCtx.arc(activeEntity.x * scale, activeEntity.y * scale, 4, 0, Math.PI * 2);
        mmCtx.fill();
        
        // Draw direction indicator
        mmCtx.strokeStyle = '#ffcc00';
        mmCtx.lineWidth = 2;
        mmCtx.beginPath();
        mmCtx.moveTo(activeEntity.x * scale, activeEntity.y * scale);
        mmCtx.lineTo(
            activeEntity.x * scale + Math.cos(activeEntity.angle) * 10,
            activeEntity.y * scale + Math.sin(activeEntity.angle) * 10
        );
        mmCtx.stroke();
        
        // Draw border
        mmCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        mmCtx.lineWidth = 2;
        mmCtx.strokeRect(0, 0, mmWidth, mmHeight);
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

const game = new Game();
game.init();

export default game;
