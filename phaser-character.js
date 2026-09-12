// Hoods Character System v1.1 — improved full-body outfits, shared human anatomy, 4 directions.
(() => {
const KEY='hoods-humans-v1';
const URL='assets/characters/v1/humans-v1.svg?v=outfits-v2';
const FRAME_W=48,FRAME_H=64,FRAMES=3;
const DIRS=['down','left','right','up'];
const WALK=[0,1,2,1];
const OUTFITS={
  wanderer:{id:'wanderer',name:'Wanderer',atlasRow:0,player:true,price:0,description:'Brown road cloak and hood.'},
  ranger:{id:'ranger',name:'Ranger',atlasRow:1,player:true,price:90,description:'Forest cloak with a darker field hood.'},
  warden:{id:'warden',name:'Warden',atlasRow:2,npc:true,description:'Town warden uniform.'},
  merchant:{id:'merchant',name:'Merchant',atlasRow:3,npc:true,description:'Warm leather merchant outfit.'}
};
const PLAYER_OUTFITS=Object.values(OUTFITS).filter(o=>o.player);
const frame=(outfit,dir,step)=>`${outfit}-${dir}-${step}`;
function registerFrames(scene){
  if(!scene?.textures?.exists(KEY))return false;
  const texture=scene.textures.get(KEY);
  if(texture.has(frame('wanderer','down',0)))return true;
  Object.values(OUTFITS).forEach(o=>DIRS.forEach((dir,dirIndex)=>{
    for(let step=0;step<FRAMES;step++)texture.add(frame(o.id,dir,step),0,step*FRAME_W,(o.atlasRow*4+dirIndex)*FRAME_H,FRAME_W,FRAME_H);
  }));
  texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  return true;
}
function ensureLoaded(scene,done){
  if(!scene)return done?.(false);
  const finish=()=>done?.(registerFrames(scene));
  if(scene.textures.exists(KEY))return finish();
  const start=()=>{
    if(scene.textures.exists(KEY))return finish();
    scene.load.svg(KEY,URL);
    scene.load.once('complete',finish);
    scene.load.once('loaderror',file=>{if(file?.key===KEY){console.warn('[Hoods outfits] atlas failed to load');done?.(false)}});
    scene.load.start();
  };
  if(scene.load.isLoading())scene.load.once('complete',start);else start();
}
function validOutfit(id,fallback='wanderer'){return OUTFITS[id]?id:fallback}
function install(scene,target,options={}){
  if(!scene||!target||!scene.textures.exists(KEY))return null;
  if(typeof options==='function')options={};
  let outfit=validOutfit(options.outfit,options.npc?'merchant':'wanderer');
  let dir=DIRS.includes(options.direction)?options.direction:'down';
  let moving=false,clock=0,lastFrame='';
  const root=scene.add.container(0,0);target.add(root);
  const visual=scene.add.container(0,0);root.add(visual);
  const sprite=scene.add.sprite(0,0,KEY,frame(outfit,dir,1)).setOrigin(.5,.66);visual.add(sprite);
  const labelText=options.label===false?'':(options.label||'Hood');
  const label=labelText?scene.add.text(0,-48,labelText,{fontFamily:'monospace',fontSize:options.npc?'10px':'11px',color:options.npc?'#f3e4bf':'#e9f4c5',fontStyle:'bold',stroke:'#10140d',strokeThickness:3}).setOrigin(.5):null;
  if(label)root.add(label);
  const sync=step=>{
    const name=frame(outfit,dir,step);
    if(name!==lastFrame&&scene.textures.get(KEY).has(name)){sprite.setFrame(name);lastFrame=name}
  };
  sync(1);
  return{
    update(dt,dx=0,dy=0){
      const wasMoving=moving;moving=Math.abs(dx)>1||Math.abs(dy)>1;
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>1)dir=dx<0?'left':'right';else if(Math.abs(dy)>1)dir=dy<0?'up':'down';
      if(moving){clock+=dt;sync(WALK[Math.floor(clock*9)%WALK.length])}else{if(wasMoving)clock=0;sync(1)}
    },
    attack(){
      const dx=dir==='left'?-4:dir==='right'?4:0,dy=dir==='up'?-3:dir==='down'?3:0;
      scene.tweens.killTweensOf(visual);visual.setPosition(0,0);scene.tweens.add({targets:visual,x:dx,y:dy,scaleX:1.04,scaleY:.98,duration:65,yoyo:true,ease:'Quad.easeOut'});
    },
    setOutfit(id){outfit=validOutfit(id,outfit);lastFrame='';sync(moving?WALK[Math.floor(clock*9)%WALK.length]:1);return outfit},
    setDirection(next){if(DIRS.includes(next)){dir=next;lastFrame='';sync(1)}},
    rebuild(){lastFrame='';sync(1)},
    outfit:()=>outfit,
    direction:()=>dir,
    sprite,
    root
  };
}
window.HoodsCharacter={KEY,URL,OUTFITS,PLAYER_OUTFITS,ensureLoaded,registerFrames,install,validOutfit};
})();
