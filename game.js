const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width, H = canvas.height, WORLD_W = 1800, WORLD_H = 1200;
const keys = new Set();
const ui = {
  coins: document.getElementById("coins"), location: document.getElementById("location"),
  shopModal: document.getElementById("shopModal"), shopItems: document.getElementById("shopItems"),
  slots: { helmet: document.getElementById("slotHelmet"), armor: document.getElementById("slotArmor"), weapon: document.getElementById("slotWeapon"), shield: document.getElementById("slotShield"), boots: document.getElementById("slotBoots") }
};
const items = [
  {id:"iron-sword",name:"Iron Sword",slot:"weapon",price:35,rarity:"UNCOMMON"},
  {id:"iron-helmet",name:"Iron Helmet",slot:"helmet",price:25,rarity:"UNCOMMON"},
  {id:"leather-armor",name:"Leather Armor",slot:"armor",price:30,rarity:"COMMON"},
  {id:"wooden-shield",name:"Wooden Shield",slot:"shield",price:20,rarity:"COMMON"},
  {id:"ranger-boots",name:"Ranger Boots",slot:"boots",price:18,rarity:"RARE"}
];
const state = { player:{x:900,y:760,dir:"down",moving:false,walkTime:0}, camera:{x:0,y:0}, coins:120, owned:new Set(), equipped:{helmet:null,armor:null,weapon:null,shield:null,boots:null}, shopOpen:false };
const shop={x:1110,y:610,w:250,h:170}, northGate={x:810,y:95,w:180,h:70};
const buildings=[{x:345,y:360,w:290,h:190,label:"INN"},{x:760,y:330,w:260,h:190,label:"BANK"},{...shop,label:"OLD BRAM'S SHOP"}];
const trees=[[160,180],[280,220],[420,140],[1450,180],[1580,250],[1660,430],[190,910],[330,1010],[1510,930],[1650,1020],[180,520],[1600,650],[520,1040],[1360,1060],[570,170],[1260,180]];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rectContains=(r,x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
const sx=x=>Math.round(x-state.camera.x), sy=y=>Math.round(y-state.camera.y);
const distanceToShop=()=>Math.hypot(state.player.x-(shop.x+shop.w/2),state.player.y-(shop.y+shop.h/2));
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function updateLocation(){let l="TOWN SQUARE",p=state.player;if(distanceToShop()<250)l="OLD BRAM'S SHOP";else if(p.y<260)l="NORTH GATE";else if(p.x<500)l="WEST GREEN";else if(p.x>1320)l="EAST GREEN";if(ui.location)ui.location.textContent=l;}
function updateEquipmentUI(){Object.entries(ui.slots).forEach(([slot,el])=>{if(!el)return;const id=state.equipped[slot];const item=items.find(i=>i.id===id);el.textContent=item?item.name:(slot==="boots"?"Basic Boots":"Empty");});}
function update(dt){if(state.shopOpen)return;let p=state.player,dx=(keys.has("ArrowRight")||keys.has("d")?1:0)-(keys.has("ArrowLeft")||keys.has("a")?1:0),dy=(keys.has("ArrowDown")||keys.has("s")?1:0)-(keys.has("ArrowUp")||keys.has("w")?1:0),len=Math.hypot(dx,dy);p.moving=len>0;if(len){dx/=len;dy/=len;let nx=clamp(p.x+dx*185*dt,70,WORLD_W-70),ny=clamp(p.y+dy*185*dt,70,WORLD_H-70);let blocked=buildings.some(b=>rectContains({x:b.x-24,y:b.y-24,w:b.w+48,h:b.h+48},nx,ny));if(!blocked){p.x=nx;p.y=ny;}p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");p.walkTime+=dt*9;}state.camera.x=clamp(p.x-W/2,0,WORLD_W-W);state.camera.y=clamp(p.y-H/2,0,WORLD_H-H);updateLocation();}
function drawGround(){ctx.fillStyle="#6d8d45";ctx.fillRect(0,0,W,H);let t=48;for(let x=Math.floor(state.camera.x/t)*t;x<state.camera.x+W+t;x+=t)for(let y=Math.floor(state.camera.y/t)*t;y<state.camera.y+H+t;y+=t){let n=((x/t)*17+(y/t)*31)%5;ctx.fillStyle=n===0?"#668440":n===1?"#72934a":"#6d8d45";ctx.fillRect(sx(x),sy(y),t,t);}ctx.fillStyle="#8a8678";ctx.fillRect(sx(805),sy(0),190,WORLD_H);ctx.fillRect(sx(0),sy(670),WORLD_W,180);ctx.fillStyle="#466f83";ctx.fillRect(sx(1420),sy(430),250,160);}
function drawTree(x,y){let X=sx(x),Y=sy(y);px(X-7,Y,14,36,"#5b4027");px(X-28,Y-28,56,38,"#365e2e");px(X-20,Y-38,42,28,"#477838");px(X-12,Y-31,20,8,"#6b9a46");}
function drawBuilding(b){let X=sx(b.x),Y=sy(b.y);px(X,Y+46,b.w,b.h-46,"#6f5337");px(X-10,Y+28,b.w+20,24,"#342c27");ctx.fillStyle="#7b3e32";ctx.beginPath();ctx.moveTo(X-14,Y+35);ctx.lineTo(X+b.w/2,Y-20);ctx.lineTo(X+b.w+14,Y+35);ctx.closePath();ctx.fill();px(X+b.w/2-22,Y+b.h-64,44,64,"#d0a25d");ctx.fillStyle="#f0dcae";ctx.font="700 13px monospace";ctx.textAlign="center";ctx.fillText(b.label,X+b.w/2,Y+73);}
function drawGate(){let X=sx(northGate.x),Y=sy(northGate.y);px(X,Y,24,100,"#5c4430");px(X+northGate.w-24,Y,24,100,"#5c4430");px(X+20,Y+10,northGate.w-40,18,"#3a3028");ctx.fillStyle="#d8c697";ctx.font="700 12px monospace";ctx.textAlign="center";ctx.fillText("THE WILDS — LOCKED",X+northGate.w/2,Y-10);}
function drawBaseCharacter(X,Y,dir,moving,time){let bob=moving?Math.round(Math.sin(time)*1.5):0,step=moving?Math.round(Math.sin(time)*3):0,side=dir==="left"||dir==="right";ctx.save();ctx.translate(X,Y+bob);if(dir==="left")ctx.scale(-1,1);px(-14,20,28,7,"rgba(0,0,0,.22)");if(!side){px(-10+step,7,8,18,"#2a211d");px(2-step,7,8,18,"#2a211d");px(-9+step,8,6,14,"#71624f");px(3-step,8,6,14,"#71624f");px(-12,-12,24,22,"#2a211d");px(-10,-11,20,19,"#d89a70");px(-17,-9,6,17,"#2a211d");px(11,-9,6,17,"#2a211d");px(-16,-8,4,15,"#d89a70");px(12,-8,4,15,"#d89a70");px(-9,-29,18,17,"#2a211d");px(-7,-28,14,15,"#d89a70");}else{px(-5+step,7,8,18,"#2a211d");px(2-step,9,7,16,"#2a211d");px(-4+step,8,6,14,"#71624f");px(3-step,10,5,12,"#71624f");px(-8,-12,15,22,"#2a211d");px(-6,-11,12,19,"#d89a70");px(-6,-29,15,17,"#2a211d");px(-4,-28,12,15,"#d89a70");}ctx.restore();}
function drawEquipment(X,Y,dir,moving,time){let flip=dir==="left",side=dir==="left"||dir==="right";ctx.save();ctx.translate(X,Y);if(flip)ctx.scale(-1,1);if(state.equipped.armor){px(side?-7:-11,-11,side?14:22,19,"#33271f");px(side?-5:-9,-9,side?10:18,15,"#7f5639");}if(state.equipped.helmet){px(side?-7:-10,-31,side?17:20,10,"#3a4042");px(side?-5:-8,-29,side?14:16,8,"#aeb6b8");}if(state.equipped.weapon){px(side?10:15,-5,3,25,"#6d4b2f");px(side?8:13,-11,7,15,"#c8d0d1");}if(state.equipped.shield){let x=side?-14:-22;px(x,-6,12,18,"#4d351f");px(x+2,-4,8,14,"#8a6038");}if(state.equipped.boots){let st=moving?Math.round(Math.sin(time)*3):0;px(-10+st,18,10,7,"#32281f");px(0-st,18,10,7,"#32281f");}ctx.restore();}
function drawPlayer(){let X=sx(state.player.x),Y=sy(state.player.y),p=state.player;drawBaseCharacter(X,Y,p.dir,p.moving,p.walkTime);drawEquipment(X,Y,p.dir,p.moving,p.walkTime);ctx.textAlign="center";ctx.font="700 12px monospace";ctx.fillStyle="#f4ead2";ctx.fillText("Hood",X,Y-40);}
function drawNpc(){let x=sx(shop.x+shop.w/2),y=sy(shop.y+shop.h+42);px(x-7,y-17,14,16,"#c4875e");px(x-10,y-1,20,17,"#5c4733");px(x-8,y+16,6,12,"#3e3c37");px(x+2,y+16,6,12,"#3e3c37");ctx.fillStyle="#f3e4bf";ctx.font="700 11px monospace";ctx.textAlign="center";ctx.fillText("OLD BRAM",x,y-24);if(distanceToShop()<190&&!state.shopOpen){px(x-76,y-66,152,24,"rgba(18,18,14,.88)");ctx.fillStyle="#f3e4bf";ctx.fillText("Press E to trade",x,y-50);}}
function render(){drawGround();trees.forEach(t=>drawTree(...t));buildings.forEach(drawBuilding);drawGate();drawNpc();drawPlayer();}
function renderShop(){if(!ui.shopItems)return;ui.shopItems.innerHTML="";items.forEach(item=>{let owned=state.owned.has(item.id),equipped=state.equipped[item.slot]===item.id,row=document.createElement("button");row.className="shop-item"+(equipped?" equipped":"");row.innerHTML=`<span class="item-swatch"></span><span><b>${item.name}</b><small>${item.slot.toUpperCase()} · ${item.rarity}</small></span><strong>${equipped?"EQUIPPED":owned?"EQUIP":`${item.price} COINS`}</strong>`;row.onclick=()=>{if(!owned){if(state.coins<item.price)return;state.coins-=item.price;state.owned.add(item.id);}state.equipped[item.slot]=item.id;if(ui.coins)ui.coins.textContent=state.coins;updateEquipmentUI();renderShop();};ui.shopItems.appendChild(row);});}
function openShop(){if(distanceToShop()>190)return;state.shopOpen=true;keys.clear();if(ui.shopModal)ui.shopModal.hidden=false;renderShop();}
function closeShop(){state.shopOpen=false;keys.clear();if(ui.shopModal)ui.shopModal.hidden=true;}
window.addEventListener("keydown",e=>{let key=e.key.length===1?e.key.toLowerCase():e.key;keys.add(key);if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if(key==="e")state.shopOpen?closeShop():openShop();if(key==="Escape")closeShop();});
window.addEventListener("keyup",e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
const touchMap={up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"};
document.querySelectorAll("[data-key]").forEach(b=>{let mapped=touchMap[b.dataset.key];b.addEventListener("pointerdown",e=>{e.preventDefault();keys.add(mapped);});["pointerup","pointercancel","pointerleave"].forEach(n=>b.addEventListener(n,()=>keys.delete(mapped)));});
document.getElementById("interactButton")?.addEventListener("click",()=>state.shopOpen?closeShop():openShop());
document.getElementById("closeShop")?.addEventListener("click",closeShop);
ui.shopModal?.addEventListener("click",e=>{if(e.target===ui.shopModal)closeShop();});
if(ui.coins)ui.coins.textContent=state.coins;updateEquipmentUI();
let last=performance.now();function frame(now){let dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(frame);}requestAnimationFrame(frame);