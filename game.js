// UI Element Selectors
const webglContainer = document.querySelector("#webgl-container");
const menu = document.querySelector("#menu");
const hud = document.querySelector("#hud");
const pauseScreen = document.querySelector("#pause-screen");
const gameOverScreen = document.querySelector("#game-over-screen");
const gameOverMsg = document.querySelector("#game-over-msg");
const gameOverCoins = document.querySelector("#game-over-coins");
const coinCountDisplay = document.querySelector("#coin-count");
const bankCoinsDisplay = document.querySelector("#bank-coins");
const tutorialBanner = document.querySelector("#tutorial-banner");
const skipTutorialBtn = document.querySelector("#btn-skip-tutorial");
const gateContainer = document.querySelector("#gate-container");
const usernameInput = document.querySelector("#username-input");
const btnLogin = document.querySelector("#btn-login");
const profileStatus = document.querySelector("#profile-status");
const easyButton = document.querySelector("#btn-easy");
const mediumButton = document.querySelector("#btn-medium");
const hardButton = document.querySelector("#btn-hard");
const tutorialButton = document.querySelector("#btn-tutorial");
const pauseButton = document.querySelector("#btn-pause");
const backButton = document.querySelector("#btn-back");
const resumeButton = document.querySelector("#btn-resume");
const quitButton = document.querySelector("#btn-quit");
const restartButton = document.querySelector("#btn-restart");
const gameOverMenuButton = document.querySelector("#btn-gameover-menu");
const radioBot = document.querySelector("#radio-bot");
const radio2p = document.querySelector("#radio-2p");
const diffSection = document.querySelector("#diff-section");
const p2Section = document.querySelector("#p2-section");
const start2pButton = document.querySelector("#btn-start-2p");
const volumeSlider = document.querySelector("#volume-slider");
const eraSlider = document.querySelector("#era-slider");
const skinSelect = document.querySelector("#skin-select");
const buyBirdBtn = document.querySelector("#buy-bird");
const buyStarBtn = document.querySelector("#buy-star");
const buyNukeBtn = document.querySelector("#buy-nuke");
const visitCountDisplay = document.querySelector("#visit-count");

// State Variables
let currentUser = "Player1";
let totalBankCoins = 0;
let unlockedSkins = { bird: false, star: false, nuke: false };

let scene, camera, renderer;
let playerMesh, botMesh, floorMesh, starFieldParticles;
let playerHpGroup, botHpGroup, crosshairMesh;
let wallMeshes = [], bulletMeshes = [], coinMeshes = [];
let collidableObjects = [];

const GAME_WIDTH = 120;
const GAME_HEIGHT = 70;
const BORDER_PADDING = 3;
const CHARACTER_SIZE = 3;
const BULLET_RADIUS = 0.6;
const MAX_BOUNCES = 3;

let cameraDistance = 45;
let cameraAngle = 0;
let gameRunning = false, paused = false, isTutorial = false, isTwoPlayer = false;
let tutorialStep = 0;
let difficulty = "medium";
let bullets = [], coins = [], walls = [];
let collectedCoins = 0, playerShootWait = 0, botShootWait = 0;

const player = { x: -40, z: 0, w: CHARACTER_SIZE, h: CHARACTER_SIZE * 3, speed: 0.6, hp: 200, maxHp: 200 };
const bot = { x: 40, z: 0, w: CHARACTER_SIZE, h: CHARACTER_SIZE * 3, speed: 0.45, hp: 200, maxHp: 200, targetX: 40, targetZ: 0, stuckTimer: 0 };
const keys = {};

const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();
const aimTarget3D = new THREE.Vector3();

// Fetch Daily GitHub Pages Visitor Counter
function loadDailyVisits() {
  if (!visitCountDisplay) return;

  const pageUrl = window.location.origin + window.location.pathname;
  const apiUrl = `https://hits.sh/${encodeURIComponent(pageUrl)}/count.json?view=today-total`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      visitCountDisplay.textContent = data.count || 1;
    })
    .catch(() => {
      visitCountDisplay.textContent = "1";
    });
}

