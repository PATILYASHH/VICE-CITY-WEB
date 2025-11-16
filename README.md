# VICE-CITY-WEB

A GTA Vice City-style open-world web game built with HTML5 Canvas and JavaScript. Experience a fully interactive top-down city with cars, buildings, and smooth controls for both desktop and mobile.

## Features

### Core Gameplay
- **Open World City**: Procedurally generated city with roads, buildings, and sidewalks
- **Player Movement**: Smooth WASD and Arrow key controls
- **Vehicle System**: Drive multiple car types with realistic physics
- **Collision Detection**: Buildings and world boundaries prevent movement
- **Camera System**: Smooth following camera that tracks the player or vehicle

### Vehicle Physics
- Acceleration and braking
- Turning mechanics based on speed
- Drag and deceleration
- Collision response with buildings
- Multiple car types: Sedan, Sports, Truck, Taxi

### Controls

#### Desktop
- **WASD** or **Arrow Keys**: Move player / Drive vehicle
- **E**: Enter/Exit vehicle
- **Shift**: Sprint (when on foot)
- **Space**: Attack (placeholder)

#### Mobile
- **Joystick** (left side): Movement control
- **Car Button** (🚗): Enter/Exit vehicle
- **Sprint Button** (🏃): Sprint while moving
- **Attack Button** (👊): Attack (placeholder)

## Project Structure

```
VICE-CITY-WEB/
├── index.html          # Main HTML file
├── styles.css          # Responsive CSS with mobile controls
└── js/
    ├── game.js        # Main game loop and initialization
    ├── input.js       # Keyboard and touch input management
    ├── player.js      # Player entity with movement logic
    ├── car.js         # Vehicle physics and rendering
    ├── world.js       # World generation and collision detection
    └── controls.js    # Mobile touch controls (joystick + buttons)
```

## How to Run

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/PATILYASHH/VICE-CITY-WEB.git
   cd VICE-CITY-WEB
   ```

2. Start a local web server (choose one):
   ```bash
   # Python 3
   python3 -m http.server 8080
   
   # Python 2
   python -m SimpleHTTPServer 8080
   
   # Node.js (with http-server package)
   npx http-server -p 8080
   
   # PHP
   php -S localhost:8080
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Direct File Access
Most modern browsers block ES6 modules when opening HTML files directly (file:// protocol). Always use a local web server.

## Technical Details

### Architecture
- **Pure JavaScript ES6 Modules**: No external game engines or frameworks
- **HTML5 Canvas Rendering**: All graphics rendered on canvas with primitive shapes
- **requestAnimationFrame Loop**: Optimized 60 FPS game loop
- **Modular Design**: Separate modules for input, entities, world, and controls

### Performance
- Optimized rendering with camera culling
- Efficient collision detection
- Smooth 60 FPS on most devices
- Responsive design for mobile and desktop

### Browser Compatibility
- Chrome 61+ (recommended)
- Firefox 60+
- Safari 11+
- Edge 16+
- Mobile browsers with touch support

## Development

### Adding New Features
Each module is independent and follows a clear pattern:

- **input.js**: Handles all input sources (keyboard, touch, joystick)
- **player.js**: Player entity with update() and draw() methods
- **car.js**: Vehicle entity with physics simulation
- **world.js**: World generation and collision checking
- **controls.js**: Mobile UI controls setup
- **game.js**: Main game loop coordinating all systems

### Customization
- Modify world size in `game.js` (worldWidth, worldHeight)
- Adjust player/vehicle speeds in respective class files
- Change building colors and city layout in `world.js`
- Add new vehicle types by extending the Car class

## License

This project is open source. No copyrighted GTA assets are used - all graphics are placeholder primitives.

## Credits

Created as a demonstration of HTML5 Canvas game development with vanilla JavaScript.