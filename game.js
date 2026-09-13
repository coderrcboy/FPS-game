const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");


const menu = document.querySelector("#menu");
const hud = document.querySelector("#hud");
const pauseScreen = document.querySelector("#pause-screen");
const resultText = document.querySelector("#result-text");
//choose games diff. settings
const easyButton = document.querySelector("#btn-easy");
const mediumButton = document.querySelector("#btn-medium");
const hardButton = document.querySelector("#btn-hard");
//gui inside game
const pauseButton = document.querySelector("#btn-pause");
const backButton = document.querySelector("#btn-back");
const resumeButton = document.querySelector("#btn-resume");
const quitButton = document.querySelector("#btn-quit");

// Mode toggle elements
const radioBot = document.querySelector("#radio-bot");
const radio2p = document.querySelector("#radio-2p");
const diffSection = document.querySelector("#diff-section");
const p2Section = document.querySelector("#p2-section");
const start2pButton = document.querySelector("#btn-start-2p");

// Settings elements
const volumeSlider = document.querySelector("#volume-slider");
const eraSlider = document.querySelector("#era-slider");

// Preloading Theme Assets with error/load handlers
const images = {
  cavemanAvatar: { img: new Image(), loaded: false },
  cavemanBg: { img: new Image(), loaded: false },
  shipAvatar: { img: new Image(), loaded: false },
  spaceBg: { img: new Image(), loaded: false }
};

images.cavemanAvatar.img.onload = () => { images.cavemanAvatar.loaded = true; };
images.cavemanAvatar.img.src = "caveman.png";

images.cavemanBg.img.onload = () => { images.cavemanBg.loaded = true; };
images.cavemanBg.img.src = "cavemanera.jpeg";

images.shipAvatar.img.onload = () => { images.shipAvatar.loaded = true; };
images.shipAvatar.img.src = "ship.png";

images.spaceBg.img.onload = () => { images.spaceBg.loaded = true; };
images.spaceBg.img.src = "space.jpeg";

radioBot.addEventListener("change", () => {
  diffSection.style.display = "block";
  p2Section.style.display = "none";
});

radio2p.addEventListener("change", () => {
  diffSection.style.display = "none";
  p2Section.style.display = "block";
});

start2pButton.addEventListener("click", () => {
  startGame("medium");
});


const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const BORDER_PADDING = 6; // Accounts for outer arena border stroke
const CHARACTER_SIZE = 30;
const BULLET_RADIUS = 6; //bullet size
const MAX_BOUNCES = 3; //max bounces of bullet
const PLAYER_SHOOT_DELAY = 18; //reload/recoil time ig??
const FLOOR_Y = GAME_HEIGHT - 60; // Strict boundary stopping entities above HUD


let gameRunning = false;
let paused = false;
let difficulty = "medium";
let bullets = [];
let playerShootWait = 0;
let isTwoPlayer = false;

// Audio setup
const shootSound = new Audio("gun.mp3");
function playShootSound() {
  shootSound.currentTime = 0;
  shootSound.volume = parseFloat(volumeSlider.value);
  shootSound.play().catch(() => {});
}


const keys = {};
const mouse = {
  x: 0,
  y: 0
};
//boundaries
let walls = [];

const OBSTACLE_COLORS = [
  "#555577", "#8844aa", "#228899", "#aa5533",
  "#448855", "#aa3366", "#777733", "#3355aa"
];

