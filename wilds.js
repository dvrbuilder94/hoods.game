// Hoods v0.3 — compact combat/progression layer kept separate from the town core.
const WILDS_SAVE_KEY = "hoods-wilds-v03";

const progression = {
  level: 1,
  xp: 0,
  kills: 0,
  loot: { "Rat Tail": 0, "Slime Core": 0, "Rusted Badge": 0 }
};

function xpNeeded(level){ return 40 + (level - 1) * 25; }
function loadProgression(){
  try {
    const raw=localStorage.getItem(WILDS_SAVE_KEY); if(!raw) return;
    const saved=JSON.parse(raw);
    if(Number.isFinite(saved.level)) progression.level=Math.max(1,Math.floor(saved.level));
    if(Number.isFinite(saved.xp)) progression.xp=Math.max(0,Math.floor(saved.xp));
    if(Number.isFinite(saved.kills)) progression.kills=Math.max(0,Math.floor(saved.kills));
    if(saved.loot && typeof saved.loot==="object") Object.keys(progression.loot).forEach(k=>progression.loot[k]=Math.max(0,Math.floor(saved.loot[k]||0)));
  } catch (_) {}
}
function saveProgression(){
  try { localStorage.setItem(WILDS_SAVE_KEY, JSON.stringify(progression)); } catch (_) {}
}
loadProgression();

const baseGetStats=getStats;
getStats=function(){
  const stats=baseGetStats();
  stats.hp += (progression.level-1)*5;
  stats.attack += Math.floor((progression.level-1)/2);
  return stats;
};

function makeMob(name,x,y,hp,attack,speed,coins,xp,drop,dropChance,kind){
  return {name,x,y,spawnX:x,spawnY:y,hp,maxHp:hp,attack,speed,coins,xp,drop,dropChance,kind,alive:true,respawnAt:0,attackAt:0,hitFlashUntil:0};
}

const wilds = {
  zoneY: 260,
  mobs: [
    makeMob("Bog Rat",760,165,40,8,62,12,12,"Rat Tail",0.45,"rat"),
    makeMob("Mire Slime",920,105,60,10,44,18,18,"Slime Core",0.35,"slime"),
    makeMob("Wild Thug",1085,185,85,13,68,28,28,"Rusted Badge",0.25,"thug")
  ],
  playerAttackAt: 0,
  attackAnimUntil: 0,
  attackDir: "down",
  message: "",
  messageUntil: 0
};

northGate.y = 285;
state.player.hp = getStats().hp;

const healthBarEl = document.getElementById("healthBar");
const healthTextEl = document.getElementById("healthText");
const levelBadgeEl = document.getElementById("levelBadge");
const xpEl = document.getElementById("statXp");
const killsEl = document.getElementById("statKills");

function inWilds(){ return state.player.y < wilds.zoneY; }
function mobDistance(mob){ return Math.hypot(state.player.x-mob.x, state.player.y-mob.y); }
function showCombatMessage(text, ms=1100){ wilds.message=text; wilds.messageUntil=performance.now()+ms; }
function livingMobs(){ return wilds.mobs.filter(m=>m.alive); }
function nearestMob(){ return livingMobs().sort((a,b)=>mobDistance(a)-mobDistance(b))[0] || null; }

function updateProgressionUI(){
  if(levelBadgeEl) levelBadgeEl.textContent=`LEVEL ${progression.level}`;
  if(xpEl) xpEl.textContent=`${progression.xp}/${xpNeeded(progression.level)}`;
  if(killsEl) killsEl.textContent=progression.kills;
}

function addXp(amount){
  progression.xp += amount;
  let leveled=false;
  while(progression.xp>=xpNeeded(progression.level)){
    progression.xp-=xpNeeded(progression.level);
    progression.level++;
    leveled=true;
  }
  if(leveled){
    state.player.hp=getStats().hp;
    showCombatMessage(`LEVEL UP · Level ${progression.level}`,1900);
  }
  saveProgression(); updateProgressionUI(); updateUI(); syncPlayerHealth();
}

function syncPlayerHealth(){
  const maxHp=getStats().hp;
  if(!Number.isFinite(state.player.hp)) state.player.hp=maxHp;
  state.player.hp=clamp(state.player.hp,0,maxHp);
  if(healthBarEl) healthBarEl.style.width=`${(state.player.hp/maxHp)*100}%`;
  if(healthTextEl) healthTextEl.textContent=`${Math.ceil(state.player.hp)} / ${maxHp} HP`;
}

