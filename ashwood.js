// Hoods v0.6 — Ashwood Trail combat slice with zone loot + mini-boss.
const ASHWOOD_SAVE_KEY="hoods-ashwood-v06";
const ashwoodState={
  loot:{"Ashwood Fang":0,"Charred Token":0,"Warden Crest":0},
  bossDefeated:false,
  kills:0
};

function loadAshwood(){
  try{
    const raw=localStorage.getItem(ASHWOOD_SAVE_KEY);if(!raw)return;
    const saved=JSON.parse(raw);
    if(saved.loot&&typeof saved.loot==="object")Object.keys(ashwoodState.loot).forEach(k=>ashwoodState.loot[k]=Math.max(0,Math.floor(saved.loot[k]||0)));
    ashwoodState.bossDefeated=!!saved.bossDefeated;
    ashwoodState.kills=Math.max(0,Math.floor(saved.kills||0));
  }catch(_){}
}
function saveAshwood(){try{localStorage.setItem(ASHWOOD_SAVE_KEY,JSON.stringify(ashwoodState));}catch(_){}}
loadAshwood();

function makeAshMob(name,x,y,hp,attack,speed,coins,xp,drop,dropChance,kind,boss=false){
  return {name,x,y,spawnX:x,spawnY:y,hp,maxHp:hp,attack,speed,coins,xp,drop,dropChance,kind,boss,alive:!(boss&&ashwoodState.bossDefeated),respawnAt:0,attackAt:0,hitFlashUntil:0};
}

const ashwood={
  mobs:[
    makeAshMob("Thorn Wolf",1565,620,70,12,78,24,22,"Ashwood Fang",0.5,"wolf"),
    makeAshMob("Ash Bandit",1645,845,105,16,64,34,34,"Charred Token",0.35,"bandit"),
    makeAshMob("Grove Warden",1730,690,190,20,50,75,70,"Warden Crest",1,"warden",true)
  ]
};

function ashwoodActive(){return typeof inAshwood==="function"&&inAshwood()&&worldState?.ashwoodUnlocked;}
function ashDistance(m){return Math.hypot(state.player.x-m.x,state.player.y-m.y);}
function nearestAshMob(){return ashwood.mobs.filter(m=>m.alive).sort((a,b)=>ashDistance(a)-ashDistance(b))[0]||null;}
function respawnAshMob(m){if(m.boss&&ashwoodState.bossDefeated)return;m.alive=true;m.hp=m.maxHp;m.x=m.spawnX;m.y=m.spawnY;m.attackAt=0;}

function addAshLoot(name){ashwoodState.loot[name]=(ashwoodState.loot[name]||0)+1;saveAshwood();renderInventory();}
function rollAshDrop(m){
  if(m.boss){addAshLoot("Warden Crest");return "Warden Crest";}
  const luckBonus=Math.max(0,getStats().luck-1)*0.015;
  if(Math.random()<=Math.min(.8,m.dropChance+luckBonus)){addAshLoot(m.drop);return m.drop;}
  return null;
}

function attackAshwood(){
  if(!ashwoodActive()||modalOpen())return;
  const now=performance.now();
  if(now<wilds.playerAttackAt)return;
  wilds.playerAttackAt=now+430;wilds.attackAnimUntil=now+180;wilds.attackDir=state.player.dir;
  const mob=nearestAshMob();
  if(!mob||ashDistance(mob)>90){showCombatMessage("No Ashwood enemy in range");return;}
  const damage=Math.max(1,getStats().attack+3+Math.floor(Math.random()*4));
  mob.hp=Math.max(0,mob.hp-damage);mob.hitFlashUntil=now+120;showCombatMessage(`${mob.name} · -${damage} HP`,700);
  if(mob.hp>0)return;

  mob.alive=false;
  if(mob.boss){
    ashwoodState.bossDefeated=true;
  }else{
    mob.respawnAt=now+6500+Math.random()*2500;
  }
  state.coins+=mob.coins;progression.kills++;ashwoodState.kills++;
  const drop=rollAshDrop(mob);
  saveAshwood();saveGame();saveProgression();updateUI();updateProgressionUI();
  addXp(mob.xp);
  if(mob.boss){
    showCombatMessage(`Grove Warden defeated · +${mob.coins} Coins · +${mob.xp} XP · Warden Crest`,2400);
  }else{
    showCombatMessage(`${mob.name} defeated · +${mob.coins} Coins · +${mob.xp} XP${drop?` · ${drop}`:""}`,1900);
  }
}

window.hoodsHooks=window.hoodsHooks||{};
const priorOutsideAttack=window.hoodsHooks.onAttackOutsideWilds;
window.hoodsHooks.onAttackOutsideWilds=()=>{
  if(ashwoodActive())attackAshwood();
  else if(typeof priorOutsideAttack==="function")priorOutsideAttack();
};

