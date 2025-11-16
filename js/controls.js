export class MobileControls {
    constructor(inputManager) {
        this.input = inputManager;
        this.joystickContainer = document.getElementById('joystick-container');
        this.joystickBase = document.getElementById('joystick-base');
        this.joystickStick = document.getElementById('joystick-stick');
        this.btnEnterCar = document.getElementById('btn-enter-car');
        this.btnSprint = document.getElementById('btn-sprint');
        this.btnAttack = document.getElementById('btn-attack');
        
        this.joystickActive = false;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickRadius = 50;
        
        this.setupJoystick();
        this.setupButtons();
    }
    
    setupJoystick() {
        const handleStart = (e) => {
            e.preventDefault();
            this.joystickActive = true;
            
            const rect = this.joystickContainer.getBoundingClientRect();
            this.joystickStartX = rect.left + rect.width / 2;
            this.joystickStartY = rect.top + rect.height / 2;
            
            const touch = e.touches ? e.touches[0] : e;
            this.updateJoystick(touch.clientX, touch.clientY);
        };
        
        const handleMove = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            this.updateJoystick(touch.clientX, touch.clientY);
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.resetJoystick();
        };
        
        this.joystickContainer.addEventListener('touchstart', handleStart, { passive: false });
        this.joystickContainer.addEventListener('touchmove', handleMove, { passive: false });
        this.joystickContainer.addEventListener('touchend', handleEnd, { passive: false });
        this.joystickContainer.addEventListener('touchcancel', handleEnd, { passive: false });
        
        this.joystickContainer.addEventListener('pointerdown', handleStart);
        this.joystickContainer.addEventListener('pointermove', handleMove);
        this.joystickContainer.addEventListener('pointerup', handleEnd);
        this.joystickContainer.addEventListener('pointercancel', handleEnd);
    }
    
    updateJoystick(clientX, clientY) {
        const dx = clientX - this.joystickStartX;
        const dy = clientY - this.joystickStartY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let normalizedX = dx / this.joystickRadius;
        let normalizedY = dy / this.joystickRadius;
        
        if (distance > this.joystickRadius) {
            normalizedX = dx / distance;
            normalizedY = dy / distance;
        }
        
        const stickX = normalizedX * Math.min(distance, this.joystickRadius);
        const stickY = normalizedY * Math.min(distance, this.joystickRadius);
        
        this.joystickStick.style.left = `${35 + stickX}px`;
        this.joystickStick.style.top = `${35 + stickY}px`;
        
        this.input.setJoystick(true, normalizedX, normalizedY);
    }
    
    resetJoystick() {
        this.joystickStick.style.left = '35px';
        this.joystickStick.style.top = '35px';
        this.input.setJoystick(false, 0, 0);
    }
    
    setupButtons() {
        this.btnEnterCar.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.input.setAction('enterCar', true);
        }, { passive: false });
        
        this.btnEnterCar.addEventListener('click', (e) => {
            e.preventDefault();
            this.input.setAction('enterCar', true);
        });
        
        const handleSprintStart = (e) => {
            e.preventDefault();
            this.input.setAction('sprint', true);
        };
        
        const handleSprintEnd = (e) => {
            e.preventDefault();
            this.input.setAction('sprint', false);
        };
        
        this.btnSprint.addEventListener('touchstart', handleSprintStart, { passive: false });
        this.btnSprint.addEventListener('touchend', handleSprintEnd, { passive: false });
        this.btnSprint.addEventListener('pointerdown', handleSprintStart);
        this.btnSprint.addEventListener('pointerup', handleSprintEnd);
        
        this.btnAttack.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.input.setAction('attack', true);
        }, { passive: false });
        
        this.btnAttack.addEventListener('click', (e) => {
            e.preventDefault();
            this.input.setAction('attack', true);
        });
    }
}
