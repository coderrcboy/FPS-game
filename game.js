// Get elements from HTML
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const pauseScreen = document.getElementById('pause-screen');

const hpText = document.getElementById('hp-text');
const resultText = document.getElementById('result-text');

const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');

const btnPause = document.getElementById('btn-pause');
const btnBack = document.getElementById('btn-back');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');

// Game state
let gameRunning = false;
let paused = false;
let difficulty = 'medium';

// Input
const keys = {};
const mouse = { x: 0, y: 0 };

// Sizes
const squareSize = 24;
const bulletSize = 6;
const floorY = canvas.height - 40;

// Player
const player = {
  x: 100,
  y: floorY - squareSize * 3,
  w: squareSize,
  h: squareSize * 3,
  speed: 5,
  color: '#33ccff',
  hp: 200
};

// Bot
const bot = {
  x: canvas.width - 124,
  y: floorY - squareSize * 3,
  w: squareSize,
  h: squareSize * 3,
  speed: 3,
  color: '#ff3366',
  hp: 200,
  shootWait: 0,
  shootDelay: 40,
  thinkWait: 0,
  thinkDelay: 20,
  targetY: 0
};

// Bullets
let bullets = [];

// Player shoot cooldown
let playerShootWait = 0;
const playerShootDelay = 18;

// ----------------------
// Button clicks
// ----------------------

btnEasy.addEventListener('click', function() {
  startGame('easy');
});

btnMedium.addEventListener('click', function() {
  startGame('medium');
});

btnHard.addEventListener('click', function() {
  startGame('hard');
});

btnBack.addEventListener('click', function() {
  gameRunning = false;
  menu.style.display = 'block';
  canvas.style.display = 'none';
  hud.style.display = 'none';
  pauseScreen.style.display = 'none';
  resultText.textContent = '';
});

btnPause.addEventListener('click', function() {
  if (!gameRunning) return;
  paused = !paused;
  if (paused) {
    pauseScreen.style.display = 'flex';
  } else {
    pauseScreen.style.display = 'none';
  }
});

btnResume.addEventListener('click', function() {
  paused = false;
  pauseScreen.style.display = 'none';
});

btnQuit.addEventListener('click', function() {
  gameRunning = false;
  menu.style.display = 'block';
  canvas.style.display = 'none';
  hud.style.display = 'none';
  pauseScreen.style.display = 'none';
  resultText.textContent = '';
});

// ----------------------
// Start game
// ----------------------

function startGame(diff) {
  difficulty = diff;

  // Bot settings
  if (difficulty === 'easy') {
    bot.speed = 2.2;
    bot.shootDelay = 55;
    bot.thinkDelay = 35;
  } else if (difficulty === 'medium') {
    bot.speed = 3.2;
    bot.shootDelay = 35;
    bot.thinkDelay = 22;
  } else if (difficulty === 'hard') {
    bot.speed = 4.2;
    bot.shootDelay = 22;
    bot.thinkDelay = 10;
  }

  // Reset HP
  player.hp = 200;
  bot.hp = 200;

  // Reset positions
  player.x = 100;
  player.y = floorY - squareSize * 3;
  bot.x = canvas.width - 124;
  bot.y = floorY - squareSize * 3;

  bullets = [];
  playerShootWait = 0;
  bot.shootWait = 0;

  // Show game
  menu.style.display = 'none';
  canvas.style.display = 'block';
  hud.style.display = 'flex';
  pauseScreen.style.display = 'none';

  gameRunning = true;
  paused = false;
  updateHpText();

  requestAnimationFrame(gameLoop);
}

// ----------------------
// Keys and mouse
// ----------------------

window.addEventListener('keydown', function(e) {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (key === 'p' && gameRunning) {
    paused = !paused;
    if (paused) {
      pauseScreen.style.display = 'flex';
    } else {
      pauseScreen.style.display = 'none';
    }
  }

  if (key === ' ' && gameRunning && !paused) {
    playerShoot();
  }

  if (key === 'arrowup' || key === 'arrowdown') {
    e.preventDefault();
  }
});

window.addEventListener('keyup', function(e) {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', function() {
  if (gameRunning && !paused) {
    playerShoot();
  }
});

// ----------------------
// Shooting
// ----------------------

function playerShoot() {
  if (playerShootWait > 0) return;

  const headH = player.h / 3;
  const cx = player.x + player.w / 2;
  const cy = player.y + headH / 2;

  const angle = Math.atan2(mouse.y - cy, mouse.x - cx);
  const speed = 9;

  bullets.push({
    x: cx,
    y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    from: 'player'
  });

  playerShootWait = playerShootDelay;
}

function botShoot() {
  if (bot.shootWait > 0) return;

  const headH = bot.h / 3;
  const cx = bot.x + bot.w / 2;
  const cy = bot.y + headH / 2;

  const pHeadH = player.h / 3;
  const px = player.x + player.w / 2;
  const py = player.y + pHeadH / 2;

  const angle = Math.atan2(py - cy, px - cx);

  let error = 0.1;
  if (difficulty === 'easy') error = 0.25;
  if (difficulty === 'hard') error = 0.05;

  const finalAngle = angle + (Math.random() - 0.5) * error;
  const speed = 8;

  bullets.push({
    x: cx,
    y: cy,
    vx: Math.cos(finalAngle) * speed,
    vy: Math.sin(finalAngle) * speed,
    from: 'bot'
  });

  bot.shootWait = bot.shootDelay;
}