// Dynamic Procedural Canvas Skin Generator
function generateSkinTexture(skinName) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (skinName === "bird") {
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#ff6600";
    ctx.beginPath();
    ctx.moveTo(100, 140); ctx.lineTo(156, 140); ctx.lineTo(128, 190);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(80, 90, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(176, 90, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath(); ctx.arc(80, 90, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(176, 90, 10, 0, Math.PI * 2); ctx.fill();
  } else if (skinName === "star") {
    ctx.fillStyle = "#111133";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#ffff00";
    ctx.beginPath();
    const cx = 128, cy = 128, outerRadius = 90, innerRadius = 40;
    for (let i = 0; i < 5; i++) {
      let x = cx + Math.cos((18 + i * 72) * Math.PI / 180) * outerRadius;
      let y = cy - Math.sin((18 + i * 72) * Math.PI / 180) * outerRadius;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      x = cx + Math.cos((54 + i * 72) * Math.PI / 180) * innerRadius;
      y = cy - Math.sin((54 + i * 72) * Math.PI / 180) * innerRadius;
      ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  } else if (skinName === "nuke") {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath(); ctx.arc(128, 128, 90, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.beginPath(); ctx.arc(128, 128, 20, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(128, 128); ctx.arc(128, 128, 80, 0, Math.PI / 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(128, 128); ctx.arc(128, 128, 80, (2 * Math.PI / 3), (3 * Math.PI / 3)); ctx.fill();
    ctx.beginPath(); ctx.moveTo(128, 128); ctx.arc(128, 128, 80, (4 * Math.PI / 3), (5 * Math.PI / 3)); ctx.fill();
  } else if (skinName === "caveman") {
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#000000";
    ctx.fillRect(40, 60, 176, 20);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(60, 140, 136, 40);
  } else if (skinName === "ship") {
    ctx.fillStyle = "#050525";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(30, 30, 196, 196);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(70, 70, 116, 116);
  }

  return new THREE.CanvasTexture(canvas);
}

const textures = {
  cavemanAvatar: generateSkinTexture("caveman"),
  shipAvatar: generateSkinTexture("ship"),
  birdSkin: generateSkinTexture("bird"),
  starSkin: generateSkinTexture("star"),
  nukeSkin: generateSkinTexture("nuke")
};

const textureLoader = new THREE.TextureLoader();
textureLoader.load("caveman.png", (t) => { textures.cavemanAvatar = t; updateCharacterSkins(); });
textureLoader.load("ship.png", (t) => { textures.shipAvatar = t; updateCharacterSkins(); });
textureLoader.load("bird.png", (t) => { textures.birdSkin = t; updateCharacterSkins(); });
textureLoader.load("star.png", (t) => { textures.starSkin = t; updateCharacterSkins(); });
textureLoader.load("nuke.png", (t) => { textures.nukeSkin = t; updateCharacterSkins(); });

const shootSound = new Audio("gun.mp3");
let lastSoundTime = 0;

function playShootSound() {
  const now = Date.now();
  if (now - lastSoundTime < 60) return;
  lastSoundTime = now;
  shootSound.currentTime = 0;
  shootSound.volume = parseFloat(volumeSlider.value);
  shootSound.play().catch(() => {});
}

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

function addSkinOption(val, text) {
  const opt = document.createElement("option");
  opt.value = val;
  opt.textContent = text;
  skinSelect.appendChild(opt);
}

function updateShopUI() {
  bankCoinsDisplay.textContent = totalBankCoins;
  buyBirdBtn.disabled = unlockedSkins.bird || totalBankCoins < 10;
  buyBirdBtn.textContent = unlockedSkins.bird ? "Bird (Owned)" : "Bird Skin (10 Coins)";

  buyStarBtn.disabled = unlockedSkins.star || totalBankCoins < 20;
  buyStarBtn.textContent = unlockedSkins.star ? "Star (Owned)" : "Star Skin (20 Coins)";

  buyNukeBtn.disabled = unlockedSkins.nuke || totalBankCoins < 35;
  buyNukeBtn.textContent = unlockedSkins.nuke ? "Nuke (Owned)" : "Nuke Skin (35 Coins)";
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000822);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  webglContainer.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x00ffff, 0.8);
  dirLight.position.set(20, 40, 20);
  scene.add(dirLight);

  const floorGeo = new THREE.PlaneGeometry(GAME_WIDTH, GAME_HEIGHT);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x050515, roughness: 0.8 });
  floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  scene.add(floorMesh);

  const starGeo = new THREE.BufferGeometry();
  const starCount = 300;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 300;
    starPositions[i + 1] = Math.random() * 80 + 10;
    starPositions[i + 2] = (Math.random() - 0.5) * 300;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8 });
  starFieldParticles = new THREE.Points(starGeo, starMat);
  starFieldParticles.visible = false;
  scene.add(starFieldParticles);

  playerMesh = createCharacterMesh(0x00ffff, "player");
  botMesh = createCharacterMesh(0xff0055, "bot");
  scene.add(playerMesh);
  scene.add(botMesh);

  playerHpGroup = createHpBarGroup();
  botHpGroup = createHpBarGroup();
  scene.add(playerHpGroup);
  scene.add(botHpGroup);

  const crossGeo = new THREE.SphereGeometry(0.8, 8, 8);
  const crossMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true });
  crosshairMesh = new THREE.Mesh(crossGeo, crossMat);
  scene.add(crosshairMesh);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('wheel', onScroll);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', (e) => {
    if (gameRunning && !paused && e.button === 0) playerShoot();
  });
}

