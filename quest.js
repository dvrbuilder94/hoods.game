// Hoods v0.4 — first quest + crafting loop. Isolated from combat through small hooks.
const QUEST_SAVE_KEY="hoods-quest-v04";
const questState={
  kills:{rat:0,slime:0,thug:0},
  claimed:false,
  forgeUnlocked:false,
  crafted:false
};

function loadQuest(){
  try{
    const raw=localStorage.getItem(QUEST_SAVE_KEY);if(!raw)return;
    const saved=JSON.parse(raw);
    if(saved.kills) Object.keys(questState.kills).forEach(k=>questState.kills[k]=Math.max(0,Math.floor(saved.kills[k]||0)));
    questState.claimed=!!saved.claimed;
    questState.forgeUnlocked=!!saved.forgeUnlocked;
    questState.crafted=!!saved.crafted;
  }catch(_){}
}
function saveQuest(){try{localStorage.setItem(QUEST_SAVE_KEY,JSON.stringify(questState));}catch(_){}}
loadQuest();

const reinforcedArmor={id:"reinforced-leather",name:"Reinforced Leather Armor",slot:"armor",price:0,rarity:"UNCOMMON",stats:{hp:18,defense:5}};
function ensureReinforcedArmor(){if(!items.some(i=>i.id===reinforcedArmor.id))items.push(reinforcedArmor);}
if(questState.crafted){
  ensureReinforcedArmor();
  state.owned.add(reinforcedArmor.id);
  if(!state.equipped.armor)state.equipped.armor=reinforcedArmor.id;
  saveGame();
}

const questModal=document.createElement("div");
questModal.className="shop-modal";
questModal.id="questModal";
questModal.hidden=true;
questModal.innerHTML=`
  <div class="shop-card quest-card">
    <div class="shop-title"><div><small>HOODS CONTRACT</small><h2>First Blood</h2></div><button id="closeQuest" type="button">×</button></div>
    <p class="shop-note">Clear one of each creature in The Wilds. Bram will then open his small forge for you.</p>
    <div class="quest-objectives" id="questObjectives"></div>
    <button class="quest-action" id="claimQuest" type="button"></button>
    <div class="forge-panel" id="forgePanel"></div>
  </div>`;
document.querySelector(".arena-wrap")?.appendChild(questModal);

const questButton=document.createElement("button");
questButton.id="questButton";questButton.type="button";questButton.textContent="QUEST [Q]";
document.querySelector(".status-row")?.appendChild(questButton);

const questObjectives=document.getElementById("questObjectives");
const claimQuest=document.getElementById("claimQuest");
const forgePanel=document.getElementById("forgePanel");

function questReady(){return Object.values(questState.kills).every(v=>v>=1);}
function recipeReady(){return (progression.loot["Rat Tail"]||0)>=2&&(progression.loot["Slime Core"]||0)>=1&&state.coins>=15;}

function renderQuest(){
  if(questObjectives){
    const rows=[["Bog Rat",questState.kills.rat],["Mire Slime",questState.kills.slime],["Wild Thug",questState.kills.thug]];
    questObjectives.innerHTML=rows.map(([name,count])=>`<div><span>${name}</span><b>${Math.min(1,count)}/1 ${count>=1?"✓":""}</b></div>`).join("");
  }
  if(claimQuest){
    if(questState.claimed){claimQuest.textContent="CONTRACT COMPLETE · +30 COINS";claimQuest.disabled=true;}
    else if(questReady()){claimQuest.textContent="CLAIM REWARD · +30 COINS + FORGE";claimQuest.disabled=false;}
    else{claimQuest.textContent="DEFEAT ALL 3 CREATURES";claimQuest.disabled=true;}
  }
  if(forgePanel){
    if(!questState.forgeUnlocked){forgePanel.innerHTML='<small>BRAM\'S FORGE</small><p>Complete the contract to unlock your first recipe.</p>';return;}
    const tail=progression.loot["Rat Tail"]||0,core=progression.loot["Slime Core"]||0;
    forgePanel.innerHTML=`<small>BRAM'S FORGE</small><h3>Reinforced Leather Armor</h3><p>+18 HP · +5 DEFENSE</p><p class="recipe">2 Rat Tail (${tail}/2) · 1 Slime Core (${core}/1) · 15 Coins</p><button id="craftArmor" class="quest-action" ${questState.crafted||!recipeReady()?"disabled":""}>${questState.crafted?"CRAFTED":"CRAFT ARMOR"}</button>`;
    document.getElementById("craftArmor")?.addEventListener("click",craftArmor);
  }
}

function openQuest(){closeShop();closeInventory();state.questOpen=true;keys.clear();questModal.hidden=false;renderQuest();}
function closeQuest(){state.questOpen=false;keys.clear();questModal.hidden=true;}
const previousModalOpen=modalOpen;
modalOpen=function(){return previousModalOpen()||!!state.questOpen;};

function claimFirstQuest(){
  if(questState.claimed||!questReady())return;
  questState.claimed=true;questState.forgeUnlocked=true;state.coins+=30;
  saveQuest();saveGame();updateUI();renderQuest();
  showCombatMessage("Contract complete · Forge unlocked · +30 Coins",1900);
}

function craftArmor(){
  if(questState.crafted||!questState.forgeUnlocked||!recipeReady())return;
  progression.loot["Rat Tail"]-=2;
  progression.loot["Slime Core"]-=1;
  state.coins-=15;
  questState.crafted=true;
  ensureReinforcedArmor();
  state.owned.add(reinforcedArmor.id);
  state.equipped.armor=reinforcedArmor.id;
  state.player.hp=Math.min(getStats().hp,state.player.hp+8);
  saveQuest();saveProgression();saveGame();updateUI();renderInventory();renderShop();renderQuest();syncPlayerHealth();
  showCombatMessage("Crafted Reinforced Leather Armor",1900);
}

window.hoodsHooks=window.hoodsHooks||{};
window.hoodsHooks.onMobDefeated=(mob)=>{
  if(mob?.kind in questState.kills){questState.kills[mob.kind]++;saveQuest();renderQuest();}
};
window.hoodsHooks.onLoot=()=>renderQuest();

questButton.addEventListener("click",()=>state.questOpen?closeQuest():openQuest());
document.getElementById("closeQuest")?.addEventListener("click",closeQuest);
questModal.addEventListener("click",e=>{if(e.target===questModal)closeQuest();});
claimQuest?.addEventListener("click",claimFirstQuest);
window.addEventListener("keydown",e=>{
  if((e.key||"").toLowerCase()==="q"){e.preventDefault();state.questOpen?closeQuest():openQuest();}
  if(e.key==="Escape")closeQuest();
});

updateUI();renderInventory();renderShop();renderQuest();syncPlayerHealth();
