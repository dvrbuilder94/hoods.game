// Hoods map migration P2 — Town Tilemap data + object collisions.
(()=>{
const MAP_KEY='town-core',MAP_URL='maps/town/town-core.json?v=map-p2',TILE_KEY='town-basic',TILE_URL='assets/maps/tiles/town-basic.svg?v=map-p2';
const props=list=>Object.fromEntries((list||[]).map(p=>[p.name,p.value]));
function wait(){const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');if(!scene||!scene.sys?.isActive())return setTimeout(wait,100);load(scene)}
function load(scene){
 if(scene.__hoodsMapLoading||scene.__hoodsTownMap)return;
 scene.__hoodsMapLoading=true;
 const ready=()=>{scene.__hoodsMapLoading=false;install(scene)};
 const haveMap=scene.cache.tilemap.exists(MAP_KEY),haveTiles=scene.textures.exists(TILE_KEY);
 if(haveMap&&haveTiles)return ready();
 if(!haveMap)scene.load.tilemapTiledJSON(MAP_KEY,MAP_URL);
 if(!haveTiles)scene.load.svg(TILE_KEY,TILE_URL);
 scene.load.once('complete',ready);
 scene.load.once('loaderror',file=>{scene.__hoodsMapLoading=false;console.warn('[Hoods map] Town asset failed, keeping legacy world',file?.key)});
 scene.load.start();
}
function install(scene){
 if(scene.__hoodsTownMap)return;
 try{
  const map=scene.make.tilemap({key:MAP_KEY}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0);
  const tiles=map.addTilesetImage('town-basic',TILE_KEY,32,32,0,0);if(!tiles)throw new Error('tileset town-basic not available');
  const worldObject=o=>{const p=props(o.properties);return{...o,props:p,worldX:ox+(o.x||0),worldY:oy+(o.y||0)}};
  const ground=map.createLayer('ground',tiles,ox,oy)?.setDepth(.14);
  const decor=map.createLayer('decor',tiles,ox,oy)?.setDepth(.24);
  const roofs=map.createLayer('roofs',tiles,ox,oy)?.setDepth(28);
  let collisionLayer=null;const collisionBodies=[];
  const collisionObjects=(map.getObjectLayer('collisions')?.objects||[]).map(worldObject);
  if(collisionObjects.length&&scene.solids){
   collisionObjects.forEach(o=>{if(!o.width||!o.height)return;const z=scene.add.zone(o.worldX+o.width/2,o.worldY+o.height/2,o.width,o.height);scene.physics.add.existing(z,true);z.__mapCollision=true;z.__mapBuilding=o.props.building||null;scene.solids.add(z);collisionBodies.push(z)});
  }else{
   collisionLayer=map.createLayer('collisions',tiles,ox,oy);
   if(collisionLayer){collisionLayer.setVisible(false);collisionLayer.setCollisionByExclusion([-1]);if(scene.player)scene.physics.add.collider(scene.player,collisionLayer)}
  }
  const objects={};(map.getObjectLayer('objects')?.objects||[]).forEach(o=>objects[o.name]=worldObject(o));
  const triggers=(map.getObjectLayer('triggers')?.objects||[]).map(worldObject);
  scene.__hoodsTownMap={map,meta:{zoneId:meta.zoneId||'town',chunkId:meta.chunkId||'town-core',zLevel:Number(meta.zLevel||0),worldX:ox,worldY:oy},layers:{ground,decor,collisions:collisionLayer,roofs},collisionBodies,objects,triggers};
  scene.mapObject=name=>scene.__hoodsTownMap?.objects?.[name]||null;
  scene.mapTrigger=name=>scene.__hoodsTownMap?.triggers?.find(t=>t.name===name)||null;
  const spawn=objects.player_spawn;if(spawn&&scene.player)scene.player.setPosition(spawn.worldX,spawn.worldY);
  const bram=objects.npc_bram;if(bram&&scene.bram)scene.bram.setPosition(bram.worldX,bram.worldY);
  const mara=objects.npc_mara;if(mara&&scene.mara)scene.mara.setPosition(mara.worldX,mara.worldY);
  const loc=document.getElementById('phaserLocation');scene.events.on('update',()=>{if(!loc||!scene.player)return;for(const t of triggers){if(t.type!=='zone')continue;const inside=scene.player.x>=t.worldX&&scene.player.x<=t.worldX+(t.width||0)&&scene.player.y>=t.worldY&&scene.player.y<=t.worldY+(t.height||0);if(inside){loc.textContent=t.props.label||t.name.toUpperCase();break}}});
  window.HoodsMaps=window.HoodsMaps||{zones:{}};window.HoodsMaps.zones[scene.__hoodsTownMap.meta.zoneId]=scene.__hoodsTownMap;
  console.info('[Hoods map] P2 loaded',scene.__hoodsTownMap.meta,'collision objects',collisionBodies.length);
 }catch(err){scene.__hoodsTownMap=null;console.warn('[Hoods map] Town install failed, legacy world kept',err)}
}
if(new URLSearchParams(location.search).get('chunks')==='v1'){
 const script=document.createElement('script');script.src='phaser-chunks-runtime.js?v=town-v1';script.async=true;document.head.appendChild(script);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,50));else setTimeout(wait,50);
})();