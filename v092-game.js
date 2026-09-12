// Hoods v0.9.2 — CHARACTER SYSTEM PASS.
// One humanoid renderer, one scale, one silhouette language for player + NPCs.
(() => {
const SAVE='hoods-v092';
const ITEMS=[
  {id:'sword',name:'Rusty Sword',slot:'weapon',price:25,atk:3},
  {id:'shield',name:'Wood Shield',slot:'shield',price:20,def:2},
  {id:'helmet',name:'Iron Hood',slot:'helmet',price:30,def:2},
  {id:'armor',name:'Leather Armor',slot:'armor',price:35,def:3,hp:15},
  {id:'boots',name:'Runner Boots',slot:'boots',price:22,spd:1}
];
const fresh=()=>({coins:120,owned:['sword','shield'],gear:{weapon:'sword',shield:'shield',helmet:null,armor:null,boots:null},quest:{accepted:false,kills:0,done:false},loot:{ratTail:0}});
const load=()=>{try{return {...fresh(),...(JSON.parse(localStorage.getItem(SAVE))||{})}}catch{return fresh()}};

const LOOKS={
  Hoods:{skin:0xc68b67,hair:0x171514,cloth:0x4f3b32,accent:0x8a6748,hood:true},
  Bram:{skin:0xc78b66,hair:0x6a3f2e,cloth:0x70503b,accent:0xa47b50,beard:true},
  Mara:{skin:0xc68b68,hair:0x4a2924,cloth:0x70433d,accent:0xa85f4c},
  Thorn:{skin:0xc58b67,hair:0x5b392c,cloth:0x50635a,accent:0x8b9c7b},
  Guard:{skin:0xca9672,hair:0x332922,cloth:0x3b5270,accent:0x8b9cab,helmet:true},
  Sara:{skin:0xd19a75,hair:0x7a4c32,cloth:0x8b654d,accent:0xc18c62},
  Merchant:{skin:0xc99470,hair:0x3d3029,cloth:0x536d47,accent:0x89a767}
};

class Game extends Phaser.Scene{
  constructor(){super('v092');this.s=load();this.touch={up:false,down:false,left:false,right:false};this.dir='down';this.walk=0;this.lastWalk=0;this.npcs=[];this.rats=[];this.mode='play';this.lastAtk=0;this.lastHeroKey='';}
  preload(){const a='assets/v08/';['grass','cobble'].forEach(k=>this.load.svg(k,a+`tile-${k}.svg`));['tree','fountain','lamp','banner','barrel'].forEach(k=>this.load.svg(k,a+`prop-${k}.svg`));['bank','inn','shop'].forEach(k=>this.load.svg(k,a+`building-${k}.svg`));this.load.svg('hit',a+'hood-down.svg')}
  create(){this.W=980;this.H=720;this.physics.world.setBounds(0,0,this.W,this.H);this.cameras.main.setBounds(0,0,this.W,this.H);this.cameras.main.setBackgroundColor('#22341f');this.world();this.people();this.player();this.enemies();this.hud();this.dom();this.keys=this.input.keyboard.addKeys('W,A,S,D,E,I,SPACE');this.cursors=this.input.keyboard.createCursorKeys();this.input.keyboard.on('keydown-E',()=>this.talk());this.input.keyboard.on('keydown-I',()=>this.openBag());this.input.keyboard.on('keydown-SPACE',()=>this.attack());this.bindMobile();this.cameras.main.startFollow(this.actor,true,.09,.09);this.setZoom();this.scale.on('resize',()=>this.setZoom());this.cameras.main.setRoundPixels(true)}
  save(){localStorage.setItem(SAVE,JSON.stringify(this.s));this.refreshHud()}
  stats(){let st={hp:125,atk:5,def:2,spd:166};Object.values(this.s.gear).filter(Boolean).forEach(id=>{const it=ITEMS.find(x=>x.id===id);if(it){st.hp+=it.hp||0;st.atk+=it.atk||0;st.def+=it.def||0;st.spd+=(it.spd||0)*12}});return st}

  world(){const W=this.W,H=this.H;for(let y=0;y<H;y+=32)for(let x=0;x<W;x+=32)this.add.image(x+16,y+16,'grass').setDepth(0);const cob=(x,y,w,h)=>{for(let yy=y;yy<y+h;yy+=32)for(let xx=x;xx<x+w;xx+=32)this.add.image(xx+16,yy+16,'cobble').setDepth(.2)};cob(300,0,380,H);cob(0,280,W,210);cob(230,190,520,395);const edge=this.add.graphics().setDepth(.35);edge.lineStyle(4,0x4f4b40,1).strokeRoundedRect(230,190,520,395,8);const water=this.add.graphics().setDepth(.12);water.fillStyle(0x2e6b8e,1).fillRoundedRect(0,585,235,135,10).fillRoundedRect(790,585,190,135,10);this.add.image(185,250,'inn').setOrigin(.5,1).setScale(1.02).setDepth(34);this.add.image(490,230,'bank').setOrigin(.5,1).setScale(1.05).setDepth(32);this.add.image(790,255,'shop').setOrigin(.5,1).setScale(1.02).setDepth(34);this.add.image(490,430,'fountain').setDepth(58).setScale(1.08);[[70,120],[910,115],[90,510],[880,480],[250,120],[730,125],[300,615],[705,610]].forEach(([x,y])=>this.add.image(x,y,'tree').setOrigin(.5,.9).setDepth(y/10));[[325,292],[655,292],[325,535],[655,535]].forEach(([x,y])=>this.add.image(x,y,'lamp').setOrigin(.5,1).setDepth(y/10+15));[[330,225],[650,225],[445,540],[535,540]].forEach(([x,y])=>this.add.image(x,y,'banner').setOrigin(.5,1).setDepth(y/10+12));[[260,505],[725,505],[140,520],[850,520]].forEach(([x,y])=>this.add.image(x,y,'barrel').setOrigin(.5,1).setDepth(y/10+10))}

  // ----- ONE CHARACTER SYSTEM -----
  drawHumanoid(container,{name='Hoods',dir='down',frame=0,gear={},npc=false}={}){
    container.removeAll(true);const L=LOOKS[name]||LOOKS.Hoods;const R=(x,y,w,h,c,s=0x171311)=>this.add.rectangle(x,y,w,h,c).setStrokeStyle(1,s);const E=(x,y,w,h,c,a=1)=>this.add.ellipse(x,y,w,h,c,a);const side=dir==='left'?-1:dir==='right'?1:0,back=dir==='up',bob=[0,-1,0,1][frame]||0,step=[0,2,0,-2][frame]||0;
    // shared 32x48-ish silhouette for EVERY human character
    container.add(E(0,29,34,9,0x080908,.34));
    container.add(R(-6,17+bob+step,8,17,0x302a27));container.add(R(7,17+bob-step,8,17,0x302a27));
    container.add(R(-7,27+bob+step,11,6,gear.boots?0x11110f:0x362d28));container.add(R(7,27+bob-step,11,6,gear.boots?0x11110f:0x362d28));
    container.add(R(0,2+bob,27,28,0x211d1b));container.add(R(0,4+bob,21,24,gear.armor?0x615044:L.cloth));
    container.add(R(0,-2+bob,20,5,gear.armor?0x8e795c:L.accent));container.add(R(0,15+bob,24,6,0x171514));
    const arm1=frame===1?L.accent:L.cloth,arm2=frame===3?L.accent:L.cloth;container.add(R(-16,0+bob-step/2,6,21,arm1));container.add(R(16,0+bob+step/2,6,21,arm2));
    // head / hood / hair
    if(back){container.add(R(0,-21+bob,24,22,(gear.helmet||L.helmet)?0x697579:(L.hood?0x151412:L.hair)));container.add(R(0,-16+bob,17,13,L.hood?0x29231f:L.hair));}
    else{
      const outer=(gear.helmet||L.helmet)?0x707b7e:(L.hood?0x151412:L.hair);container.add(R(side*2,-21+bob,24,22,outer));container.add(R(side*3,-17+bob,18,14,L.hood?0x29231f:L.hair));container.add(R(side*4,-11+bob,14,10,L.skin));
      container.add(R(side*8,-12+bob,2,2,0x080807));container.add(R(side*3,-8+bob,6,2,0x754a39));if(L.beard)container.add(R(side*3,-5+bob,11,5,0x5a3428));if(gear.helmet||L.helmet)container.add(R(side*8,-18+bob,8,4,0xc4cbcb,0x31383a));
    }
    container.add(R(0,9+bob,21,4,0x10100f));container.add(R(0,11+bob,5,5,L.accent));
    // player equipment overlays use the same skeleton scale
    if(!npc&&dir!=='up'){
      if(gear.weapon){const wx=side?side*22:21,sword=this.add.container(wx,-2+bob).setAngle(side?side*12:-8);sword.add(R(0,-2,4,27,0xcbd4d4,0x3d4446));sword.add(R(0,11,7,5,0x6b492d));container.add(sword)}
      if(gear.shield){const sx=side?-side*21:-21;container.add(R(sx,4+bob,12,19,0x704d32,0x251b15));container.add(R(sx,4+bob,4,13,0xa67a48,0x251b15))}
    }
  }

  addCharacter(x,y,name,opts={}){const c=this.add.container(x,y).setDepth(y/10+30).setScale(1);this.drawHumanoid(c,{name,dir:opts.dir||'down',frame:0,gear:opts.gear||{},npc:!!opts.npc});const label=this.add.text(x,y-47,name,{fontFamily:'Georgia,serif',fontSize:'12px',fontStyle:'bold',color:opts.player?'#b9ef5a':'#f2e6c8',stroke:'#111',strokeThickness:4}).setOrigin(.5).setDepth(c.depth+1);if(opts.quest)this.add.text(x,y-67,'!',{fontFamily:'Georgia,serif',fontSize:'23px',fontStyle:'bold',color:'#ffd447',stroke:'#382408',strokeThickness:4}).setOrigin(.5).setDepth(c.depth+2);return {c,label}}

  people(){this.npc(185,308,'Sara','Innkeeper','Rooms and rumors soon.');this.npc(490,292,'Thorn','Banker','Vault storage will open here.');this.npc(790,322,'Bram','Gear Merchant','Buy, equip and survive.');this.npc(700,490,'Mara','Quest Giver','Road East: clear three rats.',true);this.npc(315,385,'Guard','Town Guard','Safe zone ends at east road.');this.npc(130,530,'Merchant','Market','Consumables later.')}
  npc(x,y,name,role,line,quest=false){const ch=this.addCharacter(x,y,name,{npc:true,quest});this.npcs.push({x,y,name,role,line,ch})}

  player(){this.actor=this.physics.add.sprite(490,505,'hit').setVisible(false).setCollideWorldBounds(true);this.actor.body.setSize(26,32).setOffset(11,28);const p=this.addCharacter(490,505,'Hoods',{player:true,gear:this.s.gear});this.hero=p.c;this.name=p.label;this.drawHero(true)}
  drawHero(force=false){const key=this.dir+this.walk+JSON.stringify(this.s.gear);if(!force&&key===this.lastHeroKey)return;this.lastHeroKey=key;this.drawHumanoid(this.hero,{name:'Hoods',dir:this.dir,frame:this.walk,gear:this.s.gear,npc:false})}

  enemies(){[[830,460],[880,515],[820,570]].forEach(([x,y])=>{const r=this.add.container(x,y).setDepth(y/10+25);r.hp=18;r.dead=false;r.add(this.add.ellipse(0,8,25,10,0x17110e));r.add(this.add.circle(-5,0,8,0x65523d).setStrokeStyle(2,0x2b2119));r.add(this.add.circle(5,0,7,0x756049).setStrokeStyle(2,0x2b2119));r.add(this.add.text(0,-20,'Rat',{fontFamily:'monospace',fontSize:'9px',color:'#e8d3aa',stroke:'#111',strokeThickness:3}).setOrigin(.5));this.rats.push(r)})}

  hud(){this.ui=this.add.container(10,10).setScrollFactor(0).setDepth(700);const bg=this.add.graphics();bg.fillStyle(0x0b0d0b,.72).fillRoundedRect(0,0,168,62,9);bg.lineStyle(1,0x70624c,.8).strokeRoundedRect(0,0,168,62,9);this.ui.add(bg);this.ui.add(this.add.text(10,3,'Hoods',{fontFamily:'Georgia,serif',fontSize:'22px',fontStyle:'bold',color:'#f0d99a',stroke:'#111',strokeThickness:4}));this.hp=this.add.text(12,35,'',{fontFamily:'monospace',fontSize:'9px',color:'#fff'});this.gold=this.add.text(12,48,'',{fontFamily:'monospace',fontSize:'9px',color:'#f3d776'});this.ui.add([this.hp,this.gold]);this.questText=this.add.text(10,78,'',{fontFamily:'monospace',fontSize:'9px',color:'#b9ef5a',backgroundColor:'#0b0d0bcc',padding:{x:6,y:4}}).setScrollFactor(0).setDepth(700);this.hint=this.add.text(0,0,'',{fontFamily:'monospace',fontSize:'10px',color:'#f7efcf',backgroundColor:'#11140ddd',padding:{x:7,y:5}}).setOrigin(.5).setDepth(650);this.refreshHud()}
  refreshHud(){const st=this.stats();this.hp?.setText(`HP ${st.hp}/${st.hp}`);this.gold?.setText(`Coins ${this.s.coins} · Loot ${this.s.loot.ratTail}`);let q='Quest: talk to Mara';if(this.s.quest.accepted)q=this.s.quest.done?'Quest complete':`Quest: rats ${this.s.quest.kills}/3`;this.questText?.setText(q)}

  dom(){const box=document.createElement('div');box.id='dialogueBox';box.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:80;background:#0b0e0bea;border:1px solid #6f7a62;border-radius:12px;padding:12px;color:#f4eed4;font-family:Georgia,serif;box-shadow:0 8px 28px #0008;display:none';box.innerHTML='<b id="dTitle" style="color:#f0d79d;font-size:16px"></b><div id="dRole" style="font:700 10px monospace;color:#b9ef5a;margin:2px 0 8px"></div><div id="dLine" style="font-size:14px"></div><div id="dItems" style="display:grid;gap:6px;margin-top:10px"></div><button id="dClose" style="margin-top:8px;width:100%;padding:10px;border-radius:8px;background:#171b15;color:#eee;border:1px solid #555">Close</button>';document.body.appendChild(box);this.box=box;document.getElementById('dClose').onclick=()=>this.closeBox()}
  openBox(title,role,line,items=[]){this.mode='menu';this.box.style.display='block';dTitle.textContent=title;dRole.textContent=role;dLine.textContent=line;dItems.innerHTML='';items.forEach(it=>{const b=document.createElement('button');b.textContent=it.label;b.style.cssText='padding:10px;border-radius:8px;background:#26351f;color:#b9ef5a;border:1px solid #8b947f;font-weight:800';b.onclick=it.fn;dItems.appendChild(b)})}
  closeBox(){this.box.style.display='none';this.mode='play'}
  nearNpc(){let best=null,bd=999;for(const n of this.npcs){const d=Phaser.Math.Distance.Between(this.actor.x,this.actor.y,n.x,n.y);if(d<bd){bd=d;best=n}}return bd<82?best:null}
  talk(){if(this.mode==='menu'){this.closeBox();return}const n=this.nearNpc();if(!n)return;if(n.name==='Bram')this.shop();else if(n.name==='Mara')this.mara();else this.openBox(n.name,n.role,n.line)}
  shop(){this.openBox('Bram','Gear merchant','Starter gear.',ITEMS.map(it=>({label:`${it.name} · ${it.price} Coins`,fn:()=>{if(this.s.owned.includes(it.id))return;if(this.s.coins<it.price)return;this.s.coins-=it.price;this.s.owned.push(it.id);this.s.gear[it.slot]=it.id;this.save();this.drawHero(true)}})))}
  mara(){if(this.s.quest.done)return this.openBox('Mara','Quest giver','Road East is safe.');if(!this.s.quest.accepted)this.openBox('Mara','Quest giver','Clear three rats east.',[{label:'Accept quest',fn:()=>{this.s.quest.accepted=true;this.save();this.closeBox()}}]);else this.openBox('Mara','Quest giver',`Progress ${this.s.quest.kills}/3`)}
  openBag(){const rows=this.s.owned.map(id=>{const it=ITEMS.find(x=>x.id===id),on=this.s.gear[it.slot]===id;return{label:`${on?'✓':'□'} ${it.name}`,fn:()=>{this.s.gear[it.slot]=on?null:id;this.save();this.drawHero(true);this.openBag()}}});this.openBox('Bag','Inventory','Equip or unequip.',rows)}
  attack(){if(this.mode==='menu')return;const now=this.time.now;if(now-this.lastAtk<380)return;this.lastAtk=now;let hit=null,bd=999;for(const r of this.rats.filter(r=>!r.dead)){const d=Phaser.Math.Distance.Between(this.actor.x,this.actor.y,r.x,r.y);if(d<bd){bd=d;hit=r}}if(!hit||bd>82)return;hit.hp-=this.stats().atk;hit.setAlpha(.55);this.time.delayedCall(90,()=>hit.setAlpha(1));if(hit.hp<=0){hit.dead=true;hit.setVisible(false);this.s.coins+=8;this.s.loot.ratTail++;if(this.s.quest.accepted&&!this.s.quest.done){this.s.quest.kills++;if(this.s.quest.kills>=3){this.s.quest.done=true;this.s.coins+=35}}this.save();this.time.delayedCall(5000,()=>{hit.hp=18;hit.dead=false;hit.setVisible(true)})}}

  bindMobile(){document.querySelectorAll('[data-move]').forEach(btn=>{const d=btn.dataset.move,on=e=>{e.preventDefault();this.touch[d]=true;btn.classList.add('active')},off=e=>{e.preventDefault();this.touch[d]=false;btn.classList.remove('active')};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,off))});talkBtn.onclick=()=>this.talk();bagBtn.onclick=()=>this.openBag();atkBtn.onclick=()=>this.attack()}
  setZoom(){const w=this.scale.width;this.cameras.main.setZoom(w<500?.66:w<800?.8:1)}
  update(time){if(this.mode==='menu'){this.actor.setVelocity(0);return}let dx=0,dy=0;if(this.cursors.left.isDown||this.keys.A.isDown||this.touch.left)dx--;if(this.cursors.right.isDown||this.keys.D.isDown||this.touch.right)dx++;if(this.cursors.up.isDown||this.keys.W.isDown||this.touch.up)dy--;if(this.cursors.down.isDown||this.keys.S.isDown||this.touch.down)dy++;const moving=!!(dx||dy);if(moving){const l=Math.hypot(dx,dy);dx/=l;dy/=l;if(Math.abs(dx)>Math.abs(dy))this.dir=dx<0?'left':'right';else this.dir=dy<0?'up':'down';if(time-this.lastWalk>110){this.walk=(this.walk+1)%4;this.lastWalk=time}}else this.walk=0;this.actor.setVelocity(dx*this.stats().spd,dy*this.stats().spd);this.actor.setPosition(Math.round(this.actor.x),Math.round(this.actor.y));this.hero.setPosition(this.actor.x,this.actor.y).setDepth(this.actor.y/10+35);this.name.setPosition(this.actor.x,this.actor.y-47).setDepth(this.hero.depth+1);this.drawHero();const n=this.nearNpc();this.hint.setVisible(!!n);if(n)this.hint.setText(`TALK ${n.name}`).setPosition(this.actor.x,this.actor.y-70)}
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#22341f',pixelArt:true,roundPixels:true,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:window.innerWidth,height:window.innerHeight},scene:Game});
})();