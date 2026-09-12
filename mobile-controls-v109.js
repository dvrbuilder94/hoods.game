// Hoods v1.0.9 — capture-phase mobile controls for iPhone/Safari.
(()=>{
 const state={up:false,down:false,left:false,right:false};
 const getScene=()=>Phaser.GAMES?.[0]?.scene?.scenes?.find(s=>s?.actor&&s?.hero)||null;
 const setDir=(d,on)=>{if(d in state)state[d]=!!on;const s=getScene();if(s?.touch&&d in s.touch)s.touch[d]=!!on;};
 const clear=()=>{Object.keys(state).forEach(k=>setDir(k,false));};
 const dirFromTarget=t=>t?.closest?.('[data-dir]')?.dataset?.dir||null;
 const actionFromTarget=t=>t?.closest?.('[data-action]')?.dataset?.action||null;
 const start=e=>{
   const d=dirFromTarget(e.target); if(d){e.preventDefault();e.stopPropagation();setDir(d,true);e.target.closest('[data-dir]')?.classList.add('active');return;}
   const a=actionFromTarget(e.target); if(a){e.preventDefault();e.stopPropagation();const s=getScene();if(a==='talk')s?.talk?.();else if(a==='bag')s?.openBag?.();else if(a==='attack')s?.attack?.();}
 };
 const end=e=>{
   const d=dirFromTarget(e.target); if(d){e.preventDefault();e.stopPropagation();setDir(d,false);e.target.closest('[data-dir]')?.classList.remove('active');}
 };
 document.addEventListener('touchstart',start,{capture:true,passive:false});
 document.addEventListener('touchend',end,{capture:true,passive:false});
 document.addEventListener('touchcancel',end,{capture:true,passive:false});
 document.addEventListener('pointerdown',start,{capture:true,passive:false});
 document.addEventListener('pointerup',end,{capture:true,passive:false});
 document.addEventListener('pointercancel',end,{capture:true,passive:false});
 addEventListener('blur',clear);addEventListener('pagehide',clear);
 let last=performance.now();
 const loop=now=>{
   const s=getScene();const dt=Math.min(.035,(now-last)/1000);last=now;
   if(s&&s.mode!=='menu'){
     let dx=(state.right?1:0)-(state.left?1:0),dy=(state.down?1:0)-(state.up?1:0);
     if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;const sp=s.stats?.().spd||166;const nx=Phaser.Math.Clamp(s.actor.x+dx*sp*dt,14,(s.W||980)-14),ny=Phaser.Math.Clamp(s.actor.y+dy*sp*dt,18,(s.H||720)-18);s.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');s.actor.setPosition(nx,ny);s.actor.body?.reset(nx,ny);s.hero?.setPosition(nx,ny).setDepth(ny/10+35);s.name?.setPosition(nx,ny-44).setDepth((s.hero?.depth||80)+1);s.lastHeroKey='';s.drawHero?.(true);}
   }
   requestAnimationFrame(loop);
 };
 requestAnimationFrame(loop);
 const mark=document.createElement('div');mark.textContent='v1.0.9 TOUCH CAPTURE';mark.style.cssText='position:fixed;z-index:9999;top:44px;right:12px;background:#111e;color:#b9ef5a;border:1px solid #829266;border-radius:7px;padding:4px 7px;font:700 9px monospace;pointer-events:none';document.body.appendChild(mark);
})();