function generateRandomWalls() {
  walls = [];
  const targetWallCount = Math.floor(Math.random() * 12) + 4; // 4 to 15 obstacles

  const playerSpawn = { x: 40, y: 40, w: 220, h: FLOOR_Y - 80 };
  const botSpawn = { x: GAME_WIDTH - 260, y: 40, w: 220, h: FLOOR_Y - 80 };

  let attempts = 0;
  while (walls.length < targetWallCount && attempts < 200) {
    attempts++;

    const width = Math.floor(Math.random() * 60) + 25;
    const height = Math.floor(Math.random() * 120) + 50;
    
    const x = Math.floor(Math.random() * (GAME_WIDTH - 500)) + 250;
    const y = Math.floor(Math.random() * (FLOOR_Y - height - 40)) + 20;

    const candidateWall = {
      x: x,
      y: y,
      w: width,
      h: height,
      color: OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)]
    };

    // Check overlaps with player/bot spawns
    if (rectRectHit(candidateWall, playerSpawn) || rectRectHit(candidateWall, botSpawn)) {
      continue;
    }

    // Check non-overlapping against existing generated walls with margin
    let overlapsExisting = false;
    for (const wall of walls) {
      const paddedWall = {
        x: wall.x - 10,
        y: wall.y - 10,
        w: wall.w + 20,
        h: wall.h + 20
      };
      if (rectRectHit(candidateWall, paddedWall)) {
        overlapsExisting = true;
        break;
      }
    }

    if (!overlapsExisting) {
      walls.push(candidateWall);
    }
  }
}

//colors of the player/bot and other features
const player = {
  x: 120,
  y: FLOOR_Y - CHARACTER_SIZE * 3,
  w: CHARACTER_SIZE,
  h: CHARACTER_SIZE * 3,
  speed: 6,
  color: "#33ccff",
  hp: 200,
  maxHp: 200
};


const bot = {
  x: GAME_WIDTH - 120 - CHARACTER_SIZE,
  y: FLOOR_Y - CHARACTER_SIZE * 3,
  w: CHARACTER_SIZE,
  h: CHARACTER_SIZE * 3,
  speed: 4.5,
  color: "#ff3366",
  hp: 200,
  maxHp: 200,
  shootWait: 0,
  shootDelay: 35,
  moveWait: 0,
  moveDelay: 15,
  targetX: 0,
  targetY: 0,
  vx: 0,
  vy: 0
};
//some code for the game and buttons to work or smthg
easyButton.addEventListener("click", () => {
  startGame("easy");
});


mediumButton.addEventListener("click", () => {
  startGame("medium");
});


hardButton.addEventListener("click", () => {
  startGame("hard");
});


backButton.addEventListener("click", returnToMenu);
quitButton.addEventListener("click", returnToMenu);


pauseButton.addEventListener("click", togglePause);


resumeButton.addEventListener("click", () => {
  paused = false;
  pauseScreen.style.display = "none";
});


window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;


  if (key === "p" && gameRunning) {
    togglePause();
  }


  if (key === " " && gameRunning && !paused) {
    playerShoot();
  }

  if ((key === "enter" || key === "shift") && gameRunning && !paused && isTwoPlayer) {
    player2Shoot();
  }


  if ([
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "w", "a", "s", "d"
  ].includes(key)) {
    event.preventDefault();
  }
});


window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});


canvas.addEventListener("mousemove", (event) => {
  const rectangle = canvas.getBoundingClientRect();


  mouse.x = (
    (event.clientX - rectangle.left) / rectangle.width
  ) * GAME_WIDTH;


  mouse.y = (
    (event.clientY - rectangle.top) / rectangle.height
  ) * GAME_HEIGHT;
});


canvas.addEventListener("mousedown", () => {
  if (gameRunning && !paused) {
    playerShoot();
  }
});


function startGame(selectedDifficulty) {
  isTwoPlayer = radio2p.checked;

  difficulty = selectedDifficulty;
  setBotDifficulty();
  generateRandomWalls();


  player.hp = player.maxHp;
  bot.hp = bot.maxHp;


  player.x = 120;
  player.y = FLOOR_Y - CHARACTER_SIZE * 3;


  bot.x = GAME_WIDTH - 120 - CHARACTER_SIZE;
  bot.y = FLOOR_Y - CHARACTER_SIZE * 3;
  bot.targetX = bot.x;
  bot.targetY = bot.y;


  bullets = [];
  playerShootWait = 0;
  bot.shootWait = 0;
  bot.moveWait = 0;


  menu.style.display = "none";
  canvas.style.display = "block";
  hud.style.display = "flex";
  pauseScreen.style.display = "none";


  gameRunning = true;
  paused = false;


  requestAnimationFrame(gameLoop);
}
//bots settings based on diff.
function setBotDifficulty() {
  if (difficulty === "easy") {
    bot.speed = 3.5;
    bot.shootDelay = 55;
    bot.moveDelay = 20;
  }


  if (difficulty === "medium") {
    bot.speed = 5.0;
    bot.shootDelay = 30;
    bot.moveDelay = 12;
  }


  if (difficulty === "hard") {
    bot.speed = 6.5;
    bot.shootDelay = 18;
    bot.moveDelay = 6;
  }
}


