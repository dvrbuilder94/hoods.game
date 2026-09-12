// Hoods equipment UI v1.1 — Tibia-style set display; gear affects stats, outfits stay separate.
(()=>{
const SLOT_ORDER=['helmet','weapon','armor','shield','legs','boots'];
const SLOT_LABEL={helmet:'HELM',weapon:'WPN',armor:'ARM',shield:'SHLD',legs:'LEGS',boots:'BOOTS'};
const SLOT_CLASS={helmet:'hoods-slot-helmet',weapon:'hoods-slot-weapon',armor:'hoods-slot-armor',shield:'hoods-slot-shield',legs:'hoods-slot-legs',boots:'hoods-slot-boots'};
const FUTURE=[['amulet','AMULET'],['backpack','BAG'],['ring','RING']];
function wait(attempt=0){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive()||!scene.renderInventory)return setTimeout(()=>wait(attempt+1),120);
 if(!scene.__hoodsCharacterLive&&attempt<50)return setTimeout(()=>wait(attempt+1),100);
 install(scene);
}
function abbr(name){const words=String(name||'').trim().split(/\s+/).filter(Boolean);return(words.length>1?words.slice(0,3).map(w=>w[0]).join(''):words[0]?.slice(0,4)||'ITEM').toUpperCase()}
function inspectGear(root){
 const gear={};
 for(const row of root.querySelectorAll('.p-item')){
  if(!(row instanceof HTMLButtonElement))continue;
  const small=row.querySelector('small')?.textContent?.trim()||'';
  const slot=small.split('·')[0]?.trim().toLowerCase();
  if(!SLOT_ORDER.includes(slot))continue;
  const name=row.querySelector('b')?.textContent?.trim()||SLOT_LABEL[slot];
  const status=row.querySelector('strong')?.textContent?.trim()||'';
  if(status==='UNEQUIP'||status==='EQUIPPED'){
   gear[slot]={name,button:row,rarity:inferRarity(row,small)};
   // Equipped gear belongs in the set, not duplicated in the backpack list.
   row.hidden=true;row.dataset.hoodsEquipped='true';
  }
 }
 return gear;
}
function inferRarity(row,text){
 const full=`${row.textContent||''} ${text||''}`.toUpperCase();
 for(const rarity of ['LEGENDARY','EPIC','RARE','UNCOMMON','COMMON'])if(full.includes(rarity))return rarity;
 return '';
}
function makeSlot(slot,item){
 const b=document.createElement('button');b.type='button';b.className=`hoods-slot ${SLOT_CLASS[slot]}${item?'':' empty'}`;b.dataset.slot=slot;
 if(item){b.dataset.rarity=item.rarity||'';b.title=`${item.name} — tap to unequip`;b.innerHTML=`${abbr(item.name)}<small>${item.name}</small>`;b.onclick=()=>item.button.click()}
 else{b.disabled=true;b.innerHTML=`${SLOT_LABEL[slot]}<small>empty</small>`}
 return b;
}
function makeFuture(slot,label){const b=document.createElement('button');b.type='button';b.disabled=true;b.className=`hoods-slot hoods-slot-${slot} empty future`;b.innerHTML=`${label}<small>future</small>`;return b}
function decorate(root){
 root.querySelector('.hoods-set-shell')?.remove();root.querySelector('.hoods-bag-heading')?.remove();
 const gear=inspectGear(root),shell=document.createElement('section');shell.className='hoods-set-shell';
 const side=document.createElement('div');side.className='hoods-set-side';side.innerHTML='<div class="hoods-set-title"><span>SET</span><b>EQUIPMENT</b></div>';
 const grid=document.createElement('div');grid.className='hoods-set-grid';
 FUTURE.forEach(([slot,label])=>grid.appendChild(makeFuture(slot,label)));SLOT_ORDER.forEach(slot=>grid.appendChild(makeSlot(slot,gear[slot])));side.appendChild(grid);
 const copy=document.createElement('div');copy.className='hoods-set-copy';copy.innerHTML='<strong>Equipment set</strong>Helmet, armor, weapon, shield, legs and boots change <b>stats</b>. Your selected full-body outfit controls the character look.';
 shell.append(side,copy);
 const heading=document.createElement('div');heading.className='hoods-bag-heading';heading.textContent='BACKPACK / UNEQUIPPED ITEMS';
 root.prepend(heading);root.prepend(shell);
}
function install(scene){
 if(scene.__hoodsEquipmentUi)return;scene.__hoodsEquipmentUi=true;
 const previous=scene.renderInventory.bind(scene);
 scene.renderInventory=()=>{previous();const root=document.getElementById('pInvItems');if(root)decorate(root)};
 scene.renderInventory();
 console.info('[Hoods equipment] v1.1 set UI mounted; equipment and outfits remain separate');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>wait(),100));else setTimeout(()=>wait(),100);
})();
