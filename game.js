// game.js

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const resultEl = document.getElementById('result');
const btnBack = document.getElementById('btn-back');
const btnPause = document.getElementById('btn-pause');

const pauseOverlay = document.getElementById('pause-overlay');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');

const btnEasy = document.getElementById('btn-start-easy');
const btnMedium = document.getElementById('btn-start-medium');
const btnHard = document.getElementById('btn-start-hard');

let gameRunning = false;
let paused = false;
let botDifficulty = 'medium';

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Config
const squareSize = 24; // size of each "square" in the 3-block character
const bulletSize = 6;
const baseY = canvas.height - 40; // floor line

// Characters: each is 3 squares: [head, body1, body2] from top to bottom
// We'll store top-left of the whole stack, and derive squares.

const player = {
  x: 100,
  y: baseY - squareSize * 3, // top of stack
  w: squareSize,
  h: squareSize * 3,
  speed: 5,
  color: '#33ccff',
  hpHead: 100,
  hpBody1: 100,
  hpBody2: 100,
  wins: 0
};

const bot = {
  x: canvas.width - 124,
  y: baseY - squareSize * 3,
  w: squareSize,
  h: squareSize * 3,
  speed: 3,
  color: '#ff3366',
  hpHead: 100,
  hpBody1: 100,
  hpBody2: 100,
  wins: 0,
  shootCooldown: 0,
  shootDelay: 40,
  reactionFrames: 20
};

let bullets = []; // {x,y,vx,vy,owner:'player'|'bot'}

let matchOver = false;
let matchWinnerText = '';

// ----------------------
// UI wiring
// ----------------------

btnEasy.addEventListener('click', () => startGame('easy'));
btnMedium.addEventListener('click', () => startGame('medium'));
btnHard.addEventListener('click', () => startGame('hard'));

btnBack.addEventListener('click', () => {
  gameRunning = false;
  paused = false;
  pauseOverlay.style.display = 'none';
  canvas.style.display = 'none';
  hud.style.display = 'none';
  menu.style.display = 'block';
  resultEl.textContent = '';
});

btnPause.addEventListener('click', () => {
  if (!gameRunning) return;
  togglePause();
});

btnResume.addEventListener('click', () => {
  if (!gameRunning) return;
  togglePause();
});

btnQuit.addEventListener('click', () => {
  gameRunning = false;
  paused = false;
  pauseOverlay.style.display = 'none';
  canvas.style.display = 'none';
  hud.style.display = 'none';
  menu.style.display = 'block';
  resultEl.textContent = '';
});

// Pause with P key
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (key === 'p' && gameRunning) {
    togglePause();
  }

  if (key === 'arrowup' || key === 'arrowdown') {
    // prevent page scroll
    e.preventDefault();
  }

  if (key === ' ' && gameRunning && !paused) {
    tryShootPlayer();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
  mouse.down = true;
  if (gameRunning && !paused) tryShootPlayer();
});

canvas.addEventListener('mouseup', () => {
  mouse.down = false;
});

// ----------------------
// Game control
// ----------------------

function togglePause() {
  paused = !paused;
  pauseOverlay.style.display = paused ? 'flex' : 'none';
}

function startGame(difficulty) {
  botDifficulty = difficulty;
  configureBot();
  menu.style.display = 'none';
  canvas.style.display = 'block';
  hud.style.display = 'flex';
  pauseOverlay.style.display = 'none';
  gameRunning = true;
  paused = false;

  player.wins = 0;
  bot.wins = 0;
  startMatch();
  requestAnimationFrame(loop);
}

function configureBot() {
  switch (botDifficulty) {
    case 'easy':
      bot.speed = 2.2;
      bot.shootDelay = 55;
      bot.reactionFrames = 35;
      break;
    case 'medium':
      bot.speed = 3.2;
      bot.shootDelay = 35;
      bot.reactionFrames = 22;
      break;
    case 'hard':
      bot.speed = 4.2;
      bot.shootDelay = 22;
      bot.reactionFrames = 10;
      break;
  }
}