function returnToMenu() {
  gameRunning = false;
  paused = false;


  menu.style.display = "block";
  canvas.style.display = "none";
  hud.style.display = "none";
  pauseScreen.style.display = "none";
  resultText.textContent = "";
}


function togglePause() {
  if (!gameRunning) {
    return;
  }


  paused = !paused;
  pauseScreen.style.display = paused ? "flex" : "none";
}


function playerShoot() {
  if (playerShootWait > 0) {
    return;
  }


  const headHeight = player.h / 3;
  const startX = player.x + player.w / 2;
  const startY = player.y + headHeight / 2;
  const angle = Math.atan2(mouse.y - startY, mouse.x - startX);


  bullets.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * 10,
    vy: Math.sin(angle) * 10,
    from: "player",
    bounces: 0
  });

  playShootSound();
  playerShootWait = PLAYER_SHOOT_DELAY;
}

function player2Shoot() {
  if (bot.shootWait > 0) {
    return;
  }

  const startX = bot.x + bot.w / 2;
  const startY = bot.y + (bot.h / 6);
  const targetX = player.x + player.w / 2;
  const targetY = player.y + (player.h / 6);

  const angle = Math.atan2(targetY - startY, targetX - startX);

  bullets.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * 10,
    vy: Math.sin(angle) * 10,
    from: "bot",
    bounces: 0
  });

  playShootSound();
  bot.shootWait = PLAYER_SHOOT_DELAY;
}


function botShoot() {
  if (bot.shootWait > 0) {
    return;
  }


  const botHeadHeight = bot.h / 3;
  const startX = bot.x + bot.w / 2;
  const startY = bot.y + botHeadHeight / 2;

  // Predictive leading algorithm
  const targetX = player.x + player.w / 2;
  const targetY = player.y + (player.h / 3) / 2;

  const angle = Math.atan2(targetY - startY, targetX - startX);
  let aimingError = difficulty === "easy" ? 0.25 : (difficulty === "medium" ? 0.10 : 0.02);

  const finalAngle = angle + (Math.random() - 0.5) * aimingError;


  bullets.push({
    x: startX,
    y: startY,
    vx: Math.cos(finalAngle) * 9.5,
    vy: Math.sin(finalAngle) * 9.5,
    from: "bot",
    bounces: 0
  });

  playShootSound();
  bot.shootWait = bot.shootDelay;
}


function update() {
  if (!gameRunning || paused) {
    return;
  }


  let nextPlayerX = player.x;
  let nextPlayerY = player.y;


  if (keys.a || (!isTwoPlayer && keys.arrowleft)) {
    nextPlayerX -= player.speed;
  }


  if (keys.d || (!isTwoPlayer && keys.arrowright)) {
    nextPlayerX += player.speed;
  }


  if (keys.w || (!isTwoPlayer && keys.arrowup)) {
    nextPlayerY -= player.speed;
  }


  if (keys.s || (!isTwoPlayer && keys.arrowdown)) {
    nextPlayerY += player.speed;
  }


  moveWithCollisions(player, nextPlayerX, player.y);
  moveWithCollisions(player, player.x, nextPlayerY);


  if (playerShootWait > 0) {
    playerShootWait--;
  }


  if (isTwoPlayer) {
    updatePlayer2();
  } else {
    updateBot();
  }

  updateBullets();


  if (bot.shootWait > 0) {
    bot.shootWait--;
  }
}