// ----------------------
// Update
// ----------------------

function update() {
  if (!gameRunning || paused) return;

  // Player move
  if (keys['arrowup']) player.y -= player.speed;
  if (keys['arrowdown']) player.y += player.speed;

  // Keep player on screen
  const minY = 20;
  const maxY = floorY - player.h;
  if (player.y < minY) player.y = minY;
  if (player.y > maxY) player.y = maxY;

  // Player shoot cooldown
  if (playerShootWait > 0) playerShootWait--;

  // Bot
  updateBot();

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;

    // Off screen
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }

    // Hit player?
    if (b.from === 'bot') {
      if (checkHitPlayer(b)) {
        bullets.splice(i, 1);
        continue;
      }
    }

    // Hit bot?
    if (b.from === 'player') {
      if (checkHitBot(b)) {
        bullets.splice(i, 1);
        continue;
      }
    }
  }

  // Bot shoot cooldown
  if (bot.shootWait > 0) bot.shootWait--;
}

// ----------------------
// Bot logic
// ----------------------

function updateBot() {
  if (bot.thinkWait <= 0) {
    bot.targetY = player.y + (Math.random() - 0.5) * 40;
    bot.thinkWait = bot.thinkDelay;
  } else {
    bot.thinkWait--;
  }

  const botCenter = bot.y + bot.h / 2;
  if (botCenter < bot.targetY - 10) {
    bot.y += bot.speed;
  } else if (botCenter > bot.targetY + 10) {
    bot.y -= bot.speed;
  }

  const minY = 20;
  const maxY = floorY - bot.h;
  if (bot.y < minY) bot.y = minY;
  if (bot.y > maxY) bot.y = maxY;

  const headH = bot.h / 3;
  const cx = bot.x + bot.w / 2;
  const cy = bot.y + headH / 2;

  const pHeadH = player.h / 3;
  const px = player.x + player.w / 2;
  const py = player.y + pHeadH / 2;

  const dx = px - cx;
  const dy = py - cy;

  if (dx < -20 && Math.abs(dy) < 120) {
    botShoot();
  }
}

// ----------------------
// Hit checking
// ----------------------

function checkHitPlayer(bullet) {
  const headH = player.h / 3;

  const head = { x: player.x, y: player.y, w: player.w, h: headH };
  const body1 = { x: player.x, y: player.y + headH, w: player.w, h: headH };
  const body2 = { x: player.x, y: player.y + headH * 2, w: player.w, h: headH };

  if (rectCircleHit(head, bullet)) {
    player.hp -= 25;
    updateHpText();
    checkDeath();
    return true;
  }
  if (rectCircleHit(body1, bullet)) {
    player.hp -= 10;
    updateHpText();
    checkDeath();
    return true;
  }
  if (rectCircleHit(body2, bullet)) {
    player.hp -= 10;
    updateHpText();
    checkDeath();
    return true;
  }

  return false;
}

function checkHitBot(bullet) {
  const headH = bot.h / 3;

  const head = { x: bot.x, y: bot.y, w: bot.w, h: headH };
  const body1 = { x: bot.x, y: bot.y + headH, w: bot.w, h: headH };
  const body2 = { x: bot.x, y: bot.y + headH * 2, w: bot.w, h: headH };

  if (rectCircleHit(head, bullet)) {
    bot.hp -= 25;
    updateHpText();
    checkDeath();
    return true;
  }
  if (rectCircleHit(body1, bullet)) {
    bot.hp -= 10;
    updateHpText();
    checkDeath();
    return true;
  }
  if (rectCircleHit(body2, bullet)) {
    bot.hp -= 10;
    updateHpText();
    checkDeath();
    return true;
  }

  return false;
}

function rectCircleHit(rect, circle) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx * dx + dy * dy) <= (bulletSize * bulletSize);
}

function checkDeath() {
  if (player.hp <= 0) {
    endGame('Bot wins!');
  } else if (bot.hp <= 0) {
    endGame('You win!');
  }
}

function updateHpText() {
  hpText.textContent = 'You: ' + Math.max(0, player.hp) + ' | Bot: ' + Math.max(0, bot.hp);
}

function endGame(text) {
  gameRunning = false;
  resultText.textContent = text;
  menu.style.display = 'block';
  canvas.style.display = 'none';
  hud.style.display = 'none';
  pauseScreen.style.display = 'none';
}

// ----------------------
// Draw
// ----------------------

function draw() {
  // Background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floor
  ctx.strokeStyle = '#222244';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(canvas.width, floorY);
  ctx.stroke();

  // Draw player and bot
  drawCharacter(player, player.color);
  drawCharacter(bot, bot.color);

  // Draw bullets
  for (const b of bullets) {
    ctx.fillStyle = b.from === 'player' ? '#88ffff' : '#ff88aa';
    ctx.beginPath();
    ctx.arc(b.x, b.y, bulletSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCharacter(char, color) {
  const headH = char.h / 3;

  // Head
  ctx.fillStyle = color;
  ctx.fillRect(char.x, char.y, char.w, headH);

  // Body 1
  ctx.fillRect(char.x, char.y + headH, char.w, headH);

  // Body 2
  ctx.fillRect(char.x, char.y + headH * 2, char.w, headH);
}

// ----------------------
// Game loop
// ----------------------

function gameLoop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}