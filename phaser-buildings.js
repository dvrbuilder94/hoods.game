// Hoods Phaser buildings v1.1 — data-driven geometry with compact top-down roofs and legacy fallback.
(()=>{
const LEGACY=[
 {id:'inn',name:'THE INN',x:345,y:360,w:290,h:190,doorX:490,doorY:550,floor:0x725f48,roof:0x743a31},
 {id:'bank',name:'THE BANK',x:760,y:330,w:260,h:190,doorX:890,doorY:520,floor:0x777164,roof:0x55483d},
 {id:'shop',name:"OLD BRAM'S SHOP",x:1110,y:610,w:250,h:170,doorX:1235,doorY:780,floor:0x66513d,roof:0x6f392f}
];
const color=(v,f)=>{if(typeof v==='number')return v;if(typeof v==='string'){const n=Number(v);if(Number.isFinite(n))return n;const h=parseInt(v.replace('#',''),16);if(Number.isFinite(h))return h}return f};
const shade=(hex,amount)=>{const r=Math.max(0,Math.min(255,((hex>>16)&255)+amount)),g=Math.max(0,Math.min(255,((hex>>8)&255)+amount)),b=Math.max(0,Math.min(255,(hex&255)+amount));return(r<<16)|(g<<8)|b};
function mapDef(scene,base){
 const o=scene.mapObject?.(`building_${base.id}`),door=scene.mapObject?.(`door_${base.id}`),trigger=scene.mapTrigger?.(`door_${base.id}_trigger`),art=scene.mapObject?.(`art_${base.id}`);
 if(!o||!door)return{...base,source:'legacy',artSource:'legacy'};
 return{...base,name:o.props.label||base.name,x:o.worldX,y:o.worldY,w:o.width||base.w,h:o.height||base.h,doorX:door.worldX,doorY:door.worldY,floor:color(o.props.floorColor,base.floor),roof:color(o.props.roofColor,base.roof),doorTrigger:trigger||null,source:'map',artSource:art?.props?.artSource||o.props.artSource||'legacy'};
}
let attempts=0;
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive())return setTimeout(wait,120);
 if(!scene.__hoodsTownMapReady&&attempts++<60)return setTimeout(wait,100);
 install(scene);
}
function addTopDownRoof(scene,b){
 const roof=scene.add.container(0,0).setDepth(900);
 const g=scene.add.graphics(),dark=shade(b.roof,-28),light=shade(b.roof,18),ridge=shade(b.roof,-42);
 const x=b.x-7,y=b.y+6,w=b.w+14,h=Math.max(96,b.h-30),mid=b.x+b.w/2;
 // Compact gabled roof seen from above: two planes, a ridge and pixel-like shingle rows.
 g.fillStyle(dark,1).fillRect(x,y,w,h);
 g.fillStyle(b.roof,1).fillRect(b.x+1,y+4,Math.max(1,b.w/2-1),h-8);
 g.fillStyle(light,.88).fillRect(mid,y+4,Math.max(1,b.w/2-1),h-8);
 g.fillStyle(ridge,1).fillRect(mid-2,y,4,h);
 g.lineStyle(3,ridge,.95).strokeRect(x,y,w,h);
 g.lineStyle(1,dark,.6);
 for(let yy=y+16;yy<y+h-5;yy+=16)g.lineBetween(x+3,yy,x+w-3,yy);
 // Short eave keeps the doorway readable instead of drawing a tall front-facing facade.
 g.fillStyle(ridge,.95).fillRect(x-3,y+h-5,w+6,8);
 roof.add(g);
 const sign=scene.add.text(b.x+b.w/2,b.y+b.h-19,b.name,{fontFamily:'monospace',fontSize:'11px',color:'#f2dfb4',fontStyle:'bold',stroke:'#241f1a',strokeThickness:3}).setOrigin(.5,1);
 roof.add(sign);
 return roof;
}
function install(scene){
 if(scene.__hoodsBuildings)return;scene.__hoodsBuildings=true;
 const defs=LEGACY.map(b=>mapDef(scene,b));
 const oldBlocks=scene.solids?.getChildren?.()||[];
 defs.forEach(b=>{const cx=b.x+b.w/2,cy=b.y+b.h/2;oldBlocks.filter(z=>!z.__mapCollision&&Math.abs(z.x-cx)<35&&Math.abs(z.y-cy)<35).forEach(z=>scene.solids.remove(z,true,true))});
 const wall=(x,y,w,h)=>{const z=scene.add.zone(x,y,w,h);scene.physics.add.existing(z,true);scene.solids.add(z);return z};
 const roofs=[];
 defs.forEach(b=>{
  if(b.artSource!=='tilemap'){
   scene.add.rectangle(b.x+b.w/2,b.y+b.h/2+18,b.w-28,b.h-62,b.floor,.98).setDepth(1);
   const line=scene.add.graphics().setDepth(2);line.lineStyle(3,0x2f2922,1);line.strokeRect(b.x+14,b.y+42,b.w-28,b.h-56);
   if(b.id==='inn'){
    for(let i=0;i<3;i++){scene.add.rectangle(b.x+58+i*76,b.y+95,46,25,0x4b3527).setDepth(3);scene.add.rectangle(b.x+58+i*76,b.y+105,36,8,0xa38962).setDepth(3)}scene.add.rectangle(b.x+b.w-55,b.y+120,62,24,0x503829).setDepth(3);
   }else if(b.id==='bank'){
    scene.add.rectangle(b.x+b.w/2,b.y+100,150,28,0x514a40).setDepth(3);for(let i=0;i<4;i++)scene.add.rectangle(b.x+45+i*55,b.y+70,24,20,0xb9a16c).setDepth(3);
   }else{
    scene.add.rectangle(b.x+b.w/2,b.y+90,155,24,0x493226).setDepth(3);for(let i=0;i<4;i++)scene.add.rectangle(b.x+42+i*48,b.y+65,24,16,[0xaeb6b8,0x8a6038,0x7f5639,0x32281f][i]).setDepth(3);
   }
  }
  if(b.source!=='map'){
   const t=18,gap=62;wall(b.x+b.w/2,b.y+48,b.w-28,t);wall(b.x+14,b.y+b.h/2+18,t,b.h-76);wall(b.x+b.w-14,b.y+b.h/2+18,t,b.h-76);wall(b.x+(b.w-gap)/4,b.y+b.h-14,(b.w-gap)/2,t);wall(b.x+b.w-(b.w-gap)/4,b.y+b.h-14,(b.w-gap)/2,t);
  }
  const roof=addTopDownRoof(scene,b);roofs.push({b,roof,inside:false});
 });
 const hint=scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'10px',color:'#dfeeaa',backgroundColor:'#0a0c08e8',padding:{x:7,y:4}}).setDepth(1100).setOrigin(.5).setVisible(false);
 scene.events.on('update',()=>{
  const p=scene.player;if(!p)return;let any=false;
  roofs.forEach(r=>{const b=r.b,inside=p.x>b.x+18&&p.x<b.x+b.w-18&&p.y>b.y+52&&p.y<b.y+b.h-12;if(inside!==r.inside){r.inside=inside;scene.tweens.killTweensOf(r.roof);scene.tweens.add({targets:r.roof,alpha:inside?.08:1,duration:140})}
   const t=b.doorTrigger,nearDoor=t?(p.x>=t.worldX&&p.x<=t.worldX+(t.width||0)&&p.y>=t.worldY&&p.y<=t.worldY+(t.height||0)):(Math.abs(p.x-b.doorX)<52&&Math.abs(p.y-b.doorY)<62);
   if(nearDoor&&!inside){hint.setText(`${b.name} · ENTER`).setPosition(b.doorX,b.doorY+20).setVisible(true);any=true}
  });
  if(!any)hint.setVisible(false);p.setDepth(Math.max(10,Math.floor(p.y/10)));if(scene.bram)scene.bram.setDepth(Math.floor(scene.bram.y/10));if(scene.mara)scene.mara.setDepth(Math.floor(scene.mara.y/10));
 });
 scene.__hoodsBuildingDefs=defs;console.info('[Hoods buildings] v1.1 sources',defs.map(b=>`${b.id}:${b.source}/${b.artSource}`).join(', '));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,50));else setTimeout(wait,50);
})();
