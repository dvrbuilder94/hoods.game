// Hoods v0.2 — first combat slice. Kept separate so the current town loop stays easy to debug.
const wilds = {
  zoneY: 260,
  mob: { name: "Bog Rat", x: 900, y: 155, spawnX: 900, spawnY: 155, hp: 40, maxHp: 40, alive: true, respawnAt: 0, attackAt: 0 },
  playerAttackAt: 0,
  hitFlashUntil: 0,
  message: "",
  messageUntil: 0
};

northGate.y = 285;
state.player.hp = getStats().hp;

const healthBarEl = document.getElementById("healthBar");
const healthTextEl = document.getElementById("healthText");

function inWilds(){ return state.player.y < wilds.zoneY; }
function mobDistance(){ return Math.hypot(state.player.x-wilds.mob.x, state.player.y-wilds.mob.y); }
function showCombatMessage(text, ms=1100){ wilds.message=text; wilds.messageUntil=performance.now()+ms; }

function syncPlayerHealth(){
  const maxHp=getStats().hp;
  if(!Number.isFinite(state.player.hp)) state.player.hp=maxHp;
  state.player.hp=clamp(state.player.hp,0,maxHp);
  if(healthBarEl) healthBarEl.style.width=`${(state.player.hp/maxHp)*100}%`;
  if(healthTextEl) healthTextEl.textContent=`${Math.ceil(state.player.hp)} / ${maxHp} HP`;
}

function playerAttack(){
  if(modalOpen() || !inWilds() || !wilds.mob.alive) return;
  const now=performance.now();
  if(now<wilds.playerAttackAt) return;
  wilds.playerAttackAt=now+430;
  if(mobDistance()>82){ showCombatMessage("Too far away"); return; }
  const damage=Math.max(1,getStats().attack+2);
  wilds.mob.hp=Math.max(0,wilds.mob.hp-damage);
  wilds.hitFlashUntil=now+110;
  showCombatMessage(`-${damage} HP`);
  if(wilds.mob.hp<=0){
    wilds.mob.alive=false;
    wilds.mob.respawnAt=now+4500;
    state.coins+=12;
    saveGame(); updateUI();
    showCombatMessage("Bog Rat defeated · +12 Coins",1800);
  }
}

function updateMob(dt){
  if(modalOpen()) return;
  const mob=wilds.mob, now=performance.now();
  if(!mob.alive){
    if(now>=mob.respawnAt){ mob.alive=true; mob.hp=mob.maxHp; mob.x=mob.spawnX; mob.y=mob.spawnY; }
    return;
  }
  if(!inWilds()) return;
  const dx=state.player.x-mob.x, dy=state.player.y-mob.y, dist=Math.hypot(dx,dy);
  if(dist>38 && dist<260){
    mob.x=clamp(mob.x+(dx/dist)*62*dt,620,1180);
    mob.y=clamp(mob.y+(dy/dist)*62*dt,70,wilds.zoneY-18);
  }
  if(dist<=42 && now>=mob.attackAt){
    mob.attackAt=now+1050;
    const defense=getStats().defense;
    const damage=Math.max(1,8-Math.floor(defense/2));
    state.player.hp-=damage;
    showCombatMessage(`Bog Rat hits -${damage}`,900);
    if(state.player.hp<=0){
      state.player.x=900; state.player.y=760; state.player.hp=getStats().hp;
      mob.x=mob.spawnX; mob.y=mob.spawnY;
      showCombatMessage("You were knocked out · returned to Town",1900);
    }
  }
  syncPlayerHealth();
}

const townUpdate=update;
update=function(dt){
  townUpdate(dt);
  updateMob(dt);
  syncPlayerHealth();
};

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
    ctx.fillStyle="rgba(39,71,35,.42)";
    ctx.fillRect(0,0,W,Math.min(H,bottom));
    for(let x=40;x<W;x+=110){
      px(x,Math.max(8,bottom-155+(x%3)*14),5,5,"rgba(177,199,94,.28)");
    }
  }
};

drawGate=function(){
  const X=sx(northGate.x),Y=sy(northGate.y);
  px(X,Y,24,100,"#5c4430"); px(X+northGate.w-24,Y,24,100,"#5c4430");
  px(X+20,Y+10,northGate.w-40,18,"#3a3028");
  ctx.fillStyle="#d8c697"; ctx.font="700 12px monospace"; ctx.textAlign="center";
  ctx.fillText("THE WILDS — OPEN",X+northGate.w/2,Y-10);
};

function drawBogRat(){
  const mob=wilds.mob;
  if(!mob.alive) return;
  const X=sx(mob.x),Y=sy(mob.y), flash=performance.now()<wilds.hitFlashUntil;
  px(X-14,Y+11,28,6,"rgba(0,0,0,.22)");
  px(X-15,Y-8,30,20,flash?"#d7c38d":"#66523a");
  px(X+9,Y-5,11,12,flash?"#ead6a2":"#7b6243");
  px(X+16,Y-2,2,2,"#17140f");
  px(X-10,Y+9,5,7,"#352b22"); px(X+6,Y+9,5,7,"#352b22");
  ctx.fillStyle="#efe3bf";ctx.font="700 10px monospace";ctx.textAlign="center";ctx.fillText(mob.name,X,Y-24);
  px(X-22,Y-19,44,5,"#331c18"); px(X-22,Y-19,44*(mob.hp/mob.maxHp),5,"#c95f42");
}

function drawWildsHint(){
  if(!inWilds()) return;
  ctx.textAlign="center";ctx.font="700 11px monospace";
  if(wilds.mob.alive && mobDistance()<105){
    px(W/2-93,H-73,186,25,"rgba(10,12,8,.82)");ctx.fillStyle="#f3e4bf";ctx.fillText("SPACE / F · ATTACK",W/2,H-56);
  }
  if(performance.now()<wilds.messageUntil){
    px(W/2-145,42,290,29,"rgba(10,12,8,.85)");ctx.fillStyle="#dfeeaa";ctx.fillText(wilds.message,W/2,61);
  }
}

const townRender=render;
render=function(){ townRender(); drawBogRat(); drawWildsHint(); };

window.addEventListener("keydown",e=>{
  if(e.code==="Space" || e.key.toLowerCase()==="f"){
    e.preventDefault(); playerAttack();
  }
});

const mobileActions=document.querySelector(".mobile-actions");
if(mobileActions){
  const attack=document.createElement("button");
  attack.type="button"; attack.id="attackButton"; attack.textContent="⚔"; attack.setAttribute("aria-label","Attack");
  attack.style.cssText="width:52px;height:52px;border:1px solid #c98749;background:rgba(91,48,29,.9);font-weight:900;font-size:18px;touch-action:none";
  attack.addEventListener("click",playerAttack);
  mobileActions.prepend(attack);
}

syncPlayerHealth();
