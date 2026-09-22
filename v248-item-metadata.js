// Hoods V2.4.9 — item metadata plus equipment-bag movement safety.
(() => {
  const META={
    'Iron Sword':{rarity:'COMMON',price:55},
    'Iron Helmet':{rarity:'COMMON',price:40},
    'Leather Armor':{rarity:'COMMON',price:65},
    'Wooden Shield':{rarity:'COMMON',price:35},
    'Ranger Boots':{rarity:'UNCOMMON',price:90}
  };
  window.HOODS_ITEM_META=Object.freeze(META);

  // Keep the visible build label aligned with the runtime patch actually loaded by play.html.
  document.title='Hoods V2.4.9';
  const hudVersion=document.querySelector('.v2-hud b');
  if(hudVersion) hudVersion.textContent='HOODS V2.4.9';

  const decorate=()=>{
    document.querySelectorAll('#v2BagItems .v2-item').forEach(row=>{
      if(row.dataset.meta==='1') return;
      const name=row.querySelector('b')?.textContent;
      const meta=META[name];
      const info=row.querySelector('small');
      if(!meta||!info) return;
      info.textContent=`${info.textContent} · ${meta.rarity} · ${meta.price}c`;
      row.dataset.meta='1';
    });
  };
  const bag=document.getElementById('v2BagItems');
  if(bag) new MutationObserver(decorate).observe(bag,{childList:true,subtree:true});
  decorate();

  const panel=document.getElementById('v2Bag');
  const findScene=()=>((window.Phaser&&Phaser.GAMES)||[]).map(g=>g?.scene?.getScene('HoodsV2')).find(s=>s?.sys?.isActive()&&s.player);
  const syncMovement=()=>{
    const scene=findScene();if(!scene||!panel)return;
    const enabled=panel.hidden;
    const keys=[scene.keys?.W,scene.keys?.A,scene.keys?.S,scene.keys?.D,scene.cursors?.left,scene.cursors?.right,scene.cursors?.up,scene.cursors?.down].filter(Boolean);
    keys.forEach(key=>{if(!enabled)key.reset?.();key.enabled=enabled});
    if(!enabled){scene.stopTouch?.();scene.player.setVelocity(0)}
  };
  if(panel)new MutationObserver(syncMovement).observe(panel,{attributes:true,attributeFilter:['hidden']});
  setTimeout(syncMovement,0);
})();
