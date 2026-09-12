// Hoods visual layer P9 — Tilemaps own Town static art; runtime keeps only lightweight ambience/fallback.
(() => {
let attempts=0;
function wait(){
  const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
  if(!scene||!scene.sys?.isActive())return setTimeout(wait,120);
  if(!scene.__hoodsTownMapReady&&attempts++<60)return setTimeout(wait,100);
  install(scene);
}
function install(scene){
  if(scene.__hoodsVisuals)return;scene.__hoodsVisuals=true;
  const mapExterior=!!scene.__hoodsTownExterior;
  if(!mapExterior){
    const ground=scene.add.graphics().setDepth(.35);
    ground.fillStyle(0x77766f,.92).fillRoundedRect(640,570,610,330,18);
    for(let y=586,row=0;y<888;y+=22,row++)for(let x=654+(row%2?11:0);x<1230;x+=34){const n=((x*13+y*7)%19);ground.fillStyle(n<6?0x6c6c66:n<12?0x818078:0x74736c,.82).fillRoundedRect(x,y,28,16,4)}
    ground.fillStyle(0x77766f,.9).fillRect(816,250,168,340).fillRect(0,688,1800,145);
    for(let y=268;y<585;y+=24)for(let x=826;x<976;x+=36)ground.fillStyle(((x+y)%3)?0x74736e:0x85837b,.65).fillRoundedRect(x,y,28,17,4);
    ground.lineStyle(4,0x504f4a,.95).strokeRoundedRect(640,570,610,330,18);
    const garden=(x,y,w,h)=>{ground.fillStyle(0x465a35,.95).fillRoundedRect(x,y,w,h,8);ground.lineStyle(3,0x3b3329,.9).strokeRoundedRect(x,y,w,h,8);for(let yy=y+10;yy<y+h-6;yy+=18)for(let xx=x+10;xx<x+w-6;xx+=20){const k=(xx+yy)%4;ground.fillStyle([0xc77965,0xd3b552,0xb07aac,0xe5d2a0][k],.85).fillCircle(xx,yy,2.4)}};
    garden(665,600,105,48);garden(1030,600,105,48);garden(665,845,115,38);garden(1020,845,115,38);
    const lamp=(x,y)=>{const c=scene.add.container(x,y).setDepth(Math.floor(y/10));c.add(scene.add.rectangle(0,4,8,40,0x3a332c));c.add(scene.add.rectangle(0,-18,18,20,0x4b4439).setStrokeStyle(2,0x241f1b));c.add(scene.add.rectangle(0,-18,9,11,0xe0a84f,.92));c.glow=scene.add.circle(0,-18,24,0xe0a84f,.08);c.addAt(c.glow,0);scene.tweens.add({targets:c.glow,alpha:{from:.05,to:.14},duration:900+Phaser.Math.Between(0,350),yoyo:true,repeat:-1});return c};
    [[690,675],[1110,675],[690,825],[1110,825],[800,610],[1000,610]].forEach(p=>lamp(...p));
    const barrel=(x,y)=>{const c=scene.add.container(x,y).setDepth(Math.floor(y/10));c.add(scene.add.ellipse(0,9,22,8,0x3a291f,.35));c.add(scene.add.rectangle(0,0,20,27,0x755036).setStrokeStyle(2,0x36251c));c.add(scene.add.rectangle(0,-6,21,3,0x302a25));c.add(scene.add.rectangle(0,6,21,3,0x302a25))};
    barrel(620,865);barrel(1265,850);barrel(1090,560);
  }else{
    // Old world labels were useful during the rectangle prototype but fight the map/HUD hierarchy now.
    const obsolete=new Set(['THE WILDS — OPEN','ASHWOOD TRAIL — LOCKED','ASHWOOD TRAIL — OPEN']);
    for(const child of scene.children.list){if(typeof child?.text==='string'&&obsolete.has(child.text))child.setVisible(false)}
  }
  // Runtime ambience stays deliberately light and below actors; static scenery belongs in map data.
  const leaves=[];for(let i=0;i<14;i++){const l=scene.add.rectangle(Phaser.Math.Between(50,1750),Phaser.Math.Between(300,1150),Phaser.Math.Between(2,3),Phaser.Math.Between(2,3),0x91a862,.24).setDepth(4);leaves.push({o:l,v:Phaser.Math.FloatBetween(3,7),w:Phaser.Math.FloatBetween(.7,1.5)})}
  let time=0;scene.events.on('update',(_,delta)=>{time+=delta/1000;leaves.forEach((l,i)=>{l.o.x+=Math.sin(time*l.w+i)*.06;l.o.y+=l.v*delta/1000;if(l.o.y>1180){l.o.y=300;l.o.x=Phaser.Math.Between(50,1750)}})});
  console.info('[Hoods visuals] P9 static exterior source',mapExterior?'tilemap':'legacy');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,80));else setTimeout(wait,80);
})();