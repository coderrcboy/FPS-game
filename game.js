// Get elements
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const pauseScreen = document.getElementById('pause-screen');

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
const squareSize = 30;
const bulletSize = 6;
const floorY = canvas.height - 60;
const maxBounces = 3; // how many times a bullet can bounce

// Map: list of rectangles {x, y, w, h}
const walls = [
  { x: 300, y: 200, w: 40, h: 250 },
  { x: 500, y: 100, w: 40, h: 180 },
  { x: 500, y: 420, w: 40, h: 180 },
  { x: 750, y: 250, w: 40, h: 250 },
  { x: 900, y: 120, w: 40, h: 140 },
  { x: 900, y: 460, w: 40, h: 140 }
];

// Player
const player = {
  x: 120,
  y: floorY - squareSize * 3,
  w: squareSize,
  h: squareSize * 3,
  speed: 6,
  color: '#33ccff',
  hp: 200,
  maxHp: 200
};

// Bot
const bot = {
  x: canvas.width - 120 - squareSize,
  y: floorY - squareSize * 3,
  w: squareSize,
  h: squareSize * 3,
  speed: 4,
  color: '#ff3366',
  hp: 200,
  maxHp: 200,
  shootWait: 0,
  shootDelay: 40,
  moveWait: 0,
  moveDelay: 15,
  targetX: 0,
  targetY: 0
};

// Bullets
let bullets = [];

// Player shoot cooldown
let playerShootWait = 0;
const playerShootDelay = 18;

// ----------------------
// Buttons
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

  // Bot settings by difficulty
  if (difficulty === 'easy') {
    bot.speed = 3;
    bot.shootDelay = 60;
    bot.moveDelay = 25;
  } else if (difficulty === 'medium') {
    bot.speed = 4.5;
    bot.shootDelay = 35;
    bot.moveDelay = 15;
  } else if (difficulty === 'hard') {
    bot.speed = 6.5;
    bot.shootDelay = 20;
    bot.moveDelay = 8;
  }

  // Reset HP
  player.hp = player.maxHp;
  bot.hp = bot.maxHp;

  // Reset positions
  player.x = 120;
  player.y = floorY - squareSize * 3;
  bot.x = canvas.width - 120 - squareSize;
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

  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
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
  const speed = 10;

  bullets.push({
    x: cx,
    y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    from: 'player',
    bounces: 0
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

  let error = 0.12;
  if (difficulty === 'easy') error = 0.3;
  if (difficulty === 'hard') error = 0.04;

  const finalAngle = angle + (Math.random() - 0.5) * error;
  const speed = 9;

  bullets.push({
    x: cx,
    y: cy,
    vx: Math.cos(finalAngle) * speed,
    vy: Math.sin(finalAngle) * speed,
    from: 'bot',
    bounces: 0
  });

  bot.shootWait = bot.shootDelay;
}

// ----------------------
// Collision helpers
// ----------------------

function rectRectHit(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function rectCircleHit(rect, circle) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx * dx + dy * dy) <= (bulletSize * bulletSize);
}

function moveWithCollisions(char, newX, newY) {
  const testRect = { x: newX, y: newY, w: char.w, h: char.h };

  for (const w of walls) {
    if (rectRectHit(testRect, w)) {
      return false;
    }
  }

  if (newX < 0 || newY < 0 ||
      newX + char.w > canvas.width ||
      newY + char.h > canvas.height) {
    return false;
  }

  char.x = newX;
  char.y = newY;
  return true;
}

function hasLineOfSight(x1, y1, x2, y2) {
  const steps = 20;
  const dx = (x2 - x1) / steps;
  const dy = (y2 - y1) / steps;

  let x = x1;
  let y = y1;

  for (let i = 0; i <= steps; i++) {
    const pointRect = { x: x - 2, y: y - 2, w: 4, h: 4 };
    for (const w of walls) {
      if (rectRectHit(pointRect, w)) {
        return false;
      }
    }
    x += dx;
    y += dy;
  }
  return true;
}

// ----------------------
// Update
// ----------------------

