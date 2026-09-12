// Hoods Phaser buildings v0.7 — Bank/Shop geometry can come from Town map data.
(()=>{
const LEGACY=[
 {id:'inn',name:'THE INN',x:345,y:360,w:290,h:190,doorX:490,doorY:550,floor:0x725f48,roof:0x743a31},
 {id:'bank',name:'THE BANK',x:760,y:330,w:260,h:190,doorX:890,doorY:520,floor:0x777164,roof:0x55483d},
 {id:'shop',name:"OLD BRAM'S SHOP",x:1110,y:610,w:250,h:170,doorX:1235,doorY:780,floor:0x66513d,roof:0x6f392f}
];
const color=(v,f)=>{if(typeof v==='number')return v;if(typeof v==='string'){const n=Number(v);if(Number.isFinite(n))return n;const h=parseInt(v.replace('#',''),16);if(Number.isFinite(h))return h}return f};
function mapDef(scene,base){
 if(base.id==='inn')return{...base,source:'legacy'};
 const o=scene.mapObject?.(`building_${base.id}`),door=scene.mapObject?.(`door_${base.id}`),trigger=scene.mapTrigger?.(`door_${base.id}_trigger`);
 if(!o||!door)return{...base,source:'legacy'};
 return{...base,name:o.props.label||base.name,x:o.worldX,y:o.worldY,w:o.width||base.w,h:o.height||base.h,doorX:door.worldX,doorY:door.worldY,floor:color(o.props.floorColor,base.floor),roof:color(o.props.roofColor,base.roof),doorTrigger:trigger||null,source:'map'};
}
let attempts=0;
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive())return setTimeout(wait,120);
 if(!scene.__hoodsTownMap&&attempts++<30)return setTimeout(wait,100);
 install(scene);
}
function install(scene){
 if(scene.__hoodsBuildings)return;scene.__hoodsBuildings=true;
 const defs=LEGACY.map(b=>mapDef(scene,b));
 const oldBlocks=scene.solids?.getChildren?.()||[];
 defs.forEach(b=>{const cx=b.x+b.w/2,cy=b.y+b.h/2;oldBlocks.filter(z=>!z.__mapCollision&&Math.abs(z.x-cx)<35&&Math.abs(z.y-cy)<35).forEach(z=>scene.solids.remove(z,true,true))});
 const wall=(x,y,w,h)=>{const z=scene.add.zone(x,y,w,h);scene.physics.add.existing(z,true);scene.solids.add(z);return z};
 const roofs=[];
 defs.forEach(b=>{
  scene.add.rectangle(b.x+b.w/2,b.y+b.h/2+18,b.w-28,b.h-62,b.floor,.98).setDepth(1);
  const line=scene.add.graphics().setDepth(2);line.lineStyle(3,0x2f2922,1);line.strokeRect(b.x+14,b.y+42,b.w-28,b.h-56);
  if(b.id==='inn'){
   for(let i=0;i<3;i++){scene.add.rectangle(b.x+58+i*76,b.y+95,46,25,0x4b3527).setDepth(3);scene.add.rectangle(b.x+58+i*76,b.y+105,36,8,0xa38962).setDepth(3)}scene.add.rectangle(b.x+b.w-55,b.y+120,62,24,0x503829).setDepth(3);
  }else if(b.id==='bank'){
   scene.add.rectangle(b.x+b.w/2,b.y+100,150,28,0x514a40).setDepth(3);for(let i=0;i<4;i++)scene.add.rectangle(b.x+45+i*55,b.y+70,24,20,0xb9a16c).setDepth(3);
  }else{
   scene.add.rectangle(b.x+b.w/2,b.y+90,155,24,0x493226).setDepth(3);for(let i=0;i<4;i++)scene.add.rectangle(b.x+42+i*48,b.y+65,24,16,[0xaeb6b8,0x8a6038,0x7f5639,0x32281f][i]).setDepth(3);
  }
  if(b.source!=='map'){
   const t=18,gap=62;wall(b.x+b.w/2,b.y+48,b.w-28,t);wall(b.x+14,b.y+b.h/2+18,t,b.h-76);wall(b.x+b.w-14,b.y+b.h/2+18,t,b.h-76);wall(b.x+(b.w-gap)/4,b.y+b.h-14,(b.w-gap)/2,t);wall(b.x+b.w-(b.w-gap)/4,b.y+b.h-14,(b.w-gap)/2,t);
  }
  const roof=scene.add.container(0,0).setDepth(30),g=scene.add.graphics();g.fillStyle(b.roof,1);g.fillTriangle(b.x-12,b.y+46,b.x+b.w/2,b.y-18,b.x+b.w+12,b.y+46);g.fillStyle(0x302923,.94).fillRect(b.x-8,b.y+42,b.w+16,25);g.fillStyle(0x5f4935,.96).fillRect(b.x,b.y+57,b.w,42);roof.add(g);roof.add(scene.add.text(b.x+b.w/2,b.y+63,b.name,{fontFamily:'monospace',fontSize:'12px',color:'#f2dfb4',fontStyle:'bold'}).setOrigin(.5,0));roofs.push({b,roof,inside:false});
 });
 const hint=scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'10px',color:'#dfeeaa',backgroundColor:'#0a0c08cc',padding:{x:7,y:4}}).setDepth(45).setOrigin(.5).setVisible(false);
 scene.events.on('update',()=>{
  const p=scene.player;if(!p)return;let any=false;
  roofs.forEach(r=>{const b=r.b,inside=p.x>b.x+18&&p.x<b.x+b.w-18&&p.y>b.y+52&&p.y<b.y+b.h-12;if(inside!==r.inside){r.inside=inside;scene.tweens.killTweensOf(r.roof);scene.tweens.add({targets:r.roof,alpha:inside?.1:1,duration:180})}
   const t=b.doorTrigger,nearDoor=t?(p.x>=t.worldX&&p.x<=t.worldX+(t.width||0)&&p.y>=t.worldY&&p.y<=t.worldY+(t.height||0)):(Math.abs(p.x-b.doorX)<52&&Math.abs(p.y-b.doorY)<62);
   if(nearDoor&&!inside){hint.setText(`${b.name} · WALK THROUGH THE DOOR`).setPosition(b.doorX,b.doorY+22).setVisible(true);any=true}
  });
  if(!any)hint.setVisible(false);p.setDepth(Math.max(10,Math.floor(p.y/10)));if(scene.bram)scene.bram.setDepth(Math.floor(scene.bram.y/10));if(scene.mara)scene.mara.setDepth(Math.floor(scene.mara.y/10));
 });
 scene.__hoodsBuildingDefs=defs;console.info('[Hoods buildings] sources',defs.map(b=>`${b.id}:${b.source}`).join(', '));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,50));else setTimeout(wait,50);
})();