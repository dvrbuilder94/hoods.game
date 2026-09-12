// Hoods chunk runtime v0.1 — opt-in scalable Tilemap loader.
// Enable only with ?chunks=v1 while the pilot is being validated.
(()=>{
if(new URLSearchParams(location.search).get('chunks')!=='v1')return;
const MANIFEST_KEY='town-manifest-v1',MANIFEST_URL='maps/town/manifest.json?v=town-v1';
const props=list=>Object.fromEntries((list||[]).map(p=>[p.name,p.value]));
const worldObject=(o,ox,oy)=>{const p=props(o.properties);return{...o,props:p,worldX:ox+(o.x||0),worldY:oy+(o.y||0)}};
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive())return setTimeout(wait,100);
 if(scene.load?.isLoading?.())return setTimeout(wait,100);
 loadManifest(scene);
}
function loadManifest(scene){
 if(scene.cache.json.exists(MANIFEST_KEY))return loadAssets(scene,scene.cache.json.get(MANIFEST_KEY));
 scene.load.json(MANIFEST_KEY,MANIFEST_URL);
 scene.load.once('complete',()=>loadAssets(scene,scene.cache.json.get(MANIFEST_KEY)));
 scene.load.once('loaderror',file=>{if(file?.key===MANIFEST_KEY)fail(scene,'manifest',file)});
 scene.load.start();
}
function loadAssets(scene,manifest){
 if(!manifest?.chunks?.length)return fail(scene,'empty manifest');
 const chunks=manifest.chunks.filter(c=>c.enabled!==false);
 for(const ts of manifest.tilesets||[]){if(!scene.textures.exists(ts.key))scene.load.svg(ts.key,ts.url)}
 for(const c of chunks){if(!scene.cache.tilemap.exists(c.key))scene.load.tilemapTiledJSON(c.key,c.url)}
 if(scene.load.list?.size===0)return install(scene,manifest,chunks);
 scene.load.once('complete',()=>install(scene,manifest,chunks));
 scene.load.once('loaderror',file=>console.warn('[Hoods chunks] asset failed; legacy fallback remains',file?.key));
 scene.load.start();
}
function install(scene,manifest,chunks){
 if(scene.__hoodsChunksReady)return;
 try{
  const installed=[];
  for(const def of chunks){
   const map=scene.make.tilemap({key:def.key}),meta=props(map.properties),ox=Number(meta.worldX||0),oy=Number(meta.worldY||0);
   const tileSets=(map.tilesets||[]).map(ts=>map.addTilesetImage(ts.name,ts.name,ts.tileWidth||32,ts.tileHeight||32,ts.tileMargin||0,ts.tileSpacing||0)).filter(Boolean);
   if(!tileSets.length)throw new Error(`No tileset available for ${def.key}`);
   const ground=map.createLayer('ground',tileSets,ox,oy)?.setDepth(.16);
   const decor=map.createLayer('decor',tileSets,ox,oy)?.setDepth(3.2);
   const roofs=map.createLayer('roofs',tileSets,ox,oy)?.setDepth(28);
   const collisionBodies=[];
   for(const raw of map.getObjectLayer('collisions')?.objects||[]){
    const o=worldObject(raw,ox,oy);if(!o.width||!o.height||!scene.solids)continue;
    const z=scene.add.zone(o.worldX+o.width/2,o.worldY+o.height/2,o.width,o.height);scene.physics.add.existing(z,true);
    z.__mapCollision=true;z.__mapChunk=def.key;z.__mapBuilding=o.props.building||null;scene.solids.add(z);collisionBodies.push(z);
   }
   const objects={};for(const raw of map.getObjectLayer('objects')?.objects||[]){const o=worldObject(raw,ox,oy);objects[o.name]=o}
   const triggers=(map.getObjectLayer('triggers')?.objects||[]).map(o=>worldObject(o,ox,oy));
   installed.push({key:def.key,map,meta:{...meta,worldX:ox,worldY:oy,zLevel:Number(meta.zLevel||0)},layers:{ground,decor,roofs},collisionBodies,objects,triggers});
  }
  const baseObject=scene.mapObject?.bind(scene),baseTrigger=scene.mapTrigger?.bind(scene);
  scene.__hoodsChunks=installed;
  scene.mapObject=name=>installed.map(c=>c.objects[name]).find(Boolean)||baseObject?.(name)||null;
  scene.mapTrigger=name=>installed.flatMap(c=>c.triggers).find(t=>t.name===name)||baseTrigger?.(name)||null;
  scene.__hoodsChunksReady=true;
  window.HoodsMaps=window.HoodsMaps||{zones:{}};window.HoodsMaps.chunks=installed;
  console.info('[Hoods chunks] loaded',installed.map(c=>c.key).join(', '));
 }catch(err){fail(scene,'install',err)}
}
function fail(scene,stage,err){scene.__hoodsChunksReady=true;scene.__hoodsChunks=[];console.warn(`[Hoods chunks] ${stage} failed; legacy world kept`,err||'')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,80));else setTimeout(wait,80);
})();
