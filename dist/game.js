const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const atlas = new Image();
atlas.src = "assets/hoods-atlas.webp";

const ui = {
  score: document.getElementById("score"),
  wave: document.getElementById("wave"),
  health: document.getElementById("healthBar"),
  healthText: document.getElementById("healthText"),
  gameOver: document.getElementById("gameOver"),
  finalScore: document.getElementById("finalScore"),
};

const keys = new Set();
let skin = 0;
let state;
let last = performance.now();

function reset() {
  state = {
    player: { x: W / 2, y: H / 2, r: 25, hp: 100, cooldown: 0 },
    arrows: [],
    enemies: [],
    particles: [],
    score: 0,
    time: 0,
    nextSpawn: 0,
    over: false,
  };
  ui.gameOver.hidden = true;
  updateHud();
}

function updateHud() {
  ui.score.textContent = state.score;
  ui.wave.textContent = Math.floor(state.time / 18) + 1;
  ui.health.style.width = `${Math.max(0, state.player.hp)}%`;
  ui.healthText.textContent = `${Math.ceil(Math.max(0, state.player.hp))} HP`;
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  const margin = 35;
  let x = side === 1 ? W + margin : side === 3 ? -margin : Math.random() * W;
  let y = side === 0 ? -margin : side === 2 ? H + margin : Math.random() * H;
  const type = Math.floor(Math.random() * 3);
  state.enemies.push({ x, y, r: 22 + type * 2, type, hp: 1 + (type === 2 ? 1 : 0), speed: 42 + Math.random() * 18 + state.time * .25, hit: 0 });
}

function shootAt(x, y) {
  if (state.over || state.player.cooldown > 0) return;
  const dx = x - state.player.x;
  const dy = y - state.player.y;
  const len = Math.hypot(dx, dy) || 1;
  state.arrows.push({ x: state.player.x, y: state.player.y, vx: dx / len * 520, vy: dy / len * 520, life: 1.4 });
  state.player.cooldown = .22;
}

function nearestShot() {
  if (!state.enemies.length) return shootAt(state.player.x + 100, state.player.y);
  const e = state.enemies.reduce((best, next) => {
    const bd = Math.hypot(best.x - state.player.x, best.y - state.player.y);
    const nd = Math.hypot(next.x - state.player.x, next.y - state.player.y);
    return nd < bd ? next : best;
  });
  shootAt(e.x, e.y);
}

function update(dt) {
  if (state.over) return;
  state.time += dt;
  state.player.cooldown -= dt;
  const p = state.player;
  let dx = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  let dy = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
  const len = Math.hypot(dx, dy) || 1;
  p.x = Math.max(34, Math.min(W - 34, p.x + dx / len * 190 * dt));
  p.y = Math.max(34, Math.min(H - 34, p.y + dy / len * 190 * dt));

  state.nextSpawn -= dt;
  if (state.nextSpawn <= 0) {
    spawnEnemy();
    state.nextSpawn = Math.max(.42, 1.05 - state.time * .008);
  }

  state.arrows.forEach(a => { a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt; });
  state.arrows = state.arrows.filter(a => a.life > 0 && a.x > -20 && a.x < W + 20 && a.y > -20 && a.y < H + 20);

  for (const e of state.enemies) {
    const ex = p.x - e.x;
    const ey = p.y - e.y;
    const el = Math.hypot(ex, ey) || 1;
    e.x += ex / el * e.speed * dt;
    e.y += ey / el * e.speed * dt;
    e.hit -= dt;
    if (el < p.r + e.r && e.hit <= 0) {
      p.hp -= 13;
      e.hit = .7;
      e.x -= ex / el * 28;
      e.y -= ey / el * 28;
    }
  }

  for (const a of state.arrows) {
    for (const e of state.enemies) {
      if (a.life <= 0 || e.hp <= 0) continue;
      if (Math.hypot(a.x - e.x, a.y - e.y) < e.r + 5) {
        a.life = 0;
        e.hp -= 1;
        for (let i = 0; i < 7; i++) state.particles.push({ x: e.x, y: e.y, vx: (Math.random() - .5) * 90, vy: (Math.random() - .5) * 90, life: .5 });
        if (e.hp <= 0) state.score += 10 + e.type * 5;
      }
    }
  }
  state.enemies = state.enemies.filter(e => e.hp > 0);
  state.particles.forEach(particle => { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt; });
  state.particles = state.particles.filter(particle => particle.life > 0);

  if (p.hp <= 0) {
    state.over = true;
    ui.finalScore.textContent = state.score;
    ui.gameOver.hidden = false;
  }
  updateHud();
}

function drawGrid() {
  const gradient = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 600);
  gradient.addColorStop(0, "#26331c");
  gradient.addColorStop(1, "#10150e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(172, 203, 117, .055)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = "rgba(185, 239, 90, .14)";
  ctx.strokeRect(22, 22, W - 44, H - 44);
}

function drawAtlasToken(entity, col, row, size) {
  const cellW = atlas.width / 3;
  const cellH = atlas.height / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(atlas, col * cellW, row * cellH, cellW, cellH, entity.x - size / 2, entity.y - size / 2, size, size);
  ctx.restore();
  ctx.strokeStyle = row === 0 ? "#c7ee75" : "#715e64";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, size / 2, 0, Math.PI * 2);
  ctx.stroke();
}

function render() {
  drawGrid();
  if (atlas.complete && atlas.naturalWidth) {
    state.enemies.forEach(e => drawAtlasToken(e, e.type, 1, e.r * 2.5));
    drawAtlasToken(state.player, skin, 0, 82);
  }

  ctx.fillStyle = "#d8f69b";
  state.arrows.forEach(a => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(a.vy, a.vx));
    ctx.fillRect(-8, -2, 17, 4);
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -5); ctx.lineTo(4, 5); ctx.fill();
    ctx.restore();
  });
  ctx.fillStyle = "#d7f08e";
  state.particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillRect(p.x, p.y, 3, 3); });
  ctx.globalAlpha = 1;
}

function frame(now) {
  const dt = Math.min(.033, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.add(key);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  if (e.key === " ") nearestShot();
});
window.addEventListener("keyup", e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));

canvas.addEventListener("pointerdown", e => {
  const rect = canvas.getBoundingClientRect();
  shootAt((e.clientX - rect.left) * W / rect.width, (e.clientY - rect.top) * H / rect.height);
});

document.querySelectorAll("[data-skin]").forEach(button => button.addEventListener("click", () => {
  skin = Number(button.dataset.skin);
  document.querySelectorAll("[data-skin]").forEach((item, index) => {
    item.classList.toggle("active", index === skin);
    item.querySelector(".skin-price small").textContent = index === skin ? "EQUIPPED" : index === 0 ? "FREE" : "PREVIEW";
  });
}));

const touchMap = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
document.querySelectorAll("[data-key]").forEach(button => {
  const mapped = touchMap[button.dataset.key];
  button.addEventListener("pointerdown", e => { e.preventDefault(); keys.add(mapped); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(name => button.addEventListener(name, () => keys.delete(mapped)));
});
document.getElementById("fireButton").addEventListener("pointerdown", nearestShot);
document.getElementById("restartButton").addEventListener("click", reset);
document.getElementById("walletButton").addEventListener("click", e => {
  e.currentTarget.textContent = "TESTNET SOON";
  setTimeout(() => { e.currentTarget.textContent = "CONNECT WALLET"; }, 1800);
});

reset();
requestAnimationFrame(frame);
