// Hoods v0.7 — Warden Crest payoff + third zone.
const CINDER_SAVE_KEY="hoods-cinder-v07";
const cinderState={unlocked:false,rewardClaimed:false,kills:0,loot:{"Ember Shard":0,"Bone Fragment":0}};

function loadCinder(){
  try{
    const raw=localStorage.getItem(CINDER_SAVE_KEY);if(!raw)return;
    const s=JSON.parse(raw);
    cinderState.unlocked=!!s.unlocked;cinderState.rewardClaimed=!!s.rewardClaimed;cinderState.kills=Math.max(0,Math.floor(s.kills||0));
    if(s.loot)Object.keys(cinderState.loot).forEach(k=>cinderState.loot[k]=Math.max(0,Math.floor(s.loot[k]||0)));
  }catch(_){}
}
function saveCinder(){try{localStorage.setItem(CINDER_SAVE_KEY,JSON.stringify(cinderState));}catch(_){}}
loadCinder();

const wardenBlade={id:"warden-blade",name:"Warden Blade",slot:"weapon",price:0,rarity:"RARE",stats:{attack:9,luck:1}};
function ensureWardenBlade(){if(!items.some(i=>i.id===wardenBlade.id))items.push(wardenBlade);}
if(cinderState.rewardClaimed){ensureWardenBlade();state.owned.add(wardenBlade.id);saveGame();}

const crestShrine={x:1700,y:940};
const cinderPortal={x:190,y:930};
const inCinder=()=>cinderState.unlocked&&state.player.x<370&&state.player.y>790;
const distanceToShrine=()=>Math.hypot(state.player.x-crestShrine.x,state.player.y-crestShrine.y);
const distanceToCinderPortal=()=>Math.hypot(state.player.x-cinderPortal.x,state.player.y-cinderPortal.y);

const crestModal=document.createElement("div");crestModal.className="shop-modal";crestModal.hidden=true;
crestModal.innerHTML=`<div class="shop-card"><div class="shop-title"><div><small>ASHWOOD RELIC</small><h2>Warden Shrine</h2></div><button id="closeCrest" type="button">×</button></div><div id="crestBody"></div></div>`;
document.querySelector(".arena-wrap")?.appendChild(crestModal);
const crestBody=document.getElementById("crestBody");

function hasCrest(){return (ashwoodState?.loot?.["Warden Crest"]||0)>0;}
function renderCrest(){
  if(!crestBody)return;
  if(!hasCrest()&&!cinderState.rewardClaimed){crestBody.innerHTML='<p class="shop-note">The stone is dormant. The Grove Warden carries the key.</p>';return;}
  if(!cinderState.rewardClaimed){
    crestBody.innerHTML='<p class="shop-note">The Warden Crest fits the old seal. Claim the Warden Blade and awaken the passage to Cinder Hollow.</p><button class="quest-action" id="claimCrestReward">USE WARDEN CREST</button>';
    document.getElementById("claimCrestReward")?.addEventListener("click",claimCrestReward);return;
  }
  crestBody.innerHTML='<p class="shop-note">The seal is open. The Warden Blade is yours.</p><div class="dialogue-reward">WARDEN BLADE · +9 ATTACK · +1 LUCK</div><button class="quest-action" id="enterCinder">ENTER CINDER HOLLOW</button>';
  document.getElementById("enterCinder")?.addEventListener("click",enterCinder);
}
function openCrest(){if(distanceToShrine()>105)return;closeShop();closeInventory();if(typeof closeQuest==="function")closeQuest();if(typeof closeDialogue==="function")closeDialogue();state.crestOpen=true;keys.clear();crestModal.hidden=false;renderCrest();}
function closeCrest(){state.crestOpen=false;keys.clear();crestModal.hidden=true;}
const cinderBaseModalOpen=modalOpen;modalOpen=function(){return cinderBaseModalOpen()||!!state.crestOpen;};

document.getElementById("closeCrest")?.addEventListener("click",closeCrest);crestModal.addEventListener("click",e=>{if(e.target===crestModal)closeCrest();});