function createHeadMaterialArray(baseColorHex, textureMap = null) {
  const defaultMat = new THREE.MeshStandardMaterial({ color: baseColorHex });
  const skinMat = textureMap ? new THREE.MeshStandardMaterial({ map: textureMap }) : defaultMat;

  return [
    skinMat, skinMat, defaultMat, defaultMat, skinMat, skinMat
  ];
}

function createCharacterMesh(colorHex, role) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex });

  const headGeo = new THREE.BoxGeometry(CHARACTER_SIZE, CHARACTER_SIZE, CHARACTER_SIZE);
  let headMaterials = createHeadMaterialArray(colorHex);

  if (role === "player") {
    const selectedSkin = skinSelect.value;
    if (selectedSkin !== "none" && textures[`${selectedSkin}Skin`]) {
      headMaterials = createHeadMaterialArray(colorHex, textures[`${selectedSkin}Skin`]);
    }
  }

  const headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.name = "headMesh";
  headMesh.position.y = CHARACTER_SIZE * 2.5;
  group.add(headMesh);

  const bodyGeo = new THREE.BoxGeometry(CHARACTER_SIZE, CHARACTER_SIZE * 2, CHARACTER_SIZE);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = CHARACTER_SIZE;
  group.add(bodyMesh);

  return group;
}

function updateCharacterSkins() {
  const eraVal = parseInt(eraSlider.value);
  const headMesh = playerMesh.getObjectByName("headMesh");
  const selectedSkin = skinSelect.value;
  const baseColor = 0x00ffff;

  if (eraVal === 1 && textures.cavemanAvatar) {
    headMesh.material = createHeadMaterialArray(baseColor, textures.cavemanAvatar);
  } else if (eraVal === 2 && textures.shipAvatar) {
    headMesh.material = createHeadMaterialArray(baseColor, textures.shipAvatar);
  } else if (selectedSkin !== "none" && textures[`${selectedSkin}Skin`]) {
    headMesh.material = createHeadMaterialArray(baseColor, textures[`${selectedSkin}Skin`]);
  } else {
    headMesh.material = createHeadMaterialArray(baseColor, null);
  }
}

function createHpBarGroup() {
  const group = new THREE.Group();
  
  const bgGeo = new THREE.PlaneGeometry(6, 0.8);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);

  const fgGeo = new THREE.PlaneGeometry(6, 0.8);
  const fgMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
  const fgMesh = new THREE.Mesh(fgGeo, fgMat);
  fgMesh.position.z = 0.05;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = "#ffffff";
  ctx.font = "Bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillText("200/200", 64, 22);

  const textTexture = new THREE.CanvasTexture(canvas);
  const textMat = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, side: THREE.DoubleSide });
  const textGeo = new THREE.PlaneGeometry(6, 1.5);
  const textMesh = new THREE.Mesh(textGeo, textMat);
  textMesh.position.y = 1.2;
  textMesh.position.z = 0.06;

  group.add(bgMesh);
  group.add(fgMesh);
  group.add(textMesh);
  return group;
}

