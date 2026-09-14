const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");


const menu = document.querySelector("#menu");
const hud = document.querySelector("#hud");
const pauseScreen = document.querySelector("#pause-screen");
const gameOverScreen = document.querySelector("#game-over-screen");
const gameOverMsg = document.querySelector("#game-over-msg");
const gameOverCoins = document.querySelector("#game-over-coins");
const resultText = document.querySelector("#result-text");
const coinCountDisplay = document.querySelector("#coin-count");
const bankCoinsDisplay = document.querySelector("#bank-coins");

// Profile elements
const usernameInput = document.querySelector("#username-input");
const btnLogin = document.querySelector("#btn-login");
const profileStatus = document.querySelector("#profile-status");

//choose games diff. settings
const easyButton = document.querySelector("#btn-easy");
const mediumButton = document.querySelector("#btn-medium");
const hardButton = document.querySelector("#btn-hard");
//gui inside game
const pauseButton = document.querySelector("#btn-pause");
const backButton = document.querySelector("#btn-back");
const resumeButton = document.querySelector("#btn-resume");
const quitButton = document.querySelector("#btn-quit");
const restartButton = document.querySelector("#btn-restart");
const gameOverMenuButton = document.querySelector("#btn-gameover-menu");

// Mode toggle elements
const radioBot = document.querySelector("#radio-bot");
const radio2p = document.querySelector("#radio-2p");
const diffSection = document.querySelector("#diff-section");
const p2Section = document.querySelector("#p2-section");
const start2pButton = document.querySelector("#btn-start-2p");

// Settings & Shop elements
const volumeSlider = document.querySelector("#volume-slider");
const eraSlider = document.querySelector("#era-slider");
const skinSelect = document.querySelector("#skin-select");
const buyBirdBtn = document.querySelector("#buy-bird");
const buyStarBtn = document.querySelector("#buy-star");
const buyNukeBtn = document.querySelector("#buy-nuke");

let currentUser = "Player1";
let totalBankCoins = 0;
let unlockedSkins = { bird: false, star: false, nuke: false };

// --- LOCAL STORAGE / CACHE PROFILE LOGIC ---
function loadUserProfile(username) {
  currentUser = username.trim() || "Player1";
  const savedData = localStorage.getItem(`duel_user_${currentUser}`);

  if (savedData) {
    const data = JSON.parse(savedData);
    totalBankCoins = data.coins || 0;
    unlockedSkins = data.unlockedSkins || { bird: false, star: false, nuke: false };
  } else {
    totalBankCoins = 0;
    unlockedSkins = { bird: false, star: false, nuke: false };
    saveUserProfile();
  }

  profileStatus.innerHTML = `Logged in as: <b>${currentUser}</b>`;
  rebuildSkinSelectOptions();
  updateShopUI();
}

function saveUserProfile() {
  const data = {
    coins: totalBankCoins,
    unlockedSkins: unlockedSkins,
    equippedSkin: skinSelect.value
  };
  localStorage.setItem(`duel_user_${currentUser}`, JSON.stringify(data));
}

function rebuildSkinSelectOptions() {
  const currentEquipped = skinSelect.value;
  skinSelect.innerHTML = '<option value="none">Default Block</option>';

  if (unlockedSkins.bird) addSkinOption("bird", "Bird Skin");
  if (unlockedSkins.star) addSkinOption("star", "Star Skin");
  if (unlockedSkins.nuke) addSkinOption("nuke", "Nuke Skin");

  skinSelect.value = unlockedSkins[currentEquipped] ? currentEquipped : "none";
}

btnLogin.addEventListener("click", () => {
  loadUserProfile(usernameInput.value);
});

skinSelect.addEventListener("change", () => {
  saveUserProfile();
});

// Preloading Theme & Skin Assets with load handlers
const images = {
  cavemanAvatar: { img: new Image(), loaded: false },
  cavemanBg: { img: new Image(), loaded: false },
  shipAvatar: { img: new Image(), loaded: false },
  spaceBg: { img: new Image(), loaded: false },
  birdSkin: { img: new Image(), loaded: false },
  starSkin: { img: new Image(), loaded: false },
  nukeSkin: { img: new Image(), loaded: false }
};

