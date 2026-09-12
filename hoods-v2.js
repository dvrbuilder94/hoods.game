// Hoods V2.3 — responsive town slice with depth-sorted props and enterable buildings.
(() => {
const VERSION='v2.3';
const MAP_URL=`maps/town-v2/town-square.json?v=${VERSION}`;
const MAP_KEY='hoods-town-v2';
const TILESET_KEY='hoods-classic-v1';
const CHAR_KEY='hoods-humans-v2';
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
 constructor(){
   super('HoodsV2');
   this.touch={up:false,down:false,left:false,right:false};
   this.roofZones=[];
   this.depthProps=[];
   this.direction='down';
   this.activeBuilding=null;
 }
 preload(){
   this.load.json(MAP_KEY,MAP_URL);
   this.load.svg(TILESET_KEY,`assets/maps/tiles/hoods-classic-v1.svg?v=${VERSION}`,{width:256,height:128});
   this.load.svg(CHAR_KEY,`assets/characters/v2/humans-v2.svg?v=${VERSION}`,{width:96,height:384});
 }
 create(){
   const d=this.cache.json.get(MAP_KEY);if(!d)throw new Error('Town V2 map missing');
   const ts=d.tileSize||32;this.dataMap=d;this.tileSize=ts;
   this.installCharacterFrames();
   this.installTileFrames();
   this.map=this.make.tilemap({tileWidth:ts,tileHeight:ts,width:d.width,height:d.height});
   const tiles=this.map.addTilesetImage(TILESET_KEY,TILESET_KEY,32,32,0,0);
   this.layers={};
   const depth={ground:0,groundBorders:1,walls:4,items:6,decorTop:18};
   for(const name of Object.keys(depth))this.layers[name]=this.map.createBlankLayer(name,tiles,0,0).setDepth(depth[name]);
   this.paintWorld(d);
   this.worldW=d.width*ts;this.worldH=d.height*ts;
   this.physics.world.setBounds(0,0,this.worldW,this.worldH);
   this.cameras.main.setBounds(0,0,this.worldW,this.worldH).setRoundPixels(true).setBackgroundColor('#708e4a');
   this.installCollisions(d);
   this.makeAnimations();
   this.createPlayer(d);
   this.makeNpcs(d);
   this.installCamera();
   this.keys=this.input.keyboard.addKeys('W,A,S,D,I,ESC');this.cursors=this.input.keyboard.createCursorKeys();
   this.keys.I.on('down',()=>this.toggleBag());this.keys.ESC.on('down',()=>this.closeBag());
   this.bindTouch();this.renderBag();this.refreshHud();this.setLocation('TOWN SQUARE');
   this.scale.on('resize',()=>this.fitCamera());
 }
 installCharacterFrames(){
   const tex=this.textures.get(CHAR_KEY);if(!tex||tex.key==='__MISSING')throw new Error('Character atlas failed to load');
   for(let row=0;row<8;row++)for(let col=0;col<3;col++){
     const idx=row*3+col,key=String(idx);if(!tex.has(key))tex.add(key,0,col*32,row*48,32,48);
   }
 }
 installTileFrames(){
   const tex=this.textures.get(TILESET_KEY);if(!tex||tex.key==='__MISSING')throw new Error('Town tileset failed to load');
   for(let row=0;row<4;row++)for(let col=0;col<8;col++){
     const idx=row*8+col,key=`tile_${idx}`;if(!tex.has(key))tex.add(key,0,col*32,row*32,32,32);
   }
 }
 frameFor(outfit,dir,phase=1){const cfg=OUTFITS[outfit]||OUTFITS.wanderer;return cfg.base+(DIR_ROW[dir]??0)*3+phase}
 makeAnimations(){
   for(const [outfit,cfg] of Object.entries(OUTFITS))for(const [dir,row] of Object.entries(DIR_ROW)){
     const key=`${outfit}-${dir}`,start=cfg.base+row*3;
     if(!this.anims.exists(key))this.anims.create({key,frames:[0,1,2,1].map(i=>({key:CHAR_KEY,frame:String(start+i)})),frameRate:7,repeat:-1});
   }
 }
 installCamera(){
   this.cameras.main.startFollow(this.player,true,.14,.14);
   this.cameras.main.setLerp(.14,.14);
   this.fitCamera();
 }
 fitCamera(){
   if(!this.worldW||!this.worldH)return;
   const w=Math.max(1,this.scale.width),h=Math.max(1,this.scale.height);
   const base=w<=700?1.12:1.05;
   const cover=Math.max(w/this.worldW,h/this.worldH);
   // Small prototype maps should never expose the browser background. As the world grows,
   // the camera naturally falls back to the intended classic-RPG zoom.
   const zoom=Math.max(base,Math.min(1.62,cover));
   this.cameras.main.setZoom(zoom);
 }
 createPlayer(d){
   const ts=this.tileSize,x=d.spawn.x*ts+ts/2,y=d.spawn.y*ts+ts/2;
   this.player=this.physics.add.sprite(x,y,CHAR_KEY,String(this.frameFor(state.outfit,'down',1))).setOrigin(.5,.82).setDepth(20);
   this.player.body.setSize(18,17).setOffset(7,28).setCollideWorldBounds(true);
   this.physics.add.collider(this.player,this.solids);
   this.playerShadow=this.add.ellipse(x,y+10,18,5,0x081006,.26).setDepth(18);
   this.playerName=this.add.text(x,y-31,'Hood',{fontFamily:'monospace',fontSize:'8px',color:'#f2ecd7',stroke:'#161a13',strokeThickness:3}).setOrigin(.5).setDepth(24);
 }
 addDepthProp(kind,x,y,alpha=1){
   const gid=GID[kind];if(gid==null)return null;
   const ts=this.tileSize;
   const sprite=this.add.image((x+.5)*ts,(y+1)*ts,TILESET_KEY,`tile_${gid}`).setOrigin(.5,1).setAlpha(alpha);
   sprite.setDepth(20+((y+1)*ts)/1000);
   this.depthProps.push(sprite);
   return sprite;
 }
 paintWorld(d){
   const {ground,groundBorders,walls,items}=this.layers;
   for(let y=0;y<d.height;y++)for(let x=0;x<d.width;x++)ground.putTileAt(((x*17+y*31)%13===0&&d.terrain.variants)?GID.grass2:GID.grass,x,y);
   const fill=(layer,rect,gid)=>{const [x,y,w,h]=rect;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)layer.putTileAt(gid,xx,yy)};
   (d.terrain.roads||[]).forEach(r=>fill(ground,r,GID.cobble));fill(ground,d.terrain.plaza,GID.plaza);if(d.terrain.water)fill(ground,d.terrain.water,GID.water);
   const floorProp=new Set(['flower','rug']);
   const prop=(kind,x,y)=>{
     const gid=GID[kind];if(gid==null)return;
     if(floorProp.has(kind)){(kind==='flower'?groundBorders:items).putTileAt(gid,x,y);return;}
     this.addDepthProp(kind,x,y);
   };
   (d.decor||[]).forEach(([k,x,y])=>prop(k,x,y));
   d.buildings.forEach(b=>{
     const [x,y,w,h]=b.rect;
     // Offset shadows make structures read as volumes rather than flat roof rectangles.
     this.add.rectangle((x+w/2)*this.tileSize+5,(y+h)*this.tileSize+4,w*this.tileSize-5,8,0x10160e,.34).setDepth(2);
     this.add.rectangle((x+w)*this.tileSize+3,(y+h/2)*this.tileSize+4,7,h*this.tileSize-5,0x10160e,.24).setDepth(2);
     fill(ground,b.rect,GID.wood);
     for(let xx=x;xx<x+w;xx++){walls.putTileAt(GID.wall,xx,y);walls.putTileAt(GID.wall,xx,y+h-1)}
     for(let yy=y;yy<y+h;yy++){walls.putTileAt(GID.wall,x,yy);walls.putTileAt(GID.wall,x+w-1,yy)}
     const [dx,dy]=b.door;walls.removeTileAt(dx,dy);items.putTileAt(GID.door,dx,dy);
     this.add.rectangle((dx+.5)*this.tileSize,(dy+1)*this.tileSize-3,this.tileSize-10,3,0xe4c96f,.24).setDepth(7);
     (b.windows||[]).forEach(([wx,wy])=>items.putTileAt(GID.window,wx,wy));
     (b.props||[]).forEach(([k,px,py])=>prop(k,px,py));
     const roof=this.map.createBlankLayer(`roof_${b.id}`,this.map.tilesets[0],0,0).setDepth(30);
     for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)roof.putTileAt(yy===y+h-1?GID.roofEdge:GID.roof,xx,yy);
     roof.setAlpha(.97);if(b.roofTint)roof.setTint(b.roofTint);
     const label=this.add.text((x+w/2)*this.tileSize,(y+h)*this.tileSize+5,b.label||b.id.toUpperCase(),{fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#d6cfaa',stroke:'#171a14',strokeThickness:3}).setOrigin(.5,0).setDepth(17).setAlpha(.75);
     this.roofZones.push({b,roof,label,inside:false});
   });
 }
 installCollisions(d){
   const ts=this.tileSize;this.solids=this.physics.add.staticGroup();
   const add=(x,y,w,h)=>{if(w<=0||h<=0)return;const z=this.add.zone(x,y,w,h);this.physics.add.existing(z,true);this.solids.add(z)};
   d.buildings.forEach(b=>{
     const [x,y,w,h]=b.rect,[dx,dy]=b.door;
     add((x+w/2)*ts,(y+.5)*ts,w*ts,ts);add((x+.5)*ts,(y+h/2)*ts,ts,h*ts);add((x+w-.5)*ts,(y+h/2)*ts,ts,h*ts);
     const left=dx-x,right=(x+w-1)-dx;if(left>0)add((x+left/2)*ts,(dy+.5)*ts,left*ts,ts);if(right>0)add((dx+1+right/2)*ts,(dy+.5)*ts,right*ts,ts);
   });
 }
 makeNpcs(d){
   const ts=this.tileSize;this.npcs=[];
   (d.npcs||[]).forEach(n=>{
     const outfit=n.outfit==='merchant'?'ranger':'wanderer',x=n.x*ts+ts/2,y=n.y*ts+ts/2;
     const s=this.add.sprite(x,y,CHAR_KEY,String(this.frameFor(outfit,'down',1))).setOrigin(.5,.82).setDepth(20+y/1000);
     if(n.outfit==='warden')s.setTint(0xc9ddc5);if(n.outfit==='merchant')s.setTint(0xf0d2a5);
     const shadow=this.add.ellipse(x,y+10,17,4,0x081006,.22).setDepth(s.depth-.02);
     const label=this.add.text(x,y-31,n.name,{fontFamily:'monospace',fontSize:'8px',color:'#efe8cf',stroke:'#171a14',strokeThickness:3}).setOrigin(.5).setDepth(s.depth+2);
     this.npcs.push({sprite:s,label,shadow});
   });
 }
 bindTouch(){
   const stop=e=>{e.preventDefault();e.stopPropagation()};
   document.querySelectorAll('[data-v2-move]').forEach(btn=>{const d=btn.dataset.v2Move,on=e=>{stop(e);this.touch[d]=true;btn.classList.add('active')},off=e=>{stop(e);this.touch[d]=false;btn.classList.remove('active')};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,off))});
   document.getElementById('v2BagBtn')?.addEventListener('pointerdown',e=>{stop(e);this.toggleBag()});
   document.getElementById('v2CloseBag')?.addEventListener('click',()=>this.closeBag());window.addEventListener('blur',()=>this.stopTouch());
 }
 stopTouch(){Object.keys(this.touch).forEach(k=>this.touch[k]=false)}
 toggleBag(){const el=document.getElementById('v2Bag');el.hidden=!el.hidden;if(!el.hidden)this.renderBag()}
 closeBag(){document.getElementById('v2Bag').hidden=true}
 itemIcon(icon){return `<span class="gear-icon gear-${icon}" aria-hidden="true"></span>`}
 renderBag(){
   const set=document.getElementById('v2Set');if(!set)return;set.innerHTML='';
   ['helmet','weapon','armor','shield','legs','boots'].forEach(slot=>{const it=item(state.equipped[slot]);const b=document.createElement('button');b.className=`v2-slot slot-${slot}${it?' filled':''}`;b.innerHTML=it?`${this.itemIcon(it.icon)}<small>${it.name}</small>`:`<span>${slot.toUpperCase()}</span>`;if(it)b.onclick=()=>{state.equipped[slot]=null;save();this.renderBag();this.refreshHud()};else b.disabled=true;set.appendChild(b)});
   const bag=document.getElementById('v2BagItems');bag.innerHTML='';ITEMS.filter(it=>state.owned.has(it.id)&&state.equipped[it.slot]!==it.id).forEach(it=>{const b=document.createElement('button');b.className='v2-item';b.innerHTML=`${this.itemIcon(it.icon)}<span><b>${it.name}</b><small>${it.slot.toUpperCase()}</small></span><strong>EQUIP</strong>`;b.onclick=()=>{state.equipped[it.slot]=it.id;save();this.renderBag();this.refreshHud()};bag.appendChild(b)});if(!bag.children.length)bag.innerHTML='<div class="v2-empty">Backpack empty</div>';
   const outfit=document.getElementById('v2Outfit');outfit.innerHTML='';Object.entries(OUTFITS).forEach(([id,cfg])=>{const b=document.createElement('button');b.className=id===state.outfit?'selected':'';b.textContent=cfg.label;b.onclick=()=>{state.outfit=id;localStorage.setItem(OUTFIT_KEY,id);this.player.setFrame(String(this.frameFor(id,this.direction,1)));this.renderBag()};outfit.appendChild(b)});
 }
 refreshHud(){document.getElementById('v2Coins').textContent=`${state.coins}c`;let atk=5,def=3,hp=100;Object.values(state.equipped).forEach(id=>{const it=item(id);if(it){atk+=it.stats.attack||0;def+=it.stats.defense||0;hp+=it.stats.hp||0}});document.getElementById('v2Stats').textContent=`HP ${hp} · ATK ${atk} · DEF ${def}`}
 setLocation(label){const el=document.getElementById('v2Location');if(el)el.textContent=label}
 updateBuildingState(){
   const ts=this.tileSize;let active=null;
   this.roofZones.forEach(r=>{
     const [x,y,w,h]=r.b.rect;
     const inside=this.player.x>(x+.35)*ts&&this.player.x<(x+w-.35)*ts&&this.player.y>(y+.35)*ts&&this.player.y<(y+h-.35)*ts;
     if(inside)active=r;
     if(inside!==r.inside){
       r.inside=inside;this.tweens.killTweensOf(r.roof);this.tweens.killTweensOf(r.label);
       this.tweens.add({targets:r.roof,alpha:inside?.045:.97,duration:145,ease:'Sine.easeOut'});
       this.tweens.add({targets:r.label,alpha:inside?0:.75,duration:100});
     }
   });
   if(active!==this.activeBuilding){
     this.activeBuilding=active;
     this.setLocation(active?(active.b.label||active.b.id.toUpperCase()):'TOWN SQUARE');
   }
 }
 update(time){
   const bagOpen=!document.getElementById('v2Bag').hidden;let dx=0,dy=0;if(!bagOpen){if(this.cursors.left.isDown||this.keys.A.isDown||this.touch.left)dx--;if(this.cursors.right.isDown||this.keys.D.isDown||this.touch.right)dx++;if(this.cursors.up.isDown||this.keys.W.isDown||this.touch.up)dy--;if(this.cursors.down.isDown||this.keys.S.isDown||this.touch.down)dy++}
   const v=new Phaser.Math.Vector2(dx,dy),moving=v.lengthSq()>0;if(moving){v.normalize().scale(132);this.player.setVelocity(v.x,v.y);this.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');this.player.anims.play(`${state.outfit}-${this.direction}`,true)}else{this.player.setVelocity(0);this.player.anims.stop();this.player.setFrame(String(this.frameFor(state.outfit,this.direction,1)))}
   this.player.setDepth(20+this.player.y/1000);this.playerName.setPosition(this.player.x,this.player.y-31).setDepth(this.player.depth+2);this.playerShadow.setPosition(this.player.x,this.player.y+10).setDepth(this.player.depth-.02).setScale(moving?1+.03*Math.sin(time/90):1,1);
   this.updateBuildingState();
 }
}
window.addEventListener('DOMContentLoaded',()=>new Phaser.Game({type:Phaser.AUTO,parent:'hoods-v2-root',backgroundColor:'#708e4a',pixelArt:true,roundPixels:true,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:HoodsV2}));
})();