// Hoods Character v4 — real sprite-atlas renderer from the approved character sheet.
(()=>{
 const boot=()=>{
  const game=Phaser.GAMES?.[0],s=game?.scene?.scenes?.[0];
  if(!s?.actor||!s?.hero){setTimeout(boot,80);return}
  const install=()=>{
   const COL={Hoods:0,Bram:1,Mara:2,Thorn:3,Guard:4,Sara:5,Merchant:6};
   const ROW={down:0,left:1,right:2,up:3};
   s.drawHumanoid=function(c,{name='Hoods',dir='down',frame=0,gear={},npc=false}={}){
    c.removeAll(true);
    const col=COL[name]??0,row=ROW[dir]??0,idx=row*7+col;
    c.add(this.add.ellipse(0,27,31,8,0x050605,.30));
    const spr=this.add.sprite(0,-3,'charsV4',idx).setOrigin(.5,.5).setScale(1);
    c.add(spr);
    if(!npc&&dir!=='up'){
      if(gear.weapon){const w=this.add.graphics();const side=dir==='left'?-1:dir==='right'?1:0,wx=side?side*23:22;w.lineStyle(3,0xd8dedc,1);w.beginPath();w.moveTo(wx,13);w.lineTo(wx+(side?side*6:6),-18);w.strokePath();w.lineStyle(3,0x6e4b31,1);w.beginPath();w.moveTo(wx-5,10);w.lineTo(wx+5,13);w.strokePath();c.add(w)}
      if(gear.shield){const sh=this.add.graphics(),side=dir==='left'?-1:dir==='right'?1:0,sx=side?-side*22:-22;sh.fillStyle(0x745035,1);sh.fillPoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);sh.lineStyle(2,0xb7915f,1);sh.strokePoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);c.add(sh)}
    }
   };
   s.npcs.forEach(n=>s.drawHumanoid(n.ch.c,{name:n.name,dir:'down',frame:0,npc:true}));
   s.lastHeroKey='';s.drawHero(true);
   const old=document.getElementById('charV4Mark');if(old)old.remove();
   const mark=document.createElement('div');mark.id='charV4Mark';mark.textContent='SPRITE V4';mark.style.cssText='position:fixed;z-index:99;top:44px;right:12px;background:#111d;color:#b9ef5a;border:1px solid #829266;border-radius:7px;padding:4px 7px;font:700 9px monospace';document.body.appendChild(mark);
  };
  if(s.textures.exists('charsV4')) return install();
  Promise.all([0,1,2].map(i=>fetch(`assets/v08/characters-v4.b64.${i}?v=1040`).then(r=>r.text()))).then(parts=>{
    const data='data:image/png;base64,'+parts.join('');
    s.load.spritesheet('charsV4',data,{frameWidth:64,frameHeight:64,endFrame:27});
    s.load.once('complete',install);
    s.load.start();
  }).catch(err=>console.error('Character V4 atlas load failed',err));
 };
 boot();
})();