function updateHpBar(hpGroup, currentHp, maxHp, posX, posZ) {
  hpGroup.position.set(posX, CHARACTER_SIZE * 3 + 2.5, posZ);
  hpGroup.lookAt(camera.position);

  const healthRatio = Math.max(0, currentHp / maxHp);
  const fgMesh = hpGroup.children[1];
  fgMesh.scale.x = healthRatio;
  fgMesh.position.x = -(3 * (1 - healthRatio));

  const textMesh = hpGroup.children[2];
  const textTexture = textMesh.material.map;
  const canvas = textTexture.image;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "Bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.max(0, currentHp)}/${maxHp}`, 64, 22);
  textTexture.needsUpdate = true;
}

function applyThemeEras() {
  const eraVal = parseInt(eraSlider.value);
  starFieldParticles.visible = (eraVal === 2);

  if (eraVal === 1) {
    floorMesh.material.color.setHex(0x4a2c00);
  } else if (eraVal === 2) {
    floorMesh.material.color.setHex(0x020212);
  } else {
    floorMesh.material.color.setHex(0x050515);
  }
  floorMesh.material.needsUpdate = true;
  updateCharacterSkins();
}

function onMouseMove(event) {
  mouseVec.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseVec.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function update3DAimTarget() {
  raycaster.setFromCamera(mouseVec, camera);
  const intersects = raycaster.intersectObjects(collidableObjects, false);

  if (intersects.length > 0) {
    aimTarget3D.copy(intersects[0].point);
  } else {
    const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CHARACTER_SIZE * 1.5);
    raycaster.ray.intersectPlane(aimPlane, aimTarget3D);
  }

  crosshairMesh.position.copy(aimTarget3D);
}

function onScroll(e) {
  if (!gameRunning) return;
  cameraDistance = Math.max(20, Math.min(90, cameraDistance + e.deltaY * 0.05));
}

function updateCamera3rdPerson() {
  const targetX = player.x;
  const targetZ = player.z;
  camera.position.x = targetX + Math.sin(cameraAngle) * cameraDistance;
  camera.position.z = targetZ + Math.cos(cameraAngle) * cameraDistance;
  camera.position.y = cameraDistance * 0.7;
  camera.lookAt(targetX, player.h / 2, targetZ);
}

function generate3DWalls() {
  wallMeshes.forEach(m => scene.remove(m));
  wallMeshes = [];
  walls = [];
  collidableObjects = [floorMesh];

  const eraVal = parseInt(eraSlider.value);
  const targetWallCount = Math.floor(Math.random() * 4) + 5;

  for (let i = 0; i < targetWallCount; i++) {
    const w = Math.random() * 6 + 4;
    const h = Math.random() * 8 + 5;
    const d = Math.random() * 10 + 4;
    const x = (Math.random() - 0.5) * (GAME_WIDTH - 40);
    const z = (Math.random() - 0.5) * (GAME_HEIGHT - 30);

    const candidate = { x: x - w / 2, z: z - d / 2, w: w, d: d, h: h, posX: x, posZ: z };
    
    let overlaps = false;
    for (const wall of walls) {
      if (checkAABBOverlap(candidate, { x: wall.x - 3, z: wall.z - 3, w: wall.w + 6, d: wall.d + 6 })) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      let wallGeo;
      if (eraVal === 1) {
        wallGeo = new THREE.DodecahedronGeometry(w / 1.5, 0);
      } else {
        wallGeo = new THREE.BoxGeometry(w, h, d);
      }

      const wallMat = new THREE.MeshStandardMaterial({ 
        color: eraVal === 1 ? 0x665544 : 0x555577, 
        roughness: eraVal === 1 ? 0.9 : 0.4 
      });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(x, h / 2, z);
      scene.add(wallMesh);

      wallMeshes.push(wallMesh);
      collidableObjects.push(wallMesh);
      walls.push(candidate);
    }
  }
}

function checkAABBOverlap(box1, box2) {
  return (
    box1.x < box2.x + box2.w &&
    box1.x + box1.w > box2.x &&
    box1.z < box2.z + box2.d &&
    box1.z + box1.d > box2.z
  );
}

function checkCollisionWithWalls(newX, newZ) {
  const halfChar = CHARACTER_SIZE / 2;
  const pBox = { x: newX - halfChar, z: newZ - halfChar, w: CHARACTER_SIZE, d: CHARACTER_SIZE };
  for (const wall of walls) {
    if (checkAABBOverlap(pBox, wall)) return true;
  }
  return false;
}

