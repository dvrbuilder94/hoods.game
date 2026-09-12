// Hoods v1.0.8 — standalone direct mobile controls. No dependency on scene bindMobile.
(()=>{
  const state={up:false,down:false,left:false,right:false};
  let scene=null,last=performance.now();
  const getScene=()=>Phaser.GAMES?.[0]?.scene?.scenes?.find(s=>s?.actor&&s?.hero)||null;
  const syncVisual=(s)=>{
    s.hero?.setPosition(s.actor.x,s.actor.y).setDepth(s.actor.y/10+35);
    s.name?.setPosition(s.actor.x,s.actor.y-44).setDepth((s.hero?.depth||80)+1);
    s.lastHeroKey='';s.drawHero?.(true);
  };
  const step=(dir,pixels=18)=>{
    const s=scene||getScene(); if(!s)return;
    let dx=0,dy=0;if(dir==='left')dx=-1;if(dir==='right')dx=1;if(dir==='up')dy=-1;if(dir==='down')dy=1;
    s.dir=dir;
    const nx=Phaser.Math.Clamp(s.actor.x+dx*pixels,14,(s.W||980)-14);
    const ny=Phaser.Math.Clamp(s.actor.y+dy*pixels,18,(s.H||720)-18);
    s.actor.body?.reset(nx,ny);s.actor.setPosition(nx,ny);syncVisual(s);
  };
  const set=(dir,on)=>{state[dir]=!!on;};
  window.HOODS_DIRECT={set,step};
  const frame=now=>{
    scene=scene||getScene();
    const dt=Math.min(.035,(now-last)/1000);last=now;
    if(scene){
      let dx=(state.right?1:0)-(state.left?1:0),dy=(state.down?1:0)-(state.up?1:0);
      if(dx||dy){
        const l=Math.hypot(dx,dy);dx/=l;dy/=l;
        scene.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
        const sp=scene.stats?.().spd||166;
        const nx=Phaser.Math.Clamp(scene.actor.x+dx*sp*dt,14,(scene.W||980)-14);
        const ny=Phaser.Math.Clamp(scene.actor.y+dy*sp*dt,18,(scene.H||720)-18);
        scene.actor.body?.reset(nx,ny);scene.actor.setPosition(nx,ny);syncVisual(scene);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  const clear=()=>Object.keys(state).forEach(k=>state[k]=false);
  addEventListener('blur',clear);addEventListener('pagehide',clear);
  const call=name=>{const s=scene||getScene();s?.[name]?.();};
  window.HOODS_ACTION=call;
  const mark=document.createElement('div');mark.textContent='v1.0.8 DIRECT INPUT';mark.style.cssText='position:fixed;z-index:101;top:44px;right:12px;background:#111e;color:#b9ef5a;border:1px solid #829266;border-radius:7px;padding:4px 7px;font:700 9px monospace';document.body.appendChild(mark);
})();