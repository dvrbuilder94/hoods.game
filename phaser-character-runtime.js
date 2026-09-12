// Hoods V2.3 live appearance bridge — colors/addons are cosmetic; equipment remains stats-only.
(()=>{
const SAVE_KEY='hoods-appearance-v23';
const PALETTES={
 hair:['#2d211c','#4a3227','#70452f','#a06a3f','#d7b36a','#b7b4ad'],
 torso:['#6b4b37','#355a3f','#334e72','#713c3c','#755b87','#b88a42'],
 legs:['#34383b','#49382f','#293f55','#4b4b32','#5b3545']
};
const read=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')||{}}catch{return{}}};
const appearance={hair:'#4a3227',torso:'#6b4b37',legs:'#34383b',addon1:false,addon2:false,...read()};
const save=()=>localStorage.setItem(SAVE_KEY,JSON.stringify(appearance));
function wait(){
 const game=window.Phaser?.GAMES?.find(Boolean),scene=game?.scene?.getScene('TownScene');
 if(!scene||!scene.player||!window.HoodsCharacter)return setTimeout(wait,120);
 window.HoodsCharacter.ensureLoaded(scene,ok=>ok?install(scene):console.warn('[Hoods V2.3] keeping legacy character fallback'));
}
function install(scene){
 if(scene.__hoodsCharacterLive)return;scene.__hoodsCharacterLive='v23';
 const mountPlayer=()=>{
  scene.player.removeAll(true);scene.bodyShape=null;scene.head=null;scene.legs=null;
  scene.hoodsAvatar=window.HoodsCharacter.install(scene,scene.player,{appearance,label:'Hood'});
  scene.hoodsAvatar?.visual?.setScale(1.18);scene.hoodsAvatar?.root?.setY(-1);
  scene.player.setSize(32,48);scene.player.body?.setSize(28,38).setOffset(-14,-18);
 };
 const mountNpc=(container,label,npcAppearance)=>{
  if(!container)return null;container.removeAll(true);
  const avatar=window.HoodsCharacter.install(scene,container,{label,npc:true,direction:'down',appearance:npcAppearance});
  avatar?.visual?.setScale(1.08);return avatar;
 };
 mountPlayer();
 scene.hoodsNpcAvatars={
  bram:mountNpc(scene.bram,'OLD BRAM',{hair:'#b7b4ad',torso:'#713c3c',legs:'#49382f',addon2:true}),
  mara:mountNpc(scene.mara,'MARA THE WARDEN',{hair:'#2d211c',torso:'#334e72',legs:'#34383b',addon1:true})
 };
 scene.rebuildPlayer=mountPlayer;
 const apply=patch=>{Object.assign(appearance,patch);save();scene.hoodsAvatar?.setAppearance(appearance);scene.renderInventory?.()};
 const colorRow=(root,key,label)=>{
  const row=document.createElement('div');row.className='p-item';row.style.cursor='default';
  const copy=document.createElement('span');copy.innerHTML=`<b>${label}</b><small>Cosmetic color</small>`;
  const choices=document.createElement('span');choices.style.cssText='display:flex;grid-auto-flow:column;gap:7px;align-items:center';
  for(const color of PALETTES[key]){const b=document.createElement('button');b.type='button';b.title=`${label} ${color}`;b.setAttribute('aria-label',b.title);b.style.cssText=`width:24px;height:24px;border-radius:4px;background:${color};border:2px solid ${appearance[key]===color?'#b9ef5a':'#596348'};cursor:pointer`;b.onclick=()=>apply({[key]:color});choices.appendChild(b)}
  row.append(copy,choices);root.appendChild(row);
 };
 const addonRow=(root,key,label,description)=>{
  const b=document.createElement('button');b.className='p-item';b.innerHTML=`<span><b>${label}</b><small>${description}</small></span><strong>${appearance[key]?'ON':'OFF'}</strong>`;b.onclick=()=>apply({[key]:!appearance[key]});root.appendChild(b);
 };
 const oldInventory=scene.renderInventory.bind(scene);
 scene.renderInventory=()=>{
  oldInventory();const root=document.getElementById('pInvItems');if(!root)return;
  const h=document.createElement('div');h.className='p-item';h.style.cursor='default';h.innerHTML='<span><b>Character appearance</b><small>Outfit colors and optional addons. Gear remains separate.</small></span><strong>V2.3</strong>';root.prepend(h);
  colorRow(root,'hair','Hair');colorRow(root,'torso','Torso');colorRow(root,'legs','Trousers');
  addonRow(root,'addon1','Addon 1 · Cowl','Short traveller cowl. Cosmetic only.');addonRow(root,'addon2','Addon 2 · Satchel','Shoulder mantle and travel satchel. Cosmetic only.');
 };
 scene.renderInventory();
 let last=performance.now();scene.events.on('update',()=>{const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;const b=scene.player?.body;if(b&&scene.hoodsAvatar)scene.hoodsAvatar.update(dt,b.velocity.x,b.velocity.y)});
 const attack=()=>scene.hoodsAvatar?.attack();document.getElementById('mobileAttack')?.addEventListener('pointerdown',attack,{passive:true});scene.input.keyboard.on('keydown-SPACE',attack);scene.input.keyboard.on('keydown-F',attack);
 window.HoodsAppearance={state:appearance,palettes:PALETTES,set:apply};
 console.info('[Hoods V2.3] modular character mounted',appearance);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wait,60));else setTimeout(wait,60);
})();
