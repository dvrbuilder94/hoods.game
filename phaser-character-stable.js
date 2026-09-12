// Hoods character stable fallback P11 — explicit SVG directions, no equipment overlays.
// Used only when the atlas-based outfit runtime did not mount a real sprite.
(()=>{
const KEYS={down:'hood-stable-down',left:'hood-stable-left',right:'hood-stable-right',up:'hood-stable-up'};
const URLS={down:'assets/v08/hood-down.svg',left:'assets/v08/hood-left.svg',right:'assets/v08/hood-right.svg',up:'assets/v08/hood-up.svg'};
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.sys?.isActive()||!scene.player)return setTimeout(wait,100);
 scene.time.delayedCall(700,()=>ensure(scene));
}
function hasRealAtlas(scene){
 const a=scene.hoodsAvatar,s=a?.sprite;
 return !!(s&&s.active!==false&&(s.texture?.key==='hoods-humans-v1'||s.texture?.key==='hoods-v23-body'));
}
function ensure(scene){
 if(scene.__hoodsStableFallback||hasRealAtlas(scene))return;
 scene.__hoodsStableFallback=true;
 let queued=false;
 for(const dir of Object.keys(KEYS))if(!scene.textures.exists(KEYS[dir])){scene.load.svg(KEYS[dir],`${URLS[dir]}?v=stable-p11`);queued=true}
 const mount=()=>install(scene);
 if(queued){scene.load.once('complete',mount);scene.load.start()}else mount();
}
function install(scene){
 if(!scene.textures.exists(KEYS.down))return console.warn('[Hoods character] stable fallback unavailable');
 scene.player.removeAll(true);
 const root=scene.add.container(0,0),shadow=scene.add.ellipse(0,24,31,7,0x080a07,.30),sprite=scene.add.image(0,-3,KEYS.down).setOrigin(.5,.62).setScale(1.12),label=scene.add.text(0,-48,'Hood',{fontFamily:'monospace',fontSize:'10px',color:'#f0e7d2',fontStyle:'bold',stroke:'#10130e',strokeThickness:3}).setOrigin(.5);
 root.add([shadow,sprite,label]);scene.player.add(root);scene.player.setSize(32,48);scene.player.body?.setSize(28,38).setOffset(-14,-18);
 let dir='down',clock=0;
 const sync=()=>{const key=KEYS[dir];if(sprite.texture?.key!==key&&scene.textures.exists(key))sprite.setTexture(key)};
 const avatar={
  sprite,root,
  update(dt,dx=0,dy=0){
   const moving=Math.abs(dx)>1||Math.abs(dy)>1;
   if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>1)dir=dx<0?'left':'right';else if(Math.abs(dy)>1)dir=dy<0?'up':'down';sync();
   if(moving){clock+=dt;root.y=Math.sin(clock*16)*1.25;root.scaleX=1+Math.sin(clock*8)*.012}else{clock=0;root.y=0;root.scaleX=1}
  },
  attack(){scene.tweens.killTweensOf(root);root.setScale(1);scene.tweens.add({targets:root,scaleX:1.06,scaleY:.94,duration:70,yoyo:true})},
  setOutfit(){return 'wanderer'},setDirection(next){if(KEYS[next]){dir=next;sync()}},rebuild(){sync()},outfit:()=> 'wanderer',direction:()=>dir
 };
 scene.hoodsAvatar=avatar;scene.rebuildPlayer=()=>install(scene);scene.__hoodsCharacterLive='stable-p11';
 console.info('[Hoods character] P11 stable outfit fallback mounted');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,50));else setTimeout(wait,50);
})();
