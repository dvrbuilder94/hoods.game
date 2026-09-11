const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const WORLD_W = 1800;
const WORLD_H = 1200;
const keys = new Set();

const ui = {
  coins: document.getElementById("coins"),
  location: document.getElementById("location"),
  shopModal: document.getElementById("shopModal"),
  shopItems: document.getElementById("shopItems"),
};

const items = [
  { id: "iron-sword", name: "Iron Sword", slot: "weapon", price: 35, rarity: "UNCOMMON" },
  { id: "iron-helmet", name: "Iron Helmet", slot: "helmet", price: 25, rarity: "UNCOMMON" },
  { id: "leather-armor", name: "Leather Armor", slot: "armor", price: 30, rarity: "COMMON" },
  { id: "wooden-shield", name: "Wooden Shield", slot: "shield", price: 20, rarity: "COMMON" },
  { id: "ranger-boots", name: "Ranger Boots", slot: "boots", price: 18, rarity: "RARE" },
];

const state = {
  player: { x: 900, y: 760, dir: "down", moving: false, walkTime: 0 },
  camera: { x: 0, y: 0 },
  coins: 120,
  owned: new Set(),
  equipped: { helmet: null, armor: null, weapon: null, shield: null, boots: null },
  shopOpen: false,
};

const shop = { x: 1110, y: 610, w: 250, h: 170 };
const northGate = { x: 810, y: 95, w: 180, h: 70 };
const buildings = [
  { x: 345, y: 360, w: 290, h: 190, label: "INN" },
  { x: 760, y: 330, w: 260, h: 190, label: "BANK" },
  { ...shop, label: "OLD BRAM'S SHOP" },
];
const trees = [
  [160,180],[280,220],[420,140],[1450,180],[1580,250],[1660,430],[190,910],[330,1010],[1510,930],[1650,1020],
  [180,520],[1600,650],[520,1040],[1360,1060],[570,170],[1260,180]
];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rectContains(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function sx(x) { return Math.round(x - state.camera.x); }
function sy(y) { return Math.round(y - state.camera.y); }
function distanceToShop() {
  const cx = shop.x + shop.w / 2;
  const cy = shop.y + shop.h / 2;
  return Math.hypot(state.player.x - cx, state.player.y - cy);
}

function updateLocation() {
  const p = state.player;
  let label = "TOWN SQUARE";
  if (distanceToShop() < 250) label = "OLD BRAM'S SHOP";
  else if (p.y < 260) label = "NORTH GATE";
  else if (p.x < 500) label = "WEST GREEN";
  else if (p.x > 1320) label = "EAST GREEN";
  if (ui.location) ui.location.textContent = label;
}

function update(dt) {
  if (state.shopOpen) return;
  const p = state.player;
  let dx = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  let dy = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
  const len = Math.hypot(dx, dy);
  p.moving = len > 0;
  if (len) {
    dx /= len; dy /= len;
    const speed = 185;
    const nextX = clamp(p.x + dx * speed * dt, 70, WORLD_W - 70);
    const nextY = clamp(p.y + dy * speed * dt, 70, WORLD_H - 70);
    const blocked = buildings.some(b => rectContains({ x:b.x-24, y:b.y-24, w:b.w+48, h:b.h+48 }, nextX, nextY));
    if (!blocked) { p.x = nextX; p.y = nextY; }
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? "right" : "left";
    else p.dir = dy > 0 ? "down" : "up";
    p.walkTime += dt * 9;
  }

  state.camera.x = clamp(p.x - W / 2, 0, WORLD_W - W);
  state.camera.y = clamp(p.y - H / 2, 0, WORLD_H - H);
  updateLocation();
}

function drawGround() {
  ctx.fillStyle = "#6d8d45";
  ctx.fillRect(0, 0, W, H);
  const tile = 48;
  for (let wx = Math.floor(state.camera.x / tile) * tile; wx < state.camera.x + W + tile; wx += tile) {
    for (let wy = Math.floor(state.camera.y / tile) * tile; wy < state.camera.y + H + tile; wy += tile) {
      const n = ((wx / tile) * 17 + (wy / tile) * 31) % 5;
      ctx.fillStyle = n === 0 ? "#668440" : n === 1 ? "#72934a" : "#6d8d45";
      ctx.fillRect(sx(wx), sy(wy), tile, tile);
      if (n === 0) {
        ctx.fillStyle = "#547037";
        ctx.fillRect(sx(wx)+10, sy(wy)+16, 3, 5);
        ctx.fillRect(sx(wx)+32, sy(wy)+30, 2, 4);
      }
    }
  }

  // Main stone roads
  ctx.fillStyle = "#8a8678";
  ctx.fillRect(sx(805), sy(0), 190, WORLD_H);
  ctx.fillRect(sx(0), sy(670), WORLD_W, 180);
  ctx.fillStyle = "#777468";
  for (let y = 0; y < WORLD_H; y += 32) ctx.fillRect(sx(815), sy(y), 170, 2);
  for (let x = 0; x < WORLD_W; x += 36) ctx.fillRect(sx(x), sy(680), 2, 160);

  // Pond
  ctx.fillStyle = "#466f83";
  ctx.fillRect(sx(1420), sy(430), 250, 160);
  ctx.fillStyle = "#5f91a5";
  for (let y = 450; y < 570; y += 24) ctx.fillRect(sx(1440), sy(y), 205, 3);
}

function drawTree(x, y) {
  const X = sx(x), Y = sy(y);
  ctx.fillStyle = "rgba(20,30,14,.28)";
  ctx.fillRect(X-25, Y+20, 58, 14);
  ctx.fillStyle = "#5b4027";
  ctx.fillRect(X-7, Y, 14, 36);
  ctx.fillStyle = "#365e2e";
  ctx.fillRect(X-28, Y-28, 56, 38);
  ctx.fillStyle = "#477838";
  ctx.fillRect(X-20, Y-38, 42, 28);
  ctx.fillStyle = "#6b9a46";
  ctx.fillRect(X-12, Y-31, 20, 8);
}

function drawBuilding(b) {
  const X = sx(b.x), Y = sy(b.y);
  ctx.fillStyle = "rgba(20,20,15,.25)";
  ctx.fillRect(X+12, Y+14, b.w, b.h);
  ctx.fillStyle = "#6f5337";
  ctx.fillRect(X, Y+46, b.w, b.h-46);
  ctx.fillStyle = "#342c27";
  ctx.fillRect(X-10, Y+28, b.w+20, 24);
  ctx.fillStyle = "#7b3e32";
  ctx.beginPath();
  ctx.moveTo(X-14, Y+35);
  ctx.lineTo(X+b.w/2, Y-20);
  ctx.lineTo(X+b.w+14, Y+35);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d0a25d";
  ctx.fillRect(X+b.w/2-22, Y+b.h-64, 44, 64);
  ctx.fillStyle = "#b8d4d0";
  ctx.fillRect(X+28, Y+82, 35, 35);
  ctx.fillRect(X+b.w-63, Y+82, 35, 35);
  ctx.fillStyle = "#f0dcae";
  ctx.font = "700 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(b.label, X+b.w/2, Y+73);
}

function drawGate() {
  const X = sx(northGate.x), Y = sy(northGate.y);
  ctx.fillStyle = "#5c4430";
  ctx.fillRect(X, Y, 24, 100);
  ctx.fillRect(X+northGate.w-24, Y, 24, 100);
  ctx.fillStyle = "#3a3028";
  ctx.fillRect(X+20, Y+10, northGate.w-40, 18);
  ctx.fillStyle = "#d8c697";
  ctx.font = "700 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("THE WILDS — LOCKED", X+northGate.w/2, Y-10);
}

function px(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawBaseCharacter(X, Y, dir, moving, walkTime) {
  const bob = moving ? Math.round(Math.sin(walkTime) * 1.5) : 0;
  const step = moving ? Math.round(Math.sin(walkTime) * 3) : 0;
  const skin = "#d89a70";
  const skinLight = "#efb082";
  const outline = "#2a211d";
  const pants = "#71624f";
  const boots = "#3e3d3d";
  const side = dir === "left" || dir === "right";
  const flip = dir === "left" ? -1 : 1;

  ctx.save();
  ctx.translate(X, Y + bob);
  if (side && flip < 0) ctx.scale(-1, 1);

  // shadow
  ctx.globalAlpha = .22;
  px(-14, 20, 28, 7, "#000");
  ctx.globalAlpha = 1;

  if (!side) {
    // legs
    px(-10 + step, 7, 8, 18, outline); px(2 - step, 7, 8, 18, outline);
    px(-9 + step, 8, 6, 14, pants); px(3 - step, 8, 6, 14, pants);
    px(-10 + step, 20, 9, 5, boots); px(1 - step, 20, 9, 5, boots);

    // torso
    px(-12, -12, 24, 22, outline);
    px(-10, -11, 20, 19, skin);
    px(-8, -10, 16, 5, skinLight);

    // arms
    px(-17, -9, 6, 17, outline); px(11, -9, 6, 17, outline);
    px(-16, -8, 4, 15, skin); px(12, -8, 4, 15, skin);

    // head
    px(-9, -29, 18, 17, outline);
    px(-7, -28, 14, 15, skin);
    if (dir === "down") {
      px(-4, -22, 2, 2, "#2b211d"); px(3, -22, 2, 2, "#2b211d");
    }
  } else {
    px(-5 + step, 7, 8, 18, outline); px(2 - step, 9, 7, 16, outline);
    px(-4 + step, 8, 6, 14, pants); px(3 - step, 10, 5, 12, pants);
    px(-6 + step, 20, 10, 5, boots); px(2 - step, 21, 9, 4, boots);
    px(-8, -12, 15, 22, outline); px(-6, -11, 12, 19, skin);
    px(-11, -8, 5, 16, outline); px(-10, -7, 3, 14, skin);
    px(-6, -29, 15, 17, outline); px(-4, -28, 12, 15, skin);
    px(5, -22, 2, 2, "#2b211d");
  }

  ctx.restore();
}

function drawArmorLayer(X, Y, dir) {
  if (!state.equipped.armor) return;
  ctx.save(); ctx.translate(X, Y);
  const side = dir === "left" || dir === "right";
  if (dir === "left") ctx.scale(-1, 1);
  const outline = "#33271f", leather = "#7f5639", hi = "#a56f49";
  if (!side) {
    px(-11, -11, 22, 19, outline); px(-9, -9, 18, 15, leather); px(-7, -8, 14, 4, hi); px(-2, -8, 4, 15, "#5f402d");
  } else {
    px(-7, -11, 14, 19, outline); px(-5, -9, 10, 15, leather); px(-3, -8, 7, 4, hi);
  }
  ctx.restore();
}

function drawBootsLayer(X, Y, dir, moving, walkTime) {
  if (!state.equipped.boots) return;
  const step = moving ? Math.round(Math.sin(walkTime) * 3) : 0;
  ctx.save(); ctx.translate(X, Y);
  if (dir === "left") ctx.scale(-1, 1);
  const side = dir === "left" || dir === "right";
  if (!side) {
    px(-10 + step, 18, 10, 7, "#32281f"); px(0 - step, 18, 10, 7, "#32281f");
    px(-8 + step, 18, 7, 3, "#594632"); px(2 - step, 18, 7, 3, "#594632");
  } else {
    px(-6 + step, 19, 11, 6, "#32281f"); px(2 - step, 20, 9, 5, "#32281f");
  }
  ctx.restore();
}

function drawHelmetLayer(X, Y, dir) {
  if (!state.equipped.helmet) return;
  ctx.save(); ctx.translate(X, Y);
  if (dir === "left") ctx.scale(-1,1);
  const side = dir === "left" || dir === "right";
  if (!side) {
    px(-10,-31,20,10,"#3a4042"); px(-8,-29,16,8,"#aeb6b8"); px(-7,-29,14,3,"#d3dbdc");
    if (dir === "down") px(-8,-22,16,3,"#4c5355");
  } else {
    px(-7,-31,17,10,"#3a4042"); px(-5,-29,14,8,"#aeb6b8"); px(-3,-29,11,3,"#d3dbdc");
  }
  ctx.restore();
}

function drawWeaponLayer(X, Y, dir) {
  if (!state.equipped.weapon) return;
  ctx.save(); ctx.translate(X, Y);
  const side = dir === "left" || dir === "right";
  if (dir === "left") ctx.scale(-1,1);
  if (side) {
    px(10,-5,3,24,"#6d4b2f"); px(8,-11,7,15,"#c8d0d1"); px(10,-15,3,6,"#e5eded"); px(6,2,10,3,"#b07a3d");
  } else {
    px(15,-3,3,25,"#6d4b2f"); px(13,-10,7,14,"#c8d0d1"); px(15,-15,3,6,"#e5eded"); px(11,3,11,3,"#b07a3d");
  }
  ctx.restore();
}

function drawShieldLayer(X, Y, dir) {
  if (!state.equipped.shield) return;
  ctx.save(); ctx.translate(X, Y);
  if (dir === "left") ctx.scale(-1,1);
  const side = dir === "left" || dir === "right";
  const x = side ? -14 : -22;
  px(x,-6,12,18,"#4d351f"); px(x+2,-4,8,14,"#8a6038"); px(x+5,-4,2,14,"#b7864e"); px(x,0,12,2,"#3a2b20");
  ctx.restore();
}

function drawPlayer() {
  const X = sx(state.player.x), Y = sy(state.player.y);
  const p = state.player;
  drawShieldLayer(X, Y, p.dir);
  drawBaseCharacter(X, Y, p.dir, p.moving, p.walkTime);
  drawBootsLayer(X, Y, p.dir, p.moving, p.walkTime);
  drawArmorLayer(X, Y, p.dir);
  drawHelmetLayer(X, Y, p.dir);
  drawWeaponLayer(X, Y, p.dir);

  ctx.textAlign = "center";
  ctx.font = "700 12px monospace";
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillText("Hood", X+1, Y-39);
  ctx.fillStyle = "#f4ead2";
  ctx.fillText("Hood", X, Y-40);
}

function drawNpc() {
  const x = sx(shop.x + shop.w/2), y = sy(shop.y + shop.h + 42);
  ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(x-12,y+15,24,6);
  px(x-7,y-17,14,16,"#c4875e"); px(x-10,y-1,20,17,"#5c4733"); px(x-8,y+16,6,12,"#3e3c37"); px(x+2,y+16,6,12,"#3e3c37");
  ctx.fillStyle = "#f3e4bf"; ctx.font = "700 11px monospace"; ctx.textAlign = "center"; ctx.fillText("OLD BRAM", x, y-24);
  if (distanceToShop() < 180 && !state.shopOpen) {
    ctx.fillStyle = "rgba(18,18,14,.88)"; ctx.fillRect(x-76,y-66,152,24);
    ctx.strokeStyle = "#9f8c62"; ctx.strokeRect(x-76,y-66,152,24);
    ctx.fillStyle = "#f3e4bf"; ctx.fillText("Press E to trade", x, y-50);
  }
}

function render() {
  drawGround();
  trees.forEach(t => drawTree(t[0], t[1]));
  buildings.forEach(drawBuilding);
  drawGate();
  drawNpc();
  drawPlayer();
}

function renderShop() {
  if (!ui.shopItems) return;
  ui.shopItems.innerHTML = "";
  items.forEach(item => {
    const owned = state.owned.has(item.id);
    const equipped = state.equipped[item.slot] === item.id;
    const row = document.createElement("button");
    row.className = "shop-item" + (equipped ? " equipped" : "");
    row.innerHTML = `<span><b>${item.name}</b><small>${item.slot.toUpperCase()} · ${item.rarity}</small></span><strong>${equipped ? "EQUIPPED" : owned ? "EQUIP" : `${item.price} COINS`}</strong>`;
    row.addEventListener("click", () => {
      if (!owned) {
        if (state.coins < item.price) return;
        state.coins -= item.price;
        state.owned.add(item.id);
      }
      state.equipped[item.slot] = item.id;
      if (ui.coins) ui.coins.textContent = state.coins;
      renderShop();
    });
    ui.shopItems.appendChild(row);
  });
}

function openShop() {
  if (distanceToShop() > 190) return;
  state.shopOpen = true;
  if (ui.shopModal) ui.shopModal.hidden = false;
  renderShop();
}
function closeShop() {
  state.shopOpen = false;
  if (ui.shopModal) ui.shopModal.hidden = true;
}

window.addEventListener("keydown", e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.add(key);
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  if (key === "e") openShop();
  if (key === "Escape") closeShop();
});
window.addEventListener("keyup", e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));

const touchMap = { up:"ArrowUp", down:"ArrowDown", left:"ArrowLeft", right:"ArrowRight" };
document.querySelectorAll("[data-key]").forEach(button => {
  const mapped = touchMap[button.dataset.key];
  button.addEventListener("pointerdown", e => { e.preventDefault(); keys.add(mapped); });
  ["pointerup","pointercancel","pointerleave"].forEach(name => button.addEventListener(name, () => keys.delete(mapped)));
});

document.querySelectorAll("[data-close-shop]").forEach(button => button.addEventListener("click", closeShop));
if (ui.coins) ui.coins.textContent = state.coins;

let last = performance.now();
function frame(now) {
  const dt = Math.min(.033, (now-last)/1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