images.cavemanAvatar.img.onload = () => { images.cavemanAvatar.loaded = true; };
images.cavemanAvatar.img.src = "caveman.png";

images.cavemanBg.img.onload = () => { images.cavemanBg.loaded = true; };
images.cavemanBg.img.src = "cavemanera.jpeg";

images.shipAvatar.img.onload = () => { images.shipAvatar.loaded = true; };
images.shipAvatar.img.src = "ship.png";

images.spaceBg.img.onload = () => { images.spaceBg.loaded = true; };
images.spaceBg.img.src = "space.jpeg";

images.birdSkin.img.onload = () => { images.birdSkin.loaded = true; };
images.birdSkin.img.src = "bird.png";

images.starSkin.img.onload = () => { images.starSkin.loaded = true; };
images.starSkin.img.src = "star.png";

images.nukeSkin.img.onload = () => { images.nukeSkin.loaded = true; };
images.nukeSkin.img.src = "nuke.png";

// Generated Starfield background data for Space Mode fallback
const stars = [];
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random() * 1200,
    y: Math.random() * 700,
    size: Math.random() * 2.5 + 0.5
  });
}

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

restartButton.addEventListener("click", () => {
  startGame(difficulty);
});

gameOverMenuButton.addEventListener("click", returnToMenu);

// Shop logic
function updateShopUI() {
  bankCoinsDisplay.textContent = totalBankCoins;

  buyBirdBtn.disabled = unlockedSkins.bird || totalBankCoins < 10;
  buyBirdBtn.textContent = unlockedSkins.bird ? "Bird (Owned)" : "Bird Skin (10 Coins)";

  buyStarBtn.disabled = unlockedSkins.star || totalBankCoins < 20;
  buyStarBtn.textContent = unlockedSkins.star ? "Star (Owned)" : "Star Skin (20 Coins)";

  buyNukeBtn.disabled = unlockedSkins.nuke || totalBankCoins < 35;
  buyNukeBtn.textContent = unlockedSkins.nuke ? "Nuke (Owned)" : "Nuke Skin (35 Coins)";
}

buyBirdBtn.addEventListener("click", () => {
  if (totalBankCoins >= 10 && !unlockedSkins.bird) {
    totalBankCoins -= 10;
    unlockedSkins.bird = true;
    addSkinOption("bird", "Bird Skin");
    saveUserProfile();
    updateShopUI();
  }
});

buyStarBtn.addEventListener("click", () => {
  if (totalBankCoins >= 20 && !unlockedSkins.star) {
    totalBankCoins -= 20;
    unlockedSkins.star = true;
    addSkinOption("star", "Star Skin");
    saveUserProfile();
    updateShopUI();
  }
});

buyNukeBtn.addEventListener("click", () => {
  if (totalBankCoins >= 35 && !unlockedSkins.nuke) {
    totalBankCoins -= 35;
    unlockedSkins.nuke = true;
    addSkinOption("nuke", "Nuke Skin");
    saveUserProfile();
    updateShopUI();
  }
});

function addSkinOption(val, text) {
  const opt = document.createElement("option");
  opt.value = val;
  opt.textContent = text;
  skinSelect.appendChild(opt);
  skinSelect.value = val;
}


const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const BORDER_PADDING = 6;
const CHARACTER_SIZE = 30;
const BULLET_RADIUS = 5;
const MAX_BOUNCES = 3;
const PLAYER_SHOOT_DELAY = 18;
const FLOOR_Y = GAME_HEIGHT - 60;


let gameRunning = false;
let paused = false;
let difficulty = "medium";
let bullets = [];
let coins = [];
let collectedCoins = 0;
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
  const targetWallCount = Math.floor(Math.random() * 12) + 4;

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

    if (rectRectHit(candidateWall, playerSpawn) || rectRectHit(candidateWall, botSpawn)) {
      continue;
    }

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

