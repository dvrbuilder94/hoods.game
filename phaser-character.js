// Hoods Character System v0.7 — layered 4-direction pixel-style avatar.
(() => {
const DIR={down:0,left:1,right:2,up:3};
function install(scene,player,getGear){
  if(!scene||!player)return null;
  let dir='down',moving=false,t=0,attacking=false,attackUntil=0;
  const root=scene.add.container(0,0); player.add(root);
  const shadow=scene.add.ellipse(0,19,30,10,0x11150f,.32);root.add(shadow);
  const body=scene.add.container(0,0);root.add(body);
  const label=scene.add.text(0,-51,'Hood',{fontFamily:'monospace',fontSize:'11px',color:'#e9f4c5',fontStyle:'bold',stroke:'#10140d',strokeThickness:3}).setOrigin(.5);root.add(label);
  const rect=(x,y,w,h,c,stroke=0x251c18)=>scene.add.rectangle(x,y,w,h,c).setStrokeStyle(1,stroke);
  function draw(){
    body.removeAll(true);const gear=getGear?.()||{};const side=dir==='left'?-1:dir==='right'?1:0,back=dir==='up';
    const bob=moving?Math.round(Math.sin(t*12)*1.5):0,step=moving?Math.sin(t*12):0;
    // legs + boots, asymmetrical walking silhouette
    body.add(rect(-6,12+bob+step*2,9,15,0x5d4c3b));body.add(rect(6,12+bob-step*2,9,15,0x5d4c3b));
    body.add(rect(-7,20+bob+step*2,11,6,gear.boots?0x2b2925:0x46372c));body.add(rect(7,20+bob-step*2,11,6,gear.boots?0x2b2925:0x46372c));
    // torso / arms
    const torso=gear.armor?0x70523b:0xb97955;body.add(rect(0,-2+bob,23,24,torso));
    body.add(rect(-15,-1+bob,7,19,gear.armor?0x6a4b36:0xc88b65));body.add(rect(15,-1+bob,7,19,gear.armor?0x6a4b36:0xc88b65));
    if(gear.armor){body.add(rect(0,-8+bob,19,5,0x9a7651));body.add(rect(0,5+bob,21,4,0x3c3028))}
    // head has hair/face shading to avoid flat rectangle feel
    body.add(rect(side*2,-25+bob,18,18,0xc98b65));
    if(back){body.add(rect(0,-29+bob,20,12,0x3b2b24));body.add(rect(0,-21+bob,18,5,0x4c3429))}
    else{body.add(rect(side*2,-31+bob,20,9,0x3b2b24));body.add(rect(side*7,-27+bob,6,9,0x4c3429));body.add(rect(side*4,-23+bob,3,3,0x2a211d))}
    if(gear.helmet){body.add(rect(side*1,-31+bob,23,13,0x929b9d,0x343a3c));body.add(rect(side*7,-27+bob,8,5,0xc1c8c8,0x343a3c))}
    // shield behind weapon side
    if(gear.shield){const sx=side===0?-17:-side*18;body.add(rect(sx,1+bob,13,20,0x7c5734,0x35251b));body.add(rect(sx,1+bob,5,13,0xa67a48,0x35251b))}
    if(gear.weapon){const wx=side===0?18:side*19,ang=attacking?(side===0?-55:side*55):(side===0?8:side*10);const weapon=scene.add.container(wx,-1+bob);const grip=rect(0,7,4,18,0x6b492d);const blade=rect(0,-7,7,18,0xbec7c9,0x485052);weapon.add([grip,blade]);weapon.setAngle(ang);body.add(weapon)}
    if(attacking){const arc=scene.add.arc(side?side*24:0,side?0:18,19,210,330,false,0xe7d28c,.32).setStrokeStyle(2,0xf2df9a,.7);body.add(arc)}
  }
  draw();
  return{
    update(dt,dx,dy){t+=dt;moving=!!(dx||dy);if(Math.abs(dx)>Math.abs(dy))dir=dx<0?'left':'right';else if(dy)dir=dy<0?'up':'down';if(attacking&&scene.time.now>=attackUntil)attacking=false;draw()},
    attack(){attacking=true;attackUntil=scene.time.now+180;draw()},
    rebuild:draw,
    direction:()=>dir
  };
}
window.HoodsCharacter={install};
})();