function generate3DCoins() {
  coinMeshes.forEach(m => scene.remove(m));
  coinMeshes = [];
  coins = [];
  collectedCoins = 0;
  coinCountDisplay.textContent = collectedCoins;

  for (let i = 0; i < 5; i++) {
    let valid = false;
    let attempts = 0;
    let cx = 0, cz = 0;

    while (!valid && attempts < 100) {
      attempts++;
      cx = (Math.random() - 0.5) * (GAME_WIDTH - 30);
      cz = (Math.random() - 0.5) * (GAME_HEIGHT - 20);
      valid = true;

      const coinBox = { x: cx - 1.5, z: cz - 1.5, w: 3, d: 3 };
      for (const wall of walls) {
        if (checkAABBOverlap(coinBox, wall)) {
          valid = false;
          break;
        }
      }
    }

    const coinPos = { x: cx, z: cz, radius: 1.5, collected: false };
    coins.push(coinPos);

    const coinGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.position.set(coinPos.x, 1.5, coinPos.z);
    scene.add(coinMesh);
    coinMeshes.push(coinMesh);
  }
}

function startTutorial() {
  isTutorial = true;
  tutorialStep = 1;
  skipTutorialBtn.style.display = "block";
  startGame("easy");
  tutorialBanner.style.display = "block";
  tutorialBanner.textContent = "TUTORIAL: Move using WASD keys!";
}

function playerShoot() {
  if (playerShootWait > 0) return;
  
  const startPos = new THREE.Vector3(player.x, player.h * 0.7, player.z);
  const dir = new THREE.Vector3().subVectors(aimTarget3D, startPos).normalize();

  if (dir.length() === 0) return;

  spawnBullet(startPos.x, startPos.y, startPos.z, dir.x * 1.4, dir.y * 1.4, dir.z * 1.4, "player");
  playShootSound();
  playerShootWait = 18;

  if (isTutorial && tutorialStep === 2) {
    tutorialStep = 3;
    tutorialBanner.textContent = "TUTORIAL: Collect a gold coin on the map!";
  }
}

function player2Shoot() {
  if (botShootWait > 0) return;
  const dirX = player.x - bot.x;
  const dirZ = player.z - bot.z;
  const len = Math.hypot(dirX, dirZ);

  if (len === 0) return;

  spawnBullet(bot.x, bot.h * 0.7, bot.z, (dirX / len) * 1.4, 0, (dirZ / len) * 1.4, "bot");
  playShootSound();
  botShootWait = 18;
}

function botShoot() {
  if (botShootWait > 0 || isTutorial || isTwoPlayer) return;
  const dirX = player.x - bot.x;
  const dirZ = player.z - bot.z;
  const len = Math.hypot(dirX, dirZ);

  if (len === 0) return;

  spawnBullet(bot.x, bot.h * 0.7, bot.z, (dirX / len) * 1.2, 0, (dirZ / len) * 1.2, "bot");
  playShootSound();
  botShootWait = 35;
}

function spawnBullet(x, y, z, vx, vy, vz, owner) {
  const bulletGeo = new THREE.SphereGeometry(BULLET_RADIUS, 8, 8);
  const bulletMat = new THREE.MeshBasicMaterial({ color: owner === "player" ? 0x00ffff : 0xff0055 });
  const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
  bulletMesh.position.set(x, y, z);
  scene.add(bulletMesh);

  bullets.push({ 
    mesh: bulletMesh, 
    x: x, y: y, z: z, 
    vx: vx, vy: vy, vz: vz, 
    from: owner, 
    bounces: 0, 
    life: 180 
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const prevX = b.x;
    const prevZ = b.z;

    b.x += b.vx;
    b.y += b.vy;
    b.z += b.vz;
    b.life--;

    b.mesh.position.set(b.x, b.y, b.z);

    const bBox = { x: b.x - BULLET_RADIUS, z: b.z - BULLET_RADIUS, w: BULLET_RADIUS * 2, d: BULLET_RADIUS * 2 };
    
    for (const wall of walls) {
      if (checkAABBOverlap(bBox, wall) && b.y <= wall.h) {
        if (b.bounces < MAX_BOUNCES) {
          const cameFromX = (prevX < wall.x || prevX > wall.x + wall.w);
          if (cameFromX) {
            b.vx *= -1;
            b.x = prevX;
          } else {
            b.vz *= -1;
            b.z = prevZ;
          }
          b.bounces++;
        } else {
          scene.remove(b.mesh);
          bullets.splice(i, 1);
        }
        break;
      }
    }

    if (b.y <= 0) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
      continue;
    }

    if (b.from === "bot" && Math.hypot(b.x - player.x, b.z - player.z) < CHARACTER_SIZE) {
      player.hp -= 20;
      scene.remove(b.mesh);
      bullets.splice(i, 1);
      checkDeath();
      continue;
    }

    if (b.from === "player" && Math.hypot(b.x - bot.x, b.z - bot.z) < CHARACTER_SIZE) {
      bot.hp -= 20;
      scene.remove(b.mesh);
      bullets.splice(i, 1);
      checkDeath();
      continue;
    }

    if (b.life <= 0 || Math.abs(b.x) > GAME_WIDTH / 2 || Math.abs(b.z) > GAME_HEIGHT / 2) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }
}

