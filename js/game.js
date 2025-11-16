import { InputManager } from './input.js';
import { Player } from './player.js';
import { Car } from './car.js';
import { World } from './world.js';
import { MobileControls } from './controls.js';

class Camera {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.smoothing = 0.1;
    }
    
    follow(target) {
        const targetX = target.x;
        const targetY = target.y;
        
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
        
        this.worldWidth = 2000;
        this.worldHeight = 2000;
        
        this.input = null;
        this.player = null;
        this.cars = [];
        this.world = null;
        this.camera = null;
        this.controls = null;
        
        this.speedMeter = document.getElementById('speed-meter');
        this.stateInfo = document.getElementById('state-info');
        
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
        
        this.controls = new MobileControls(this.input);
        
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
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
            { x: 1000, y: 1000 }
        ];
        
        for (const pos of positions) {
            const type = carTypes[Math.floor(Math.random() * carTypes.length)];
            const car = new Car(pos.x, pos.y, type);
            car.angle = Math.random() * Math.PI * 2;
            this.cars.push(car);
        }
    }
    
    update() {
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
        
        for (const car of this.cars) {
            if (!car.occupied) {
                const distance = car.distanceTo(this.player.x, this.player.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = car;
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
    }
    
    render() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.camera.applyTransform(this.ctx);
        
        this.world.draw(this.ctx, this.camera);
        
        for (const car of this.cars) {
            car.draw(this.ctx);
        }
        
        this.player.draw(this.ctx);
        
        this.ctx.restore();
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update();
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

const game = new Game();
game.init();

export default game;
