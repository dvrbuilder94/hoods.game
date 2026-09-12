// Hoods map migration P6 — Town core + building art + exterior Tilemap chunk.
(()=>{
const CORE_KEY='town-core',CORE_URL='maps/town/town-core.json?v=map-p6',TILE_KEY='town-basic',TILE_URL='assets/maps/tiles/town-basic.svg?v=map-p6';
const ART_TILE_KEY='hoods-town-v1',ART_TILE_URL='assets/maps/tiles/hoods-town-v1.svg?v=map-p6';
const WEST_KEY='town-west',WEST_URL='maps/town/town-west.json?v=map-p6';
const CENTRAL_ART_KEY='town-central-art',CENTRAL_ART_URL='maps/town/town-central-art.json?v=map-p6';
const EXTERIOR_KEY='town-exterior',EXTERIOR_URL='maps/town/town-exterior.json?v=map-p6';
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
function registerChunk(scene,chunk){
 scene.__hoodsTownChunks=scene.__hoodsTownChunks||{};scene.__hoodsTownChunks[chunk.meta.chunkId]=chunk;registerLookups(scene);
 window.HoodsMaps=window.HoodsMaps||{zones:{}};window.HoodsMaps.zones.town=scene.__hoodsTownChunks;
}
function chunk(scene,map,key,ox,oy,tiles,depths){
 const ground=map.createLayer('ground',tiles,ox,oy)?.setDepth(depths.ground);
 const decor=map.createLayer('decor',tiles,ox,oy)?.setDepth(depths.decor);
 const roofs=map.createLayer('roofs',tiles,ox,oy)?.setDepth(depths.roofs??28);
 const collisionBodies=installCollisionObjects(scene,map,ox,oy,key);
 const objects={};(map.getObjectLayer('objects')?.objects||[]).forEach(o=>{const w=worldObject(o,ox,oy);objects[o.name]=w});
 const triggers=(map.getObjectLayer('triggers')?.objects||[]).map(o=>worldObject(o,ox,oy));
 return{ground,decor,roofs,collisionBodies,objects,triggers};
}
function loadCore(scene){
 if(scene.__hoodsMapLoading||scene.__hoodsTownMap)return;
 scene.__hoodsMapLoading=true;scene.__hoodsTownMapReady=false;
 const ready=()=>{scene.__hoodsMapLoading=false;installCore(scene);setTimeout(()=>loadWest(scene),0)};
 const haveMap=scene.cache.tilemap.exists(CORE_KEY),haveTiles=scene.textures.exists(TILE_KEY);
 if(haveMap&&haveTiles)return ready();if(!haveMap)scene.load.tilemapTiledJSON(CORE_KEY,CORE_URL);if(!haveTiles)scene.load.svg(TILE_KEY,TILE_URL);
 scene.load.once('complete',ready);scene.load.once('loaderror',file=>{scene.__hoodsMapLoading=false;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town core asset failed, keeping legacy world',file?.key)});scene.load.start();
}
function installCore(scene){
 if(scene.__hoodsTownMap)return;
 try{
  const map=scene.make.tilemap({key:CORE_KEY}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0),tiles=map.addTilesetImage('town-basic',TILE_KEY,32,32,0,0);if(!tiles)throw new Error('tileset town-basic not available');
  const built=chunk(scene,map,'town-core',ox,oy,tiles,{ground:.14,decor:.24});
  const c={map,meta:{zoneId:meta.zoneId||'town',chunkId:meta.chunkId||'town-core',zLevel:Number(meta.zLevel||0),worldX:ox,worldY:oy},layers:{ground:built.ground,decor:built.decor,roofs:built.roofs},collisionBodies:built.collisionBodies,objects:built.objects,triggers:built.triggers};
  scene.__hoodsTownMap=c;registerChunk(scene,c);
  const spawn=built.objects.player_spawn;if(spawn&&scene.player)scene.player.setPosition(spawn.worldX,spawn.worldY);const bram=built.objects.npc_bram;if(bram&&scene.bram)scene.bram.setPosition(bram.worldX,bram.worldY);const mara=built.objects.npc_mara;if(mara&&scene.mara)scene.mara.setPosition(mara.worldX,mara.worldY);
  const loc=document.getElementById('phaserLocation');scene.events.on('update',()=>{if(!loc||!scene.player)return;for(const cc of Object.values(scene.__hoodsTownChunks||{})){for(const t of cc.triggers||[]){if(t.type!=='zone')continue;const inside=scene.player.x>=t.worldX&&scene.player.x<=t.worldX+(t.width||0)&&scene.player.y>=t.worldY&&scene.player.y<=t.worldY+(t.height||0);if(inside){loc.textContent=t.props.label||t.name.toUpperCase();return}}}});
  console.info('[Hoods map] P6 core loaded',c.meta);
 }catch(err){scene.__hoodsTownMap=null;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town core install failed, legacy world kept',err)}
}
function loadWest(scene){if(scene.__hoodsTownWestLoading)return;if(scene.__hoodsTownWest)return setTimeout(()=>loadCentralArt(scene),0);scene.__hoodsTownWestLoading=true;const ready=()=>{scene.__hoodsTownWestLoading=false;installWest(scene)};const haveMap=scene.cache.tilemap.exists(WEST_KEY),haveTiles=scene.textures.exists(ART_TILE_KEY);if(haveMap&&haveTiles)return ready();if(!haveMap)scene.load.tilemapTiledJSON(WEST_KEY,WEST_URL);if(!haveTiles)scene.load.svg(ART_TILE_KEY,ART_TILE_URL);scene.load.once('complete',ready);scene.load.once('loaderror',file=>{scene.__hoodsTownWestLoading=false;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town west failed, Inn stays legacy',file?.key)});scene.load.start()}
function installWest(scene){
 try{const map=scene.make.tilemap({key:WEST_KEY}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0),tiles=map.addTilesetImage('hoods-town-v1',ART_TILE_KEY,32,32,0,0);if(!tiles)throw new Error('tileset hoods-town-v1 not available');const built=chunk(scene,map,'town-west',ox,oy,tiles,{ground:.18,decor:3.2});const c={map,meta:{zoneId:'town',chunkId:meta.chunkId||'town-west',zLevel:Number(meta.zLevel||0),worldX:ox,worldY:oy},layers:{ground:built.ground,decor:built.decor,roofs:built.roofs},collisionBodies:built.collisionBodies,objects:built.objects,triggers:built.triggers};scene.__hoodsTownWest=c;registerChunk(scene,c);setTimeout(()=>loadCentralArt(scene),0)}catch(err){scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Town west install failed',err)}
}
function loadCentralArt(scene){if(scene.__hoodsTownCentralArtLoading)return;if(scene.__hoodsTownCentralArt)return setTimeout(()=>loadExterior(scene),0);scene.__hoodsTownCentralArtLoading=true;const ready=()=>{scene.__hoodsTownCentralArtLoading=false;installCentralArt(scene)};const haveMap=scene.cache.tilemap.exists(CENTRAL_ART_KEY),haveTiles=scene.textures.exists(ART_TILE_KEY);if(haveMap&&haveTiles)return ready();if(!haveMap)scene.load.tilemapTiledJSON(CENTRAL_ART_KEY,CENTRAL_ART_URL);if(!haveTiles)scene.load.svg(ART_TILE_KEY,ART_TILE_URL);scene.load.once('complete',ready);scene.load.once('loaderror',file=>{scene.__hoodsTownCentralArtLoading=false;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Central art failed',file?.key)});scene.load.start()}
function installCentralArt(scene){
 try{const map=scene.make.tilemap({key:CENTRAL_ART_KEY}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0),tiles=map.addTilesetImage('hoods-town-v1',ART_TILE_KEY,32,32,0,0);if(!tiles)throw new Error('tileset hoods-town-v1 not available');const built=chunk(scene,map,'town-central-art',ox,oy,tiles,{ground:.19,decor:3.25});const c={map,meta:{zoneId:'town',chunkId:meta.chunkId||'town-central-art',zLevel:Number(meta.zLevel||0),worldX:ox,worldY:oy},layers:{ground:built.ground,decor:built.decor,roofs:built.roofs},collisionBodies:built.collisionBodies,objects:built.objects,triggers:built.triggers};scene.__hoodsTownCentralArt=c;registerChunk(scene,c);setTimeout(()=>loadExterior(scene),0)}catch(err){scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Central art install failed',err)}
}
function loadExterior(scene){
 if(scene.__hoodsTownExteriorLoading)return;if(scene.__hoodsTownExterior){scene.__hoodsTownMapReady=true;return}scene.__hoodsTownExteriorLoading=true;
 const ready=()=>{scene.__hoodsTownExteriorLoading=false;installExterior(scene)};const haveMap=scene.cache.tilemap.exists(EXTERIOR_KEY),haveTiles=scene.textures.exists(ART_TILE_KEY);if(haveMap&&haveTiles)return ready();if(!haveMap)scene.load.tilemapTiledJSON(EXTERIOR_KEY,EXTERIOR_URL);if(!haveTiles)scene.load.svg(ART_TILE_KEY,ART_TILE_URL);scene.load.once('complete',ready);scene.load.once('loaderror',file=>{scene.__hoodsTownExteriorLoading=false;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Exterior failed; legacy Town visuals remain',file?.key)});scene.load.start();
}
function installExterior(scene){
 try{const map=scene.make.tilemap({key:EXTERIOR_KEY}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0),tiles=map.addTilesetImage('hoods-town-v1',ART_TILE_KEY,32,32,0,0);if(!tiles)throw new Error('tileset hoods-town-v1 not available');const built=chunk(scene,map,'town-exterior',ox,oy,tiles,{ground:.16,decor:3.1});const c={map,meta:{zoneId:'town',chunkId:meta.chunkId||'town-exterior',zLevel:Number(meta.zLevel||0),worldX:ox,worldY:oy},layers:{ground:built.ground,decor:built.decor,roofs:built.roofs},collisionBodies:built.collisionBodies,objects:built.objects,triggers:built.triggers};scene.__hoodsTownExterior=c;registerChunk(scene,c);scene.__hoodsTownMapReady=true;console.info('[Hoods map] P6 Town exterior loaded',c.meta)}catch(err){scene.__hoodsTownExterior=null;scene.__hoodsTownMapReady=true;console.warn('[Hoods map] Exterior install failed; legacy Town visuals remain',err)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,50));else setTimeout(wait,50);
})();