function updatePlayer2() {
  let nextBotX = bot.x;
  let nextBotY = bot.y;

  if (keys.arrowleft) nextBotX -= bot.speed;
  if (keys.arrowright) nextBotX += bot.speed;
  if (keys.arrowup) nextBotY -= bot.speed;
  if (keys.arrowdown) nextBotY += bot.speed;

  moveWithCollisions(bot, nextBotX, bot.y);
  moveWithCollisions(bot, bot.x, nextBotY);
}


function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];


    bullet.x += bullet.vx;
    bullet.y += bullet.vy;


    if (
      bullet.x < BORDER_PADDING ||
      bullet.x > GAME_WIDTH - BORDER_PADDING ||
      bullet.y < BORDER_PADDING ||
      bullet.y > FLOOR_Y
    ) {
      bullets.splice(i, 1);
      continue;
    }


    if (bounceOffWall(bullet)) {
      if (bullet.bounces >= MAX_BOUNCES) {
        bullets.splice(i, 1);
      }


      continue;
    }


    if (bullet.from === "bot" && checkHitPlayer(bullet)) {
      bullets.splice(i, 1);
      continue;
    }


    if (bullet.from === "player" && checkHitBot(bullet)) {
      bullets.splice(i, 1);
    }
  }
}


function updateBot() {
  const botCenterX = bot.x + bot.w / 2;
  const botCenterY = bot.y + bot.h / 2;


  const playerCenterX = player.x + player.w / 2;
  const playerCenterY = player.y + player.h / 2;

  // Reposition logic
  if (bot.moveWait <= 0) {
    const dist = Math.hypot(playerCenterX - botCenterX, playerCenterY - botCenterY);
    
    let targetX = botCenterX;
    let targetY = playerCenterY + (Math.random() - 0.5) * 100;

    if (dist < 220) {
      targetX = botCenterX + (botCenterX > playerCenterX ? 120 : -120);
    } else {
      targetX = botCenterX + (Math.random() - 0.5) * 200;
    }

    bot.targetX = clamp(targetX, BORDER_PADDING, GAME_WIDTH - bot.w - BORDER_PADDING);
    bot.targetY = clamp(targetY, BORDER_PADDING, FLOOR_Y - bot.h);
    bot.moveWait = bot.moveDelay;
  } else {
    bot.moveWait--;
  }

  // Smooth movement calculations
  let dx = bot.targetX - bot.x;
  let dy = bot.targetY - bot.y;
  let distance = Math.hypot(dx, dy);

  if (distance > 5) {
    let stepX = (dx / distance) * bot.speed;
    let stepY = (dy / distance) * bot.speed;

    if (!moveWithCollisions(bot, bot.x + stepX, bot.y)) {
      bot.targetX = bot.x;
    }
    if (!moveWithCollisions(bot, bot.x, bot.y + stepY)) {
      bot.targetY = bot.y;
    }
  }

  // Bot shooting line-of-sight check
  const startX = bot.x + bot.w / 2;
  const startY = bot.y + (bot.h / 6);
  const targetX = player.x + player.w / 2;
  const targetY = player.y + (player.h / 6);

  let canSeePlayer = hasLineOfSight(startX, startY, targetX, targetY);

  if (canSeePlayer || Math.random() < 0.05) {
    botShoot();
  }
}


function moveWithCollisions(character, newX, newY) {
  // Strict border clamping (Character never crosses bottom FLOOR_Y)
  const minX = BORDER_PADDING;
  const maxX = GAME_WIDTH - character.w - BORDER_PADDING;
  const minY = BORDER_PADDING;
  const maxY = FLOOR_Y - character.h;

  if (newX < minX || newX > maxX || newY < minY || newY > maxY) {
    return false;
  }

  const nextPosition = {
    x: newX,
    y: newY,
    w: character.w,
    h: character.h
  };

  // Wall collisions
  for (const wall of walls) {
    if (rectRectHit(nextPosition, wall)) {
      return false;
    }
  }

  character.x = newX;
  character.y = newY;
  return true;
}


