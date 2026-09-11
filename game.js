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
  { id: "iron-sword", name: "Iron Sword", slot: "weapon", price: 35, color: "#bfc4c4" },
  { id: "iron-helmet", name: "Iron Helmet", slot: "helmet", price: 25, color: "#aeb5b5" },
  { id: "leather-armor", name: "Leather Armor", slot: "armor", price: 30, color: "#8a5b3d" },
  { id: "wooden-shield", name: "Wooden Shield", slot: "shield", price: 20, color: "#8f6339" },
  { id: "ranger-boots", name: "Ranger Boots", slot: "boots", price: 18, color: "#5f4a34" },
];

const state = {
  player: { x: 900, y: 760, dir: "down", moving: false, hp: 100 },
  camera: { x: 0, y: 0 },
  coins: 120,
  owned: new Set(),
  equipped: { helmet: null, armor: null, weapon: null, shield: null, boots: "Basic Boots" },
  shopOpen: false,
};

const shop = { x: 1110, y: 610, w: 250, h: 170 };
const northGate = { x: 810, y: 95, w: 180, h: 70 };

const trees = [
  [160,180],[280,220],[420,140],[1450,180],[1580,250],[1660,430],[190,910],[330,1010],[1510,930],[1650,1020],
  [180,520],[1600,650],[520,1040],[1360,1060],[570,170],[1260,180]
];

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rectContains(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
function distanceToShop() {
  const cx = shop.x + shop.w / 2;
  const cy = shop.y + shop.h / 2;
  return Math.hypot(state.player.x - cx, state.player.y - cy);
}

function updateLocation() {
  const p = state.player;
  let label = "TOWN SQUARE";
  if (distanceToShop() < 240) label = "OLD BRAM'S SHOP";
  else if (p.y < 260) label = "NORTH GATE";
  else if (p.x < 500) label = "WEST GREEN";
  else if (p.x > 1320) label = "EAST GREEN";
  ui.location.textContent = label;
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
    const blockedByShop = rectContains({x:shop.x-28,y:shop.y-28,w:shop.w+56,h:shop.h+56}, nextX, nextY);
    if (!blockedByShop) { p.x = nextX; p.y = nextY; }
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? "right" : "left";
    else p.dir = dy > 0 ? "down" : "up";
  }

  state.camera.x = clamp(p.x - W / 2, 0, WORLD_W - W);
  state.camera.y = clamp(p.y - H / 2, 0, WORLD_H - H);
  updateLocation();
}

function worldToScreen(x, y) { return [x - state.camera.x, y - state.camera.y]; }

function drawGround() {
  ctx.fillStyle = "#6c8a4a";
  ctx.fillRect(0, 0, W, H);
  const tile = 48;
  ctx.strokeStyle = "rgba(35,55,29,.11)";
  for (let x = -(state.camera.x % tile); x < W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
  }
  for (let y = -(state.camera.y % tile); y < H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
  }
}

function drawPath() {
  const [x1,y1] = worldToScreen(735, 0);
  ctx.fillStyle = "#b7a071";
  ctx.fillRect(x1, y1, 330, WORLD_H);
  const [x2,y2] = worldToScreen(0, 650);
  ctx.fillRect(x2, y2, WORLD_W, 230);
  ctx.strokeStyle = "rgba(90,68,42,.25)";
  ctx.lineWidth = 3;
  for (let y = 680; y < 860; y += 38) {
    const [sx,sy] = worldToScreen(0,y);
    ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(W,sy); ctx.stroke();
  }
}