function startMatch() {
  resetCharacterHP(player);
  resetCharacterHP(bot);
  player.x = 100;
  bot.x = canvas.width - 124;
  player.y = baseY - squareSize * 3;
  bot.y = baseY - squareSize * 3;
  bullets = [];
  matchOver = false;
  matchWinnerText = '';
  updateScore();
}

function resetCharacterHP(char) {
  char.hpHead = 100;
  char.hpBody1 = 100;
  char.hpBody2 = 100;
}

function updateScore() {
  // Show HP instead of wins; wins can be shown when match ends
  scoreEl.textContent =
    `You H:${Math.max(0, player.hpHead)} B1:${Math.max(0, player.hpBody1)} B2:${Math.max(0, player.hpBody2)} | ` +
    `Bot H:${Math.max(0, bot.hpHead)} B1:${Math.max(0, bot.hpBody1)} B2:${Math.max(0, bot.hpBody2)}`;
}

function endMatch(winner) {
  matchOver = true;
  if (winner === 'player') {
    player.wins++;
    matchWinnerText = 'YOU WIN THE MATCH!';
  } else if (winner === 'bot') {
    bot.wins++;
    matchWinnerText = 'BOT WINS THE MATCH!';
  } else {
    matchWinnerText = 'DRAW!';
  }

  resultEl.textContent = matchWinnerText + ` (You ${player.wins} - ${bot.wins} Bot)`;

  // Show result and go back to menu after delay
  setTimeout(() => {
    gameRunning = false;
    paused = false;
    pauseOverlay.style.display = 'none';
    canvas.style.display = 'none';
    hud.style.display = 'none';
    menu.style.display = 'block';
  }, 2000);
}

function isCharacterDead(char) {
  return char.hpHead <= 0 && char.hpBody1 <= 0 && char.hpBody2 <= 0;
}

// ----------------------
// Shooting
// ----------------------

let playerShootCooldown = 0;
const playerShootDelay = 18;

function tryShootPlayer() {
  if (!gameRunning || paused || matchOver) return;
  if (playerShootCooldown > 0) return;

  // Shoot from head square center
  const head = getHeadSquare(player);
  const cx = head.x + head.w / 2;
  const cy = head.y + head.h / 2;
  const angle = Math.atan2(mouse.y - cy, mouse.x - cx);

  const speed = 9;
  bullets.push({
    x: cx,
    y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    owner: 'player'
  });

  playerShootCooldown = playerShootDelay;
}

function botShoot() {
  if (bot.shootCooldown > 0) return;

  const head = getHeadSquare(bot);
  const cx = head.x + head.w / 2;
  const cy = head.y + head.h / 2;

  // Aim at player's head
  const pHead = getHeadSquare(player);
  const px = pHead.x + pHead.w / 2;
  const py = pHead.y + pHead.h / 2;

  const angle = Math.atan2(py - cy, px - cx);
  const inaccuracy = (botDifficulty === 'easy' ? 0.25 : botDifficulty === 'medium' ? 0.12 : 0.05);
  const finalAngle = angle + (Math.random() - 0.5) * inaccuracy;

  const speed = 8;
  bullets.push({
    x: cx,
    y: cy,
    vx: Math.cos(finalAngle) * speed,
    vy: Math.sin(finalAngle) * speed,
    owner: 'bot'
  });

  bot.shootCooldown = bot.shootDelay;
}

// ----------------------
// Helpers: squares
// ----------------------

function getHeadSquare(char) {
  return { x: char.x, y: char.y, w: char.w, h: char.h / 3 };
}
function getBody1Square(char) {
  return { x: char.x, y: char.y + char.h / 3, w: char.w, h: char.h / 3 };
}
function getBody2Square(char) {
  return { x: char.x, y: char.y + (char.h / 3) * 2, w: char.w, h: char.h / 3 };
}

function getSquares(char) {
  return [getHeadSquare(char), getBody1Square(char), getBody2Square(char)];
}

// ----------------------
// Update
// ----------------------

