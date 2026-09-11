// Hoods v0.8.1 PURE migration scene — authored asset Town composition.
(() => {
class V08Scene extends Phaser.Scene{
  constructor(){super('V08Scene');this.touch={up:false,down:false,left:false,right:false};this.dir='down';this.phase=0}
  preload(){
    const a='assets/v08/';
    this.load.svg('grass',a+'tile-grass.svg');this.load.svg('cobble',a+'tile-cobble.svg');
    this.load.svg('tree',a+'prop-tree.svg');this.load.svg('fountain',a+'prop-fountain.svg');
    this.load.svg('bank',a+'building-bank.svg');this.load.svg('inn',a+'building-inn.svg');this.load.svg('shop',a+'building-shop.svg');
    ['down','up','left','right'].forEach(d=>this.load.svg('hood-'+d,a+'hood-'+d+'.svg'));
  }
  create(){
    const W=1280,H=960;this.physics.world.setBounds(0,0,W,H);this.cameras.main.setBounds(0,0,W,H);this.cameras.main.setBackgroundColor('#26351f');
    for(let y=0;y<H;y+=32)for(let x=0;x<W;x+=32)this.add.image(x+16,y+16,'grass').setDepth(0);
    const tile=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y+=32)for(let x=x0;x<x1;x+=32)this.add.image(x+16,y+16,'cobble').setDepth(.2)};
    // Compact town square: roads frame the plaza instead of filling the whole screen.
    tile(470,0,810,960);tile(0,360,1280,650);tile(320,240,960,780);
    // Buildings ring the square.
    this.add.image(250,325,'inn').setOrigin(.5,1).setDepth(32).setScale(1.08);
    this.add.image(640,250,'bank').setOrigin(.5,1).setDepth(30).setScale(1.08);
    this.add.image(1030,325,'shop').setOrigin(.5,1).setDepth(32).setScale(1.08);
    // Fountain anchors the town visually.
    this.add.image(640,545,'fountain').setDepth(56).setScale(1.08);
    // Dense greenery around edges and plaza corners.
    [[95,175],[1185,175],[105,790],[1175,790],[340,155],[940,155],[300,820],[980,820],[165,500],[1115,500],[430,745],[850,745]].forEach(([x,y])=>this.add.image(x,y,'tree').setOrigin(.5,.88).setDepth(y/10));
    // NPCs around the square.
    this.npc(255,380,'Sara',0x765445);this.npc(640,315,'Thorn',0x4f5d55);this.npc(1030,385,'Bram',0x6b4c39);this.npc(930,615,'Mara',0x594034,true);this.npc(390,485,'Guard',0x3d4f66);this.npc(830,425,'Trader',0x6d553b);
    // Player starts in lower middle so fountain + buildings remain visible.
    this.player=this.physics.add.sprite(640,665,'hood-down').setDepth(70).setScale(.98).setCollideWorldBounds(true);this.player.body.setSize(24,32).setOffset(12,24);
    this.name=this.add.text(640,617,'Hoods',{fontFamily:'Georgia,serif',fontSize:'13px',color:'#b9ef5a',fontStyle:'bold',stroke:'#162016',strokeThickness:3}).setOrigin(.5).setDepth(200);
    this.cameras.main.startFollow(this.player,true,.08,.08);this.setCameraZoom();this.cameras.main.setRoundPixels(true);
    this.scale.on('resize',()=>this.setCameraZoom());
    this.keys=this.input.keyboard.addKeys('W,A,S,D');this.cursors=this.input.keyboard.createCursorKeys();this.bindTouch();
    this.add.text(14,14,'HOODS TOWN',{fontFamily:'Georgia,serif',fontSize:'17px',color:'#f1d89e',fontStyle:'bold',stroke:'#111',strokeThickness:4}).setScrollFactor(0).setDepth(500);
    this.add.text(14,42,'v0.8.1 · ART MIGRATION',{fontFamily:'monospace',fontSize:'9px',color:'#b9ef5a',backgroundColor:'#11140dcc',padding:{x:6,y:4}}).setScrollFactor(0).setDepth(500);
  }
  setCameraZoom(){const w=this.scale.width;this.cameras.main.setZoom(w<500?.72:w<800?.82:1.02)}
  npc(x,y,label,color,quest=false){const c=this.add.container(x,y).setDepth(y/10+25);c.add(this.add.ellipse(0,18,24,7,0x111111,.27));c.add(this.add.rectangle(0,5,19,28,color).setStrokeStyle(2,0x2a241f));c.add(this.add.circle(0,-12,8,0xc18761).setStrokeStyle(2,0x2a241f));c.add(this.add.text(0,-35,label,{fontFamily:'Georgia,serif',fontSize:'11px',color:'#f0dfb8',fontStyle:'bold',stroke:'#181818',strokeThickness:3}).setOrigin(.5));if(quest)c.add(this.add.text(0,-55,'!',{fontFamily:'Georgia,serif',fontSize:'23px',color:'#ffd447',fontStyle:'bold',stroke:'#36250a',strokeThickness:3}).setOrigin(.5));return c}
  bindTouch(){document.querySelectorAll('[data-move]').forEach(btn=>{const d=btn.dataset.move,on=e=>{e.preventDefault();e.stopPropagation();this.touch[d]=true;btn.classList.add('active')},off=e=>{e.preventDefault();e.stopPropagation();this.touch[d]=false;btn.classList.remove('active')};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,off))});window.addEventListener('blur',()=>Object.keys(this.touch).forEach(k=>this.touch[k]=false))}
  update(_,delta){let dx=0,dy=0;if(this.cursors.left.isDown||this.keys.A.isDown||this.touch.left)dx--;if(this.cursors.right.isDown||this.keys.D.isDown||this.touch.right)dx++;if(this.cursors.up.isDown||this.keys.W.isDown||this.touch.up)dy--;if(this.cursors.down.isDown||this.keys.S.isDown||this.touch.down)dy++;if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;if(Math.abs(dx)>Math.abs(dy))this.dir=dx<0?'left':'right';else this.dir=dy<0?'up':'down'}const sp=170;this.player.setVelocity(dx*sp,dy*sp);this.player.setTexture('hood-'+this.dir);if(dx||dy){this.phase+=delta/1000*11;this.player.setScale(.98,.98+Math.sin(this.phase)*.02)}else this.player.setScale(.98);this.player.setDepth(this.player.y/10+35);this.name.setPosition(this.player.x,this.player.y-43).setDepth(this.player.depth+1)}
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#26351f',pixelArt:true,roundPixels:true,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:window.innerWidth,height:window.innerHeight},scene:V08Scene});
})();