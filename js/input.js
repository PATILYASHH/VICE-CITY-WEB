export class InputManager {
    constructor() {
        this.keys = {};
        this.joystick = { active: false, x: 0, y: 0 };
        this.actions = {
            enterCar: false,
            sprint: false,
            attack: false
        };
        
        this.setupKeyboard();
    }
    
    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
    }
    
    isKeyDown(key) {
        return this.keys[key] === true;
    }
    
    getMovementInput() {
        let dx = 0;
        let dy = 0;
        
        if (this.joystick.active) {
            dx = this.joystick.x;
            dy = this.joystick.y;
        } else {
            if (this.isKeyDown('w') || this.isKeyDown('ArrowUp')) dy -= 1;
            if (this.isKeyDown('s') || this.isKeyDown('ArrowDown')) dy += 1;
            if (this.isKeyDown('a') || this.isKeyDown('ArrowLeft')) dx -= 1;
            if (this.isKeyDown('d') || this.isKeyDown('ArrowRight')) dx += 1;
        }
        
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
        }
        
        return { dx, dy };
    }
    
    isSprinting() {
        return this.isKeyDown('Shift') || this.actions.sprint;
    }
    
    isEnterCarPressed() {
        const pressed = this.isKeyDown('e') || this.actions.enterCar;
        if (pressed) {
            this.keys['e'] = false;
            this.actions.enterCar = false;
        }
        return pressed;
    }
    
    isAttackPressed() {
        const pressed = this.isKeyDown(' ') || this.actions.attack;
        if (pressed) {
            this.keys[' '] = false;
            this.actions.attack = false;
        }
        return pressed;
    }
    
    setJoystick(active, x, y) {
        this.joystick.active = active;
        this.joystick.x = x;
        this.joystick.y = y;
    }
    
    setAction(action, value) {
        if (this.actions.hasOwnProperty(action)) {
            this.actions[action] = value;
        }
    }
}
