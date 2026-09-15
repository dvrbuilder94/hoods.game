// Hoods V2.4.3 — derive equipped gameplay stats in one place.
(() => {
  const SAVE_KEY='hoods-town-v02';
  const MAX_TRIES=120;
  const BASE={hp:100,attack:5,defense:3,speed:0,luck:0};
  const ITEM_STATS={
    'iron-sword':{attack:5},
    'iron-helmet':{defense:2},
    'leather-armor':{hp:10,defense:3},
    'wooden-shield':{defense:2},
    'ranger-boots':{speed:2,luck:1}
  };
  let tries=0;

  const derivedStats=()=>{
    const out={...BASE};
    try{
      const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
      for(const id of Object.values(raw?.equipped||{})){
        for(const [stat,value] of Object.entries(ITEM_STATS[id]||{})) out[stat]=(out[stat]||0)+value;
      }
    }catch{}
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
    if(scene.__v243StatsMounted) return;
    scene.__v243StatsMounted=true;
    const player=scene.player;
    const originalVelocity=player.setVelocity.bind(player);
    player.setVelocity=(x=0,y=x)=>{
      const multiplier=1+(derivedStats().speed*.05);
      return originalVelocity(x*multiplier,y*multiplier);
    };
    const originalHud=scene.refreshHud?.bind(scene);
    if(originalHud) scene.refreshHud=(...args)=>{const result=originalHud(...args);refreshStatsHud();return result};
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
