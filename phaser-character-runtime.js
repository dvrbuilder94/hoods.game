// Live bridge for Hoods Character System v1.0 — outfits are visual identity; gear stays stats-only.
(() => {
const OUTFIT_KEY='hoods-outfit-v1',GAME_SAVE_KEY='hoods-town-v02';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
const initial=read(OUTFIT_KEY,{selected:'wanderer',owned:['wanderer']});
const outfitState={selected:initial.selected||'wanderer',owned:new Set(Array.isArray(initial.owned)?initial.owned:['wanderer'])};
outfitState.owned.add('wanderer');
const saveOutfits=()=>localStorage.setItem(OUTFIT_KEY,JSON.stringify({selected:outfitState.selected,owned:[...outfitState.owned]}));
function wait(){
  const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
  if(!scene||!scene.player||!window.HoodsCharacter)return setTimeout(wait,120);
  window.HoodsCharacter.ensureLoaded(scene,ok=>{if(ok)install(scene);else console.warn('[Hoods outfits] keeping legacy character visuals')});
}
function install(scene){
  if(scene.__hoodsCharacterLive)return;scene.__hoodsCharacterLive=true;
  const catalog=window.HoodsCharacter.OUTFITS;
  if(!catalog[outfitState.selected]||!outfitState.owned.has(outfitState.selected))outfitState.selected='wanderer';
  const mountPlayer=()=>{
    scene.player.removeAll(true);scene.bodyShape=null;scene.head=null;scene.legs=null;
    scene.hoodsAvatar=window.HoodsCharacter.install(scene,scene.player,{outfit:outfitState.selected,label:'Hood'});
    scene.player.setSize(32,48);scene.player.body?.setSize(30,42).setOffset(-15,-21);
  };
  const mountNpc=(container,outfit,label)=>{
    if(!container)return null;container.removeAll(true);
    return window.HoodsCharacter.install(scene,container,{outfit,label,npc:true,direction:'down'});
  };
  mountPlayer();
  scene.hoodsNpcAvatars={bram:mountNpc(scene.bram,'merchant','OLD BRAM'),mara:mountNpc(scene.mara,'warden','MARA THE WARDEN')};
  // Equipment rebuilds now preserve the chosen full-body skin instead of drawing gear layers.
  scene.rebuildPlayer=mountPlayer;
  const select=id=>{
    if(!catalog[id]?.player||!outfitState.owned.has(id))return false;
    outfitState.selected=id;saveOutfits();scene.hoodsAvatar?.setOutfit(id);scene.renderInventory?.();scene.renderShop?.();return true;
  };
  const buy=id=>{
    const entry=catalog[id];if(!entry?.player||outfitState.owned.has(id))return select(id);
    const gameSave=read(GAME_SAVE_KEY,{}),coins=Number(gameSave.coins);
    if(!Number.isFinite(coins)||coins<(entry.price||0)){scene.combat?.say?.(`Need ${entry.price} Coins for ${entry.name}`,1400);return false}
    gameSave.coins=coins-entry.price;localStorage.setItem(GAME_SAVE_KEY,JSON.stringify(gameSave));
    outfitState.owned.add(id);outfitState.selected=id;saveOutfits();
    // Core game state is closure-scoped, so reload once after purchase to sync its coin cache safely.
    window.location.reload();return true;
  };
  const decorateButton=(entry,mode)=>{
    const owned=outfitState.owned.has(entry.id),selected=outfitState.selected===entry.id,b=document.createElement('button');
    b.className='p-item';
    const status=selected?'SELECTED':owned?'SELECT':'LOCKED';
    const action=mode==='shop'&&!owned?`${entry.price} C`:status;
    b.innerHTML=`<span><b>${entry.name} Outfit</b><small>FULL-BODY SKIN · ${entry.description}</small></span><strong>${action}</strong>`;
    b.onclick=()=>mode==='shop'&&!owned?buy(entry.id):select(entry.id);return b;
  };
  const addHeading=(root,text)=>{const d=document.createElement('div');d.className='p-item';d.style.cursor='default';d.innerHTML=`<span><b>${text}</b><small>Gear remains independent and affects stats only.</small></span><strong>OUTFITS</strong>`;root.appendChild(d)};
  const oldShop=scene.renderShop.bind(scene),oldInventory=scene.renderInventory.bind(scene);
  scene.renderShop=()=>{oldShop();const root=document.getElementById('pShopItems');if(!root)return;addHeading(root,'Old Bram · Outfits');window.HoodsCharacter.PLAYER_OUTFITS.forEach(o=>root.appendChild(decorateButton(o,'shop')))};
  scene.renderInventory=()=>{oldInventory();const root=document.getElementById('pInvItems');if(!root)return;addHeading(root,'Your Outfits');window.HoodsCharacter.PLAYER_OUTFITS.filter(o=>outfitState.owned.has(o.id)).forEach(o=>root.appendChild(decorateButton(o,'inventory')))};
  scene.renderShop();scene.renderInventory();
  let last=performance.now();
  scene.events.on('update',()=>{
    const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
    const b=scene.player?.body;if(!b||!scene.hoodsAvatar)return;
    scene.hoodsAvatar.update(dt,b.velocity.x,b.velocity.y);
  });
  const attackVisual=()=>scene.hoodsAvatar?.attack();
  document.getElementById('mobileAttack')?.addEventListener('pointerdown',attackVisual,{passive:true});
  scene.input.keyboard.on('keydown-SPACE',attackVisual);scene.input.keyboard.on('keydown-F',attackVisual);
  window.HoodsOutfits={state:outfitState,catalog,select,buy,unlock(id){if(!catalog[id]?.player)return false;outfitState.owned.add(id);saveOutfits();return true},selected:()=>outfitState.selected,owned:id=>outfitState.owned.has(id)};
  console.info('[Hoods outfits] v1 mounted',outfitState.selected,'NPCs share human atlas');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,60));else setTimeout(wait,60);
})();