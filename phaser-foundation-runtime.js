// Hoods foundation P11 — remove the legacy illustrated world so Tilemaps become the visual source of truth.
(()=>{
const WORLD_W=1800,WORLD_H=1200;
const LEGACY_LABELS=new Set(['INN','BANK',"OLD BRAM'S SHOP",'THE WILDS — OPEN','ASHWOOD TRAIL — OPEN','ASHWOOD TRAIL — LOCKED','HOODS TOWN']);
let attempts=0;
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive()){if(attempts++<100)setTimeout(wait,50);return}
 install(scene);
}
function install(scene){
 if(scene.__hoodsFoundationP11)return;scene.__hoodsFoundationP11=true;
 // TownScene.drawWorld() used one giant Graphics object for roads, houses, trees and water.
 // It hides the real Tilemap migration underneath. Remove only the earliest depth-0 Graphics object.
 const legacyGraphics=scene.children.list.find(o=>o instanceof Phaser.GameObjects.Graphics&&Number(o.depth||0)===0);
 if(legacyGraphics){legacyGraphics.destroy();scene.__hoodsLegacyWorldRemoved=true}
 // Keep a neutral fallback terrain under all map chunks. New terrain belongs in Tilemaps.
 scene.add.rectangle(WORLD_W/2,WORLD_H/2,WORLD_W,WORLD_H,0x627f43,1).setDepth(-1000).setName('hoods-map-fallback-ground');
 const removeLabels=()=>{
  for(const o of [...scene.children.list]){
   if(!(o instanceof Phaser.GameObjects.Text))continue;
   if(LEGACY_LABELS.has(String(o.text||'')))o.destroy();
  }
 };
 removeLabels();
 scene.time.delayedCall(800,removeLabels);
 scene.time.delayedCall(1800,removeLabels);
 console.info('[Hoods foundation] P11 legacy world art removed; Tilemaps own Town visuals');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,20));else setTimeout(wait,20);
})();
