// Hoods v0.8 visual migration — real repo assets layered into the live Phaser build.
(() => {
const ASSETS={down:'assets/v08/hood-down.svg',up:'assets/v08/hood-up.svg',left:'assets/v08/hood-left.svg',right:'assets/v08/hood-right.svg',cobble:'assets/v08/tile-cobble.svg',grass:'assets/v08/tile-grass.svg',tree:'assets/v08/prop-tree.svg'};
function wait(){const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');if(!scene||!scene.sys?.isActive())return setTimeout(wait,120);load(scene)}
function load(scene){if(scene.__v08Loading||scene.__v08Art)return;scene.__v08Loading=true;Object.entries(ASSETS).forEach(([k,u])=>scene.load.svg(`v08-${k}`,u));scene.load.once('complete',()=>install(scene));scene.load.start()}
function install(scene){scene.__v08Art=true;scene.__v08Loading=false;
  // First real tile pass: plaza and road are now image tiles from the repo, not drawn rectangles.
  const addTiles=(x0,y0,x1,y1,key)=>{for(let y=y0;y<y1;y+=32)for(let x=x0;x<x1;x+=32)scene.add.image(x+16,y+16,key).setDepth(.55)};
  addTiles(640,570,1248,922,'v08-cobble');addTiles(800,250,992,570,'v08-cobble');addTiles(0,672,1800,864,'v08-cobble');
  // Small grass patches around the square to show the new art direction immediately.
  [[576,544,64,128],[1248,544,96,160],[576,896,96,128],[1248,896,96,128]].forEach(([x,y,w,h])=>addTiles(x,y,x+w,y+h,'v08-grass'));
  // Replace some procedural trees with authored assets.
  [[605,600],[1290,610],[610,930],[1300,930],[540,760],[1370,760]].forEach(([x,y])=>scene.add.image(x,y,'v08-tree').setOrigin(.5,.88).setDepth(Math.floor(y/10)));
  // Hide legacy procedural body and mount a real directional sprite on the physics container.
  const p=scene.player;if(p){p.list?.forEach(o=>o.setVisible?.(false));const avatar=scene.add.image(0,-5,'v08-down').setOrigin(.5,.72).setScale(1.15);p.add(avatar);const label=scene.add.text(0,-53,'Hoods',{fontFamily:'Georgia,serif',fontSize:'12px',color:'#b9ef5a',fontStyle:'bold',stroke:'#172018',strokeThickness:3}).setOrigin(.5);p.add(label);let dir='down',phase=0,last=performance.now();scene.events.on('update',()=>{if(!p.body)return;const vx=p.body.velocity.x,vy=p.body.velocity.y,moving=Math.abs(vx)+Math.abs(vy)>4;if(Math.abs(vx)>Math.abs(vy)&&Math.abs(vx)>4)dir=vx<0?'left':'right';else if(Math.abs(vy)>4)dir=vy<0?'up':'down';avatar.setTexture(`v08-${dir}`);const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;if(moving){phase+=dt*11;avatar.y=-5+Math.sin(phase)*1.4;avatar.angle=Math.sin(phase)*1.2}else{avatar.y=-5;avatar.angle=0}});scene.__v08Avatar=avatar}
  // Visible migration marker, removed once the full town conversion is complete.
  scene.add.text(14,82,'v0.8 ART MIGRATION · REAL ASSETS',{fontFamily:'monospace',fontSize:'10px',color:'#f0d9a2',backgroundColor:'#11140dcc',padding:{x:7,y:5}}).setScrollFactor(0).setDepth(200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,80));else setTimeout(wait,80);
})();