function checkCoinCollection() {
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    if (!c.collected && Math.hypot(player.x - c.x, player.z - c.z) < CHARACTER_SIZE + c.radius) {
      c.collected = true;
      scene.remove(coinMeshes[i]);
      collectedCoins++;
      totalBankCoins++;
      coinCountDisplay.textContent = collectedCoins;
      saveUserProfile();
      updateShopUI();

      if (isTutorial && tutorialStep === 3) {
        tutorialStep = 4;
        tutorialBanner.textContent = "TUTORIAL COMPLETE! Return to menu to play!";
      }
    }
  }
}

function updateBot() {
  if (isTutorial) return;

  if (isTwoPlayer) {
    let nextX = bot.x;
    let nextZ = bot.z;
    if (keys.arrowleft) nextX -= bot.speed;
    if (keys.arrowright) nextX += bot.speed;
    if (keys.arrowup) nextZ -= bot.speed;
    if (keys.arrowdown) nextZ += bot.speed;

    if (!checkCollisionWithWalls(nextX, bot.z)) bot.x = nextX;
    if (!checkCollisionWithWalls(bot.x, nextZ)) bot.z = nextZ;
    return;
  }

  const dist = Math.hypot(player.x - bot.x, player.z - bot.z);
  if (dist > 15) {
    let dirX = (player.x - bot.x) / dist;
    let dirZ = (player.z - bot.z) / dist;

    let nextX = bot.x + dirX * bot.speed;
    let nextZ = bot.z + dirZ * bot.speed;

    let canMoveX = !checkCollisionWithWalls(nextX, bot.z);
    let canMoveZ = !checkCollisionWithWalls(bot.x, nextZ);

    if (canMoveX) bot.x = nextX;
    if (canMoveZ) bot.z = nextZ;

    if (!canMoveX && !canMoveZ) {
      bot.stuckTimer++;
      if (bot.stuckTimer > 10) {
        bot.x += dirZ * bot.speed;
        bot.z -= dirX * bot.speed;
      }
    } else {
      bot.stuckTimer = 0;
    }
  }

  botShoot();
}

function checkDeath() {
  if (isTutorial) return;
  if (player.hp <= 0) endGame(isTwoPlayer ? "Player 2 Wins!" : "Bot Wins!");
  else if (bot.hp <= 0) endGame(isTwoPlayer ? "Player 1 Wins!" : "You Win!");
}

function endGame(msg) {
  gameRunning = false;
  saveUserProfile();
  gameOverMsg.textContent = msg;
  gameOverCoins.textContent = `Coins Collected: ${collectedCoins}/5`;
  gameOverScreen.style.display = "flex";
}

function startGame(selectedDifficulty) {
  difficulty = selectedDifficulty;
  isTwoPlayer = radio2p.checked;

  applyThemeEras();
  generate3DWalls();
  generate3DCoins();

  bullets.forEach(b => scene.remove(b.mesh));
  bullets = [];

  player.x = -40; player.z = 0; player.hp = player.maxHp;
  bot.x = 40; bot.z = 0; bot.hp = bot.maxHp;

  menu.style.display = "none";
  webglContainer.style.display = "block";
  hud.style.display = "flex";
  pauseScreen.style.display = "none";
  gameOverScreen.style.display = "none";

  if (!isTutorial) {
    tutorialBanner.style.display = "none";
    skipTutorialBtn.style.display = "none";
  }

  if (gateContainer) {
    gateContainer.classList.add("active");
    setTimeout(() => gateContainer.classList.add("open"), 50);
  }

  gameRunning = true;
  paused = false;
  requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (!gameRunning) return;
  paused = !paused;
  pauseScreen.style.display = paused ? "flex" : "none";
}

