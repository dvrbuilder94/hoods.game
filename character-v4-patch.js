// Hoods Character v4.1 — force real sprite atlas + robust iPhone movement.
(()=>{
 const boot=()=>{
  const game=Phaser.GAMES?.[0],s=game?.scene?.scenes?.[0];
  if(!s?.actor||!s?.hero){setTimeout(boot,80);return}

  // Mobile movement independent from the older scene binding.
  s.touch=s.touch||{up:false,down:false,left:false,right:false};
  document.querySelectorAll('[data-move]').forEach(btn=>{
   const d=btn.dataset.move;
   const on=e=>{e.preventDefault();s.touch[d]=true;btn.classList.add('active')};
   const off=e=>{e.preventDefault();s.touch[d]=false;btn.classList.remove('active')};
   btn.addEventListener('touchstart',on,{passive:false});
   btn.addEventListener('touchend',off,{passive:false});
   btn.addEventListener('touchcancel',off,{passive:false});
   btn.addEventListener('pointerdown',on,{passive:false});
   btn.addEventListener('pointerup',off,{passive:false});
   btn.addEventListener('pointercancel',off,{passive:false});
  });
  document.getElementById('talkBtn')?.addEventListener('click',()=>s.talk?.());
  document.getElementById('bagBtn')?.addEventListener('click',()=>s.openBag?.());
  document.getElementById('atkBtn')?.addEventListener('click',()=>s.attack?.());

  // Direct mobile step: survives the old bindMobile crash and keeps physics/body in sync.
  let last=performance.now();
  const mobileStep=now=>{
   const dt=Math.min(.035,(now-last)/1000);last=now;
   let dx=(s.touch.right?1:0)-(s.touch.left?1:0),dy=(s.touch.down?1:0)-(s.touch.up?1:0);
   if(dx||dy){
    const l=Math.hypot(dx,dy);dx/=l;dy/=l;
    s.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
    const sp=s.stats?.().spd||166;
    const nx=Phaser.Math.Clamp(s.actor.x+dx*sp*dt,12,(s.W||980)-12);
    const ny=Phaser.Math.Clamp(s.actor.y+dy*sp*dt,18,(s.H||720)-18);
    s.actor.setPosition(nx,ny);s.actor.body?.reset(nx,ny);
    s.hero?.setPosition(nx,ny).setDepth(ny/10+35);
    s.name?.setPosition(nx,ny-44).setDepth((s.hero?.depth||80)+1);
    s.lastHeroKey='';s.drawHero?.(true);
   }
   requestAnimationFrame(mobileStep);
  };
  requestAnimationFrame(mobileStep);

  const install=()=>{
   const COL={Hoods:0,Bram:1,Mara:2,Thorn:3,Guard:4,Sara:5,Merchant:6};
   const ROW={down:0,left:1,right:2,up:3};
   s.drawHumanoid=function(c,{name='Hoods',dir='down',frame=0,gear={},npc=false}={}){
    c.removeAll(true);
    const idx=(ROW[dir]??0)*7+(COL[name]??0);
    c.add(this.add.ellipse(0,27,34,8,0x050605,.30));
    c.add(this.add.sprite(0,-5,'charsV4',idx).setOrigin(.5,.5).setScale(1.08));
    if(!npc&&dir!=='up'){
     if(gear.weapon){const w=this.add.graphics();const side=dir==='left'?-1:dir==='right'?1:0,wx=side?side*25:24;w.lineStyle(3,0xd8dedc,1);w.beginPath();w.moveTo(wx,13);w.lineTo(wx+(side?side*6:6),-19);w.strokePath();w.lineStyle(3,0x6e4b31,1);w.beginPath();w.moveTo(wx-5,10);w.lineTo(wx+5,13);w.strokePath();c.add(w)}
     if(gear.shield){const sh=this.add.graphics(),side=dir==='left'?-1:dir==='right'?1:0,sx=side?-side*24:-24;sh.fillStyle(0x745035,1);sh.fillPoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);sh.lineStyle(2,0xb7915f,1);sh.strokePoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);c.add(sh)}
    }
   };
   s.npcs?.forEach(n=>s.drawHumanoid(n.ch.c,{name:n.name,dir:'down',frame:0,npc:true}));
   s.lastHeroKey='';s.drawHero?.(true);
   document.getElementById('charV4Mark')?.remove();
   const mark=document.createElement('div');mark.id='charV4Mark';mark.textContent='SPRITE V4.1 OK';mark.style.cssText='position:fixed;z-index:99;top:44px;right:12px;background:#111d;color:#b9ef5a;border:1px solid #829266;border-radius:7px;padding:4px 7px;font:700 9px monospace';document.body.appendChild(mark);
  };

  const loadAtlas=()=>Promise.all([0,1,2].map(i=>fetch(`assets/v08/characters-v4.b64.${i}?v=1050`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('atlas part '+i);return r.text()}))).then(parts=>{
   const img=new Image();
   img.onload=()=>{if(s.textures.exists('charsV4'))s.textures.remove('charsV4');s.textures.addSpriteSheet('charsV4',img,{frameWidth:64,frameHeight:64,endFrame:27});install()};
   img.onerror=e=>console.error('Character atlas image failed',e);
   img.src='data:image/png;base64,'+parts.join('').replace(/\s+/g,'');
  }).catch(e=>console.error('Character atlas load failed',e));

  if(s.textures.exists('charsV4'))install();else loadAtlas();
 };
 boot();
})();