function claimCrestReward(){
  if(cinderState.rewardClaimed||!hasCrest())return;
  cinderState.rewardClaimed=true;cinderState.unlocked=true;ensureWardenBlade();state.owned.add(wardenBlade.id);state.equipped.weapon=wardenBlade.id;
  saveCinder();saveGame();updateUI();renderInventory();renderShop();renderCrest();showCombatMessage("Warden Blade claimed · Cinder Hollow unlocked",2200);
}
function enterCinder(){if(!cinderState.unlocked)return;closeCrest();state.player.x=230;state.player.y=910;state.camera.x=0;showCombatMessage("Entered Cinder Hollow",1300);}
function leaveCinder(){state.player.x=1640;state.player.y=920;showCombatMessage("Returned to Ashwood Trail",1300);}

function makeCinderMob(name,x,y,hp,attack,speed,coins,xp,drop,chance,kind){return{name,x,y,spawnX:x,spawnY:y,hp,maxHp:hp,attack,speed,coins,xp,drop,chance,kind,alive:true,respawnAt:0,attackAt:0,hitFlashUntil:0};}
const cinder={mobs:[
  makeCinderMob("Cinder Imp",120,850,95,16,78,32,32,"Ember Shard",.5,"imp"),
  makeCinderMob("Bone Sentry",315,1030,140,20,48,44,45,"Bone Fragment",.4,"sentry")
]};
function cinderDistance(m){return Math.hypot(state.player.x-m.x,state.player.y-m.y);}
function nearestCinderMob(){return cinder.mobs.filter(m=>m.alive).sort((a,b)=>cinderDistance(a)-cinderDistance(b))[0]||null;}
function respawnCinder(m){m.alive=true;m.hp=m.maxHp;m.x=m.spawnX;m.y=m.spawnY;m.attackAt=0;}
function rollCinderDrop(m){if(Math.random()<=Math.min(.8,m.chance+Math.max(0,getStats().luck-1)*.015)){cinderState.loot[m.drop]=(cinderState.loot[m.drop]||0)+1;saveCinder();renderInventory();return m.drop;}return null;}

function attackCinder(){
  if(!inCinder()||modalOpen())return;const now=performance.now();if(now<wilds.playerAttackAt)return;
  wilds.playerAttackAt=now+430;wilds.attackAnimUntil=now+180;wilds.attackDir=state.player.dir;
  const m=nearestCinderMob();if(!m||cinderDistance(m)>90){showCombatMessage("No Cinder enemy in range");return;}
  const damage=Math.max(1,getStats().attack+4+Math.floor(Math.random()*4));m.hp=Math.max(0,m.hp-damage);m.hitFlashUntil=now+120;showCombatMessage(`${m.name} · -${damage} HP`,700);
  if(m.hp>0)return;m.alive=false;m.respawnAt=now+7000+Math.random()*2500;state.coins+=m.coins;progression.kills++;cinderState.kills++;
  const drop=rollCinderDrop(m);saveCinder();saveGame();saveProgression();updateUI();updateProgressionUI();addXp(m.xp);showCombatMessage(`${m.name} defeated · +${m.coins} Coins · +${m.xp} XP${drop?` · ${drop}`:""}`,1900);
}
const cinderPriorAttack=window.hoodsHooks?.onAttackOutsideWilds;window.hoodsHooks=window.hoodsHooks||{};window.hoodsHooks.onAttackOutsideWilds=()=>{if(inCinder())attackCinder();else if(typeof cinderPriorAttack==="function")cinderPriorAttack();};

function updateCinder(dt){
  if(!inCinder()||modalOpen())return;const now=performance.now();cinder.mobs.forEach(m=>{if(!m.alive){if(now>=m.respawnAt)respawnCinder(m);return;}const dx=state.player.x-m.x,dy=state.player.y-m.y,dist=Math.hypot(dx,dy);if(dist>40&&dist<240){m.x=clamp(m.x+(dx/dist)*m.speed*dt,70,350);m.y=clamp(m.y+(dy/dist)*m.speed*dt,815,1120);}if(dist<=44&&now>=m.attackAt){m.attackAt=now+1000;const damage=Math.max(1,m.attack-Math.floor(getStats().defense/2));state.player.hp-=damage;showCombatMessage(`${m.name} hits -${damage}`,800);if(state.player.hp<=0){state.player.x=900;state.player.y=760;state.player.hp=getStats().hp;cinder.mobs.forEach(respawnCinder);showCombatMessage("Cinder Hollow defeated you · returned to Town",1900);}}});syncPlayerHealth();
}
const cinderBaseUpdate=update;update=function(dt){cinderBaseUpdate(dt);updateCinder(dt);};
const cinderBaseLocation=updateLocation;updateLocation=function(){cinderBaseLocation();if(inCinder()&&ui.location)ui.location.textContent="CINDER HOLLOW";};

