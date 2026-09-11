// Hoods v0.8 PURE migration scene — no legacy Town rendering.
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
    this.physics.world.setBounds(0,0,1280,900);this.cameras.main.setBounds(0,0,1280,900);this.cameras.main.setBackgroundColor('#26351f');
    // authored tile world
    for(let y=0;y<900;y+=32)for(let x=0;x<1280;x+=32)this.add.image(x+16,y+16,'grass').setDepth(0);
    const tile=(x0,y0,x1,y1)=>{for(let y=y0;y<y1;y+=32)for(let x=x0;x<x1;x+=32)this.add.image(x+16,y+16,'cobble').setDepth(.2)};
    tile(430,0,850,900);tile(0,350,1280,650);tile(300,250,980,760);
    // buildings
    this.add.image(250,270,'inn').setOrigin(.5,1).setDepth(20);
    this.add.image(640,230,'bank').setOrigin(.5,1).setDepth(20);
    this.add.image(1030,350,'shop').setOrigin(.5,1).setDepth(20);
    // props
    [[120,180],[1120,160],[160,720],[1110,720],[340,150],[950,140],[320,760],[970,760]].forEach(([x,y])=>this.add.image(x,y,'tree').setOrigin(.5,.88).setDepth(y/10));
    this.add.image(640,545,'fountain').setDepth(58);
    // NPC placeholders with proper names
    this.npc(250,330,'Sara');this.npc(640,300,'Thorn');this.npc(1030,410,'Bram');this.npc(900,610,'Mara');this.npc(410,470,'Guard');
    // player
    this.player=this.physics.add.sprite(640,470,'hood-down').setDepth(60).setScale(1.15).setCollideWorldBounds(true);this.player.body.setSize(24,32).setOffset(12,24);
    this.name=this.add.text(640,425,'Hoods',{fontFamily:'Georgia,serif',fontSize:'13px',color:'#b9ef5a',fontStyle:'bold',stroke:'#162016',strokeThickness:3}).setOrigin(.5).setDepth(200);
    this.cameras.main.startFollow(this.player,true,.09,.09);this.cameras.main.setZoom(window.innerWidth<700?1.35:1.15);this.cameras.main.setRoundPixels(true);
    this.keys=this.input.keyboard.addKeys('W,A,S,D');this.cursors=this.input.keyboard.createCursorKeys();
    this.bindTouch();
    this.add.text(16,16,'HOODS v0.8 · PURE MIGRATION',{fontFamily:'monospace',fontSize:'12px',color:'#f1d89e',backgroundColor:'#11140dcc',padding:{x:8,y:6}}).setScrollFactor(0).setDepth(500);
    this.add.text(16,48,'NEW ASSET WORLD · LEGACY TOWN OFF',{fontFamily:'monospace',fontSize:'10px',color:'#b9ef5a',backgroundColor:'#11140dcc',padding:{x:8,y:5}}).setScrollFactor(0).setDepth(500);
  }
  npc(x,y,label){const c=this.add.container(x,y).setDepth(y/10);c.add(this.add.ellipse(0,18,22,7,0x111111,.25));c.add(this.add.rectangle(0,4,18,28,0x4e4238).setStrokeStyle(2,0x2a241f));c.add(this.add.circle(0,-12,8,0xc18761).setStrokeStyle(2,0x2a241f));c.add(this.add.text(0,-34,label,{fontFamily:'monospace',fontSize:'10px',color:'#f0dfb8',fontStyle:'bold',stroke:'#181818',strokeThickness:3}).setOrigin(.5));return c}
  bindTouch(){document.querySelectorAll('[data-move]').forEach(btn=>{const d=btn.dataset.move,on=e=>{e.preventDefault();this.touch[d]=true;btn.classList.add('active')},off=e=>{e.preventDefault();this.touch[d]=false;btn.classList.remove('active')};btn.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,off))})}
  update(_,delta){let dx=0,dy=0;if(this.cursors.left.isDown||this.keys.A.isDown||this.touch.left)dx--;if(this.cursors.right.isDown||this.keys.D.isDown||this.touch.right)dx++;if(this.cursors.up.isDown||this.keys.W.isDown||this.touch.up)dy--;if(this.cursors.down.isDown||this.keys.S.isDown||this.touch.down)dy++;if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;if(Math.abs(dx)>Math.abs(dy))this.dir=dx<0?'left':'right';else this.dir=dy<0?'up':'down'}const sp=165;this.player.setVelocity(dx*sp,dy*sp);this.player.setTexture('hood-'+this.dir);if(dx||dy){this.phase+=delta/1000*11;this.player.setScale(1.15,1.15+Math.sin(this.phase)*.025)}else this.player.setScale(1.15);this.player.setDepth(this.player.y/10+30);this.name.setPosition(this.player.x,this.player.y-45).setDepth(this.player.depth+1)}
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#26351f',pixelArt:true,roundPixels:true,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:window.innerWidth,height:window.innerHeight},scene:V08Scene});
})();