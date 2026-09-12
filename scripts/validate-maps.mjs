import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const REQUIRED_LAYERS=['ground','decor','collisions','roofs','objects','triggers'];
const REQUIRED_PROPS=['zoneId','chunkId','worldX','worldY','zLevel'];
const failures=[];
const warnings=[];
const readJson=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const mapProps=map=>Object.fromEntries((map.properties||[]).map(p=>[p.name,p.value]));
const assert=(condition,message)=>{if(!condition)failures.push(message)};

function validateZone(zone){
 const manifestPath=`maps/${zone}/manifest.json`;
 assert(fs.existsSync(path.join(ROOT,manifestPath)),`${zone}: missing ${manifestPath}`);
 if(!fs.existsSync(path.join(ROOT,manifestPath)))return;
 const manifest=readJson(manifestPath);
 assert(manifest.zoneId===zone,`${manifestPath}: zoneId must be ${zone}`);
 assert(Number(manifest.tileSize)>0,`${manifestPath}: tileSize must be positive`);
 assert(manifest.tilesets&&typeof manifest.tilesets==='object',`${manifestPath}: tilesets missing`);
 assert(Array.isArray(manifest.chunks)&&manifest.chunks.length>0,`${manifestPath}: chunks missing`);
 const chunkKeys=new Set(),objectNames=new Map();
 for(const def of manifest.chunks||[]){
  assert(def.key,`${manifestPath}: chunk without key`);
  assert(def.url,`${manifestPath}: ${def.key||'unknown'} missing url`);
  assert(!chunkKeys.has(def.key),`${manifestPath}: duplicate chunk key ${def.key}`);chunkKeys.add(def.key);
  assert(manifest.tilesets?.[def.tileset],`${manifestPath}: ${def.key} references unknown tileset ${def.tileset}`);
  if(!def.url)continue;
  const absolute=path.join(ROOT,def.url);
  assert(fs.existsSync(absolute),`${manifestPath}: ${def.key} file not found at ${def.url}`);
  if(!fs.existsSync(absolute))continue;
  const map=readJson(def.url),props=mapProps(map),layers=new Map((map.layers||[]).map(l=>[l.name,l]));
  for(const layer of REQUIRED_LAYERS)assert(layers.has(layer),`${def.url}: missing layer ${layer}`);
  for(const prop of REQUIRED_PROPS)assert(Object.prototype.hasOwnProperty.call(props,prop),`${def.url}: missing map property ${prop}`);
  assert(props.zoneId===zone,`${def.url}: zoneId ${props.zoneId} does not match ${zone}`);
  assert(props.chunkId===def.key,`${def.url}: chunkId ${props.chunkId} does not match manifest key ${def.key}`);
  assert(Number.isFinite(Number(props.worldX))&&Number.isFinite(Number(props.worldY)),`${def.url}: worldX/worldY must be numeric`);
  assert(Number.isFinite(Number(props.zLevel)),`${def.url}: zLevel must be numeric`);
  assert(Number(map.tilewidth)===Number(manifest.tileSize)&&Number(map.tileheight)===Number(manifest.tileSize),`${def.url}: tile size must match manifest`);
  for(const ts of map.tilesets||[]){
   assert(ts.name===def.tilesetName||ts.name===def.tileset,`${def.url}: tileset ${ts.name} does not match manifest declaration`);
  }
  const objects=layers.get('objects')?.objects||[];
  for(const object of objects){
   if(!object.name){warnings.push(`${def.url}: unnamed object id ${object.id}`);continue}
   if(objectNames.has(object.name))failures.push(`${zone}: duplicate object name ${object.name} in ${objectNames.get(object.name)} and ${def.url}`);
   else objectNames.set(object.name,def.url);
  }
  for(const collision of layers.get('collisions')?.objects||[]){
   assert(Number(collision.width)>0&&Number(collision.height)>0,`${def.url}: collision ${collision.name||collision.id} must have width/height`);
  }
 }
}

// Validate every zone that has adopted the manifest contract. Town is mandatory today.
validateZone('town');

if(warnings.length){console.warn('\nMap validation warnings:');warnings.forEach(w=>console.warn(`- ${w}`));}
if(failures.length){console.error('\nMap validation failed:');failures.forEach(f=>console.error(`- ${f}`));process.exit(1);}
console.log('Map validation OK: manifest, layers, properties, tilesets and object names are consistent.');
