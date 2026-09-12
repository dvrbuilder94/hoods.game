// Hoods gate guard — temporary data-driven Town east boundary until Ashwood itself is migrated.
(()=>{
const KEY='town-east-gate',URL='maps/town/town-east-gate.json?v=gate-fix1';
const props=list=>Object.fromEntries((list||[]).map(p=>[p.name,p.value]));
function wait(){const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');if(!scene||!scene.sys?.isActive()||!scene.solids||!scene.player)return setTimeout(wait,100);load(scene)}
function load(scene){
 if(scene.__hoodsEastGateLoading||scene.__hoodsEastGate)return;
 scene.__hoodsEastGateLoading=true;
 const ready=()=>{scene.__hoodsEastGateLoading=false;install(scene)};
 if(scene.cache.tilemap.exists(KEY))return ready();
 scene.load.tilemapTiledJSON(KEY,URL);
 scene.load.once('complete',ready);
 scene.load.once('loaderror',file=>{scene.__hoodsEastGateLoading=false;console.warn('[Hoods gate] asset failed; legacy gate remains',file?.key)});
 scene.load.start();
}
function install(scene){
 if(scene.__hoodsEastGate)return;
 try{
  const legacyGate=scene.ashGateBlock;
  // No legacy gate means Ashwood is already unlocked; do not add a new blocker.
  if(!legacyGate){scene.__hoodsEastGate={active:false};return}
  const map=scene.make.tilemap({key:KEY}),layer=map.getObjectLayer('collisions');
  const o=layer?.objects?.find(x=>x.name==='ashwood_locked_boundary');if(!o)throw new Error('ashwood_locked_boundary missing');
  const p=props(o.properties);if(p.activeWhen!=='locked')throw new Error('invalid gate condition');
  // Replace the short legacy fence collider with one boundary sourced from map data.
  scene.solids.remove(legacyGate,true,true);
  const z=scene.add.zone(o.x+o.width/2,o.y+o.height/2,o.width,o.height);
  scene.physics.add.existing(z,true);z.__mapCollision=true;z.__mapGate='ashwood';scene.solids.add(z);
  scene.ashGateBlock=z;scene.__hoodsEastGate={active:true,map,body:z,meta:{zoneId:'town',chunkId:'town-east-gate',zLevel:Number(p.z||0)}};
  if(scene.player.x>=o.x)scene.player.setPosition(o.x-24,scene.player.y);
  console.info('[Hoods gate] locked Ashwood boundary installed from map data');
 }catch(err){scene.__hoodsEastGate=null;console.warn('[Hoods gate] install failed; legacy gate kept when possible',err)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,60));else setTimeout(wait,60);
})();