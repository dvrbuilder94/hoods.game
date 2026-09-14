// Hoods V2.4.2 — make equipped speed stats affect player movement without touching the core scene.
(() => {
  const SAVE_KEY='hoods-town-v02';
  const MAX_TRIES=120;
  let tries=0;

  const readSpeed=()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
      return raw?.equipped?.boots==='ranger-boots'?2:0;
    }catch{return 0}
  };

  const getScene=()=>{
    const games=(window.Phaser&&Phaser.GAMES)||[];
    for(const game of games){
      const scene=game?.scene?.getScene?.('HoodsV2');
      if(scene?.sys?.isActive?.()&&scene.player) return scene;
    }
    return null;
  };

  const mount=scene=>{
    if(scene.__v242SpeedMounted) return;
    scene.__v242SpeedMounted=true;
    const player=scene.player;
    const original=player.setVelocity.bind(player);
    player.setVelocity=(x=0,y=x)=>{
      const speed=readSpeed();
      const multiplier=1+(speed*.05); // +5% movement per speed point.
      return original(x*multiplier,y*multiplier);
    };
  };

  const boot=()=>{
    const scene=getScene();
    if(scene){mount(scene);return}
    if(++tries<MAX_TRIES) setTimeout(boot,100);
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));
  else boot();
})();
