// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 900;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

let gameState = 'startScreen';
let currentLevelIndex = 0;

// Set this to a level index (e.g., 3 for Level 4) to test it directly
let debugLevelIndex = -1;  

let lastTime = 0;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

const playerImage = new Image();
playerImage.src = 'astronaut.png';

// ... (playerImage definition) ...
const startScreenImage = new Image();
startScreenImage.src = 'astro_bounce_start-page.png'; // Make sure this file is in the same directory as your index.html

// ... (rest of the file) ...

// --- Input Handling and Helper Functions ---
let keys = {};

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function drawPlayer() {
    if (playerImage.complete && player.width > 0 && player.height > 0) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function drawGameElements() {
    currentPlatforms.forEach(platform => {
        platform.draw(ctx);
    });

    if (currentGoal) {
        ctx.save();
        const centerX = currentGoal.x + currentGoal.width / 2;
        const centerY = currentGoal.y + currentGoal.height / 2;
        ctx.translate(centerX, centerY);

        const numLayers = 6;
        const maxRadius = currentGoal.width / 2;

        for (let i = 0; i < numLayers; i++) {
            const radius = maxRadius * ((i + 0.5) / numLayers);
            const alpha = 0.1 + (i / numLayers) * 0.9;
            const rotation = currentGoal.spinAngle * (1 + i * 0.2); 

            ctx.save();
            ctx.rotate(rotation);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 1.75); 
            ctx.strokeStyle = `rgba(255, 223, 0, ${alpha})`;
            ctx.lineWidth = 1 + i;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    if (spawnVortex) {
        ctx.save();
        ctx.translate(spawnVortex.x + spawnVortex.width / 2, spawnVortex.y + spawnVortex.height / 2);
        ctx.rotate(spawnVortex.spinAngle);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(-spawnVortex.width / 2, -spawnVortex.height / 2, spawnVortex.width, spawnVortex.height);
        ctx.restore();
    }
}

// --- Performance Tracking ---
function updateFPS() {
    const now = performance.now();
    const elapsed = now - lastFrameTime;
    if (elapsed >= 1000) {
        fps = Math.round((frameCount / elapsed) * 1000);
        frameCount = 0;
        lastFrameTime = now;
    }
    frameCount++;
}

// --- Platform Class ---
class Platform {
    constructor(x, y, width, height, color, type = 'static', moveSpeed = 0, direction = 1, moveDistance = 0, decayTime = 0) {
        this.x = x; this.y = y; this.width = width; this.height = height; this.color = color;
        this.type = type; this.moveSpeed = moveSpeed; this.direction = direction; this.moveDistance = moveDistance;
        this.initialX = x; this.initialY = y; this.decayTime = decayTime; this.originalDecayTime = decayTime;
        this.playerOn = false; this.active = true; this.opacity = 1;
        this.prevX = x; this.prevY = y;
    }
    update(deltaTime) {
        this.prevX = this.x; this.prevY = this.y;
        if (!this.active) return;
        if (this.type === 'horizontal-moving') {
            this.x += this.moveSpeed * this.direction * deltaTime;
            if (this.direction === 1 && this.x >= this.initialX + this.moveDistance) { this.x = this.initialX + this.moveDistance; this.direction *= -1; }
            else if (this.direction === -1 && this.x <= this.initialX) { this.x = this.initialX; this.direction *= -1; }
        } else if (this.type === 'vertical-moving') {
            this.y += this.moveSpeed * this.direction * deltaTime;
            if (this.direction === 1 && this.y >= this.initialY + this.moveDistance) { this.y = this.initialY + this.moveDistance; this.direction *= -1; }
            else if (this.direction === -1 && this.y <= this.initialY) { this.y = this.initialY; this.direction *= -1; }
        }
        if (this.type === 'crumbling' && this.playerOn) {
            this.decayTime -= 1;
            if (this.decayTime <= 0) this.active = false;
            this.opacity = Math.max(0, this.decayTime / this.originalDecayTime);
        }
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.save(); ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
    reset() {
        this.x = this.initialX; this.y = this.initialY; this.decayTime = this.originalDecayTime;
        this.active = true; this.playerOn = false; this.opacity = 1;
        if (this.type === 'horizontal-moving' || this.type === 'vertical-moving') { this.direction = 1; }
        this.prevX = this.x; this.prevY = this.y;
    }
}


// --- FIXED: Reformatted all levels for consistency ---
const levels = [
    // Level 1
    {
        playerStart: { x: 100, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: GAME_WIDTH, height: 20, color: '#607d8b', type: 'static' },
            { x: 200, y: GAME_HEIGHT - 150, width: 150, height: 20, color: '#4CAF50', type: 'static' },
            { x: 450, y: GAME_HEIGHT - 250, width: 150, height: 20, color: '#4CAF50', type: 'static' },
            { x: 700, y: GAME_HEIGHT - 350, width: 150, height: 20, color: '#4CAF50', type: 'static' },
            { x: 950, y: GAME_HEIGHT - 450, width: 150, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 1000, y: GAME_HEIGHT - 510, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 2
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 300, height: 20, color: '#607d8b', type: 'static' },
            { x: 450, y: GAME_HEIGHT - 20, width: 250, height: 20, color: '#607d8b', type: 'static' },
            { x: 800, y: GAME_HEIGHT - 20, width: 400, height: 20, color: '#607d8b', type: 'static' },
            { x: 200, y: GAME_HEIGHT - 150, width: 120, height: 20, color: '#4CAF50', type: 'static' },
            { x: 500, y: GAME_HEIGHT - 250, width: 120, height: 20, color: '#4CAF50', type: 'static' },
            { x: 800, y: GAME_HEIGHT - 350, width: 120, height: 20, color: '#4CAF50', type: 'static' },
            { x: 1050, y: GAME_HEIGHT - 450, width: 100, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 1080, y: GAME_HEIGHT - 510, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 3
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 200, height: 20, color: '#607d8b', type: 'static' },
            { x: 350, y: GAME_HEIGHT - 150, width: 100, height: 20, color: '#4CAF50', type: 'static' },
            { x: 550, y: GAME_HEIGHT - 250, width: 100, height: 20, color: '#FF5722', type: 'horizontal-moving', moveSpeed: 0.5, moveDistance: 300 },
            { x: 900, y: GAME_HEIGHT - 350, width: 150, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 950, y: GAME_HEIGHT - 410, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 4
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 200, height: 20, color: '#607d8b', type: 'static' },
            { x: 300, y: GAME_HEIGHT - 150, width: 100, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 60 },
            { x: 500, y: GAME_HEIGHT - 250, width: 100, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 55 },
            { x: 700, y: GAME_HEIGHT - 350, width: 100, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 50 },
            { x: 900, y: GAME_HEIGHT - 450, width: 150, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 950, y: GAME_HEIGHT - 510, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 5
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 150, height: 20, color: '#607d8b', type: 'static' },
            { x: 200, y: GAME_HEIGHT - 200, width: 100, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.4, moveDistance: 150, direction: 1 },
            { x: 400, y: GAME_HEIGHT - 400, width: 100, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.4, moveDistance: 200, direction: -1 },
            { x: 600, y: GAME_HEIGHT - 600, width: 100, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.4, moveDistance: 150, direction: 1 },
            { x: 800, y: GAME_HEIGHT - 750, width: 150, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 850, y: GAME_HEIGHT - 810, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 6
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 100, height: 20, color: '#607d8b', type: 'static' },
            { x: 200, y: GAME_HEIGHT - 100, width: 80, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 350, y: GAME_HEIGHT - 200, width: 80, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 500, y: GAME_HEIGHT - 300, width: 80, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 650, y: GAME_HEIGHT - 400, width: 80, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 800, y: GAME_HEIGHT - 500, width: 80, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 950, y: GAME_HEIGHT - 600, width: 100, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 980, y: GAME_HEIGHT - 660, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 7
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 150, height: 20, color: '#607d8b', type: 'static' },
            { x: 250, y: GAME_HEIGHT - 150, width: 100, height: 20, color: '#FF5722', type: 'horizontal-moving', moveSpeed: 0.6, moveDistance: 200 },
            { x: 500, y: GAME_HEIGHT - 250, width: 80, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 700, y: GAME_HEIGHT - 350, width: 100, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.5, moveDistance: 100, direction: 1 },
            { x: 850, y: GAME_HEIGHT - 500, width: 150, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 900, y: GAME_HEIGHT - 560, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 8
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 100, height: 20, color: '#607d8b', type: 'static' },
            { x: 150, y: GAME_HEIGHT - 150, width: 100, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.5, moveDistance: 150, direction: 1 },
            { x: 300, y: GAME_HEIGHT - 300, width: 100, height: 20, color: '#FF5722', type: 'horizontal-moving', moveSpeed: 0.4, moveDistance: 200, direction: -1 },
            { x: 500, y: GAME_HEIGHT - 550, width: 100, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.5, moveDistance: 150, direction: -1 },
            { x: 700, y: GAME_HEIGHT - 750, width: 100, height: 20, color: '#FF5722', type: 'horizontal-moving', moveSpeed: 0.5, moveDistance: 250, direction: 1 },
            { x: 900, y: GAME_HEIGHT - 800, width: 100, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 930, y: GAME_HEIGHT - 860, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 9
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 150, height: 20, color: '#607d8b', type: 'static' },
            { x: 250, y: GAME_HEIGHT - 150, width: 100, height: 20, color: '#FF5722', type: 'horizontal-moving', moveSpeed: 0.7, moveDistance: 300 },
            { x: 550, y: GAME_HEIGHT - 250, width: 80, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 25 },
            { x: 700, y: GAME_HEIGHT - 450, width: 100, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.6, moveDistance: 250, direction: 1 },
            { x: 850, y: GAME_HEIGHT - 600, width: 70, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 1000, y: GAME_HEIGHT - 700, width: 70, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 20 },
            { x: 1100, y: GAME_HEIGHT - 800, width: 100, height: 20, color: '#4CAF50', type: 'static' },
        ],
        goal: { x: 1130, y: GAME_HEIGHT - 860, width: 60, height: 60, color: '#FF9800', spinAngle: 0, spinSpeed: 0.05 }
    },
    // Level 10
    {
        playerStart: { x: 50, y: GAME_HEIGHT - 100 },
        platforms: [
            { x: 0, y: 0, width: GAME_WIDTH, height: 20, color: '#4CAF50', type: 'static' },
            { x: 0, y: GAME_HEIGHT - 20, width: 100, height: 20, color: '#607d8b', type: 'static' },
            { x: 150, y: GAME_HEIGHT - 70, width: 60, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 15 },
            { x: 300, y: GAME_HEIGHT - 150, width: 80, height: 20, color: '#FF5722', type: 'horizontal-moving', moveSpeed: 0.8, moveDistance: 350 },
            { x: 650, y: GAME_HEIGHT - 300, width: 70, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.7, moveDistance: 150, direction: -1 },
            { x: 800, y: GAME_HEIGHT - 450, width: 60, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 15 },
            { x: 950, y: GAME_HEIGHT - 500, width: 60, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 15 },
            { x: 1100, y: GAME_HEIGHT - 550, width: 60, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 15 },
            { x: 900, y: GAME_HEIGHT - 750, width: 80, height: 20, color: '#FF5722', type: 'vertical-moving', moveSpeed: 0.7, moveDistance: 200, direction: 1 },
            { x: 1050, y: GAME_HEIGHT - 800, width: 50, height: 20, color: '#FFC107', type: 'crumbling', decayTime: 10 },
        ],
        goal: {
    x: 1060,
    y: 30, // This new position is just below the ceiling platform
    width: 60, height: 60,
    color: '#FF9800',
    spinAngle: 0, spinSpeed: 0.05
}
    }
];

// --- Game Objects ---
const player = {
    x: 0, y: 0,
    width: 45, height: 45,
    color: '#FFD700',
    dx: 0, dy: 0,
    speed: 3.5 * 1.5,
    gravity: 0.3 * 1.5,
    bounceForce: -7 * 2,
    currentPlatform: null
};

let currentPlatforms = [];
let currentGoal = null;
let spawnVortex = null;

function loadLevel(levelIndexToLoad) {
    keys = {};
    currentLevelIndex = levelIndexToLoad;
    if (currentLevelIndex >= levels.length) {
        gameState = 'gameComplete';
        return;
    }
    const levelData = levels[currentLevelIndex];
    player.x = levelData.playerStart.x;
    player.y = levelData.playerStart.y;
    player.dx = 0;
    player.dy = 0;
    player.currentPlatform = null;
    player.width = 45;
    player.height = 45;
    currentPlatforms = [];
    levelData.platforms.forEach(pData => {
        currentPlatforms.push(new Platform( pData.x, pData.y, pData.width, pData.height, pData.color, pData.type, pData.moveSpeed, pData.direction, pData.moveDistance, pData.decayTime ));
    });
    currentPlatforms.forEach(p => p.reset());
    currentGoal = { ...levelData.goal };
    currentGoal.spinAngle = 0;
    if (gameState === 'startScreen' && currentLevelIndex === 0 && debugLevelIndex === -1) {
        gameState = 'playing';
    } else {
        gameState = 'spawning';
    }
}

function updateGame(currentTime) {
    if (gameState !== 'playing') return;
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / (1000 / 60);
    lastTime = currentTime;
    currentPlatforms.forEach(platform => platform.update(deltaTime));
    if (currentGoal) currentGoal.spinAngle += currentGoal.spinSpeed;
    const prevPlayerX = player.x;
    const prevPlayerY = player.y;
    player.dy += player.gravity;
    if (player.currentPlatform) {
        player.x += player.currentPlatform.x - player.currentPlatform.prevX;
        player.y += player.currentPlatform.y - player.currentPlatform.prevY;
    }
    const isLeftPressed = (keys['ArrowLeft'] || keys['a']);
    const isRightPressed = (keys['ArrowRight'] || keys['d']);
    if (isLeftPressed && !isRightPressed) player.x -= player.speed;
    else if (isRightPressed && !isLeftPressed) player.x += player.speed;
    player.y += player.dy;
    player.currentPlatform = null;
    currentPlatforms.forEach(platform => {
        if (!platform.active || !checkCollision(player, platform)) return;
        const playerBottom = prevPlayerY + player.height;
        if (player.dy >= 0 && playerBottom <= platform.prevY + 1) {
            player.currentPlatform = platform;
            player.dy = 0;
            player.y = platform.y - player.height;
            if (platform.type === 'crumbling') platform.playerOn = true;
        } else if (player.dy < 0 && prevPlayerY >= platform.prevY + platform.height) {
            player.dy = 0;
            player.y = platform.y + platform.height;
        } else {
            if (player.x + player.width > platform.x && prevPlayerX + player.width <= platform.prevX) {
                player.x = platform.x - player.width;
            } else if (player.x < platform.x + platform.width && prevPlayerX >= platform.prevX + platform.width) {
                player.x = platform.x + platform.width;
            }
        }
    });
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    if (currentGoal && checkCollision(player, currentGoal)) gameState = 'enteringGoal';
    if (player.y > GAME_HEIGHT) gameState = 'gameOver';
}

function gameLoop(currentTime) {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    updateFPS();
    if (gameState === 'playing') {
        updateGame(currentTime);
    } else if (gameState === 'enteringGoal') {
        if (currentGoal) currentGoal.spinAngle += currentGoal.spinSpeed * 2;
        player.width = Math.max(0, player.width - 0.5);
        player.height = Math.max(0, player.height - 0.5);
        if (currentGoal) {
            player.x += (currentGoal.x + currentGoal.width / 2 - (player.x + player.width / 2)) * 0.1;
            player.y += (currentGoal.y + currentGoal.height / 2 - (player.y + player.height / 2)) * 0.1;
        }
        if (player.width <= 1) {
            gameState = 'levelComplete';
            setTimeout(() => {
                currentLevelIndex++;
                loadLevel(currentLevelIndex);
            }, 1000);
        }
    } else if (gameState === 'spawning') {
        if (!spawnVortex) {
            spawnVortex = { x: player.x, y: player.y, width: 0, height: 0, targetWidth: player.width, targetHeight: player.height, spinAngle: 0, spinSpeed: 0.1, animationProgress: 0 };
            player.width = 0; player.height = 0; player.dx = 0; player.dy = 0;
        }
        spawnVortex.width = Math.min(spawnVortex.targetWidth * 1.5, spawnVortex.width + 2);
        spawnVortex.height = Math.min(spawnVortex.targetHeight * 1.5, spawnVortex.height + 2);
        spawnVortex.x = levels[currentLevelIndex].playerStart.x + spawnVortex.targetWidth / 2 - spawnVortex.width / 2;
        spawnVortex.y = levels[currentLevelIndex].playerStart.y + spawnVortex.targetHeight / 2 - spawnVortex.height / 2;
        spawnVortex.spinAngle += spawnVortex.spinSpeed;
        if (spawnVortex.animationProgress > 0.5) {
            player.width = Math.min(spawnVortex.targetWidth, player.width + 1.5);
            player.height = Math.min(spawnVortex.targetHeight, player.height + 1.5);
        }
        spawnVortex.animationProgress += 0.02;
        if (player.width >= spawnVortex.targetWidth && spawnVortex.animationProgress >= 1) {
            gameState = 'playing';
            spawnVortex = null;
        }
    }
    drawGameElements();
    if (gameState === 'playing' || gameState === 'enteringGoal' || gameState === 'spawning') {
        drawPlayer();
    }
    if (gameState !== 'startScreen' && gameState !== 'gameOver' && gameState !== 'gameComplete') {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`LEVEL: ${currentLevelIndex + 1}`, 20, 40);
        ctx.fillText(`FPS: ${fps}`, 20, 70);
    }
    if (gameState === 'levelComplete') {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${currentLevelIndex + 1} COMPLETE!`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Loading next level...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    } else if (gameState === 'gameComplete') {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Thanks for playing!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    // ... (code before startScreen) ...

    } else if (gameState === 'startScreen') {
        // NEW: Draw the background image instead of text instructions
        if (startScreenImage.complete && startScreenImage.naturalWidth > 0) {
            ctx.drawImage(startScreenImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            // Fallback if image doesn't load
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ASTRO-BOUNCE', GAME_WIDTH / 2, GAME_HEIGHT / 2);
            ctx.font = '24px Arial';
            ctx.fillText('Press any key to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        }
    } else if (gameState === 'gameOver') {

// ... (code after startScreen) ...
    } else if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        ctx.font = '28px Arial';
        ctx.fillText('You fell into the abyss...', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillStyle = '#FFD700';
        ctx.font = '48px Arial';
        ctx.fillText('PRESS SPACE TO RESTART', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }
    requestAnimationFrame(gameLoop);
}

function handleBounce() {
    if (gameState === 'playing' && player.currentPlatform) {
        player.dy = player.bounceForce;
        player.currentPlatform = null; 
    }
}

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'startScreen' || gameState === 'gameComplete') {
            currentLevelIndex = 0;
            loadLevel(0);
        } else if (gameState === 'gameOver') {
            loadLevel(currentLevelIndex);
        } else {
            handleBounce();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const bounceButton = document.getElementById('bounceButton');
leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowLeft'] = true; }, { passive: false });
leftButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['ArrowLeft'] = false; }, { passive: false });
rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowRight'] = true; }, { passive: false });
rightButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['ArrowRight'] = false; }, { passive: false });
bounceButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'startScreen' || gameState === 'gameOver' || gameState === 'gameComplete') {
        if (gameState !== 'playing') {
             currentLevelIndex = 0;
             loadLevel(0);
        }
    } else {
        handleBounce();
    }
}, { passive: false });

if (debugLevelIndex !== -1 && debugLevelIndex < levels.length) {
    gameState = 'playing';
    loadLevel(debugLevelIndex);
}

gameLoop(0);
