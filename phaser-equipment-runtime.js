// Hoods equipment UI v1.3 — compact Tibia-style set; independent from character loading.
(()=>{
const SLOT_ORDER=['helmet','weapon','armor','shield','legs','boots'];
const SLOT_LABEL={helmet:'HELM',weapon:'WPN',armor:'ARM',shield:'SHLD',legs:'LEGS',boots:'BOOTS'};
const SLOT_CLASS={helmet:'hoods-slot-helmet',weapon:'hoods-slot-weapon',armor:'hoods-slot-armor',shield:'hoods-slot-shield',legs:'hoods-slot-legs',boots:'hoods-slot-boots'};
const ITEM_SLOT={'Iron Helmet':'helmet','Iron Sword':'weapon','Leather Armor':'armor','Wooden Shield':'shield','Ranger Boots':'boots'};
const ICON_SLOTS=new Set(['helmet','weapon','armor','shield','boots']);
const FUTURE=[['amulet','AMULET'],['backpack','BAG'],['ring','RING']];
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive()||!scene.renderInventory)return setTimeout(wait,80);
 install(scene);
}
function iconMarkup(slot){return ICON_SLOTS.has(slot)?`<span class="hoods-item-icon icon-${slot}" aria-hidden="true"></span>`:''}
function inspectGear(root){
 const gear={};
 for(const row of root.querySelectorAll('.p-item')){
  if(!(row instanceof HTMLButtonElement))continue;
  const small=row.querySelector('small')?.textContent?.trim()||'',slot=small.split('·')[0]?.trim().toLowerCase();
  if(!SLOT_ORDER.includes(slot))continue;
  const name=row.querySelector('b')?.textContent?.trim()||SLOT_LABEL[slot],status=row.querySelector('strong')?.textContent?.trim()||'';
  if(status==='UNEQUIP'||status==='EQUIPPED'){gear[slot]={name,button:row,rarity:inferRarity(row,small)};row.hidden=true;row.dataset.hoodsEquipped='true'}
 }
 return gear;
}
function inferRarity(row,text){const full=`${row.textContent||''} ${text||''}`.toUpperCase();for(const rarity of ['LEGENDARY','EPIC','RARE','UNCOMMON','COMMON'])if(full.includes(rarity))return rarity;return ''}
function makeSlot(slot,item){
 const b=document.createElement('button');b.type='button';b.className=`hoods-slot ${SLOT_CLASS[slot]}${item?'':' empty'}`;b.dataset.slot=slot;
 if(item){b.dataset.rarity=item.rarity||'';b.title=`${item.name} — tap to unequip`;b.innerHTML=`${iconMarkup(slot)}<small>${item.name}</small>`;b.onclick=()=>item.button.click()}
 else{b.disabled=true;b.innerHTML=`<span class="hoods-empty-label">${SLOT_LABEL[slot]}</span><small>empty</small>`}
 return b;
}
function makeFuture(slot,label){const b=document.createElement('button');b.type='button';b.disabled=true;b.className=`hoods-slot hoods-slot-${slot} empty future`;b.innerHTML=`<span class="hoods-empty-label">${label}</span><small>future</small>`;return b}
function decorateRows(root){
 for(const row of root.querySelectorAll('.p-item')){
  if(!(row instanceof HTMLButtonElement)||row.querySelector('.hoods-row-icon'))continue;
  const name=row.querySelector('b')?.textContent?.trim()||'',slot=ITEM_SLOT[name];if(!slot)continue;
  const icon=document.createElement('span');icon.className=`hoods-row-icon icon-${slot}`;icon.setAttribute('aria-hidden','true');row.prepend(icon);row.classList.add('hoods-item-row');
 }
}
function decorate(root){
 root.querySelector('.hoods-set-shell')?.remove();root.querySelector('.hoods-bag-heading')?.remove();
 const gear=inspectGear(root),shell=document.createElement('section');shell.className='hoods-set-shell';
 const side=document.createElement('div');side.className='hoods-set-side';side.innerHTML='<div class="hoods-set-title"><span>SET</span><b>EQUIPMENT</b></div>';
 const grid=document.createElement('div');grid.className='hoods-set-grid';FUTURE.forEach(([slot,label])=>grid.appendChild(makeFuture(slot,label)));SLOT_ORDER.forEach(slot=>grid.appendChild(makeSlot(slot,gear[slot])));side.appendChild(grid);
 const copy=document.createElement('div');copy.className='hoods-set-copy';copy.innerHTML='<strong>Set</strong><span>Gear changes stats. Outfit controls appearance.</span>';
 shell.append(side,copy);
 const heading=document.createElement('div');heading.className='hoods-bag-heading';heading.textContent='BACKPACK';root.prepend(heading);root.prepend(shell);decorateRows(root);
}
function install(scene){
 if(scene.__hoodsEquipmentUi)return;scene.__hoodsEquipmentUi=true;
 const previousInventory=scene.renderInventory.bind(scene),previousShop=scene.renderShop.bind(scene);
 scene.renderInventory=()=>{previousInventory();const root=document.getElementById('pInvItems');if(root)decorate(root)};
 scene.renderShop=()=>{previousShop();const root=document.getElementById('pShopItems');if(root)decorateRows(root)};
 scene.renderInventory();scene.renderShop();console.info('[Hoods equipment] v1.3 compact set mounted');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,40));else setTimeout(wait,40);
})();
