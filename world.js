// Hoods v0.5 — quest NPC + second quest + first unlockable zone.
const WORLD_SAVE_KEY="hoods-world-v05";
const worldState={roadEastAccepted:false,thugKills:0,roadEastClaimed:false,ashwoodUnlocked:false};

function loadWorld(){
  try{
    const raw=localStorage.getItem(WORLD_SAVE_KEY);if(!raw)return;
    const s=JSON.parse(raw);
    worldState.roadEastAccepted=!!s.roadEastAccepted;
    worldState.thugKills=Math.max(0,Math.floor(s.thugKills||0));
    worldState.roadEastClaimed=!!s.roadEastClaimed;
    worldState.ashwoodUnlocked=!!s.ashwoodUnlocked;
  }catch(_){}
}
function saveWorld(){try{localStorage.setItem(WORLD_SAVE_KEY,JSON.stringify(worldState));}catch(_){}}
loadWorld();

const mara={x:690,y:625,name:"MARA THE WARDEN"};
const ashwoodGate={x:1435,y:650,w:46,h:210};
const ASHWOOD_X=1480;
const distanceToMara=()=>Math.hypot(state.player.x-mara.x,state.player.y-mara.y);
const inAshwood=()=>state.player.x>ASHWOOD_X;

const dialogue=document.createElement("div");
dialogue.className="shop-modal";dialogue.id="dialogueModal";dialogue.hidden=true;
dialogue.innerHTML=`<div class="shop-card dialogue-card">
  <div class="shop-title"><div><small>TOWN WARDEN</small><h2>Mara</h2></div><button id="closeDialogue" type="button">×</button></div>
  <div id="dialogueBody"></div>
</div>`;
document.querySelector(".arena-wrap")?.appendChild(dialogue);
const dialogueBody=document.getElementById("dialogueBody");

function firstQuestComplete(){return typeof questState!=="undefined"&&questState.claimed;}
function roadEastReady(){return worldState.roadEastAccepted&&worldState.thugKills>=2;}

function renderDialogue(){
  if(!dialogueBody)return;
  if(!firstQuestComplete()){
    dialogueBody.innerHTML=`<p class="dialogue-copy">The Wilds are crawling again. Prove you can handle yourself before I open the eastern road.</p><button class="quest-action" id="maraFirstBlood">VIEW FIRST BLOOD</button>`;
    document.getElementById("maraFirstBlood")?.addEventListener("click",()=>{closeDialogue();openQuest();});
    return;
  }
  if(!worldState.roadEastAccepted){
    dialogueBody.innerHTML=`<p class="dialogue-copy">You survived the Wilds. Good. Two thugs are watching the eastern road. Clear them and I'll open Ashwood Trail.</p><div class="dialogue-reward">REWARD · ASHWOOD TRAIL ACCESS + 40 COINS</div><button class="quest-action" id="acceptRoadEast">ACCEPT · ROAD EAST</button>`;
    document.getElementById("acceptRoadEast")?.addEventListener("click",()=>{worldState.roadEastAccepted=true;saveWorld();renderDialogue();showCombatMessage("Road East accepted · defeat 2 Wild Thugs",1700);});
    return;
  }
  if(!roadEastReady()){
    dialogueBody.innerHTML=`<p class="dialogue-copy">Road East</p><div class="quest-objectives"><div><span>Defeat Wild Thugs</span><b>${Math.min(2,worldState.thugKills)}/2</b></div></div><p class="shop-note">Find them north of town in The Wilds.</p>`;
    return;
  }
  if(!worldState.roadEastClaimed){
    dialogueBody.innerHTML=`<p class="dialogue-copy">The road is clear. Ashwood Trail is yours to explore.</p><button class="quest-action" id="claimRoadEast">OPEN ASHWOOD · +40 COINS</button>`;
    document.getElementById("claimRoadEast")?.addEventListener("click",claimRoadEast);
    return;
  }
  dialogueBody.innerHTML=`<p class="dialogue-copy">Ashwood Trail is open. Head east through the wooden gate. Don't expect the road beyond it to stay friendly for long.</p><div class="dialogue-reward">ASHWOOD TRAIL · UNLOCKED</div>`;
}

function claimRoadEast(){
  if(!roadEastReady()||worldState.roadEastClaimed)return;
  worldState.roadEastClaimed=true;worldState.ashwoodUnlocked=true;state.coins+=40;
  saveWorld();saveGame();updateUI();renderDialogue();
  showCombatMessage("Ashwood Trail unlocked · +40 Coins",1900);
}