function interactCinder(){if(distanceToShrine()<=105){openCrest();return true;}if(inCinder()&&distanceToCinderPortal()<=95){leaveCinder();return true;}return false;}
window.addEventListener("keydown",e=>{if((e.key||"").toLowerCase()==="e"&&interactCinder())e.preventDefault();if(e.key==="Escape")closeCrest();});
document.getElementById("interactButton")?.addEventListener("click",()=>interactCinder());

function drawCrestShrine(){if(!worldState?.ashwoodUnlocked)return;const X=sx(crestShrine.x),Y=sy(crestShrine.y);px(X-20,Y-28,40,48,"#4a4539");px(X-14,Y-22,28,34,hasCrest()||cinderState.rewardClaimed?"#71844f":"#31352d");px(X-5,Y-13,10,15,cinderState.rewardClaimed?"#b9ef5a":"#8b7450");ctx.fillStyle="#efe3bf";ctx.font="700 10px monospace";ctx.textAlign="center";ctx.fillText("WARDEN SHRINE",X,Y-38);if(distanceToShrine()<120&&!modalOpen()){px(X-72,Y-70,144,22,"rgba(10,12,8,.84)");ctx.fillStyle="#f3e4bf";ctx.fillText("Press E to inspect",X,Y-54);}}
function drawCinderGround(){if(!inCinder())return;ctx.fillStyle="rgba(72,32,23,.35)";ctx.fillRect(0,0,W,H);for(let x=40;x<W;x+=95){px(x,420+(x%4)*18,5,5,"rgba(232,105,55,.35)");}const X=sx(cinderPortal.x),Y=sy(cinderPortal.y);px(X-22,Y-30,44,55,"#372c29");px(X-14,Y-22,28,39,"#9a4e35");ctx.fillStyle="#f1d0aa";ctx.font="700 10px monospace";ctx.textAlign="center";ctx.fillText("ASHWOOD RETURN",X,Y-40);}
function drawCinderMob(m){if(!m.alive||!inCinder())return;const X=sx(m.x),Y=sy(m.y),flash=performance.now()<m.hitFlashUntil;px(X-17,Y+14,34,6,"rgba(0,0,0,.25)");if(m.kind==="imp"){px(X-13,Y-24,26,17,flash?"#f3d4b2":"#a94f36");px(X-16,Y-8,32,25,flash?"#e6b092":"#713728");px(X-13,Y+15,8,10,"#352720");px(X+5,Y+15,8,10,"#352720");px(X-12,Y-29,5,8,"#d48645");px(X+7,Y-29,5,8,"#d48645");}else{px(X-12,Y-29,24,18,flash?"#f4ebd5":"#c6bda5");px(X-15,Y-12,30,30,flash?"#e4dbc6":"#777263");px(X-12,Y+16,8,11,"#514d43");px(X+4,Y+16,8,11,"#514d43");px(X+17,Y-8,4,28,"#9e8c63");}ctx.fillStyle="#f3e4bf";ctx.font="700 10px monospace";ctx.textAlign="center";ctx.fillText(m.name,X,Y-37);px(X-23,Y-31,46,5,"#331c18");px(X-23,Y-31,46*(m.hp/m.maxHp),5,"#d86a40");}
const cinderBaseRender=render;render=function(){cinderBaseRender();drawCrestShrine();drawCinderGround();if(inCinder()){cinder.mobs.forEach(drawCinderMob);ctx.fillStyle="#efc19b";ctx.font="700 11px monospace";ctx.textAlign="center";ctx.fillText("CINDER HOLLOW · EMBER SHARDS + BONE FRAGMENTS",W/2,92);}};

const cinderBaseInventory=renderInventory;renderInventory=function(){cinderBaseInventory();if(!ui.inventoryItems)return;Object.entries(cinderState.loot).filter(([,n])=>n>0).forEach(([name,count])=>{const row=document.createElement("div");row.className="inventory-item loot-item";row.innerHTML=`<span class="item-swatch"></span><span><b>${name}</b><small>CINDER DROP · MATERIAL</small></span><strong>×${count}</strong>`;ui.inventoryItems.appendChild(row);});};

updateUI();renderInventory();renderShop();
