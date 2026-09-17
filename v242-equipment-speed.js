// Hoods V2.4.5 — derive equipped gameplay stats safely and sanitize persisted equipment.
(() => {
  const SAVE_KEY='hoods-town-v02';
  const MAX_TRIES=120;
  const BASE={hp:100,attack:5,defense:3,speed:0,luck:0};
  const ITEM_STATS={
    'iron-sword':{slot:'weapon',stats:{attack:5}},
    'iron-helmet':{slot:'helmet',stats:{defense:2}},
    'leather-armor':{slot:'armor',stats:{hp:10,defense:3}},
    'wooden-shield':{slot:'shield',stats:{defense:2}},
    'ranger-boots':{slot:'boots',stats:{speed:2,luck:1}}
  };
  const VALID_SLOTS=['helmet','weapon','armor','shield','legs','boots'];
  let tries=0;

  const readSave=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch{return {}}};
  const sanitizeSave=()=>{
    const raw=readSave();
    const owned=new Set(Array.isArray(raw?.owned)?raw.owned.filter(id=>ITEM_STATS[id]):[]);
    const equipped={};
    for(const slot of VALID_SLOTS){
      const id=raw?.equipped?.[slot],item=ITEM_STATS[id];
      equipped[slot]=item&&item.slot===slot&&owned.has(id)?id:null;
    }
    const next={...raw,owned:[...owned],equipped};
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(next))}catch{}
    return next;
  };

  const derivedStats=()=>{
    const out={...BASE},raw=readSave(),owned=new Set(Array.isArray(raw?.owned)?raw.owned:[]);
    for(const [slot,id] of Object.entries(raw?.equipped||{})){
      const item=ITEM_STATS[id];
      if(!item||item.slot!==slot||!owned.has(id)) continue;
      for(const [stat,value] of Object.entries(item.stats)) out[stat]=(out[stat]||0)+value;
    }
    return out;
  };

  const getScene=()=>{
    for(const game of (window.Phaser&&Phaser.GAMES)||[]){
      const scene=game?.scene?.getScene?.('HoodsV2');
      if(scene?.sys?.isActive?.()&&scene.player) return scene;
    }
    return null;
  };

  const refreshStatsHud=()=>{
    const s=derivedStats(),el=document.getElementById('v2Stats');
    if(el) el.textContent=`HP ${s.hp} · ATK ${s.attack} · DEF ${s.defense} · SPD ${s.speed} · LCK ${s.luck}`;
  };

  const mount=scene=>{
    if(scene.__v245StatsMounted) return;
    scene.__v245StatsMounted=true;
    sanitizeSave();
    const player=scene.player;
    const originalVelocity=player.setVelocity.bind(player);
    player.setVelocity=(x=0,y=x)=>{
      const multiplier=1+(derivedStats().speed*.05);
      return originalVelocity(x*multiplier,y*multiplier);
    };
    const originalHud=scene.refreshHud?.bind(scene);
    if(originalHud) scene.refreshHud=(...args)=>{const result=originalHud(...args);refreshStatsHud();return result};
    scene.renderBag?.();
    scene.refreshHud?.();
    refreshStatsHud();
  };

  const boot=()=>{
    const scene=getScene();
    if(scene){mount(scene);return}
    if(++tries<MAX_TRIES) setTimeout(boot,100);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));
  else boot();
})();