function generateCoins() {
  coins = [];
  collectedCoins = 0;
  coinCountDisplay.textContent = collectedCoins;

  coins.push({
    x: bot.x + bot.w / 2,
    y: bot.y + bot.h / 2,
    radius: 10,
    collected: false
  });

  function getValidCoinLocation(minX, maxX) {
    let coinPos = { x: 0, y: 0, radius: 10 };
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 100) {
      attempts++;
      coinPos.x = Math.random() * (maxX - minX) + minX;
      coinPos.y = Math.random() * (FLOOR_Y - 100) + 50;
      valid = true;

      for (const wall of walls) {
        if (rectCircleHit(wall, coinPos)) {
          valid = false;
          break;
        }
      }
    }
    return coinPos;
  }

  for (let i = 0; i < 2; i++) {
    const pos = getValidCoinLocation(GAME_WIDTH - 400, GAME_WIDTH - 150);
    coins.push({ ...pos, collected: false });
  }

  for (let i = 0; i < 2; i++) {
    const pos = getValidCoinLocation(200, GAME_WIDTH - 400);
    coins.push({ ...pos, collected: false });
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

easyButton.addEventListener("click", () => startGame("easy"));
mediumButton.addEventListener("click", () => startGame("medium"));
hardButton.addEventListener("click", () => startGame("hard"));

backButton.addEventListener("click", returnToMenu);
quitButton.addEventListener("click", returnToMenu);
pauseButton.addEventListener("click", togglePause);

resumeButton.addEventListener("click", () => {
  paused = false;
  pauseScreen.style.display = "none";
});

// Touch controls mapping
document.querySelectorAll("#touch-controls button").forEach(btn => {
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const id = btn.id;
    if (id === "touch-up") keys.w = true;
    if (id === "touch-down") keys.s = true;
    if (id === "touch-left") keys.a = true;
    if (id === "touch-right") keys.d = true;
    if (id === "touch-fire" && gameRunning && !paused) playerShoot();
  });
  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    const id = btn.id;
    if (id === "touch-up") keys.w = false;
    if (id === "touch-down") keys.s = false;
    if (id === "touch-left") keys.a = false;
    if (id === "touch-right") keys.d = false;
  });
});


window.addEventListener("keydown", (event) => {
  if (event.target.tagName === "INPUT" || event.target.tagName === "SELECT") {
    return;
  }

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

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
  }
});


window.addEventListener("keyup", (event) => {
  if (event.target.tagName === "INPUT" || event.target.tagName === "SELECT") {
    return;
  }
  keys[event.key.toLowerCase()] = false;
});


canvas.addEventListener("mousemove", (event) => {
  const rectangle = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rectangle.left) / rectangle.width) * GAME_WIDTH;
  mouse.y = ((event.clientY - rectangle.top) / rectangle.height) * GAME_HEIGHT;
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

  generateCoins();

  bullets = [];
  playerShootWait = 0;
  bot.shootWait = 0;
  bot.moveWait = 0;

  menu.style.display = "none";
  canvas.style.display = "block";
  hud.style.display = "flex";
  pauseScreen.style.display = "none";
  gameOverScreen.style.display = "none";

  gameRunning = true;
  paused = false;

  requestAnimationFrame(gameLoop);
}

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

  saveUserProfile();
  updateShopUI();
  menu.style.display = "block";
  canvas.style.display = "none";
  hud.style.display = "none";
  pauseScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  resultText.textContent = "";
}


function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  pauseScreen.style.display = paused ? "flex" : "none";
}