function bounceOffWall(bullet) {
  const bulletBox = {
    x: bullet.x - BULLET_RADIUS,
    y: bullet.y - BULLET_RADIUS,
    w: BULLET_RADIUS * 2,
    h: BULLET_RADIUS * 2
  };


  for (const wall of walls) {
    if (!rectRectHit(bulletBox, wall)) {
      continue;
    }


    const previousX = bullet.x - bullet.vx;
    const previousY = bullet.y - bullet.vy;


    const cameFromSide = (
      previousX < wall.x ||
      previousX > wall.x + wall.w
    );


    const cameFromTopOrBottom = (
      previousY < wall.y ||
      previousY > wall.y + wall.h
    );


    if (cameFromSide && !cameFromTopOrBottom) {
      bullet.vx *= -1;
    } else {
      bullet.vy *= -1;
    }


    bullet.bounces++;
    return true;
  }


  return false;
}


function checkHitPlayer(bullet) {
  return damageCharacter(player, bullet);
}


function checkHitBot(bullet) {
  return damageCharacter(bot, bullet);
}


function damageCharacter(character, bullet) {
  const sectionHeight = character.h / 3;


  const sections = [
    {
      x: character.x,
      y: character.y,
      w: character.w,
      h: sectionHeight,
      damage: 25
    },
    {
      x: character.x,
      y: character.y + sectionHeight,
      w: character.w,
      h: sectionHeight,
      damage: 10
    },
    {
      x: character.x,
      y: character.y + sectionHeight * 2,
      w: character.w,
      h: sectionHeight,
      damage: 10
    }
  ];


  for (const section of sections) {
    if (rectCircleHit(section, bullet)) {
      character.hp -= section.damage;
      checkDeath();
      return true;
    }
  }


  return false;
}


function rectRectHit(first, second) {
  return (
    first.x < second.x + second.w &&
    first.x + first.w > second.x &&
    first.y < second.y + second.h &&
    first.y + first.h > second.y
  );
}


function rectCircleHit(rectangle, circle) {
  const closestX = Math.max(
    rectangle.x,
    Math.min(circle.x, rectangle.x + rectangle.w)
  );


  const closestY = Math.max(
    rectangle.y,
    Math.min(circle.y, rectangle.y + rectangle.h)
  );


  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;


  return (
    distanceX * distanceX +
    distanceY * distanceY
  ) <= BULLET_RADIUS * BULLET_RADIUS;
}


function hasLineOfSight(startX, startY, targetX, targetY) {
  const steps = 20;
  const stepX = (targetX - startX) / steps;
  const stepY = (targetY - startY) / steps;


  let currentX = startX;
  let currentY = startY;


  for (let i = 0; i <= steps; i++) {
    const point = {
      x: currentX - 2,
      y: currentY - 2,
      w: 4,
      h: 4
    };


    for (const wall of walls) {
      if (rectRectHit(point, wall)) {
        return false;
      }
    }


    currentX += stepX;
    currentY += stepY;
  }


  return true;
}


function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}


function checkDeath() {
  if (player.hp <= 0) {
    endGame(isTwoPlayer ? "Player 2 Wins!" : "Bot wins!");
  } else if (bot.hp <= 0) {
    endGame(isTwoPlayer ? "Player 1 Wins!" : "You win!");
  }
}


function endGame(message) {
  gameRunning = false;
  resultText.textContent = message;


  menu.style.display = "block";
  canvas.style.display = "none";
  hud.style.display = "none";
  pauseScreen.style.display = "none";
}


