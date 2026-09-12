// Hoods Character System V2.3 — animated cosmetic compositor.
(()=>{
const FRAME_W=48,FRAME_H=64,COLS=9,DIRS=['down','left','right','up'];
const LAYERS=['body','legs','torso','hair','addon1','addon2'];
const KEYS=Object.fromEntries(LAYERS.map(id=>[id,`hoods-v23-${id}`]));
const URLS=Object.fromEntries(LAYERS.map(id=>[id,`assets/characters/v23/wanderer-v23-${id}.svg?v=23.1`]));
const OUTFITS={wanderer:{id:'wanderer',name:'Wanderer',player:true,price:0,description:'Recolorable road outfit with two cosmetic addons.'}};
const PLAYER_OUTFITS=[OUTFITS.wanderer];
const frame=(dir,column)=>`${dir}-${column}`;
function registerFrames(scene){
  for(const id of LAYERS){
    if(!scene.textures.exists(KEYS[id]))return false;
    const texture=scene.textures.get(KEYS[id]);
    if(!texture.has(frame('down',0)))DIRS.forEach((dir,row)=>{for(let column=0;column<COLS;column++)texture.add(frame(dir,column),0,column*FRAME_W,row*FRAME_H,FRAME_W,FRAME_H)});
    texture.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  }
  return true;
}
function ensureLoaded(scene,done){
  if(!scene)return done?.(false);
  const finish=()=>done?.(registerFrames(scene));
  if(LAYERS.every(id=>scene.textures.exists(KEYS[id])))return finish();
  const start=()=>{
    if(LAYERS.every(id=>scene.textures.exists(KEYS[id])))return finish();
    for(const id of LAYERS)if(!scene.textures.exists(KEYS[id]))scene.load.svg(KEYS[id],URLS[id]);
    scene.load.once('complete',finish);scene.load.start();
  };
  if(scene.load.isLoading())scene.load.once('complete',start);else start();
}
const tint=value=>Number.parseInt(String(value||'#ffffff').replace('#',''),16);
function install(scene,target,options={}){
  if(!scene||!target||!LAYERS.every(id=>scene.textures.exists(KEYS[id])))return null;
  let dir=DIRS.includes(options.direction)?options.direction:'down',walkClock=0,attackClock=0,last='';
  let appearance={hair:'#4a3227',torso:'#6b4b37',legs:'#34383b',addon1:false,addon2:false,...options.appearance};
  const root=scene.add.container(0,0),visual=scene.add.container(0,0);target.add(root);root.add(visual);
  const sprites={};
  for(const id of LAYERS){sprites[id]=scene.add.sprite(0,0,KEYS[id],frame(dir,0)).setOrigin(.5,.875);visual.add(sprites[id])}
  const labelText=options.label===false?'':(options.label||'Hood');
  const label=labelText?scene.add.text(0,-50,labelText,{fontFamily:'monospace',fontSize:options.npc?'10px':'11px',color:options.npc?'#f3e4bf':'#e9f4c5',fontStyle:'bold',stroke:'#10140d',strokeThickness:3}).setOrigin(.5):null;
  if(label)root.add(label);
  const paint=()=>{sprites.hair.setTint(tint(appearance.hair));sprites.torso.setTint(tint(appearance.torso));sprites.legs.setTint(tint(appearance.legs));sprites.addon1.setVisible(!!appearance.addon1);sprites.addon2.setVisible(!!appearance.addon2)};
  const sync=column=>{const key=`${dir}-${column}`;if(key===last)return;for(const id of LAYERS)sprites[id].setFrame(frame(dir,column));last=key};
  paint();sync(0);
  return{
    update(dt,dx=0,dy=0){
      if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>1)dir=dx<0?'left':'right';else if(Math.abs(dy)>1)dir=dy<0?'up':'down';
      if(attackClock>0){attackClock=Math.max(0,attackClock-dt);const elapsed=.34-attackClock;sync(elapsed<.07?5:elapsed<.14?6:elapsed<.23?7:8);if(!attackClock)sync(0);return}
      const moving=Math.abs(dx)>1||Math.abs(dy)>1;if(moving){walkClock+=dt;sync(1+Math.floor(walkClock/.11)%4)}else{walkClock=0;sync(0)}
    },
    attack(){if(attackClock>0)return;attackClock=.34;last='';sync(5)},
    setAppearance(next={}){appearance={...appearance,...next};paint();return{...appearance}},getAppearance:()=>({...appearance}),
    setOutfit:()=> 'wanderer',setDirection(next){if(DIRS.includes(next)){dir=next;last='';sync(0)}},rebuild(){last='';paint();sync(0)},
    outfit:()=> 'wanderer',direction:()=>dir,sprite:sprites.body,sprites,visual,root
  };
}
window.HoodsCharacter={KEY:KEYS.body,KEYS,URLS,OUTFITS,PLAYER_OUTFITS,ensureLoaded,registerFrames,install,validOutfit:()=> 'wanderer'};
})();
