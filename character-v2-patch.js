// Hoods Character v2 patch — canonical anatomy, richer classic-RPG silhouette, safer iPhone touch.
(()=>{
 const boot=()=>{
  const game=Phaser.GAMES?.[0],s=game?.scene?.scenes?.[0];
  if(!s?.actor||!s?.hero){setTimeout(boot,80);return}

  const LOOKS={
   Hoods:{skin:0xc98f6c,hair:0x181512,cloth:0x4c3a31,cloth2:0x302722,accent:0x9b744d,hood:true},
   Bram:{skin:0xc98d68,hair:0x65402d,cloth:0x75543c,cloth2:0x4d3428,accent:0xb38858,beard:true},
   Mara:{skin:0xcb906e,hair:0x482722,cloth:0x74423d,cloth2:0x4d2a2b,accent:0xb96a56},
   Thorn:{skin:0xc9916e,hair:0x54382d,cloth:0x52665d,cloth2:0x35443f,accent:0x91a987},
   Guard:{skin:0xcb9673,hair:0x332922,cloth:0x3f5877,cloth2:0x283c57,accent:0xaab7bf,helmet:true},
   Sara:{skin:0xd39c77,hair:0x7a4c32,cloth:0x8a634b,cloth2:0x5d4133,accent:0xd19a68},
   Merchant:{skin:0xca9570,hair:0x3b3029,cloth:0x556f49,cloth2:0x35482f,accent:0x94b46e}
  };
  const shade=(c,f=.78)=>{const r=(c>>16)&255,g=(c>>8)&255,b=c&255;return ((r*f)<<16)|((g*f)<<8)|(b*f)};
  const light=(c,f=1.18)=>{const r=Math.min(255,((c>>16)&255)*f),g=Math.min(255,((c>>8)&255)*f),b=Math.min(255,(c&255)*f);return (r<<16)|(g<<8)|b};

  s.drawHumanoid=function(c,{name='Hoods',dir='down',frame=0,gear={},npc=false}={}){
   c.removeAll(true);
   const L=LOOKS[name]||LOOKS.Hoods,G=this.add.graphics();
   const side=dir==='left'?-1:dir==='right'?1:0,back=dir==='up';
   const phase=[0,1,0,-1][frame]||0,bob=[0,-1,0,0][frame]||0;
   const p=(pts,col,a=1)=>{G.fillStyle(col,a);G.fillPoints(pts.map(([x,y])=>new Phaser.Geom.Point(x,y+bob)),true)};
   const e=(x,y,w,h,col,a=1)=>{G.fillStyle(col,a);G.fillEllipse(x,y+bob,w,h)};
   const r=(x,y,w,h,col,rad=2)=>{G.fillStyle(col,1);G.fillRoundedRect(x-w/2,y-h/2+bob,w,h,rad)};
   const line=(w,col,a=1)=>G.lineStyle(w,col,a);

   // Grounding shadow: same footprint for every human.
   e(0,29,30,7,0x050605,.32);

   // Legs: narrow hips, visible knee break, alternating stride.
   const leg=gear.boots?0x211c18:0x332a25,boot=gear.boots?0x151412:0x49382e;
   const lx=-5+phase*1.5,rx=5-phase*1.5;
   p([[-8,9],[-1,9],[-1,18],[lx-1,28],[lx-7,28]],leg);
   p([[1,9],[8,9],[8,18],[rx+7,28],[rx+1,28]],leg);
   e(lx-3,28,10,5,boot);e(rx+3,28,10,5,boot);
   line(1,light(leg,1.12),.7);G.beginPath();G.moveTo(-6,13+bob);G.lineTo(lx-4,23+bob);G.moveTo(6,13+bob);G.lineTo(rx+4,23+bob);G.strokePath();

   // Torso: shoulder line, chest volume, tapered waist and hem.
   const cloth=gear.armor?0x675446:L.cloth,clothDark=gear.armor?0x46382f:(L.cloth2||shade(L.cloth));
   p([[-12,-6],[-8,-11],[-2,-13],[2,-13],[8,-11],[12,-6],[10,8],[7,15],[-7,15],[-10,8]],clothDark);
   p([[-9,-8],[-4,-11],[4,-11],[9,-8],[8,8],[5,13],[-5,13],[-8,8]],cloth);
   p([[-8,2],[8,2],[7,9],[0,12],[-7,9]],shade(cloth,.88));
   r(0,12,17,3,0x201b18,1);r(0,12,3,4,L.accent,1);
   line(1,light(cloth,1.18),.65);G.beginPath();G.moveTo(-6,-7+bob);G.lineTo(-7,5+bob);G.strokePath();

   // Arms: slimmer upper arm and forearm, real walk swing.
   const sw=phase*2.1;
   p([[-10,-6],[-15,-2-sw],[-14,7-sw],[-11,13-sw],[-8,11]],clothDark);
   p([[10,-6],[15,-2+sw],[14,7+sw],[11,13+sw],[8,11]],clothDark);
   p([[-13,6-sw],[-16,11-sw],[-13,14-sw],[-10,11-sw]],L.skin);
   p([[13,6+sw],[16,11+sw],[13,14+sw],[10,11+sw]],L.skin);

   // Neck + head. Head stays identical scale for every NPC.
   r(side*1,-14,7,6,L.skin,2);
   if(back){
    e(0,-22,20,21,L.hood?0x211d1a:(L.helmet?0x657276:L.hair));
    p([[-8,-24],[-3,-29],[4,-29],[9,-24],[7,-15],[-7,-15]],L.hood?0x29231f:L.hair);
    if(L.helmet){line(2,0xa9b5b8);G.strokeEllipse(0,-23+bob,19,18);}
   }else if(side){
    const hx=side*2;
    e(hx,-22,20,21,L.hood?0x211d1a:(L.helmet?0x657276:L.hair));
    e(hx+side*2,-20,14,15,L.skin);
    if(L.hood){line(4,0x2c2621);G.strokeEllipse(hx,-22+bob,19,20);}
    else p([[hx-side*8,-27],[hx+side*4,-29],[hx+side*8,-23],[hx-side*5,-20]],L.hair);
    e(hx+side*7,-21,2,2,0x17120f);p([[hx+side*8,-18],[hx+side*11,-17],[hx+side*8,-16]],0xa36d54);
    if(L.beard)p([[hx-side*3,-17],[hx+side*7,-16],[hx+side*5,-11],[hx-side*2,-12]],0x5a372a);
   }else{
    e(0,-22,21,22,L.hood?0x211d1a:(L.helmet?0x657276:L.hair));
    e(0,-20,15,16,L.skin);
    if(L.hood){line(4,0x2d2722);G.strokeEllipse(0,-22+bob,20,21);p([[-9,-26],[-5,-30],[0,-31],[5,-30],[9,-26],[6,-27],[0,-28],[-6,-27]],0x332c26);}
    else p([[-8,-27],[-4,-30],[3,-30],[8,-26],[6,-21],[-7,-21]],L.hair);
    e(-4,-21,2,2,0x17120f);e(4,-21,2,2,0x17120f);p([[0,-20],[2,-17],[-1,-17]],0xa36d54);
    if(L.beard){p([[-6,-16],[6,-16],[4,-10],[0,-8],[-4,-10]],0x5a372a);r(0,-17,8,2,0x5a372a,1);}
   }
   if(L.helmet||gear.helmet){line(2,0xb7c1c3);G.strokeArc(side*2,-23+bob,9,Math.PI,Math.PI*2);r(side*2,-19,17,2,0x4b585c,1);}

   // NPC identity stays costume-only, never anatomy changes.
   if(name==='Guard'){p([[-7,-4],[7,-4],[6,8],[0,11],[-6,8]],0x435f84);r(0,1,3,9,0xb4c0c7,1);}
   if(name==='Mara'){p([[-8,5],[8,5],[10,14],[-10,14]],0x7a4741);line(1,0xc27867,.8);G.beginPath();G.moveTo(-6,7+bob);G.lineTo(6,7+bob);G.strokePath();}
   if(name==='Bram'){r(0,4,14,10,0x77553d,2);r(0,0,3,11,0xb58b59,1);}
   if(name==='Thorn'){r(0,3,13,8,0x586d63,2);}
   if(name==='Sara'){p([[-7,5],[7,5],[9,14],[-9,14]],0x936b50);}
   if(name==='Merchant'){r(0,4,14,9,0x5b754f,2);}

   c.add(G);

   // Player gear overlays only.
   if(!npc&&dir!=='up'){
    if(gear.weapon){const w=this.add.graphics();const wx=side?side*19:18;w.lineStyle(3,0xd8dedc,1);w.beginPath();w.moveTo(wx,10+bob);w.lineTo(wx+(side?side*5:5),-16+bob);w.strokePath();w.lineStyle(3,0x6e4b31,1);w.beginPath();w.moveTo(wx-4,8+bob);w.lineTo(wx+5,11+bob);w.strokePath();c.add(w)}
    if(gear.shield){const sh=this.add.graphics(),sx=side?-side*18:-18;sh.fillStyle(0x745035,1);sh.fillPoints([[sx-6,-4],[sx+6,-4],[sx+6,8],[sx,15],[sx-6,8]].map(([x,y])=>new Phaser.Geom.Point(x,y+bob)),true);sh.lineStyle(2,0xb7915f,1);sh.strokePoints([[sx-6,-4],[sx+6,-4],[sx+6,8],[sx,15],[sx-6,8]].map(([x,y])=>new Phaser.Geom.Point(x,y+bob)),true);c.add(sh)}
   }
  };

  // Re-render every human with the new shared anatomy.
  s.npcs.forEach(n=>s.drawHumanoid(n.ch.c,{name:n.name,dir:'down',frame:0,npc:true}));
  s.lastHeroKey='';s.drawHero(true);

  // Resilient touch binding for iPhone. Existing update loop already reads s.touch.
  document.querySelectorAll('[data-move]').forEach(btn=>{
   const d=btn.dataset.move;
   const on=e=>{e.preventDefault();s.touch[d]=true;btn.classList.add('active')};
   const off=e=>{e.preventDefault();s.touch[d]=false;btn.classList.remove('active')};
   btn.addEventListener('touchstart',on,{passive:false});btn.addEventListener('touchend',off,{passive:false});btn.addEventListener('touchcancel',off,{passive:false});
   btn.addEventListener('pointerdown',on,{passive:false});btn.addEventListener('pointerup',off,{passive:false});btn.addEventListener('pointercancel',off,{passive:false});
  });
  document.getElementById('talkBtn')?.addEventListener('click',()=>s.talk());
  document.getElementById('bagBtn')?.addEventListener('click',()=>s.openBag());
  document.getElementById('atkBtn')?.addEventListener('click',()=>s.attack());
 };
 boot();
})();