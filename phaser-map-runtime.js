// Hoods map runtime P10 — manifest-driven chunks, reusable layers and functional z-level registry.
(()=>{
const MANIFEST_KEY='town-manifest-v2';
const MANIFEST_URL='maps/town/manifest.json?v=map-p10';
const ASSET_VERSION='map-p10';
const props=list=>Object.fromEntries((list||[]).map(p=>[p.name,p.value]));
const worldObject=(o,ox,oy)=>{const p=props(o.properties);return{...o,props:p,worldX:ox+(o.x||0),worldY:oy+(o.y||0)}};
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive())return setTimeout(wait,100);
 if(scene.__hoodsTownMapReady||scene.__hoodsMapLoading)return;
 loadManifest(scene);
}
function loadManifest(scene){
 scene.__hoodsMapLoading=true;scene.__hoodsTownMapReady=false;
 if(scene.cache.json.exists(MANIFEST_KEY))return queueAssets(scene,scene.cache.json.get(MANIFEST_KEY));
 scene.load.json(MANIFEST_KEY,MANIFEST_URL);
 scene.load.once('complete',()=>queueAssets(scene,scene.cache.json.get(MANIFEST_KEY)));
 scene.load.once('loaderror',file=>{if(file?.key===MANIFEST_KEY)fail(scene,'manifest',file?.key)});
 scene.load.start();
}
function validateManifest(manifest){
 if(!manifest||manifest.zoneId!=='town')throw new Error('Town manifest missing or has the wrong zoneId');
 if(!Array.isArray(manifest.chunks)||!manifest.chunks.length)throw new Error('Town manifest has no chunks');
 if(!manifest.tilesets||typeof manifest.tilesets!=='object')throw new Error('Town manifest has no tilesets');
 const keys=new Set();
 for(const def of manifest.chunks){
  if(!def?.key||!def?.url)throw new Error('Every Town chunk requires key + url');
  if(keys.has(def.key))throw new Error(`Duplicate Town chunk key: ${def.key}`);keys.add(def.key);
  if(!manifest.tilesets[def.tileset])throw new Error(`Unknown tileset ${def.tileset} for ${def.key}`);
 }
 return manifest;
}
function queueAssets(scene,rawManifest){
 let manifest;
 try{manifest=validateManifest(rawManifest)}catch(err){return fail(scene,'manifest validation',err)}
 let queued=false;
 for(const ts of Object.values(manifest.tilesets)){
  if(!scene.textures.exists(ts.key)){scene.load.svg(ts.key,`${ts.url}?v=${ASSET_VERSION}`);queued=true}
 }
 for(const def of manifest.chunks){
  if(def.enabled===false)continue;
  if(!scene.cache.tilemap.exists(def.key)){scene.load.tilemapTiledJSON(def.key,`${def.url}?v=${ASSET_VERSION}`);queued=true}
 }
 if(!queued)return install(scene,manifest);
 const failed=new Set(),onError=file=>{if(file?.key)failed.add(file.key)};
 scene.load.on('loaderror',onError);
 scene.load.once('complete',()=>{scene.load.off('loaderror',onError);install(scene,manifest,failed)});
 scene.load.start();
}
function installCollisionObjects(scene,map,ox,oy,chunkId,zLevel){
 const bodies=[];if(!scene.solids)return bodies;
 for(const raw of map.getObjectLayer('collisions')?.objects||[]){
  const o=worldObject(raw,ox,oy);if(!o.width||!o.height)continue;
  const zone=scene.add.zone(o.worldX+o.width/2,o.worldY+o.height/2,o.width,o.height);
  scene.physics.add.existing(zone,true);zone.__mapCollision=true;zone.__mapBuilding=o.props.building||null;zone.__mapChunk=chunkId;zone.__mapZLevel=zLevel;
  scene.solids.add(zone);bodies.push(zone);
 }
 return bodies;
}
function createLayer(map,name,tiles,ox,oy,depth){
 if(!map.getLayer(name))return null;
 return map.createLayer(name,tiles,ox,oy)?.setDepth(depth);
}
function installChunk(scene,manifest,def){
 const map=scene.make.tilemap({key:def.key}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0),zLevel=Number(meta.zLevel||0);
 const ts=manifest.tilesets[def.tileset],tileSize=Number(manifest.tileSize||32);
 const tiles=map.addTilesetImage(def.tilesetName||def.tileset,ts.key,tileSize,tileSize,0,0);if(!tiles)throw new Error(`Tileset ${def.tileset} unavailable for ${def.key}`);
 const depths=def.depths||{};
 const ground=createLayer(map,'ground',tiles,ox,oy,Number(depths.ground??.15));
 const decor=createLayer(map,'decor',tiles,ox,oy,Number(depths.decor??3));
 const roofs=createLayer(map,'roofs',tiles,ox,oy,Number(depths.roofs??28));
 const collisionBodies=installCollisionObjects(scene,map,ox,oy,def.key,zLevel);
 const objects={};
 for(const raw of map.getObjectLayer('objects')?.objects||[]){const o=worldObject(raw,ox,oy);if(objects[o.name])console.warn('[Hoods map] duplicate object inside chunk',def.key,o.name);objects[o.name]=o}
 const triggers=(map.getObjectLayer('triggers')?.objects||[]).map(o=>worldObject(o,ox,oy));
 const chunk={key:def.key,map,definition:def,meta:{zoneId:meta.zoneId||manifest.zoneId,chunkId:meta.chunkId||def.key,zLevel,worldX:ox,worldY:oy},layers:{ground,decor,roofs},collisionBodies,objects,triggers};
 if(def.sceneAlias)scene[def.sceneAlias]=chunk;
 if(def.primary)scene.__hoodsTownMap=chunk;
 return chunk;
}
function installZLevelController(scene,ordered,byZ){
 scene.__hoodsZLevel=Number(scene.__hoodsZLevel||0);
 scene.setMapZLevel=level=>{
  const next=Number(level);if(!Number.isFinite(next))return false;
  scene.__hoodsZLevel=next;
  for(const c of ordered){
   const active=c.meta.zLevel===next;
   for(const layer of Object.values(c.layers||{}))layer?.setVisible?.(active);
   for(const zone of c.collisionBodies||[])if(zone.body)zone.body.enable=active;
  }
  scene.events.emit('hoods-zlevel-changed',{zoneId:'town',zLevel:next,chunks:[...(byZ[next]||[])]});
  return true;
 };
 scene.setMapZLevel(scene.__hoodsZLevel);
}
function install(scene,manifest,failedAssets=new Set()){
 try{
  const chunks={},ordered=[],byZ={};
  for(const def of manifest.chunks){
   if(def.enabled===false)continue;
   if(failedAssets.has(def.key)){console.warn('[Hoods map] skipped failed chunk asset',def.key);continue}
   try{
    const chunk=installChunk(scene,manifest,def);chunks[chunk.meta.chunkId]=chunk;ordered.push(chunk);(byZ[chunk.meta.zLevel]??=[]).push(chunk);
   }catch(err){console.warn('[Hoods map] chunk install failed; keeping fallback for',def.key,err)}
  }
  if(!scene.__hoodsTownMap)throw new Error('Primary Town chunk did not install');
  scene.__hoodsTownChunks=chunks;scene.__hoodsTownChunkOrder=ordered;scene.__hoodsTownByZ=byZ;
  scene.mapObject=name=>{for(const c of ordered){if(c.objects?.[name])return c.objects[name]}return null};
  scene.mapTrigger=name=>{for(const c of ordered){const t=c.triggers?.find?.(x=>x.name===name);if(t)return t}return null};
  scene.mapChunks=(zLevel=null)=>zLevel===null?[...ordered]:[...(byZ[Number(zLevel)]||[])];
  const names=new Map();
  for(const c of ordered)for(const name of Object.keys(c.objects||{})){if(names.has(name))console.warn('[Hoods map] duplicate object name across chunks',name,names.get(name),c.meta.chunkId);else names.set(name,c.meta.chunkId)}
  installZLevelController(scene,ordered,byZ);
  for(const def of manifest.chunks.filter(d=>d.applySpawns)){
   const c=ordered.find(x=>x.key===def.key);if(!c)continue;
   const spawn=c.objects.player_spawn;if(spawn&&scene.player)scene.player.setPosition(spawn.worldX,spawn.worldY);
   const bram=c.objects.npc_bram;if(bram&&scene.bram)scene.bram.setPosition(bram.worldX,bram.worldY);
   const mara=c.objects.npc_mara;if(mara&&scene.mara)scene.mara.setPosition(mara.worldX,mara.worldY);
  }
  bindLocationHud(scene,ordered);
  window.HoodsMaps=window.HoodsMaps||{zones:{}};window.HoodsMaps.manifests=window.HoodsMaps.manifests||{};window.HoodsMaps.manifests.town=manifest;window.HoodsMaps.zones.town=chunks;window.HoodsMaps.byZ=window.HoodsMaps.byZ||{};window.HoodsMaps.byZ.town=byZ;
  scene.__hoodsMapLoading=false;scene.__hoodsTownMapReady=true;
  scene.events.emit('hoods-map-ready',{zoneId:'town',chunks:ordered,byZ,manifest});
  console.info('[Hoods map] P10 manifest loaded',ordered.map(c=>`${c.meta.chunkId}@z${c.meta.zLevel}`).join(', '));
 }catch(err){fail(scene,'install',err)}
}
function bindLocationHud(scene,chunks){
 if(scene.__hoodsLocationBinding)return;scene.__hoodsLocationBinding=true;
 const loc=document.getElementById('phaserLocation');
 scene.events.on('postupdate',()=>{
  if(!loc||!scene.player)return;
  const currentZ=Number(scene.__hoodsZLevel||0);
  for(const c of chunks){if(c.meta.zLevel!==currentZ)continue;for(const t of c.triggers||[]){if(t.type!=='zone')continue;const inside=scene.player.x>=t.worldX&&scene.player.x<=t.worldX+(t.width||0)&&scene.player.y>=t.worldY&&scene.player.y<=t.worldY+(t.height||0);if(inside){loc.textContent=t.props.label||t.name.toUpperCase();return}}}
 });
}
function fail(scene,stage,err){scene.__hoodsMapLoading=false;scene.__hoodsTownMapReady=true;scene.__hoodsMapFailed=true;scene.events?.emit?.('hoods-map-failed',{stage,error:err});console.warn(`[Hoods map] ${stage} failed; legacy world remains active`,err||'')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,50));else setTimeout(wait,50);
})();