function playerShoot() {
  if (playerShootWait > 0) return;

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
  if (bot.shootWait > 0) return;

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
  if (bot.shootWait > 0) return;

  const botHeadHeight = bot.h / 3;
  const startX = bot.x + bot.w / 2;
  const startY = bot.y + botHeadHeight / 2;

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
  if (!gameRunning || paused) return;

  let nextPlayerX = player.x;
  let nextPlayerY = player.y;

  if (keys.a || (!isTwoPlayer && keys.arrowleft)) nextPlayerX -= player.speed;
  if (keys.d || (!isTwoPlayer && keys.arrowright)) nextPlayerX += player.speed;
  if (keys.w || (!isTwoPlayer && keys.arrowup)) nextPlayerY -= player.speed;
  if (keys.s || (!isTwoPlayer && keys.arrowdown)) nextPlayerY += player.speed;

  moveWithCollisions(player, nextPlayerX, player.y);
  moveWithCollisions(player, player.x, nextPlayerY);

  if (playerShootWait > 0) playerShootWait--;

  if (isTwoPlayer) {
    updatePlayer2();
  } else {
    updateBot();
  }

  updateBullets();
  checkCoinCollection();

  if (bot.shootWait > 0) bot.shootWait--;
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

function checkCoinCollection() {
  const pBox = { x: player.x, y: player.y, w: player.w, h: player.h };
  for (const coin of coins) {
    if (!coin.collected && rectCircleHit(pBox, coin)) {
      coin.collected = true;
      collectedCoins++;
      totalBankCoins++;
      coinCountDisplay.textContent = collectedCoins;
      saveUserProfile();
    }
  }
}


function updateBot() {
  const botCenterX = bot.x + bot.w / 2;
  const botCenterY = bot.y + bot.h / 2;

  const playerCenterX = player.x + player.w / 2;
  const playerCenterY = player.y + player.h / 2;

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

  let dx = bot.targetX - bot.x;
  let dy = bot.targetY - bot.y;
  let distance = Math.hypot(dx, dy);

  if (distance > 5) {
    let stepX = (dx / distance) * bot.speed;
    let stepY = (dy / distance) * bot.speed;

    if (!moveWithCollisions(bot, bot.x + stepX, bot.y)) bot.targetX = bot.x;
    if (!moveWithCollisions(bot, bot.x, bot.y + stepY)) bot.targetY = bot.y;
  }

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
  const minX = BORDER_PADDING;
  const maxX = GAME_WIDTH - character.w - BORDER_PADDING;
  const minY = BORDER_PADDING;
  const maxY = FLOOR_Y - character.h;

  if (newX < minX || newX > maxX || newY < minY || newY > maxY) return false;

  const nextPosition = { x: newX, y: newY, w: character.w, h: character.h };
  for (const wall of walls) {
    if (rectRectHit(nextPosition, wall)) return false;
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
    if (!rectRectHit(bulletBox, wall)) continue;

    const previousX = bullet.x - bullet.vx;
    const previousY = bullet.y - bullet.vy;

    const cameFromSide = (previousX < wall.x || previousX > wall.x + wall.w);
    const cameFromTopOrBottom = (previousY < wall.y || previousY > wall.y + wall.h);

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
  
  const hitW = character.w * 0.75;
  const hitH = sectionHeight * 0.75;
  const offsetX = (character.w - hitW) / 2;
  const offsetY = (sectionHeight - hitH) / 2;

  const sections = [
    { x: character.x + offsetX, y: character.y + offsetY, w: hitW, h: hitH, damage: 25 },
    { x: character.x + offsetX, y: character.y + sectionHeight + offsetY, w: hitW, h: hitH, damage: 10 },
    { x: character.x + offsetX, y: character.y + sectionHeight * 2 + offsetY, w: hitW, h: hitH, damage: 10 }
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
  const closestX = Math.max(rectangle.x, Math.min(circle.x, rectangle.x + rectangle.w));
  const closestY = Math.max(rectangle.y, Math.min(circle.y, rectangle.y + rectangle.h));
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const r = circle.radius || BULLET_RADIUS;
  return (distanceX * distanceX + distanceY * distanceY) <= r * r;
}

function hasLineOfSight(startX, startY, targetX, targetY) {
  const steps = 20;
  const stepX = (targetX - startX) / steps;
  const stepY = (targetY - startY) / steps;

  let currentX = startX;
  let currentY = startY;

  for (let i = 0; i <= steps; i++) {
    const point = { x: currentX - 2, y: currentY - 2, w: 4, h: 4 };
    for (const wall of walls) {
      if (rectRectHit(point, wall)) return false;
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
  saveUserProfile();
  gameOverMsg.textContent = message;
  gameOverCoins.textContent = `Coins Collected This Game: ${collectedCoins}/5`;
  gameOverScreen.style.display = "flex";
}


function draw() {
  const eraVal = parseInt(eraSlider.value);

  if (eraVal === 1) {
    if (images.cavemanBg.loaded) {
      ctx.drawImage(images.cavemanBg.img, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      ctx.fillStyle = "#4a2c00";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = "#2e1a00";
      ctx.fillRect(0, FLOOR_Y - 40, GAME_WIDTH, GAME_HEIGHT - FLOOR_Y + 40);
    }
  } else if (eraVal === 2) {
    if (images.spaceBg.loaded) {
      ctx.drawImage(images.spaceBg.img, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
      ctx.fillStyle = "#020212";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = "#ffffff";
      for (const s of stars) ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  } else {
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  ctx.strokeStyle = eraVal === 2 ? "#00ffff" : (eraVal === 1 ? "#d4a359" : "#00ffff");
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

  for (const coin of coins) {
    if (!coin.collected) {
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#b8860b";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawCharacter(player);
  drawCharacter(bot);

  for (const bullet of bullets) {
    ctx.fillStyle = bulletColor(bullet);
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

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
  const healthPercent = Math.max(0, character.hp / character.maxHp);

  ctx.fillStyle = "#333333";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  ctx.fillStyle = "#00ff00";
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

  ctx.fillStyle = "white";
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText(character.hp, barX + barWidth / 2, barY - 4);

  const eraVal = parseInt(eraSlider.value);

  if (eraVal === 1) {
    if (images.cavemanAvatar.loaded) {
      ctx.drawImage(images.cavemanAvatar.img, character.x, character.y, character.w, character.h);
    } else {
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(character.x, character.y, character.w, character.h);
      ctx.fillStyle = "#ffcc99";
      ctx.fillRect(character.x + 5, character.y + 5, character.w - 10, 20);
    }
  } else if (eraVal === 2) {
    if (images.shipAvatar.loaded) {
      ctx.drawImage(images.shipAvatar.img, character.x, character.y, character.w, character.h);
    } else {
      ctx.fillStyle = "#00ffcc";
      ctx.beginPath();
      ctx.moveTo(character.x + character.w / 2, character.y);
      ctx.lineTo(character.x + character.w, character.y + character.h);
      ctx.lineTo(character.x, character.y + character.h);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    const sectionHeight = character.h / 3;
    const selectedSkin = skinSelect.value;

    if (character === player && selectedSkin !== "none" && images[`${selectedSkin}Skin`]?.loaded) {
      ctx.drawImage(images[`${selectedSkin}Skin`].img, character.x, character.y, character.w, sectionHeight);
    } else {
      ctx.fillStyle = character.color;
      ctx.fillRect(character.x, character.y, character.w, sectionHeight);
    }

    ctx.fillStyle = character.color;
    ctx.fillRect(character.x, character.y + sectionHeight, character.w, sectionHeight);
    ctx.fillRect(character.x, character.y + sectionHeight * 2, character.w, sectionHeight);
  }
}


function drawCrosshair() {
  const size = 10;
  const gap = 4;

  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.lineCap = "square";

  ctx.beginPath();
  ctx.moveTo(mouse.x - size, mouse.y);
  ctx.lineTo(mouse.x - gap, mouse.y);
  ctx.moveTo(mouse.x + gap, mouse.y);
  ctx.lineTo(mouse.x + size, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - size);
  ctx.lineTo(mouse.x, mouse.y - gap);
  ctx.moveTo(mouse.x, mouse.y + gap);
  ctx.lineTo(mouse.x, mouse.y + size);
  ctx.stroke();
  ctx.restore();
}

// Initializing Profile Cache on Startup
loadUserProfile("Player1");

function gameLoop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}