function rollDrop(mob){
  const luckBonus=Math.max(0,getStats().luck-1)*0.015;
  if(Math.random()<=Math.min(0.75,mob.dropChance+luckBonus)){
    progression.loot[mob.drop]=(progression.loot[mob.drop]||0)+1;
    saveProgression();
    renderInventory();
    window.hoodsHooks?.onLoot?.(mob.drop, progression.loot[mob.drop]);
    return mob.drop;
  }
  return null;
}

function playerAttack(){
  if(modalOpen() || !inWilds()) return;
  const now=performance.now();
  if(now<wilds.playerAttackAt) return;
  wilds.playerAttackAt=now+430;
  wilds.attackAnimUntil=now+180;
  wilds.attackDir=state.player.dir;
  const mob=nearestMob();
  if(!mob || mobDistance(mob)>88){ showCombatMessage("No enemy in range"); return; }
  const damage=Math.max(1,getStats().attack+2+Math.floor(Math.random()*3));
  mob.hp=Math.max(0,mob.hp-damage);
  mob.hitFlashUntil=now+120;
  showCombatMessage(`${mob.name} · -${damage} HP`,700);
  if(mob.hp<=0){
    mob.alive=false;
    mob.respawnAt=now+5000+Math.random()*2500;
    state.coins+=mob.coins;
    progression.kills++;
    const drop=rollDrop(mob);
    saveGame(); saveProgression(); updateUI(); updateProgressionUI();
    window.hoodsHooks?.onMobDefeated?.(mob, drop);
    const reward=`+${mob.coins} Coins · +${mob.xp} XP${drop?` · ${drop}`:""}`;
    showCombatMessage(`${mob.name} defeated · ${reward}`,2000);
    addXp(mob.xp);
  }
}

function respawnMob(mob){ mob.alive=true;mob.hp=mob.maxHp;mob.x=mob.spawnX;mob.y=mob.spawnY;mob.attackAt=0; }
function resetWildsMobs(){ wilds.mobs.forEach(respawnMob); }

function updateMobs(dt){
  if(modalOpen()) return;
  const now=performance.now();
  wilds.mobs.forEach(mob=>{
    if(!mob.alive){ if(now>=mob.respawnAt) respawnMob(mob); return; }
    if(!inWilds()) return;
    const dx=state.player.x-mob.x,dy=state.player.y-mob.y,dist=Math.hypot(dx,dy);
    if(dist>38 && dist<245){
      mob.x=clamp(mob.x+(dx/dist)*mob.speed*dt,600,1200);
      mob.y=clamp(mob.y+(dy/dist)*mob.speed*dt,65,wilds.zoneY-16);
    }
    if(dist<=43 && now>=mob.attackAt){
      mob.attackAt=now+1050;
      const damage=Math.max(1,mob.attack-Math.floor(getStats().defense/2));
      state.player.hp-=damage;
      showCombatMessage(`${mob.name} hits -${damage}`,800);
      if(state.player.hp<=0){
        state.player.x=900;state.player.y=760;state.player.hp=getStats().hp;
        resetWildsMobs();
        showCombatMessage("Knocked out · returned to Town",1900);
      }
    }
  });
  syncPlayerHealth();
}

const townUpdate=update;
update=function(dt){ townUpdate(dt); updateMobs(dt); syncPlayerHealth(); };

const townUpdateLocation=updateLocation;
updateLocation=function(){
  townUpdateLocation();
  if(inWilds() && ui.location) ui.location.textContent="THE WILDS";
};

const townDrawGround=drawGround;
drawGround=function(){
  townDrawGround();
  const bottom=sy(wilds.zoneY);
  if(bottom>0){
    ctx.fillStyle="rgba(39,71,35,.45)";ctx.fillRect(0,0,W,Math.min(H,bottom));
    for(let x=30;x<W;x+=95){
      px(x,Math.max(8,bottom-155+(x%4)*13),5,5,"rgba(177,199,94,.28)");
      if(x%190===30) px(x+24,Math.max(12,bottom-105),11,8,"rgba(62,79,43,.42)");
    }
  }
};

drawGate=function(){
  const X=sx(northGate.x),Y=sy(northGate.y);
  px(X,Y,24,100,"#5c4430");px(X+northGate.w-24,Y,24,100,"#5c4430");px(X+20,Y+10,northGate.w-40,18,"#3a3028");
  ctx.fillStyle="#d8c697";ctx.font="700 12px monospace";ctx.textAlign="center";ctx.fillText("THE WILDS — OPEN",X+northGate.w/2,Y-10);
};

