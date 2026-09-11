// Live bridge for Hoods Character System v0.7
(() => {
function gearFromLegacy(scene){
  const fills=new Set();
  const scan=o=>{if(o&&typeof o.fillColor==='number')fills.add(o.fillColor);if(o?.list)o.list.forEach(scan)};
  scene.player?.list?.forEach(scan);
  return{
    armor:fills.has(0x7f5639),
    helmet:fills.has(0xaeb6b8),
    weapon:fills.has(0xc8d0d1),
    shield:fills.has(0x8a6038),
    boots:fills.has(0x32281f)
  };
}
function wait(){
  const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
  if(!scene||!scene.player||!window.HoodsCharacter)return setTimeout(wait,120);
  install(scene);
}
function install(scene){
  if(scene.__hoodsCharacterLive)return;scene.__hoodsCharacterLive=true;
  let gear=gearFromLegacy(scene);
  const mount=()=>{
    gear=gearFromLegacy(scene);
    scene.player.removeAll(true);
    scene.bodyShape=null;scene.head=null;scene.legs=null;
    scene.hoodsAvatar=window.HoodsCharacter.install(scene,scene.player,()=>gear);
    scene.player.setSize(32,48);
    scene.player.body?.setSize(30,42).setOffset(-15,-21);
  };
  mount();
  const legacyRebuild=scene.rebuildPlayer.bind(scene);
  scene.rebuildPlayer=()=>{
    legacyRebuild();
    gear=gearFromLegacy(scene);
    mount();
  };
  let last=performance.now();
  scene.events.on('update',()=>{
    const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
    const b=scene.player?.body;if(!b||!scene.hoodsAvatar)return;
    scene.hoodsAvatar.update(dt,b.velocity.x,b.velocity.y);
  });
  const attack=document.getElementById('mobileAttack');
  attack?.addEventListener('pointerdown',()=>scene.hoodsAvatar?.attack(),{passive:true});
  scene.input.keyboard.on('keydown-SPACE',()=>scene.hoodsAvatar?.attack());
  scene.input.keyboard.on('keydown-F',()=>scene.hoodsAvatar?.attack());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,60));else setTimeout(wait,60);
})();