function returnToMenu() {
  gameRunning = false;
  paused = false;
  isTutorial = false;
  skipTutorialBtn.style.display = "none";

  if (gateContainer) {
    gateContainer.classList.remove("open");
    setTimeout(() => {
      gateContainer.classList.remove("active");
      webglContainer.style.display = "none";
      menu.style.display = "block";
    }, 600);
  } else {
    webglContainer.style.display = "none";
    menu.style.display = "block";
  }

  saveUserProfile();
  updateShopUI();
  hud.style.display = "none";
  pauseScreen.style.display = "none";
  gameOverScreen.style.display = "none";
}

function update() {
  if (!gameRunning || paused) return;

  let nextX = player.x;
  let nextZ = player.z;

  if (keys.a) nextX -= player.speed;
  if (keys.d) nextX += player.speed;
  if (keys.w) nextZ -= player.speed;
  if (keys.s) nextZ += player.speed;

  let moved = (nextX !== player.x || nextZ !== player.z);

  if (!checkCollisionWithWalls(nextX, player.z)) {
    player.x = Math.max(-GAME_WIDTH / 2 + BORDER_PADDING, Math.min(GAME_WIDTH / 2 - BORDER_PADDING, nextX));
  }
  if (!checkCollisionWithWalls(player.x, nextZ)) {
    player.z = Math.max(-GAME_HEIGHT / 2 + BORDER_PADDING, Math.min(GAME_HEIGHT / 2 - BORDER_PADDING, nextZ));
  }

  if (isTutorial && tutorialStep === 1 && moved) {
    tutorialStep = 2;
    tutorialBanner.textContent = "TUTORIAL: Aim with mouse and click to shoot!";
  }

  playerMesh.position.set(player.x, 0, player.z);
  botMesh.position.set(bot.x, 0, bot.z);

  updateHpBar(playerHpGroup, player.hp, player.maxHp, player.x, player.z);
  updateHpBar(botHpGroup, bot.hp, bot.maxHp, bot.x, bot.z);

  if (playerShootWait > 0) playerShootWait--;
  if (botShootWait > 0) botShootWait--;

  update3DAimTarget();
  updateBot();
  updateBullets();
  checkCoinCollection();
  updateCamera3rdPerson();
}

function render() {
  renderer.render(scene, camera);
}

function gameLoop() {
  if (!gameRunning) return;
  update();
  render();
  requestAnimationFrame(gameLoop);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Event Listeners
radioBot.addEventListener("change", () => {
  diffSection.style.display = "block";
  p2Section.style.display = "none";
});

radio2p.addEventListener("change", () => {
  diffSection.style.display = "none";
  p2Section.style.display = "block";
});

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

btnLogin.addEventListener("click", () => loadUserProfile(usernameInput.value));
skinSelect.addEventListener("change", () => {
  saveUserProfile();
  updateCharacterSkins();
});

eraSlider.addEventListener("input", () => {
  applyThemeEras();
});

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === "p" && gameRunning) togglePause();
  if ((e.key === "Enter" || e.key === "Shift") && gameRunning && !paused && isTwoPlayer) player2Shoot();
});

window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

easyButton.addEventListener("click", () => startGame("easy"));
mediumButton.addEventListener("click", () => startGame("medium"));
hardButton.addEventListener("click", () => startGame("hard"));
tutorialButton.addEventListener("click", startTutorial);
start2pButton.addEventListener("click", () => startGame("medium"));

pauseButton.addEventListener("click", togglePause);
backButton.addEventListener("click", returnToMenu);
resumeButton.addEventListener("click", () => {
  paused = false;
  pauseScreen.style.display = "none";
});
quitButton.addEventListener("click", returnToMenu);
restartButton.addEventListener("click", () => startGame(difficulty));
gameOverMenuButton.addEventListener("click", returnToMenu);
skipTutorialBtn.addEventListener("click", returnToMenu);

// Load User Profile, Daily Visits & Launch Engine
loadUserProfile("Player1");
loadDailyVisits();
initThree();

window.addEventListener("load", () => {
  startTutorial();
});