function updateAshwood(dt){
  if(!ashwoodActive()||modalOpen())return;
  const now=performance.now();
  ashwood.mobs.forEach(m=>{
    if(!m.alive){if(!m.boss&&now>=m.respawnAt)respawnAshMob(m);return;}
    const dx=state.player.x-m.x,dy=state.player.y-m.y,dist=Math.hypot(dx,dy);
    const aggro=m.boss?300:225;
    if(dist>40&&dist<aggro){m.x=clamp(m.x+(dx/dist)*m.speed*dt,1505,1760);m.y=clamp(m.y+(dy/dist)*m.speed*dt,500,1010);}
    if(dist<=44&&now>=m.attackAt){
      m.attackAt=now+(m.boss?850:1050);
      const damage=Math.max(1,m.attack-Math.floor(getStats().defense/2));
      state.player.hp-=damage;showCombatMessage(`${m.name} hits -${damage}`,800);
      if(state.player.hp<=0){
        state.player.x=900;state.player.y=760;state.player.hp=getStats().hp;
        ashwood.mobs.filter(x=>!x.boss).forEach(respawnAshMob);
        if(!ashwoodState.bossDefeated)respawnAshMob(ashwood.mobs.find(x=>x.boss));
        showCombatMessage("Ashwood defeated you · returned to Town",1900);
      }
    }
  });
  syncPlayerHealth();
}

const ashwoodBaseUpdate=update;
update=function(dt){ashwoodBaseUpdate(dt);updateAshwood(dt);};

function drawAshMob(m){
  if(!m.alive)return;
  const X=sx(m.x),Y=sy(m.y),flash=performance.now()<m.hitFlashUntil;
  px(X-18,Y+14,36,6,"rgba(0,0,0,.25)");
  if(m.kind==="wolf"){
    px(X-17,Y-8,32,19,flash?"#e4d9b2":"#6f6449");px(X+8,Y-13,15,15,flash?"#efe5c3":"#84775a");px(X+17,Y-10,3,3,"#16140f");px(X-13,Y+9,6,8,"#3b362c");px(X+7,Y+9,6,8,"#3b362c");
  }else if(m.kind==="bandit"){
    px(X-12,Y-30,24,17,flash?"#f0d0ad":"#b97c58");px(X-16,Y-13,32,28,flash?"#d8c7a8":"#4e4033");px(X-12,Y+13,9,12,"#2a2926");px(X+3,Y+13,9,12,"#2a2926");px(X-20,Y-9,4,26,"#8b6f48");
  }else{
    px(X-18,Y-34,36,22,flash?"#f0d9b5":"#8c6b47");px(X-22,Y-13,44,34,flash?"#dfccb1":"#4d5a3f");px(X-15,Y+18,11,14,"#292d27");px(X+4,Y+18,11,14,"#292d27");px(X+21,Y-12,5,35,"#c0a25c");px(X-25,Y-13,5,35,"#c0a25c");
  }
  ctx.fillStyle=m.boss?"#dfeeaa":"#efe3bf";ctx.font=`700 ${m.boss?11:10}px monospace`;ctx.textAlign="center";ctx.fillText(m.boss?`★ ${m.name.toUpperCase()} ★`:m.name,X,Y-41);
  const w=m.boss?66:46;px(X-w/2,Y-34,w,5,"#331c18");px(X-w/2,Y-34,w*(m.hp/m.maxHp),5,m.boss?"#b9ef5a":"#c95f42");
}

function drawAshwoodHud(){
  if(!ashwoodActive())return;
  const mob=nearestAshMob();ctx.textAlign="center";ctx.font="700 11px monospace";
  if(mob&&ashDistance(mob)<115){px(W/2-118,H-105,236,25,"rgba(10,12,8,.84)");ctx.fillStyle="#f3e4bf";ctx.fillText(`SPACE / F · ATTACK ${mob.name.toUpperCase()}`,W/2,H-88);}
  if(!ashwoodState.bossDefeated){ctx.fillStyle="#dfeeaa";ctx.fillText("ASHWOOD OBJECTIVE · DEFEAT THE GROVE WARDEN",W/2,92);}
  else{ctx.fillStyle="#dfeeaa";ctx.fillText("GROVE WARDEN DEFEATED",W/2,92);}
}

const ashwoodBaseRender=render;
render=function(){ashwoodBaseRender();if(worldState?.ashwoodUnlocked){ashwood.mobs.forEach(drawAshMob);drawAshwoodHud();}};

const ashwoodBaseInventory=renderInventory;
renderInventory=function(){
  ashwoodBaseInventory();
  if(!ui.inventoryItems)return;
  Object.entries(ashwoodState.loot).filter(([,count])=>count>0).forEach(([name,count])=>{
    const row=document.createElement("div");row.className="inventory-item loot-item";
    row.innerHTML=`<span class="item-swatch"></span><span><b>${name}</b><small>ASHWOOD DROP · ${name==="Warden Crest"?"BOSS TROPHY":"MATERIAL"}</small></span><strong>×${count}</strong>`;
    ui.inventoryItems.appendChild(row);
  });
};

renderInventory();
