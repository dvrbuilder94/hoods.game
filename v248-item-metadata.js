// Hoods V2.4.8 — lightweight item rarity and coin-price metadata for the playable beta.
(() => {
  const META={
    'Iron Sword':{rarity:'COMMON',price:55},
    'Iron Helmet':{rarity:'COMMON',price:40},
    'Leather Armor':{rarity:'COMMON',price:65},
    'Wooden Shield':{rarity:'COMMON',price:35},
    'Ranger Boots':{rarity:'UNCOMMON',price:90}
  };
  window.HOODS_ITEM_META=Object.freeze(META);

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
})();