function openDialogue(){
  if(distanceToMara()>95)return;
  closeShop();closeInventory();if(typeof closeQuest==="function")closeQuest();
  state.dialogueOpen=true;keys.clear();dialogue.hidden=false;renderDialogue();
}
function closeDialogue(){state.dialogueOpen=false;keys.clear();dialogue.hidden=true;}
const worldBaseModalOpen=modalOpen;
modalOpen=function(){return worldBaseModalOpen()||!!state.dialogueOpen;};

document.getElementById("closeDialogue")?.addEventListener("click",closeDialogue);
dialogue.addEventListener("click",e=>{if(e.target===dialogue)closeDialogue();});
window.addEventListener("keydown",e=>{
  const k=(e.key||"").toLowerCase();
  if(k==="e"&&distanceToMara()<=95){e.preventDefault();openDialogue();}
  if(e.key==="Escape")closeDialogue();
});
document.getElementById("interactButton")?.addEventListener("click",()=>{if(distanceToMara()<=95)openDialogue();});

// Preserve earlier quest hooks and add Road East progress.
window.hoodsHooks=window.hoodsHooks||{};
const priorMobDefeated=window.hoodsHooks.onMobDefeated;
window.hoodsHooks.onMobDefeated=(mob)=>{
  if(typeof priorMobDefeated==="function")priorMobDefeated(mob);
  if(worldState.roadEastAccepted&&!worldState.roadEastClaimed&&mob?.kind==="thug"){
    worldState.thugKills=Math.min(2,worldState.thugKills+1);saveWorld();renderDialogue();
    if(worldState.thugKills>=2)showCombatMessage("Road East complete · return to Mara",1800);
  }
};

// Lock the eastern road until Mara opens it.
const worldBaseUpdate=update;
update=function(dt){
  const beforeX=state.player.x;
  worldBaseUpdate(dt);
  if(!worldState.ashwoodUnlocked&&state.player.x>ASHWOOD_X-22&&state.player.y>585&&state.player.y<885){
    state.player.x=Math.min(beforeX,ASHWOOD_X-24);
    if(!modalOpen()&&performance.now()-(worldState.lastLockedMessage||0)>1600){worldState.lastLockedMessage=performance.now();showCombatMessage("Ashwood Trail locked · speak to Mara",1200);}
  }
};

const worldBaseLocation=updateLocation;
updateLocation=function(){
  worldBaseLocation();
  if(inAshwood()&&ui.location)ui.location.textContent="ASHWOOD TRAIL";
};

function drawMara(){
  const X=sx(mara.x),Y=sy(mara.y);
  px(X-13,Y+18,26,6,"rgba(0,0,0,.22)");px(X-10,Y-28,20,18,"#c78b67");px(X-14,Y-10,28,29,"#394d42");px(X-11,Y+17,8,12,"#282c29");px(X+3,Y+17,8,12,"#282c29");
  px(X-15,Y-12,30,6,"#76896d");ctx.fillStyle="#efe3bf";ctx.font="700 10px monospace";ctx.textAlign="center";ctx.fillText(mara.name,X,Y-37);
  if(distanceToMara()<115&&!modalOpen()){px(X-72,Y-72,144,23,"rgba(10,12,8,.84)");ctx.fillStyle="#f3e4bf";ctx.fillText("Press E to talk",X,Y-56);}
}

function drawAshwood(){
  const gateX=sx(ashwoodGate.x),gateY=sy(ashwoodGate.y);
  const zoneX=sx(ASHWOOD_X);if(zoneX<W){ctx.fillStyle="rgba(88,72,42,.22)";ctx.fillRect(Math.max(0,zoneX),0,W-Math.max(0,zoneX),H);}
  px(gateX,gateY,18,ashwoodGate.h,"#493724");px(gateX+28,gateY,18,ashwoodGate.h,"#493724");
  if(!worldState.ashwoodUnlocked){for(let y=gateY+18;y<gateY+ashwoodGate.h-12;y+=26)px(gateX+5,y,36,8,"#6f4d2e");}
  ctx.fillStyle="#e2cf9c";ctx.font="700 11px monospace";ctx.textAlign="center";ctx.fillText(worldState.ashwoodUnlocked?"ASHWOOD TRAIL — OPEN":"ASHWOOD TRAIL — LOCKED",gateX+22,gateY-10);
  if(worldState.ashwoodUnlocked&&inAshwood()){
    for(let x=ASHWOOD_X+90;x<WORLD_W;x+=120){const X=sx(x),Y=sy(520+((x/40)%5)*85);px(X-9,Y,18,32,"#573e26");px(X-26,Y-27,52,35,"#594f2e");px(X-18,Y-37,38,24,"#71643a");}
  }
}

const worldBaseRender=render;
render=function(){worldBaseRender();drawAshwood();drawMara();};
