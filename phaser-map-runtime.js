// Hoods map migration P3 — Town core + west chunk, incremental and fallback-safe.
(()=>{
const CORE_KEY='town-core',CORE_URL='maps/town/town-core.json?v=map-p3',TILE_KEY='town-basic',TILE_URL='assets/maps/tiles/town-basic.svg?v=map-p3';
const WEST_KEY='town-west',WEST_URL='maps/town/town-west.json?v=map-p3';
const props=list=>Object.fromEntries((list||[]).map(p=>[p.name,p.value]));
const worldObject=(o,ox,oy)=>{const p=props(o.properties);return{...o,props:p,worldX:ox+(o.x||0),worldY:oy+(o.y||0)}};
function wait(){const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');if(!scene||!scene.sys?.isActive())return setTimeout(wait,100);loadCore(scene)}
function installCollisionObjects(scene,map,ox,oy,chunkId){
 const bodies=[];const objects=(map.getObjectLayer('collisions')?.objects||[]).map(o=>worldObject(o,ox,oy));
 if(!scene.solids)return bodies;
 objects.forEach(o=>{if(!o.width||!o.height)return;const z=scene.add.zone(o.worldX+o.width/2,o.worldY+o.height/2,o.width,o.height);scene.physics.add.existing(z,true);z.__mapCollision=true;z.__mapBuilding=o.props.building||null;z.__mapChunk=chunkId;scene.solids.add(z);bodies.push(z)});
 return bodies;
}
function registerLookups(scene){
 scene.mapObject=name=>{for(const c of Object.values(scene.__hoodsTownChunks||{})){if(c?.objects?.[name])return c.objects[name]}return null};
 scene.mapTrigger=name=>{for(const c of Object.values(scene.__hoodsTownChunks||{})){const hit=c?.triggers?.find?.(t=>t.name===name);if(hit)return hit}return null};
}
function loadCore(scene){
 if(scene.__hoodsMapLoading||scene.__hoodsTownMap)return;
 scene.__hoodsMapLoading=true;
 const ready=()=>{scene.__hoodsMapLoading=false;installCore(scene);setTimeout(()=>loadWest(scene),0)};
 const haveMap=scene.cache.tilemap.exists(CORE_KEY),haveTiles=scene.textures.exists(TILE_KEY);
 if(haveMap&&haveTiles)return ready();
 if(!haveMap)scene.load.tilemapTiledJSON(CORE_KEY,CORE_URL);
 if(!haveTiles)scene.load.svg(TILE_KEY,TILE_URL);
 scene.load.once('complete',ready);
 scene.load.once('loaderror',file=>{scene.__hoodsMapLoading=false;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town core asset failed, keeping legacy world',file?.key)});
 scene.load.start();
}
function installCore(scene){
 if(scene.__hoodsTownMap)return;
 try{
  const map=scene.make.tilemap({key:CORE_KEY}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0);
  const tiles=map.addTilesetImage('town-basic',TILE_KEY,32,32,0,0);if(!tiles)throw new Error('tileset town-basic not available');
  const ground=map.createLayer('ground',tiles,ox,oy)?.setDepth(.14);
  const decor=map.createLayer('decor',tiles,ox,oy)?.setDepth(.24);
  const roofs=map.createLayer('roofs',tiles,ox,oy)?.setDepth(28);
  const collisionBodies=installCollisionObjects(scene,map,ox,oy,'town-core');
  const objects={};(map.getObjectLayer('objects')?.objects||[]).forEach(o=>{const w=worldObject(o,ox,oy);objects[o.name]=w});
  const triggers=(map.getObjectLayer('triggers')?.objects||[]).map(o=>worldObject(o,ox,oy));
  const chunk={map,meta:{zoneId:meta.zoneId||'town',chunkId:meta.chunkId||'town-core',zLevel:Number(meta.zLevel||0),worldX:ox,worldY:oy},layers:{ground,decor,roofs},collisionBodies,objects,triggers};
  scene.__hoodsTownMap=chunk;scene.__hoodsTownChunks=scene.__hoodsTownChunks||{};scene.__hoodsTownChunks[chunk.meta.chunkId]=chunk;scene.__hoodsTownMapReady=false;registerLookups(scene);
  const spawn=objects.player_spawn;if(spawn&&scene.player)scene.player.setPosition(spawn.worldX,spawn.worldY);
  const bram=objects.npc_bram;if(bram&&scene.bram)scene.bram.setPosition(bram.worldX,bram.worldY);
  const mara=objects.npc_mara;if(mara&&scene.mara)scene.mara.setPosition(mara.worldX,mara.worldY);
  const loc=document.getElementById('phaserLocation');scene.events.on('update',()=>{if(!loc||!scene.player)return;for(const c of Object.values(scene.__hoodsTownChunks||{})){for(const t of c.triggers||[]){if(t.type!=='zone')continue;const inside=scene.player.x>=t.worldX&&scene.player.x<=t.worldX+(t.width||0)&&scene.player.y>=t.worldY&&scene.player.y<=t.worldY+(t.height||0);if(inside){loc.textContent=t.props.label||t.name.toUpperCase();return}}}});
  window.HoodsMaps=window.HoodsMaps||{zones:{}};window.HoodsMaps.zones.town=scene.__hoodsTownChunks;
  console.info('[Hoods map] P3 core loaded',chunk.meta,'collision objects',collisionBodies.length);
 }catch(err){scene.__hoodsTownMap=null;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town core install failed, legacy world kept',err)}
}
function loadWest(scene){
 if(scene.__hoodsTownWestLoading||scene.__hoodsTownWest){scene.__hoodsTownMapReady=true;return}
 scene.__hoodsTownWestLoading=true;
 const ready=()=>{scene.__hoodsTownWestLoading=false;installWest(scene)};
 if(scene.cache.tilemap.exists(WEST_KEY))return ready();
 scene.load.tilemapTiledJSON(WEST_KEY,WEST_URL);scene.load.once('complete',ready);
 scene.load.once('loaderror',file=>{scene.__hoodsTownWestLoading=false;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town west asset failed, Inn stays legacy',file?.key)});
 scene.load.start();
}
function installWest(scene){
 if(scene.__hoodsTownWest){scene.__hoodsTownMapReady=true;return}
 try{
  const map=scene.make.tilemap({key:WEST_KEY}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0);
  const collisionBodies=installCollisionObjects(scene,map,ox,oy,'town-west');
  const objects={};(map.getObjectLayer('objects')?.objects||[]).forEach(o=>{const w=worldObject(o,ox,oy);objects[o.name]=w});
  const triggers=(map.getObjectLayer('triggers')?.objects||[]).map(o=>worldObject(o,ox,oy));
  const chunk={map,meta:{zoneId:meta.zoneId||'town',chunkId:meta.chunkId||'town-west',zLevel:Number(meta.zLevel||0),worldX:ox,worldY:oy},layers:{ground:null,decor:null,roofs:null},collisionBodies,objects,triggers};
  scene.__hoodsTownWest=chunk;scene.__hoodsTownChunks=scene.__hoodsTownChunks||{};scene.__hoodsTownChunks[chunk.meta.chunkId]=chunk;scene.__hoodsTownMapReady=true;registerLookups(scene);
  window.HoodsMaps=window.HoodsMaps||{zones:{}};window.HoodsMaps.zones.town=scene.__hoodsTownChunks;
  console.info('[Hoods map] P3 west loaded',chunk.meta,'collision objects',collisionBodies.length);
 }catch(err){scene.__hoodsTownWest=null;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town west install failed, Inn stays legacy',err)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,50));else setTimeout(wait,50);
})();