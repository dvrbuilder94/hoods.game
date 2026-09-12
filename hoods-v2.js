// Hoods V2.1 — clean vertical slice: data-driven town, reliable SVG atlas, compact mobile UX.
(() => {
const VERSION='v2.1';
const MAP_URL=`maps/town-v2/town-square.json?v=${VERSION}`;
const MAP_KEY='hoods-town-v2';
const TILESET_KEY='hoods-classic-v1';
const CHAR_KEY='hoods-humans-v1';
const SAVE_KEY='hoods-town-v02';
const OUTFIT_KEY='hoods-outfit-v2';
const GID={grass:0,grass2:1,cobble:2,plaza:3,wood:4,wall:5,door:6,window:7,roof:8,roofEdge:9,tree:10,barrel:11,table:12,chair:13,rug:14,water:15,lamp:16,sign:17,crate:18,flower:19};
const ITEMS=[
 {id:'iron-sword',name:'Iron Sword',slot:'weapon',icon:'weapon',stats:{attack:5}},
 {id:'iron-helmet',name:'Iron Helmet',slot:'helmet',icon:'helmet',stats:{defense:2}},
 {id:'leather-armor',name:'Leather Armor',slot:'armor',icon:'armor',stats:{hp:10,defense:3}},
 {id:'wooden-shield',name:'Wooden Shield',slot:'shield',icon:'shield',stats:{defense:2}},
 {id:'ranger-boots',name:'Ranger Boots',slot:'boots',icon:'boots',stats:{speed:2,luck:1}}
];
const OUTFITS={wanderer:{label:'Wanderer',base:0},ranger:{label:'Ranger',base:12}};
const DIR_ROW={down:0,left:1,right:2,up:3};
const read=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const raw=read(SAVE_KEY,{});
const state={
 coins:Number.isFinite(raw.coins)?raw.coins:120,
 owned:new Set(raw.owned||ITEMS.map(x=>x.id)),
 equipped:{helmet:null,weapon:null,armor:null,shield:null,legs:null,boots:null,...(raw.equipped||{})},
 outfit:OUTFITS[localStorage.getItem(OUTFIT_KEY)]?localStorage.getItem(OUTFIT_KEY):'wanderer'
};
const save=()=>localStorage.setItem(SAVE_KEY,JSON.stringify({coins:state.coins,owned:[...state.owned],equipped:state.equipped}));
const item=id=>ITEMS.find(x=>x.id===id);

class HoodsV2 extends Phaser.Scene {
 constructor(){super('HoodsV2');this.touch={up:false,down:false,left:false,right:false};this.roofZones=[];this.direction='down';}
 preload(){
   this.load.json(MAP_KEY,MAP_URL);
   this.load.svg(TILESET_KEY,`assets/maps/tiles/hoods-classic-v1.svg?v=${VERSION}`,{width:256,height:128});
   // Load the SVG as one image, then add frames ourselves. Safari was unreliable
   // when the SVG was passed directly to load.spritesheet().
   this.load.svg(CHAR_KEY,`assets/characters/v1/humans-v1.svg?v=${VERSION}`,{width:144,height:1024});
 }
 create(){
   const d=this.cache.json.get(MAP_KEY); if(!d) throw new Error('Town V2 map missing');
   const ts=d.tileSize||32; this.dataMap=d; this.tileSize=ts;
   this.installCharacterFrames();
   this.map=this.make.tilemap({tileWidth:ts,tileHeight:ts,width:d.width,height:d.height});
   const tiles=this.map.addTilesetImage(TILESET_KEY,TILESET_KEY,32,32,0,0);
   this.layers={};
   const layerDepth={ground:0,groundBorders:1,walls:4,items:6,decorTop:18};
   for(const name of Object.keys(layerDepth)){
     const l=this.map.createBlankLayer(name,tiles,0,0).setDepth(layerDepth[name]);
     this.layers[name]=l;
   }
   this.paintWorld(d);
   const worldW=d.width*ts,worldH=d.height*ts;
   this.physics.world.setBounds(0,0,worldW,worldH);
   this.cameras.main.setBounds(0,0,worldW,worldH).setRoundPixels(true);
   this.installCollisions(d);
   this.makeAnimations();
   this.createPlayer(d);
   this.makeNpcs(d);
   this.cameras.main.startFollow(this.player,true,.14,.14);
   const zoom=this.scale.width<=700?1.18:1.05;this.cameras.main.setZoom(zoom);
   this.keys=this.input.keyboard.addKeys('W,A,S,D,I,ESC');this.cursors=this.input.keyboard.createCursorKeys();
   this.keys.I.on('down',()=>this.toggleBag());this.keys.ESC.on('down',()=>this.closeBag());
   this.bindTouch();this.renderBag();this.refreshHud();
   this.events.once('shutdown',()=>this.stopTouch());
 }
 installCharacterFrames(){
   const tex=this.textures.get(CHAR_KEY); if(!tex||tex.key==='__MISSING') throw new Error('Character atlas failed to load');
   for(let row=0;row<16;row++) for(let col=0;col<3;col++){
     const idx=row*3+col,key=String(idx);if(!tex.has(key))tex.add(key,0,col*48,row*64,48,64);
   }
 }
 createPlayer(d){
   const ts=this.tileSize,x=d.spawn.x*ts+ts/2,y=d.spawn.y*ts+ts/2;
   this.player=this.physics.add.sprite(x,y,CHAR_KEY,String(this.frameFor(state.outfit,'down',1)))
     .setOrigin(.5,.78).setDepth(20).setScale(1.08);
   this.player.body.setSize(22,22).setOffset(13,40).setCollideWorldBounds(true);
   this.physics.add.collider(this.player,this.solids);
   this.playerShadow=this.add.ellipse(x,y+14,24,7,0x081006,.28).setDepth(10);
   this.playerName=this.add.text(x,y-43,'Hood',{fontFamily:'monospace',fontSize:'9px',color:'#f2ecd7',stroke:'#161a13',strokeThickness:3}).setOrigin(.5).setDepth(24);
 }
 paintWorld(d){
   const {ground,groundBorders,walls,items,decorTop}=this.layers;
   for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++)ground.putTileAt(((x*17+y*31)%13===0&&d.terrain.variants)?GID.grass2:GID.grass,x,y);
   const fill=(layer,rect,gid)=>{const [x,y,w,h]=rect;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)layer.putTileAt(gid,xx,yy)};
   d.terrain.roads.forEach(r=>fill(ground,r,GID.cobble));fill(ground,d.terrain.plaza,GID.plaza);if(d.terrain.water)fill(ground,d.terrain.water,GID.water);
   const prop=(kind,x,y)=>{
     const gid=GID[kind];if(gid==null)return;
     const layer=(kind==='tree'||kind==='lamp')?decorTop:(kind==='flower'?groundBorders:items);
     layer.putTileAt(gid,x,y);
   };
   (d.decor||[]).forEach(([k,x,y])=>prop(k,x,y));
   d.buildings.forEach(b=>{
     const [x,y,w,h]=b.rect;fill(ground,b.rect,GID.wood);
     for(let xx=x;xx<x+w;xx++){walls.putTileAt(GID.wall,xx,y);walls.putTileAt(GID.wall,xx,y+h-1)}
     for(let yy=y;yy<y+h;yy++){walls.putTileAt(GID.wall,x,yy);walls.putTileAt(GID.wall,x+w-1,yy)}
     const [dx,dy]=b.door;walls.removeTileAt(dx,dy);items.putTileAt(GID.door,dx,dy);
     (b.windows||[]).forEach(([wx,wy])=>items.putTileAt(GID.window,wx,wy));
     (b.props||[]).forEach(([k,px,py])=>items.putTileAt(GID[k],px,py));
     const roof=this.map.createBlankLayer(`roof_${b.id}`,this.map.tilesets[0],0,0).setDepth(30);
     for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)roof.putTileAt(yy===y+h-1?GID.roofEdge:GID.roof,xx,yy);
     roof.setAlpha(.97); if(b.roofTint) roof.setTint(b.roofTint);
     this.layers[`roof_${b.id}`]=roof;this.roofZones.push({b,roof,inside:false});
   });
 }
 installCollisions(d){
   const ts=this.tileSize;this.solids=this.physics.add.staticGroup();
   const add=(x,y,w,h)=>{if(w<=0||h<=0)return;const z=this.add.zone(x,y,w,h);this.physics.add.existing(z,true);this.solids.add(z)};
   d.buildings.forEach(b=>{
     const [x,y,w,h]=b.rect,[dx,dy]=b.door;
     add((x+w/2)*ts,(y+.5)*ts,w*ts,ts);add((x+.5)*ts,(y+h/2)*ts,ts,h*ts);add((x+w-.5)*ts,(y+h/2)*ts,ts,h*ts);
     const left=dx-x,right=(x+w-1)-dx;
     if(left>0)add((x+left/2)*ts,(dy+.5)*ts,left*ts,ts);
     if(right>0)add((dx+1+right/2)*ts,(dy+.5)*ts,right*ts,ts);
   });
 }
 makeAnimations(){
   for(const [outfit,cfg] of Object.entries(OUTFITS)) for(const [dir,row] of Object.entries(DIR_ROW)){
     const key=`${outfit}-${dir}`,start=cfg.base+row*3;
     if(!this.anims.exists(key))this.anims.create({key,frames:[0,1,2,1].map(i=>({key:CHAR_KEY,frame:String(start+i)})),frameRate:7,repeat:-1});
   }
 }
 frameFor(outfit,dir,phase=1){const cfg=OUTFITS[outfit]||OUTFITS.wanderer;return cfg.base+(DIR_ROW[dir]??0)*3+phase}
 makeNpcs(d){
   const ts=this.tileSize;this.npcs=[];
   (d.npcs||[]).forEach(n=>{
     const outfit=n.outfit==='merchant'?'ranger':'wanderer',x=n.x*ts+ts/2,y=n.y*ts+ts/2;
     const s=this.add.sprite(x,y,CHAR_KEY,String(this.frameFor(outfit,'down',1))).setOrigin(.5,.78).setScale(1.02).setDepth(20+y/1000);
     if(n.outfit==='warden')s.setTint(0xc9ddc5);if(n.outfit==='merchant')s.setTint(0xf0d2a5);
     const label=this.add.text(x,y-43,n.name,{fontFamily:'monospace',fontSize:'9px',color:'#efe8cf',stroke:'#171a14',strokeThickness:3}).setOrigin(.5).setDepth(24);
     this.npcs.push({sprite:s,label});
   });
 }
 bindTouch(){
   const stop=e=>{e.preventDefault();e.stopPropagation()};
   document.querySelectorAll('[data-v2-move]').forEach(btn=>{const d=btn.dataset.v2Move,on=e=>{stop(e);this.touch[d]=true;btn.classList.add('active')},off=e=>{stop(e);this.touch[d]=false;btn.classList.remove('active')};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,off))});
   document.getElementById('v2BagBtn')?.addEventListener('pointerdown',e=>{stop(e);this.toggleBag()});
   document.getElementById('v2CloseBag')?.addEventListener('click',()=>this.closeBag());
   window.addEventListener('blur',()=>this.stopTouch());
 }
 stopTouch(){Object.keys(this.touch).forEach(k=>this.touch[k]=false)}
 toggleBag(){const el=document.getElementById('v2Bag');el.hidden=!el.hidden;if(!el.hidden)this.renderBag()}
 closeBag(){document.getElementById('v2Bag').hidden=true}
 itemIcon(icon){return `<span class="gear-icon gear-${icon}" aria-hidden="true"></span>`}
 renderBag(){
   const set=document.getElementById('v2Set');if(!set)return;set.innerHTML='';
   ['helmet','weapon','armor','shield','legs','boots'].forEach(slot=>{const it=item(state.equipped[slot]);const b=document.createElement('button');b.className=`v2-slot slot-${slot}${it?' filled':''}`;b.innerHTML=it?`${this.itemIcon(it.icon)}<small>${it.name}</small>`:`<span>${slot.toUpperCase()}</span>`;if(it)b.onclick=()=>{state.equipped[slot]=null;save();this.renderBag();this.refreshHud()};else b.disabled=true;set.appendChild(b)});
   const bag=document.getElementById('v2BagItems');bag.innerHTML='';
   ITEMS.filter(it=>state.owned.has(it.id)&&state.equipped[it.slot]!==it.id).forEach(it=>{const b=document.createElement('button');b.className='v2-item';b.innerHTML=`${this.itemIcon(it.icon)}<span><b>${it.name}</b><small>${it.slot.toUpperCase()}</small></span><strong>EQUIP</strong>`;b.onclick=()=>{state.equipped[it.slot]=it.id;save();this.renderBag();this.refreshHud()};bag.appendChild(b)});
   if(!bag.children.length)bag.innerHTML='<div class="v2-empty">Backpack empty</div>';
   const outfit=document.getElementById('v2Outfit');outfit.innerHTML='';
   Object.entries(OUTFITS).forEach(([id,cfg])=>{const b=document.createElement('button');b.className=id===state.outfit?'selected':'';b.textContent=cfg.label;b.onclick=()=>{state.outfit=id;localStorage.setItem(OUTFIT_KEY,id);this.player.setFrame(String(this.frameFor(id,this.direction,1)));this.renderBag()};outfit.appendChild(b)});
 }
 refreshHud(){
   document.getElementById('v2Coins').textContent=`${state.coins}c`;let atk=5,def=3,hp=100;
   Object.values(state.equipped).forEach(id=>{const it=item(id);if(it){atk+=it.stats.attack||0;def+=it.stats.defense||0;hp+=it.stats.hp||0}});
   document.getElementById('v2Stats').textContent=`HP ${hp} · ATK ${atk} · DEF ${def}`;
 }
 update(time){
   const bagOpen=!document.getElementById('v2Bag').hidden;let dx=0,dy=0;
   if(!bagOpen){if(this.cursors.left.isDown||this.keys.A.isDown||this.touch.left)dx--;if(this.cursors.right.isDown||this.keys.D.isDown||this.touch.right)dx++;if(this.cursors.up.isDown||this.keys.W.isDown||this.touch.up)dy--;if(this.cursors.down.isDown||this.keys.S.isDown||this.touch.down)dy++}
   const v=new Phaser.Math.Vector2(dx,dy),moving=v.lengthSq()>0;
   if(moving){v.normalize().scale(132);this.player.setVelocity(v.x,v.y);this.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');this.player.anims.play(`${state.outfit}-${this.direction}`,true)}
   else{this.player.setVelocity(0);this.player.anims.stop();this.player.setFrame(String(this.frameFor(state.outfit,this.direction,1)))}
   this.player.setDepth(20+this.player.y/1000);
   this.playerName.setPosition(this.player.x,this.player.y-43).setDepth(this.player.depth+2);
   this.playerShadow.setPosition(this.player.x,this.player.y+14).setDepth(this.player.depth-2).setScale(moving?1+.04*Math.sin(time/90):1,1);
   const ts=this.tileSize;this.roofZones.forEach(r=>{const [x,y,w,h]=r.b.rect,inside=this.player.x>(x+.35)*ts&&this.player.x<(x+w-.35)*ts&&this.player.y>(y+.35)*ts&&this.player.y<(y+h-.35)*ts;if(inside!==r.inside){r.inside=inside;this.tweens.killTweensOf(r.roof);this.tweens.add({targets:r.roof,alpha:inside?.06:.97,duration:120})}});
 }
}
window.addEventListener('DOMContentLoaded',()=>new Phaser.Game({type:Phaser.AUTO,parent:'hoods-v2-root',backgroundColor:'#172113',pixelArt:true,roundPixels:true,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:HoodsV2}));
})();