function draw() {
  const eraVal = parseInt(eraSlider.value);

  // Background Rendering with Fallback Themes
  if (eraVal === 1) {
    if (images.cavemanBg.loaded) {
      ctx.drawImage(images.cavemanBg.img, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      ctx.fillStyle = "#3b2505";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  } else if (eraVal === 2) {
    if (images.spaceBg.loaded) {
      ctx.drawImage(images.spaceBg.img, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      ctx.fillStyle = "#00051a";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  } else {
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // Outer Map Arena Borders
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, GAME_WIDTH - 6, GAME_HEIGHT - 6);


  for (const wall of walls) {
    ctx.fillStyle = wall.color || "#555577";
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);


    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }


  ctx.strokeStyle = "#222244";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(GAME_WIDTH, FLOOR_Y);
  ctx.stroke();


  drawCharacter(player);
  drawCharacter(bot);


  for (const bullet of bullets) {
    ctx.fillStyle = bulletColor(bullet);


    ctx.beginPath();
    ctx.arc(
      bullet.x,
      bullet.y,
      BULLET_RADIUS,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Added: draw the crosshair above all game objects.
  drawCrosshair();
}


function bulletColor(bullet) {
  if (bullet.from === "player") {
    return bullet.bounces === 0 ? "#88ffff" : "#44cccc";
  }


  return bullet.bounces === 0 ? "#ff88aa" : "#cc4466";
}


function drawCharacter(character) {
  const barWidth = character.w + 20;
  const barHeight = 8;
  const barX = character.x - 10;
  const barY = character.y - 18;
  const healthPercent = Math.max(
    0,
    character.hp / character.maxHp
  );


  ctx.fillStyle = "#333333";
  ctx.fillRect(barX, barY, barWidth, barHeight);


  ctx.fillStyle = "#00ff00";
  ctx.fillRect(
    barX,
    barY,
    barWidth * healthPercent,
    barHeight
  );


  ctx.fillStyle = "white";
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText(
    character.hp,
    barX + barWidth / 2,
    barY - 4
  );

  const eraVal = parseInt(eraSlider.value);

  // Era Avatar Rendering with Graphic Fallbacks
  if (eraVal === 1) {
    if (images.cavemanAvatar.loaded) {
      ctx.drawImage(images.cavemanAvatar.img, character.x, character.y, character.w, character.h);
    } else {
      // Caveman Fallback Avatar (Stone / Wood style)
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(character.x, character.y, character.w, character.h);
      ctx.fillStyle = "#ffcc99";
      ctx.fillRect(character.x + 5, character.y + 5, character.w - 10, 20);
    }
  } else if (eraVal === 2) {
    if (images.shipAvatar.loaded) {
      ctx.drawImage(images.shipAvatar.img, character.x, character.y, character.w, character.h);
    } else {
      // Futuristic Fallback Avatar (Sci-Fi Cyber ship)
      ctx.fillStyle = "#00ffcc";
      ctx.beginPath();
      ctx.moveTo(character.x + character.w / 2, character.y);
      ctx.lineTo(character.x + character.w, character.y + character.h);
      ctx.lineTo(character.x, character.y + character.h);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Standard Retro 3-block avatar
    const sectionHeight = character.h / 3;

    ctx.fillStyle = character.color;
    ctx.fillRect(character.x, character.y, character.w, sectionHeight);
    ctx.fillRect(character.x, character.y + sectionHeight, character.w, sectionHeight);
    ctx.fillRect(character.x, character.y + sectionHeight * 2, character.w, sectionHeight);
  }
}


// Added: draw a plus-shaped crosshair at the mouse position.
function drawCrosshair() {
  const size = 10;
  const gap = 4;

  ctx.save();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.lineCap = "square";

  ctx.beginPath();

  // Horizontal parts of the plus sign.
  ctx.moveTo(mouse.x - size, mouse.y);
  ctx.lineTo(mouse.x - gap, mouse.y);

  ctx.moveTo(mouse.x + gap, mouse.y);
  ctx.lineTo(mouse.x + size, mouse.y);

  // Vertical parts of the plus sign.
  ctx.moveTo(mouse.x, mouse.y - size);
  ctx.lineTo(mouse.x, mouse.y - gap);

  ctx.moveTo(mouse.x, mouse.y + gap);
  ctx.lineTo(mouse.x, mouse.y + size);

  ctx.stroke();
  ctx.restore();
}


function gameLoop() {
  if (!gameRunning) {
    return;
  }


  update();
  draw();
  requestAnimationFrame(gameLoop);
}