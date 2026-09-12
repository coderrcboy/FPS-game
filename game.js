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


const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const CHARACTER_SIZE = 30;
const BULLET_RADIUS = 6; //bullet size
const MAX_BOUNCES = 3; //max bounces of bullet
const PLAYER_SHOOT_DELAY = 18; //reload/recoil time ig??
const FLOOR_Y = GAME_HEIGHT - 60;


let gameRunning = false;
let paused = false;
let difficulty = "medium";
let bullets = [];
let playerShootWait = 0;


const keys = {};
const mouse = {
  x: 0,
  y: 0
};
//boundaries
const walls = [
  { x: 300, y: 200, w: 40, h: 250 },
  { x: 500, y: 100, w: 40, h: 180 },
  { x: 500, y: 420, w: 40, h: 180 },
  { x: 750, y: 250, w: 40, h: 250 },
  { x: 900, y: 120, w: 40, h: 140 },
  { x: 900, y: 460, w: 40, h: 140 }
];
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
  speed: 4,
  color: "#ff3366",
  hp: 200,
  maxHp: 200,
  shootWait: 0,
  shootDelay: 40,
  moveWait: 0,
  moveDelay: 15,
  targetX: 0,
  targetY: 0
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


  if ([
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright"
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
  difficulty = selectedDifficulty;
  setBotDifficulty();


  player.hp = player.maxHp;
  bot.hp = bot.maxHp;


  player.x = 120;
  player.y = FLOOR_Y - CHARACTER_SIZE * 3;


  bot.x = GAME_WIDTH - 120 - CHARACTER_SIZE;
  bot.y = FLOOR_Y - CHARACTER_SIZE * 3;


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
    bot.speed = 3;
    bot.shootDelay = 60;
    bot.moveDelay = 25;
  }


  if (difficulty === "medium") {
    bot.speed = 4.5;
    bot.shootDelay = 35;
    bot.moveDelay = 15;
  }


  if (difficulty === "hard") {
    bot.speed = 6.5;
    bot.shootDelay = 20;
    bot.moveDelay = 8;
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


  playerShootWait = PLAYER_SHOOT_DELAY;
}


function botShoot() {
  if (bot.shootWait > 0) {
    return;
  }


  const botHeadHeight = bot.h / 3;
  const startX = bot.x + bot.w / 2;
  const startY = bot.y + botHeadHeight / 2;


  const playerHeadHeight = player.h / 3;
  const targetX = player.x + player.w / 2;
  const targetY = player.y + playerHeadHeight / 2;


  const angle = Math.atan2(targetY - startY, targetX - startX);
  let aimingError = 0.12;


  if (difficulty === "easy") {
    aimingError = 0.3;
  }


  if (difficulty === "hard") {
    aimingError = 0.04;
  }


  const finalAngle = angle + (Math.random() - 0.5) * aimingError;


  bullets.push({
    x: startX,
    y: startY,
    vx: Math.cos(finalAngle) * 9,
    vy: Math.sin(finalAngle) * 9,
    from: "bot",
    bounces: 0
  });


  bot.shootWait = bot.shootDelay;
}


function update() {
  if (!gameRunning || paused) {
    return;
  }


  let nextPlayerX = player.x;
  let nextPlayerY = player.y;


  if (keys.arrowleft) {
    nextPlayerX -= player.speed;
  }


  if (keys.arrowright) {
    nextPlayerX += player.speed;
  }


  if (keys.arrowup) {
    nextPlayerY -= player.speed;
  }


  if (keys.arrowdown) {
    nextPlayerY += player.speed;
  }


  moveWithCollisions(player, nextPlayerX, player.y);
  moveWithCollisions(player, player.x, nextPlayerY);


  if (playerShootWait > 0) {
    playerShootWait--;
  }


  updateBot();
  updateBullets();


  if (bot.shootWait > 0) {
    bot.shootWait--;
  }
}


function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];


    bullet.x += bullet.vx;
    bullet.y += bullet.vy;


    if (
      bullet.x < 0 ||
      bullet.x > GAME_WIDTH ||
      bullet.y < 0 ||
      bullet.y > GAME_HEIGHT
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


  if (bot.moveWait <= 0) {
    const distanceX = playerCenterX - botCenterX;
    let targetX = botCenterX;


    if (Math.abs(distanceX) < 250) {
      targetX = distanceX > 0
        ? botCenterX - 150
        : botCenterX + 150;
    } else {
      targetX = distanceX > 0
        ? botCenterX + 120
        : botCenterX - 120;
    }


    let targetY = playerCenterY + (Math.random() - 0.5) * 80;


    targetX = clamp(targetX, 50, GAME_WIDTH - 50);
    targetY = clamp(targetY, 50, GAME_HEIGHT - 50);


    bot.targetX = targetX;
    bot.targetY = targetY;
    bot.moveWait = bot.moveDelay;
  } else {
    bot.moveWait--;
  }


  let nextBotX = bot.x;
  let nextBotY = bot.y;


  if (botCenterX < bot.targetX - 10) {
    nextBotX += bot.speed;
  } else if (botCenterX > bot.targetX + 10) {
    nextBotX -= bot.speed;
  }


  if (botCenterY < bot.targetY - 10) {
    nextBotY += bot.speed;
  } else if (botCenterY > bot.targetY + 10) {
    nextBotY -= bot.speed;
  }


  moveWithCollisions(bot, nextBotX, bot.y);
  moveWithCollisions(bot, bot.x, nextBotY);


  const botHeadHeight = bot.h / 3;
  const startX = bot.x + bot.w / 2;
  const startY = bot.y + botHeadHeight / 2;


  const playerHeadHeight = player.h / 3;
  const targetX = player.x + player.w / 2;
  const targetY = player.y + playerHeadHeight / 2;


  const horizontalDistance = targetX - startX;
  const verticalDistance = targetY - startY;
  const angleIsUseful = (
    horizontalDistance < -20 &&
    Math.abs(verticalDistance) < 140
  );


  let canSeePlayer = hasLineOfSight(
    startX,
    startY,
    targetX,
    targetY
  );


  if (difficulty === "easy" && Math.random() < 0.3) {
    canSeePlayer = true;
  }


  if (difficulty === "medium" && Math.random() < 0.15) {
    canSeePlayer = true;
  }


  if (angleIsUseful && canSeePlayer) {
    botShoot();
  }
}


function moveWithCollisions(character, newX, newY) {
  const nextPosition = {
    x: newX,
    y: newY,
    w: character.w,
    h: character.h
  };


  for (const wall of walls) {
    if (rectRectHit(nextPosition, wall)) {
      return false;
    }
  }


  const outsideMap = (
    newX < 0 ||
    newY < 0 ||
    newX + character.w > GAME_WIDTH ||
    newY + character.h > GAME_HEIGHT
  );


  if (outsideMap) {
    return false;
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
    endGame("Bot wins!");
  } else if (bot.hp <= 0) {
    endGame("You win!");
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
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);


  for (const wall of walls) {
    ctx.fillStyle = "#555577";
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);


    ctx.strokeStyle = "#7777aa";
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


  const sectionHeight = character.h / 3;


  ctx.fillStyle = character.color;
  ctx.fillRect(
    character.x,
    character.y,
    character.w,
    sectionHeight
  );


  ctx.fillRect(
    character.x,
    character.y + sectionHeight,
    character.w,
    sectionHeight
  );


  ctx.fillRect(
    character.x,
    character.y + sectionHeight * 2,
    character.w,
    sectionHeight
  );
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