function drawMob(mob){
  if(!mob.alive) return;
  const X=sx(mob.x),Y=sy(mob.y),flash=performance.now()<mob.hitFlashUntil;
  px(X-16,Y+12,32,6,"rgba(0,0,0,.22)");
  if(mob.kind==="rat"){
    px(X-15,Y-8,30,20,flash?"#d7c38d":"#66523a");px(X+9,Y-5,11,12,flash?"#ead6a2":"#7b6243");px(X+16,Y-2,2,2,"#17140f");px(X-10,Y+9,5,7,"#352b22");px(X+6,Y+9,5,7,"#352b22");
  } else if(mob.kind==="slime"){
    px(X-17,Y-9,34,22,flash?"#d8ef9a":"#5f8c4b");px(X-13,Y-14,26,9,flash?"#e5f4b0":"#76a85c");px(X-8,Y-3,3,3,"#172014");px(X+6,Y-3,3,3,"#172014");
  } else {
    px(X-12,Y-29,24,17,flash?"#f1d2b3":"#ba7e59");px(X-15,Y-12,30,25,flash?"#d9c6a2":"#5d4937");px(X-12,Y+11,9,12,"#2c2c2a");px(X+3,Y+11,9,12,"#2c2c2a");px(X+15,Y-7,3,24,"#a8afb0");
  }
  ctx.fillStyle="#efe3bf";ctx.font="700 10px monospace";ctx.textAlign="center";ctx.fillText(mob.name,X,Y-36);
  px(X-23,Y-30,46,5,"#331c18");px(X-23,Y-30,46*(mob.hp/mob.maxHp),5,"#c95f42");
}

function drawAttackAnimation(){
  const now=performance.now();if(now>=wilds.attackAnimUntil)return;
  const X=sx(state.player.x),Y=sy(state.player.y),p=(wilds.attackAnimUntil-now)/180;
  let ox=0,oy=0;
  if(wilds.attackDir==="up")oy=-31;else if(wilds.attackDir==="down")oy=31;else if(wilds.attackDir==="left")ox=-31;else ox=31;
  ctx.save();ctx.strokeStyle=`rgba(244,234,210,${0.35+0.65*p})`;ctx.lineWidth=4;ctx.beginPath();
  ctx.arc(X+ox,Y+oy,20,-1.0,0.85);ctx.stroke();ctx.restore();
}

function drawWildsHint(){
  if(!inWilds()) return;
  const mob=nearestMob();ctx.textAlign="center";ctx.font="700 11px monospace";
  if(mob && mobDistance(mob)<112){px(W/2-105,H-73,210,25,"rgba(10,12,8,.82)");ctx.fillStyle="#f3e4bf";ctx.fillText(`SPACE / F · ATTACK ${mob.name.toUpperCase()}`,W/2,H-56);}
  if(performance.now()<wilds.messageUntil){px(W/2-175,42,350,29,"rgba(10,12,8,.85)");ctx.fillStyle="#dfeeaa";ctx.fillText(wilds.message,W/2,61);}
}

const townRender=render;
render=function(){ townRender(); wilds.mobs.forEach(drawMob); drawAttackAnimation(); drawWildsHint(); };

const baseRenderInventory=renderInventory;
renderInventory=function(){
  baseRenderInventory();
  if(!ui.inventoryItems)return;
  const entries=Object.entries(progression.loot).filter(([,count])=>count>0);
  if(!entries.length)return;
  entries.forEach(([name,count])=>{
    const row=document.createElement("div");row.className="inventory-item loot-item";
    row.innerHTML=`<span class="item-swatch"></span><span><b>${name}</b><small>WILDS DROP · MATERIAL</small></span><strong>×${count}</strong>`;
    ui.inventoryItems.appendChild(row);
  });
};

window.addEventListener("keydown",e=>{
  if(e.code==="Space" || e.key.toLowerCase()==="f"){e.preventDefault();playerAttack();}
});

const mobileActions=document.querySelector(".mobile-actions");
if(mobileActions){
  const attack=document.createElement("button");attack.type="button";attack.id="attackButton";attack.textContent="⚔";attack.setAttribute("aria-label","Attack");
  attack.style.cssText="width:52px;height:52px;border:1px solid #c98749;background:rgba(91,48,29,.9);font-weight:900;font-size:18px;touch-action:none";
  attack.addEventListener("click",playerAttack);mobileActions.prepend(attack);
}

updateProgressionUI();updateUI();renderInventory();syncPlayerHealth();