function update() {
  if (!gameRunning || paused) return;

  // Player move
  let newPX = player.x;
  let newPY = player.y;

  if (keys['arrowleft'])  newPX -= player.speed;
  if (keys['arrowright']) newPX += player.speed;
  if (keys['arrowup'])    newPY -= player.speed;
  if (keys['arrowdown'])  newPY += player.speed;

  moveWithCollisions(player, newPX, player.y);
  moveWithCollisions(player, player.x, newPY);

  if (playerShootWait > 0) playerShootWait--;

  // Bot AI
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

    // Bullet hits wall? -> ricochet
    let hitWall = false;
    const bulletRect = { x: b.x - bulletSize, y: b.y - bulletSize, w: bulletSize*2, h: bulletSize*2 };

    for (const w of walls) {
      if (rectRectHit(bulletRect, w)) {
        hitWall = true;

        // Decide bounce direction: check overlap on each axis
        const prevX = b.x - b.vx;
        const prevY = b.y - b.vy;
        const wasLeft  = prevX < w.x;
        const wasRight = prevX > w.x + w.w;
        const wasAbove = prevY < w.y;
        const wasBelow = prevY > w.y + w.h;

        // If mostly horizontal collision, flip vx; else flip vy
        if ((wasLeft || wasRight) && !(wasAbove || wasBelow)) {
          b.vx = -b.vx;
        } else {
          b.vy = -b.vy;
        }

        b.bounces++;
        if (b.bounces >= maxBounces) {
          bullets.splice(i, 1);
        }
        break;
      }
    }

    if (hitWall) {
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

  if (bot.shootWait > 0) bot.shootWait--;
}

// ----------------------
// Bot AI
// ----------------------

function updateBot() {
  const botCx = bot.x + bot.w / 2;
  const botCy = bot.y + bot.h / 2;

  const pCx = player.x + player.w / 2;
  const pCy = player.y + player.h / 2;

  if (bot.moveWait <= 0) {
    const distX = pCx - botCx;
    const distY = pCy - botCy;

    let wantX = botCx;
    let wantY = botCy;

    if (Math.abs(distX) < 250) {
      if (distX > 0) wantX -= 150;
      else wantX += 150;
    } else {
      if (distX > 0) wantX += 120;
      else wantX -= 120;
    }

    wantY = pCy + (Math.random() - 0.5) * 80;

    if (wantX < 50) wantX = 50;
    if (wantX > canvas.width - 50) wantX = canvas.width - 50;
    if (wantY < 50) wantY = 50;
    if (wantY > canvas.height - 50) wantY = canvas.height - 50;

    bot.targetX = wantX;
    bot.targetY = wantY;

    bot.moveWait = bot.moveDelay;
  } else {
    bot.moveWait--;
  }

  let newBX = bot.x;
  let newBY = bot.y;

  if (botCx < bot.targetX - 10) {
    newBX += bot.speed;
  } else if (botCx > bot.targetX + 10) {
    newBX -= bot.speed;
  }

  if (botCy < bot.targetY - 10) {
    newBY += bot.speed;
  } else if (botCy > bot.targetY + 10) {
    newBY -= bot.speed;
  }

  moveWithCollisions(bot, newBX, bot.y);
  moveWithCollisions(bot, bot.x, newBY);

  const headH = bot.h / 3;
  const cx = bot.x + bot.w / 2;
  const cy = bot.y + headH / 2;

  const pHeadH = player.h / 3;
  const px = player.x + player.w / 2;
  const py = player.y + pHeadH / 2;

  const dx = px - cx;
  const dy = py - cy;

  const angleOk = dx < -20 && Math.abs(dy) < 140;
  let canSee = hasLineOfSight(cx, cy, px, py);

  if (difficulty === 'easy') {
    canSee = canSee || Math.random() < 0.3;
  } else if (difficulty === 'medium') {
    canSee = canSee || Math.random() < 0.15;
  }

  if (angleOk && canSee) {
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
    checkDeath();
    return true;
  }
  if (rectCircleHit(body1, bullet)) {
    player.hp -= 10;
    checkDeath();
    return true;
  }
  if (rectCircleHit(body2, bullet)) {
    player.hp -= 10;
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
    checkDeath();
    return true;
  }
  if (rectCircleHit(body1, bullet)) {
    bot.hp -= 10;
    checkDeath();
    return true;
  }
  if (rectCircleHit(body2, bullet)) {
    bot.hp -= 10;
    checkDeath();
    return true;
  }

  return false;
}

function checkDeath() {
  if (player.hp <= 0) {
    endGame('Bot wins!');
  } else if (bot.hp <= 0) {
    endGame('You win!');
  }
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

  // Walls
  ctx.fillStyle = '#555577';
  for (const w of walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#7777aa';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // Floor line
  ctx.strokeStyle = '#222244';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(canvas.width, floorY);
  ctx.stroke();

  // Characters with HP bars
  drawCharacterWithHp(player, player.color);
  drawCharacterWithHp(bot, bot.color);

  // Bullets
  for (const b of bullets) {
    // Color changes slightly after bounces
    let color;
    if (b.from === 'player') {
      color = b.bounces === 0 ? '#88ffff' : '#44cccc';
    } else {
      color = b.bounces === 0 ? '#ff88aa' : '#cc4466';
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, bulletSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCharacterWithHp(char, color) {
  const barWidth = char.w + 20;
  const barHeight = 8;
  const barX = char.x - 10;
  const barY = char.y - 18;

  // Background
  ctx.fillStyle = '#333333';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Health
  const hpPercent = char.hp / char.maxHp;
  const hpWidth = barWidth * hpPercent;
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(barX, barY, hpWidth, barHeight);

  // HP text
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(char.hp, barX + barWidth / 2, barY - 4);

  // 3 squares
  const headH = char.h / 3;

  ctx.fillStyle = color;
  ctx.fillRect(char.x, char.y, char.w, headH);
  ctx.fillRect(char.x, char.y + headH, char.w, headH);
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
