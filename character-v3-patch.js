// Hoods Character v3 — obvious visual replacement, safe Phaser Graphics only.
(()=>{
 const boot=()=>{
  const s=Phaser.GAMES?.[0]?.scene?.scenes?.[0];
  if(!s?.actor||!s?.hero||!s?.npcs){setTimeout(boot,80);return}
  const LOOKS={
   Hoods:{skin:0xc98f6b,hair:0x171411,cloth:0x42342d,dark:0x241e1a,accent:0xa57a4f,hood:1},
   Bram:{skin:0xc98b66,hair:0x62402e,cloth:0x73523b,dark:0x452f25,accent:0xb28a5a,beard:1},
   Mara:{skin:0xcc906e,hair:0x472621,cloth:0x74443e,dark:0x48292a,accent:0xc77762},
   Thorn:{skin:0xc8916e,hair:0x50362b,cloth:0x52675d,dark:0x304039,accent:0x9bb08d},
   Guard:{skin:0xca9472,hair:0x312820,cloth:0x3f5878,dark:0x26384f,accent:0xb8c4ca,helmet:1},
   Sara:{skin:0xd39c77,hair:0x784a31,cloth:0x8b644c,dark:0x573d31,accent:0xd49b69},
   Merchant:{skin:0xca9470,hair:0x3b3028,cloth:0x56704b,dark:0x32452d,accent:0x9ab875}
  };
  const hex=(c,f)=>{const r=Math.max(0,Math.min(255,Math.round(((c>>16)&255)*f))),g=Math.max(0,Math.min(255,Math.round(((c>>8)&255)*f))),b=Math.max(0,Math.min(255,Math.round((c&255)*f)));return (r<<16)|(g<<8)|b};
  s.drawHumanoid=function(c,{name='Hoods',dir='down',frame=0,gear={},npc=false}={}){
   c.removeAll(true);const L=LOOKS[name]||LOOKS.Hoods;const g=this.add.graphics();
   const side=dir==='left'?-1:dir==='right'?1:0,back=dir==='up',walk=[0,2,0,-2][frame]||0,bob=[0,-1,0,0][frame]||0;
   const P=(pts,col,a=1)=>{g.fillStyle(col,a);g.fillPoints(pts.map(([x,y])=>new Phaser.Geom.Point(x,y+bob)),true)};
   const E=(x,y,w,h,col,a=1)=>{g.fillStyle(col,a);g.fillEllipse(x,y+bob,w,h)};
   const R=(x,y,w,h,col,r=2)=>{g.fillStyle(col,1);g.fillRoundedRect(x-w/2,y-h/2+bob,w,h,r)};
   // larger, cleaner 40x58 canonical silhouette
   E(0,31,34,8,0x050505,.30);
   const leg=0x302822,boot=gear.boots?0x12110f:0x49382e;
   P([[-9,10],[-2,10],[-2,20],[-6+walk,30],[-11+walk,30]],leg);P([[2,10],[9,10],[9,20],[11-walk,30],[6-walk,30]],leg);
   E(-7+walk,30,11,6,boot);E(7-walk,30,11,6,boot);
   // broad shoulders, tapered waist, layered tunic
   const cloth=gear.armor?0x665242:L.cloth,dark=gear.armor?0x41342b:L.dark;
   P([[-15,-5],[-10,-12],[-4,-15],[4,-15],[10,-12],[15,-5],[12,10],[8,17],[-8,17],[-12,10]],dark);
   P([[-11,-7],[-6,-12],[6,-12],[11,-7],[9,8],[6,14],[-6,14],[-9,8]],cloth);
   P([[-8,4],[8,4],[6,12],[0,15],[-6,12]],hex(cloth,.82));
   R(0,13,19,4,0x171412,1);R(0,13,4,5,L.accent,1);
   // arms with elbows and hands
   const sw=walk*1.4;
   P([[-12,-6],[-18,-1-sw],[-17,8-sw],[-13,14-sw],[-9,11]],dark);P([[12,-6],[18,-1+sw],[17,8+sw],[13,14+sw],[9,11]],dark);
   E(-14,14-sw,7,7,L.skin);E(14,14+sw,7,7,L.skin);
   // neck
   R(side*1,-16,8,7,L.skin,2);
   if(back){
    E(0,-25,23,24,L.hood?0x1c1916:(L.helmet?0x647277:L.hair));
    P([[-10,-25],[-7,-31],[0,-34],[7,-31],[10,-25],[8,-14],[-8,-14]],L.hood?0x29231f:L.hair);
   }else if(side){
    const hx=side*2;E(hx,-25,23,24,L.hood?0x1c1916:(L.helmet?0x647277:L.hair));E(hx+side*3,-23,15,17,L.skin);
    if(L.hood)P([[hx-side*9,-30],[hx-side*5,-34],[hx+side*4,-33],[hx+side*9,-26],[hx+side*7,-17],[hx-side*5,-17]],0x2b251f);else P([[hx-side*8,-30],[hx+side*2,-33],[hx+side*8,-28],[hx+side*5,-22],[hx-side*6,-22]],L.hair);
    E(hx+side*8,-24,2.5,2.5,0x120f0d);P([[hx+side*9,-20],[hx+side*12,-19],[hx+side*9,-18]],hex(L.skin,.78));
    if(L.beard)P([[hx-side*2,-19],[hx+side*8,-18],[hx+side*6,-12],[hx,-10],[hx-side*3,-13]],0x583528);
   }else{
    E(0,-25,23,24,L.hood?0x1c1916:(L.helmet?0x647277:L.hair));E(0,-23,16,17,L.skin);
    if(L.hood){P([[-11,-28],[-7,-34],[0,-36],[7,-34],[11,-28],[8,-17],[5,-28],[0,-31],[-5,-28],[-8,-17]],0x2c251f);} else {P([[-9,-30],[-4,-34],[4,-34],[9,-29],[7,-23],[-7,-23]],L.hair);}
    E(-4,-24,2.5,2.5,0x120f0d);E(4,-24,2.5,2.5,0x120f0d);P([[0,-22],[2,-19],[-1,-19]],hex(L.skin,.78));
    if(L.beard)P([[-7,-19],[7,-19],[5,-12],[0,-9],[-5,-12]],0x583528);
   }
   // helmet overlay
   if(L.helmet||gear.helmet){P([[-10,-29],[-6,-34],[0,-36],[6,-34],[10,-29],[8,-23],[-8,-23]],0x748287);R(0,-22,20,3,0x4b575b,1);}
   // distinct clothing details, same anatomy
   if(name==='Guard'){P([[-8,-4],[8,-4],[7,9],[0,13],[-7,9]],0x46658d);R(0,1,4,11,0xb7c3c9,1);}
   if(name==='Mara'){P([[-9,6],[9,6],[11,17],[-11,17]],0x7b4741);R(0,8,12,2,0xc97c68,1);}
   if(name==='Bram'){R(0,4,16,11,0x7a583f,2);R(0,0,4,12,0xb68c5a,1);}
   if(name==='Thorn'){R(0,4,15,9,0x5b7166,2);R(0,3,3,8,0xa5b797,1);}
   if(name==='Sara'){P([[-8,6],[8,6],[10,17],[-10,17]],0x936a50);R(0,6,12,2,0xd49b69,1);}
   if(name==='Merchant'){R(0,4,16,10,0x5c774f,2);R(0,3,3,8,0xa0bd78,1);}
   c.add(g);
   // gear overlays
   if(!npc&&dir!=='up'){
    if(gear.weapon){const w=this.add.graphics();const wx=side?side*22:21;w.lineStyle(4,0xd9dedc,1);w.beginPath();w.moveTo(wx,11+bob);w.lineTo(wx+(side?side*5:5),-19+bob);w.strokePath();w.lineStyle(4,0x6b4930,1);w.beginPath();w.moveTo(wx-5,9+bob);w.lineTo(wx+5,12+bob);w.strokePath();c.add(w)}
    if(gear.shield){const sh=this.add.graphics(),sx=side?-side*21:-21;sh.fillStyle(0x765136,1);sh.fillPoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y+bob)),true);c.add(sh)}
   }
  };
  s.npcs.forEach(n=>s.drawHumanoid(n.ch.c,{name:n.name,dir:'down',frame:0,npc:true}));s.lastHeroKey='';s.drawHero(true);
  // visible version marker inside Phaser canvas area so cache mistakes are obvious
  s.add.text(s.cameras.main.width-8,28,'CHAR V3',{fontFamily:'monospace',fontSize:'11px',color:'#f4d35e',backgroundColor:'#111a',padding:{x:5,y:3}}).setOrigin(1,0).setScrollFactor(0).setDepth(9999);
 };
 boot();
})();