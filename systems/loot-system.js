(function initHoodsLoot(root){
  "use strict";

  if(!root.HoodsRPG || !root.hoodsInventory) return;

  const gear=[
    {id:"ratcatcher-cap",name:"Ratcatcher Cap",slot:"helmet",category:"gear",price:0,shop:false,rarity:"COMMON",stats:{defense:1,luck:1},source:"Bog Rat"},
    {id:"mire-buckler",name:"Mire Buckler",slot:"shield",category:"gear",price:0,shop:false,rarity:"UNCOMMON",stats:{defense:3},source:"Mire Slime"},
    {id:"thug-knife",name:"Thug Knife",slot:"weapon",category:"gear",price:0,shop:false,rarity:"UNCOMMON",stats:{attack:4,luck:1},source:"Wild Thug"},
    {id:"thornhide-boots",name:"Thornhide Boots",slot:"boots",category:"gear",price:0,shop:false,rarity:"RARE",stats:{defense:2,speed:2},source:"Thorn Wolf"},
    {id:"ashwood-leggings",name:"Ashwood Leggings",slot:"legs",category:"gear",price:0,shop:false,rarity:"RARE",stats:{defense:4,speed:1},source:"Ash Bandit"},
    {id:"ember-hood",name:"Ember Hood",slot:"outfit",category:"cosmetic",price:0,shop:false,rarity:"RARE",stats:{luck:1},source:"Cinder Imp"},
    {id:"bone-guard",name:"Bone Guard",slot:"shield",category:"gear",price:0,shop:false,rarity:"RARE",stats:{defense:5,hp:8},source:"Bone Sentry"}
  ];

  gear.forEach(item=>{
    root.HoodsRPG.registerItem(item);
    if(typeof items!=="undefined" && !items.some(existing=>existing.id===item.id)) items.push(item);
  });

  const tables={
    rat:[{id:"ratcatcher-cap",chance:.10}],
    slime:[{id:"mire-buckler",chance:.075}],
    thug:[{id:"thug-knife",chance:.065}],
    wolf:[{id:"thornhide-boots",chance:.055}],
    bandit:[{id:"ashwood-leggings",chance:.045}],
    imp:[{id:"ember-hood",chance:.04}],
    sentry:[{id:"bone-guard",chance:.035}]
  };

  function effectiveChance(entry){
    let luck=1;
    try{ luck=typeof getStats==="function"?(getStats().luck||1):1; }catch(_){}
    return Math.min(.35,entry.chance+Math.max(0,luck-1)*.004);
  }

  function roll(kind){
    const entries=tables[kind]||[];
    for(const entry of entries){
      if(Math.random()<=effectiveChance(entry)){
        root.hoodsInventory.grant(entry.id,1);
        return root.HoodsRPG.itemById(entry.id);
      }
    }
    return null;
  }

  function announce(item){
    if(!item) return;
    root.setTimeout(()=>{
      try{ if(typeof showCombatMessage==="function") showCombatMessage(`GEAR DROP · ${item.name} · ${item.rarity}`,1800); }catch(_){}
    },60);
  }

  // Wilds already exposes a defeat hook used by quests; chain rather than replace it.
  root.hoodsHooks=root.hoodsHooks||{};
  const priorMobDefeated=root.hoodsHooks.onMobDefeated;
  root.hoodsHooks.onMobDefeated=(mob,materialDrop)=>{
    if(typeof priorMobDefeated==="function") priorMobDefeated(mob,materialDrop);
    announce(roll(mob?.kind));
  };

  // Ashwood and Cinder use local roll functions instead of the shared Wilds hook.
  if(typeof rollAshDrop==="function"){
    const baseAshRoll=rollAshDrop;
    rollAshDrop=function(mob){
      const material=baseAshRoll(mob);
      if(!mob?.boss) announce(roll(mob?.kind));
      return material;
    };
  }

  if(typeof rollCinderDrop==="function"){
    const baseCinderRoll=rollCinderDrop;
    rollCinderDrop=function(mob){
      const material=baseCinderRoll(mob);
      announce(roll(mob?.kind));
      return material;
    };
  }

  root.HoodsLoot=Object.freeze({tables,gear,roll});
})(window);
