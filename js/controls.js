export class MobileControls {
    constructor(inputManager) {
        this.input = inputManager;
        this.joystickContainer = document.getElementById('joystick-container');
        this.joystickBase = document.getElementById('joystick-base');
        this.joystickStick = document.getElementById('joystick-stick');
        this.btnEnterCar = document.getElementById('btn-enter-car');
        this.btnSprint = document.getElementById('btn-sprint');
        this.btnAttack = document.getElementById('btn-attack');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        
        this.joystickActive = false;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickRadius = 50;
        this.activeTouchId = null;
        
        this.setupJoystick();
        this.setupButtons();
        this.setupFullscreen();
    }
    
    setupJoystick() {
        const handleStart = (e) => {
            e.preventDefault();
            
            // For touch events, track the touch identifier
            if (e.touches) {
                if (this.joystickActive) return; // Already tracking a touch
                this.activeTouchId = e.touches[0].identifier;
            }
            
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
            
            // For touch events, find the correct touch
            let touch = e;
            if (e.touches && this.activeTouchId !== null) {
                for (let i = 0; i < e.touches.length; i++) {
                    if (e.touches[i].identifier === this.activeTouchId) {
                        touch = e.touches[i];
                        break;
                    }
                }
            } else if (e.touches) {
                touch = e.touches[0];
            }
            
            this.updateJoystick(touch.clientX, touch.clientY);
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            
            // For touch events, check if our tracked touch ended
            if (e.changedTouches && this.activeTouchId !== null) {
                let foundTouch = false;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.activeTouchId) {
                        foundTouch = true;
                        break;
                    }
                }
                if (!foundTouch) return; // Not our touch
            }
            
            this.joystickActive = false;
            this.activeTouchId = null;
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
    
    setupFullscreen() {
        this.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Update button icon when fullscreen state changes
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenIcon();
        });
        document.addEventListener('webkitfullscreenchange', () => {
            this.updateFullscreenIcon();
        });
        document.addEventListener('mozfullscreenchange', () => {
            this.updateFullscreenIcon();
        });
        document.addEventListener('MSFullscreenChange', () => {
            this.updateFullscreenIcon();
        });
    }
    
    toggleFullscreen() {
        const gameContainer = document.getElementById('game-container');
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            // Enter fullscreen
            if (gameContainer.requestFullscreen) {
                gameContainer.requestFullscreen();
            } else if (gameContainer.webkitRequestFullscreen) {
                gameContainer.webkitRequestFullscreen();
            } else if (gameContainer.mozRequestFullScreen) {
                gameContainer.mozRequestFullScreen();
            } else if (gameContainer.msRequestFullscreen) {
                gameContainer.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    updateFullscreenIcon() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || 
                           document.mozFullScreenElement || document.msFullscreenElement;
        this.fullscreenBtn.textContent = isFullscreen ? '⛶' : '⛶';
    }
}
