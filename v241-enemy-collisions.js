// Hoods V2.4.1 safety patch: enemies are solid world actors, not walk-through decorations.
(() => {
  const MAX_TRIES=120;
  let tries=0;
  function getScene(){
    for(const game of (window.Phaser&&Phaser.GAMES)||[]){
      const scene=game?.scene?.getScene?.('HoodsV2');
      if(scene?.sys?.isActive?.()&&scene.player&&Array.isArray(scene.enemyActors))return scene;
    }
    return null;
  }
  function mount(scene){
    if(scene.__v241EnemyCollisionsMounted)return;
    const enemies=(scene.enemyActors||[]).map(a=>a?.sprite).filter(Boolean);
    if(!enemies.length){if(++tries<MAX_TRIES)setTimeout(()=>boot(),100);return}
    scene.__v241EnemyCollisionsMounted=true;
    scene.__v241EnemyColliders=enemies.map(enemy=>scene.physics.add.collider(scene.player,enemy));
  }
  function boot(){const scene=getScene();if(scene)mount(scene);else if(++tries<MAX_TRIES)setTimeout(boot,100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else boot();
})();
