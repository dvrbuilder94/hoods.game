// Hoods v1.0.7 core bootstrap — reliable iPhone input + guaranteed SVG character renderer.
(()=>{
  window.HOODS_TOUCH=window.HOODS_TOUCH||{up:false,down:false,left:false,right:false};
  window.hoodsMove=(dir,on)=>{window.HOODS_TOUCH[dir]=!!on;};

  const boot=()=>{
    const game=Phaser.GAMES?.[0];
    const s=game?.scene?.scenes?.find(x=>x?.actor&&x?.hero);
    if(!s){setTimeout(boot,60);return;}

    // One shared object: DOM buttons and Phaser update read the exact same state.
    s.touch=window.HOODS_TOUCH;
    const reset=()=>Object.keys(window.HOODS_TOUCH).forEach(k=>window.HOODS_TOUCH[k]=false);
    addEventListener('blur',reset);
    addEventListener('pagehide',reset);

    // Load a text/SVG atlas through Phaser's normal loader (no base64/image race on iOS).
    const installCharacters=()=>{
      const DIR={down:0,up:1,left:2,right:3};
      const TINT={Hoods:0xffffff,Sara:0xe2b38d,Thorn:0xb7c9bd,Bram:0xd4a177,Mara:0xd99a92,Guard:0xa9c4e4,Merchant:0xb7cf91};
      s.drawHumanoid=function(c,{name='Hoods',dir='down',gear={},npc=false}={}){
        c.removeAll(true);
        c.add(this.add.ellipse(0,27,32,8,0x050605,.28));
        const img=this.add.image(0,-2,'charCore107').setOrigin(.5).setCrop((DIR[dir]??0)*64,0,64,64).setDisplaySize(58,58);
        img.setTint(TINT[name]??0xffffff);
        c.add(img);
        if(!npc&&dir!=='up'){
          if(gear.weapon){const w=this.add.graphics();const side=dir==='left'?-1:dir==='right'?1:0,wx=side?side*23:22;w.lineStyle(3,0xd8dedc,1);w.beginPath();w.moveTo(wx,13);w.lineTo(wx+(side?side*6:6),-18);w.strokePath();w.lineStyle(3,0x6e4b31,1);w.beginPath();w.moveTo(wx-5,10);w.lineTo(wx+5,13);w.strokePath();c.add(w);}
          if(gear.shield){const sh=this.add.graphics(),side=dir==='left'?-1:dir==='right'?1:0,sx=side?-side*22:-22;sh.fillStyle(0x745035,1);sh.fillPoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);sh.lineStyle(2,0xb7915f,1);sh.strokePoints([[sx-7,-5],[sx+7,-5],[sx+7,9],[sx,17],[sx-7,9]].map(([x,y])=>new Phaser.Geom.Point(x,y)),true);c.add(sh);}
        }
      };
      s.npcs?.forEach(n=>s.drawHumanoid(n.ch.c,{name:n.name,dir:'down',npc:true}));
      s.lastHeroKey='';s.drawHero?.(true);
      const mark=document.getElementById('core107mark')||document.createElement('div');
      mark.id='core107mark';mark.textContent='v1.0.7 CORE OK';mark.style.cssText='position:fixed;z-index:100;top:44px;right:12px;background:#111e;color:#b9ef5a;border:1px solid #829266;border-radius:7px;padding:4px 7px;font:700 9px monospace';document.body.appendChild(mark);
    };

    if(s.textures.exists('charCore107')) installCharacters();
    else {
      s.load.svg('charCore107','assets/v08/characters-v2.svg?v=1070');
      s.load.once('complete',installCharacters);
      s.load.start();
    }
  };
  boot();
})();