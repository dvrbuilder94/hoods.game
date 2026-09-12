// Hoods Character v4.2 — robust canvas-backed sprite atlas.
(()=>{
 const boot=()=>{
  const s=Phaser.GAMES?.[0]?.scene?.scenes?.[0];
  if(!s?.actor||!s?.hero){setTimeout(boot,80);return}
  const mark=t=>{document.getElementById('charV4Mark')?.remove();const m=document.createElement('div');m.id='charV4Mark';m.textContent=t;m.style.cssText='position:fixed;z-index:99;top:44px;right:12px;background:#111d;color:#b9ef5a;border:1px solid #829266;border-radius:7px;padding:4px 7px;font:700 9px monospace';document.body.appendChild(m)};
  mark('SPRITE V4.2 LOADING');
  const install=()=>{
   const COL={Hoods:0,Bram:1,Mara:2,Thorn:3,Guard:4,Sara:5,Merchant:6};
   const ROW={down:0,left:1,right:2,up:3};
   s.drawHumanoid=function(c,{name='Hoods',dir='down',gear={},npc=false}={}){
    c.removeAll(true);const idx=(ROW[dir]??0)*7+(COL[name]??0);
    c.add(this.add.ellipse(0,28,34,8,0x050605,.3));
    c.add(this.add.image(0,-4,'charsV4',String(idx)).setOrigin(.5).setScale(1.06));
    if(!npc&&dir!=='up'){
     if(gear.weapon){const w=this.add.graphics(),side=dir==='left'?-1:dir==='right'?1:0,wx=side?side*25:24;w.lineStyle(3,0xd8dedc,1);w.beginPath();w.moveTo(wx,13);w.lineTo(wx+(side?side*6:6),-19);w.strokePath();w.lineStyle(3,0x6e4b31,1);w.beginPath();w.moveTo(wx-5,10);w.lineTo(wx+5,13);w.strokePath();c.add(w)}
     if(gear.shield){const sh=this.add.graphics(),side=dir==='left'?-1:dir==='right'?1:0,sx=side?-side*24:-24;sh.fillStyle(0x745035,1);sh.fillPoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);sh.lineStyle(2,0xb7915f,1);sh.strokePoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);c.add(sh)}
    }
   };
   s.npcs.forEach(n=>s.drawHumanoid(n.ch.c,{name:n.name,dir:'down',npc:true}));s.lastHeroKey='';s.drawHero(true);mark('SPRITE V4.2 OK');
  };
  Promise.all([0,1,2].map(i=>fetch(`assets/v08/characters-v4.b64.${i}?v=1060`,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('part '+i);return r.text()}))).then(parts=>{
   const img=new Image();
   img.onload=()=>{
    try{
     const cv=document.createElement('canvas');cv.width=448;cv.height=256;cv.getContext('2d').drawImage(img,0,0);
     if(s.textures.exists('charsV4'))s.textures.remove('charsV4');
     const tex=s.textures.addCanvas('charsV4',cv);
     for(let row=0;row<4;row++)for(let col=0;col<7;col++){const idx=row*7+col;tex.add(String(idx),0,col*64,row*64,64,64)}
     install();
    }catch(e){console.error(e);mark('SPRITE V4.2 FAIL')}
   };
   img.onerror=()=>mark('SPRITE V4.2 FAIL');
   img.src='data:image/png;base64,'+parts.join('').replace(/\s+/g,'');
  }).catch(e=>{console.error(e);mark('SPRITE V4.2 FAIL')});
 };
 boot();
})();