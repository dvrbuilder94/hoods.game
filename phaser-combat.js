// Hoods Phaser combat v0.5 — native combat with events + stronger feedback.
(() => {
const KEY="hoods-wilds-v03";
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"null")||{}}catch{return{}}};
const old=read();
const p={level:Math.max(1,old.level||1),xp:Math.max(0,old.xp||0),kills:Math.max(0,old.kills||0),loot:{"Rat Tail":0,"Slime Core":0,"Rusted Badge":0,...(old.loot||{})}};
const need=l=>40+(l-1)*25;
const save=()=>localStorage.setItem(KEY,JSON.stringify(p));
window.HoodsProgression={state:p,need,save};
window.HoodsCombat={install(scene,api){
  const mobs=[
    {kind:"rat",name:"Bog Rat",x:760,y:165,hp:40,attack:8,speed:62,coins:12,xp:12,drop:"Rat Tail",chance:.45,color:0x66523a},
    {kind:"slime",name:"Mire Slime",x:920,y:105,hp:60,attack:10,speed:44,coins:18,xp:18,drop:"Slime Core",chance:.35,color:0x5f8c4b},
    {kind:"thug",name:"Wild Thug",x:1085,y:185,hp:85,attack:13,speed:68,coins:28,xp:28,drop:"Rusted Badge",chance:.25,color:0x5d4937}
  ].map(m=>({...m,maxHp:m.hp,sx:m.x,sy:m.y,alive:true,attackAt:0,respawnAt:0,view:null}));
  let playerHp=api.stats().hp,attackAt=0;
  const msg=scene.add.text(480,52,"",{fontFamily:"monospace",fontSize:"12px",color:"#dfeeaa",backgroundColor:"#0a0c08dd",padding:{x:10,y:6}}).setScrollFactor(0).setOrigin(.5).setDepth(100).setVisible(false);
  const hp=scene.add.text(18,570,"",{fontFamily:"monospace",fontSize:"11px",color:"#f1d7c0",backgroundColor:"#0a0c08dd",padding:{x:8,y:5}}).setScrollFactor(0).setDepth(100);
  const prog=scene.add.text(942,570,"",{fontFamily:"monospace",fontSize:"11px",color:"#dfeeaa",backgroundColor:"#0a0c08dd",padding:{x:8,y:5}}).setScrollFactor(0).setOrigin(1,0).setDepth(100);
  const say=(t,ms=1200)=>{msg.setText(t).setVisible(true);scene.time.delayedCall(ms,()=>{if(msg.text===t)msg.setVisible(false)})};
  const refresh=()=>{hp.setText(`HP ${Math.ceil(playerHp)} / ${api.stats().hp}`);prog.setText(`LV ${p.level} · XP ${p.xp}/${need(p.level)} · KILLS ${p.kills}`);api.refreshHud()};
  const floater=(x,y,t,color="#fff")=>{const f=scene.add.text(x,y,t,{fontFamily:"monospace",fontSize:"12px",color,fontStyle:"bold",stroke:"#111",strokeThickness:3}).setOrigin(.5).setDepth(80);scene.tweens.add({targets:f,y:y-24,alpha:0,duration:650,onComplete:()=>f.destroy()})};
  const makeView=m=>{const c=scene.add.container(m.x,m.y);c.add(scene.add.rectangle(0,12,30,6,0x000000,.2));c.bodyShape=scene.add.rectangle(0,0,m.name==="Mire Slime"?32:26,m.name==="Mire Slime"?22:28,m.color).setStrokeStyle(2,0x29241d);c.add(c.bodyShape);c.barBg=scene.add.rectangle(0,-28,46,5,0x331c18);c.bar=scene.add.rectangle(-23,-28,46,5,0xc95f42).setOrigin(0,.5);c.add([c.barBg,c.bar]);c.add(scene.add.text(0,-39,m.name,{fontFamily:"monospace",fontSize:"10px",color:"#efe3bf",fontStyle:"bold"}).setOrigin(.5));m.view=c};mobs.forEach(makeView);
  const respawn=m=>{m.alive=true;m.hp=m.maxHp;m.x=m.sx;m.y=m.sy;m.view.setPosition(m.x,m.y).setAlpha(1).setVisible(true);m.bar.width=46};
  const reward=m=>{api.addCoins(m.coins);p.kills++;p.xp+=m.xp;let drop=null;const luck=Math.max(0,api.stats().luck-1)*.015;if(Math.random()<=Math.min(.75,m.chance+luck)){p.loot[m.drop]=(p.loot[m.drop]||0)+1;drop=m.drop}let leveled=false;while(p.xp>=need(p.level)){p.xp-=need(p.level);p.level++;playerHp=api.stats().hp;leveled=true}save();refresh();api.renderInventory();api.onMobDefeated?.(m,drop);say(`${m.name} defeated · +${m.coins} C · +${m.xp} XP${drop?` · ${drop}`:""}`,1800);if(leveled)scene.time.delayedCall(250,()=>say(`LEVEL UP · ${p.level}`,1800))};
  const attack=()=>{if(api.modalOpen()||scene.player.y>=260)return;const now=scene.time.now;if(now<attackAt)return;attackAt=now+430;const alive=mobs.filter(m=>m.alive).sort((a,b)=>Phaser.Math.Distance.Between(scene.player.x,scene.player.y,a.x,a.y)-Phaser.Math.Distance.Between(scene.player.x,scene.player.y,b.x,b.y));const m=alive[0];if(!m||Phaser.Math.Distance.Between(scene.player.x,scene.player.y,m.x,m.y)>88){say("No enemy in range",700);return}const dmg=Math.max(1,api.stats().attack+2+Phaser.Math.Between(0,2));m.hp=Math.max(0,m.hp-dmg);m.bar.width=46*(m.hp/m.maxHp);floater(m.x,m.y-52,`-${dmg}`,"#ffd8bd");scene.cameras.main.shake(45,.0015);scene.tweens.add({targets:m.view,alpha:.25,duration:55,yoyo:true});if(m.hp<=0){m.alive=false;m.view.setVisible(false);m.respawnAt=now+Phaser.Math.Between(5000,7500);reward(m)}else say(`${m.name} · -${dmg} HP`,650)};
  scene.input.keyboard.on("keydown-SPACE",e=>{e.preventDefault();attack()});scene.input.keyboard.on("keydown-F",attack);
  const update=dt=>{const now=scene.time.now;mobs.forEach(m=>{if(!m.alive){if(now>=m.respawnAt)respawn(m);return}if(scene.player.y>=260)return;const d=Phaser.Math.Distance.Between(scene.player.x,scene.player.y,m.x,m.y);if(d>38&&d<245){const a=Phaser.Math.Angle.Between(m.x,m.y,scene.player.x,scene.player.y);m.x+=Math.cos(a)*m.speed*dt;m.y+=Math.sin(a)*m.speed*dt;m.y=Phaser.Math.Clamp(m.y,55,244);m.view.setPosition(m.x,m.y)}if(d<=43&&now>=m.attackAt){m.attackAt=now+1050;const dmg=Math.max(1,m.attack-Math.floor(api.stats().defense/2));playerHp-=dmg;floater(scene.player.x,scene.player.y-48,`-${dmg}`,"#ff8f77");scene.cameras.main.shake(70,.003);say(`${m.name} hits · -${dmg} HP`,800);if(playerHp<=0){scene.player.setPosition(900,760);playerHp=api.stats().hp;mobs.forEach(respawn);say("Knocked out · returned to Town",1800)}}});playerHp=Math.min(playerHp,api.stats().hp);refresh()};
  refresh();return{update,attack,refresh,say,getHp:()=>playerHp,setHp:v=>{playerHp=v;refresh()}};
}};
})();