function update() {
  if (!gameRunning || paused) return;

  // Player movement: Up/Down arrows
  if (keys['arrowup']) player.y -= player.speed;
  if (keys['arrowdown']) player.y += player.speed;

  // Clamp player to floor/ceiling
  const minY = 20;
  const maxY = baseY - player.h;
  if (player.y < minY) player.y = minY;
  if (player.y > maxY) player.y = maxY;

  // Player shoot cooldown
  if (playerShootCooldown > 0) playerShootCooldown--;

  // Bot AI
  updateBot();

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;

    // Remove if out of bounds
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }

    // Check collision with player squares
    if (b.owner === 'bot') {
      const squares = getSquares(player);
      let hit = false;
      squares.forEach((sq, idx) => {
        if (hit) return;
        if (rectCircleCollide(sq, b)) {
          bullets.splice(i, 1);
          hit = true;
          // Apply damage based on which square
          if (idx === 0) player.hpHead -= 25;
          else if (idx === 1) player.hpBody1 -= 10;
          else if (idx === 2) player.hpBody2 -= 10;

          if (isCharacterDead(player)) {
            endMatch('bot');
          }
          updateScore();
        }
      });
      if (hit) return;
    }

    // Check collision with bot squares
    if (b.owner === 'player') {
      const squares = getSquares(bot);
      let hit = false;
      squares.forEach((sq, idx) => {
        if (hit) return;
        if (rectCircleCollide(sq, b)) {
          bullets.splice(i, 1);
          hit = true;
          if (idx === 0) bot.hpHead -= 25;
          else if (idx === 1) bot.hpBody1 -= 10;
          else if (idx === 2) bot.hpBody2 -= 10;

          if (isCharacterDead(bot)) {
            endMatch('player');
          }
          updateScore();
        }
      });
      if (hit) return;
    }
  }

  // Bot cooldowns
  if (bot.shootCooldown > 0) bot.shootCooldown--;
}

function rectCircleCollide(rect, circle) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx * dx + dy * dy) <= (bulletSize * bulletSize);
}

// ----------------------
// Bot AI
// ----------------------

let botThinkCooldown = 0;
let botTargetY = 0;

function updateBot() {
  if (matchOver) return;

  const bHead = getHeadSquare(bot);
  const pHead = getHeadSquare(player);
  const cx = bHead.x + bHead.w / 2;
  const cy = bHead.y + bHead.h / 2;
  const px = pHead.x + pHead.w / 2;
  const py = pHead.y + pHead.h / 2;

  // Movement: move vertically to align with player with some delay
  if (botThinkCooldown <= 0) {
    botTargetY = player.y + (Math.random() - 0.5) * 40;
    botThinkCooldown = bot.reactionFrames;
  } else {
    botThinkCooldown--;
  }

  const botCenterY = bot.y + bot.h / 2;
  if (botCenterY < botTargetY - 10) {
    bot.y += bot.speed;
  } else if (botCenterY > botTargetY + 10) {
    bot.y -= bot.speed;
  }

  // Clamp bot
  const minY = 20;
  const maxY = baseY - bot.h;
  if (bot.y < minY) bot.y = minY;
  if (bot.y > maxY) bot.y = maxY;

  // Shooting: if roughly same vertical level and player is to the left
  const angleToPlayer = Math.atan2(py - cy, px - cx);
  const horizontalAngle = Math.cos(angleToPlayer);

  // Only shoot when player is to the left and not too far vertically
  if (horizontalAngle < -0.2 && Math.abs(py - cy) < 120) {
    botShoot();
  }
}

// ----------------------
// Draw
// ----------------------

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawCharacter(char, color) {
  const [head, body1, body2] = getSquares(char);
  // Slight outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;

  [head, body1, body2].forEach(sq => {
    drawRect(sq.x, sq.y, sq.w, sq.h, color);
    ctx.strokeRect(sq.x, sq.y, sq.w, sq.h);
  });
}

function draw() {
  // Background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floor line
  ctx.strokeStyle = '#222244';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(canvas.width, baseY);
  ctx.stroke();

  // Characters
  drawCharacter(player, player.color);
  drawCharacter(bot, bot.color);

  // Bullets
  for (const b of bullets) {
    drawCircle(b.x, b.y, bulletSize, b.owner === 'player' ? '#88ffff' : '#ff88aa');
  }

  // Match over overlay
  if (matchOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(matchWinnerText, canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(loop);
}