function drawTree(wx, wy) {
  const [x,y] = worldToScreen(wx,wy);
  if (x < -80 || x > W+80 || y < -100 || y > H+100) return;
  ctx.fillStyle = "#563d2c"; ctx.fillRect(x-8,y+18,16,34);
  ctx.fillStyle = "#36592c"; ctx.beginPath(); ctx.arc(x,y,33,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "#4d7438"; ctx.beginPath(); ctx.arc(x-16,y-8,23,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+18,y-10,20,0,Math.PI*2); ctx.fill();
}

function drawBuilding(r, wall, roof, sign) {
  const [x,y] = worldToScreen(r.x,r.y);
  ctx.fillStyle = wall; ctx.fillRect(x,y+44,r.w,r.h-44);
  ctx.fillStyle = roof; ctx.fillRect(x-14,y,r.w+28,62);
  ctx.fillStyle = "#2c2117"; ctx.fillRect(x+r.w/2-23,y+r.h-62,46,62);
  ctx.fillStyle = "#e7d6a5"; ctx.font = "bold 15px monospace"; ctx.textAlign = "center";
  ctx.fillText(sign,x+r.w/2,y+30);
}

function drawGate() {
  const [x,y] = worldToScreen(northGate.x,northGate.y);
  ctx.fillStyle = "#4e4336";
  ctx.fillRect(x,y,24,90); ctx.fillRect(x+northGate.w-24,y,24,90); ctx.fillRect(x,y,northGate.w,20);
  ctx.fillStyle = "#d6c48d"; ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
  ctx.fillText("THE WILDS — LOCKED",x+northGate.w/2,y-12);
}

function drawNPC() {
  const [x,y] = worldToScreen(shop.x-45, shop.y+115);
  drawPerson(x,y,{shirt:"#774b30",pants:"#3f352d",boots:"#242321",name:"OLD BRAM",bald:false});
  if (distanceToShop() < 220 && !state.shopOpen) {
    ctx.fillStyle = "rgba(12,15,10,.88)"; ctx.strokeStyle = "#b9ef5a"; ctx.lineWidth = 1;
    ctx.fillRect(x-55,y-86,110,28); ctx.strokeRect(x-55,y-86,110,28);
    ctx.fillStyle = "#e9f7ca"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("E  SHOP",x,y-67);
  }
}

function drawPerson(x,y,opts={}) {
  const skin = opts.skin || "#d89b73";
  const shirt = opts.shirt || "#d89b73";
  const pants = opts.pants || "#5a513e";
  const boots = opts.boots || "#2d2e2c";
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(0,23,18,7,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = boots; ctx.fillRect(-13,14,10,14); ctx.fillRect(3,14,10,14);
  ctx.fillStyle = pants; ctx.fillRect(-14,-6,28,23);
  ctx.fillStyle = shirt; ctx.fillRect(-16,-28,32,24);
  ctx.fillStyle = skin; ctx.fillRect(-21,-25,6,20); ctx.fillRect(15,-25,6,20);
  ctx.fillStyle = skin; ctx.fillRect(-12,-48,24,22);
  ctx.fillStyle = "#27231e"; ctx.fillRect(-13,-49,26,5);
  ctx.restore();
  if (opts.name) {
    ctx.fillStyle = "#f3efd9"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.fillText(opts.name,x,y-58);
  }
}

function drawPlayer() {
  const [x,y] = worldToScreen(state.player.x,state.player.y);
  drawPerson(x,y,{name:"HOOD"});

  if (state.equipped.armor) {
    ctx.fillStyle = "rgba(119,74,43,.88)"; ctx.fillRect(x-15,y-29,30,23);
  }
  if (state.equipped.helmet) {
    ctx.fillStyle = "#aeb5b5"; ctx.fillRect(x-13,y-50,26,10); ctx.fillRect(x-15,y-44,4,10); ctx.fillRect(x+11,y-44,4,10);
  }
  if (state.equipped.weapon) {
    ctx.strokeStyle = "#d2d6d6"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x+21,y-15); ctx.lineTo(x+35,y-42); ctx.stroke();
    ctx.strokeStyle = "#60442b"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x+18,y-8); ctx.lineTo(x+24,y-20); ctx.stroke();
  }
  if (state.equipped.shield) {
    ctx.fillStyle = "#8f6339"; ctx.beginPath(); ctx.arc(x-25,y-16,12,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#c79a5e"; ctx.lineWidth = 2; ctx.stroke();
  }
}

function render() {
  drawGround();
  drawPath();
  trees.forEach(t => drawTree(...t));
  drawBuilding(shop,"#8d7655","#4d3528","SHOP");
  drawBuilding({x:520,y:500,w:210,h:150},"#897b68","#493b32","INN");
  drawBuilding({x:1380,y:520,w:210,h:150},"#8a7455","#503a28","BANK");
  drawGate();
  drawNPC();
  drawPlayer();
}

function openShop() {
  if (distanceToShop() > 230) return;
  state.shopOpen = true;
  ui.shopModal.hidden = false;
  renderShop();
}

function closeShop() {
  state.shopOpen = false;
  ui.shopModal.hidden = true;
}

function renderShop() {
  ui.shopItems.innerHTML = "";
  for (const item of items) {
    const owned = state.owned.has(item.id);
    const equipped = state.equipped[item.slot] === item.name;
    const button = document.createElement("button");
    button.className = "shop-item";
    button.innerHTML = `<span class="item-swatch" style="background:${item.color}"></span><span><b>${item.name}</b><small>${item.slot.toUpperCase()}</small></span><strong>${equipped ? "EQUIPPED" : owned ? "EQUIP" : `${item.price} C`}</strong>`;
    button.addEventListener("click", () => {
      if (!owned) {
        if (state.coins < item.price) return;
        state.coins -= item.price;
        state.owned.add(item.id);
        ui.coins.textContent = state.coins;
      }
      state.equipped[item.slot] = item.name;
      syncEquipmentUI();
      renderShop();
    });
    ui.shopItems.appendChild(button);
  }
}

function syncEquipmentUI() {
  document.getElementById("slotHelmet").textContent = state.equipped.helmet || "Empty";
  document.getElementById("slotArmor").textContent = state.equipped.armor || "Empty";
  document.getElementById("slotWeapon").textContent = state.equipped.weapon || "Empty";
  document.getElementById("slotShield").textContent = state.equipped.shield || "Empty";
  document.getElementById("slotBoots").textContent = state.equipped.boots || "Basic Boots";
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(.033,(now-last)/1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.add(key);
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  if (key === "e") state.shopOpen ? closeShop() : openShop();
  if (key === "Escape") closeShop();
});
window.addEventListener("keyup", e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));

document.querySelectorAll("[data-key]").forEach(button => {
  const map = {up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"};
  const mapped = map[button.dataset.key];
  button.addEventListener("pointerdown",e=>{e.preventDefault();keys.add(mapped);});
  ["pointerup","pointercancel","pointerleave"].forEach(name=>button.addEventListener(name,()=>keys.delete(mapped)));
});
document.getElementById("interactButton").addEventListener("pointerdown",()=>state.shopOpen?closeShop():openShop());
document.getElementById("closeShop").addEventListener("click",closeShop);
document.getElementById("walletButton").addEventListener("click",e=>{e.currentTarget.textContent="COMING LATER";});

syncEquipmentUI();
ui.coins.textContent = state.coins;
requestAnimationFrame(frame);
