// Hoods V2.4 — Tibia-like building reveal + playable z-level proof.
// Reads vertical/reveal data from the Town JSON and extends the existing HoodsV2 scene.
(() => {
  const CONFIG_URL='maps/town-v2/town-square.json?v=v24';
  const TEX='hoods-classic-v1';
  const TILE={grass:0,cobble:2,plaza:3,wood:4,wall:5,barrel:11,table:12,chair:13,rug:14,crate:18};
  const MAX_TRIES=140;
  let tries=0;

  function getScene(){
    const games=(window.Phaser&&Phaser.GAMES)||[];
    for(const game of games){
      const scene=game?.scene?.getScene?.('HoodsV2');
      if(scene?.sys?.isActive?.()&&scene.player&&scene.dataMap&&scene.roofZones) return scene;
    }
    return null;
  }

  const tileCenter=(scene,p)=>({x:(p[0]+.5)*scene.tileSize,y:(p[1]+.5)*scene.tileSize});
  const insideRect=(px,py,rect,pad=0)=>{
    const [x,y,w,h]=rect;
    return px>x-pad&&px<x+w+pad&&py>y-pad&&py<y+h+pad;
  };

  function mergeConfig(scene,config){
    const byId=new Map((config.buildings||[]).map(b=>[b.id,b]));
    (scene.dataMap.buildings||[]).forEach(b=>{
      const fresh=byId.get(b.id);if(!fresh)return;
      if(fresh.frontSide) b.frontSide=fresh.frontSide;
      if(Number.isFinite(fresh.revealMargin)) b.revealMargin=fresh.revealMargin;
    });
    scene.__v24Config=config;
  }

  function installReveal(scene){
    if(scene.__v24RevealInstalled)return;scene.__v24RevealInstalled=true;
    scene.updateBuildingState=function(){
      if((this.currentZ??0)!==0) return;
      const ts=this.tileSize;let active=null;
      this.roofZones.forEach(r=>{
        const [x,y,w,h]=r.b.rect;
        const tx=this.player.x/ts,ty=this.player.y/ts;
        const inside=insideRect(tx,ty,r.b.rect,-.35);
        const margin=Number.isFinite(r.b.revealMargin)?r.b.revealMargin:2.25;
        let near=insideRect(tx,ty,r.b.rect,margin);
        // The facade side gets one extra tile of reveal reach, but proximity on every side
        // still works so a player standing beside a house can see the interior like Tibia.
        if(!near&&r.b.frontSide==='south') near=tx>x-1&&tx<x+w+1&&ty>y+h-.2&&ty<y+h+margin+1;
        if(!near&&r.b.frontSide==='north') near=tx>x-1&&tx<x+w+1&&ty<y+.2&&ty>y-margin-1;
        if(!near&&r.b.frontSide==='east') near=ty>y-1&&ty<y+h+1&&tx>x+w-.2&&tx<x+w+margin+1;
        if(!near&&r.b.frontSide==='west') near=ty>y-1&&ty<y+h+1&&tx<x+.2&&tx>x-margin-1;
        const revealed=inside||near;
        if(inside)active=r;
        if(revealed!==r.__v24Revealed||inside!==r.inside){
          r.__v24Revealed=revealed;r.inside=inside;
          this.tweens.killTweensOf(r.roof);this.tweens.killTweensOf(r.label);
          this.tweens.add({targets:r.roof,alpha:revealed?(inside?.035:.085):.97,duration:150,ease:'Sine.easeOut'});
          this.tweens.add({targets:r.label,alpha:revealed?0:.75,duration:110});
        }
      });
      if(active!==this.activeBuilding){
        this.activeBuilding=active;
        this.setLocation(active?(active.b.label||active.b.id.toUpperCase()):'TOWN SQUARE');
      }
    };
  }

  function makeStair(scene,p,kind,depth=18){
    const {x,y}=tileCenter(scene,p),ts=scene.tileSize;
    const c=scene.add.container(x,y).setDepth(depth);
    const base=scene.add.rectangle(0,0,ts*.72,ts*.64,kind==='down'?0x40382f:0x736548,.96).setStrokeStyle(2,0x211d19,.9);
    c.add(base);
    for(let i=-2;i<=2;i++) c.add(scene.add.rectangle(0,i*4,ts*.52,2,kind==='down'?0xb79a6c:0xe0c88a,.88));
    c.add(scene.add.text(0,0,kind==='down'?'▼':'▲',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#f1dfaa',stroke:'#17130f',strokeThickness:2}).setOrigin(.5));
    return c;
  }

  function createSurfaceStairs(scene,config){
    const markers=[];
    (config.vertical?.transitions||[]).filter(t=>t.fromZ===0).forEach(t=>{
      const kind=t.toZ<0?'down':'up';
      const marker=makeStair(scene,t.from,kind,19.2);
      marker.__transitionId=t.id;markers.push(marker);
    });
    scene.__v24SurfaceStairs=markers;
  }

  function addLevelCollision(scene,rect){
    const ts=scene.tileSize,[x,y,w,h]=rect;
    const group=scene.physics.add.staticGroup();
    const addTile=(tx,ty)=>{
      const z=scene.add.zone((tx+.5)*ts,(ty+.5)*ts,ts,ts);scene.physics.add.existing(z,true);group.add(z);
    };
    for(let xx=x;xx<x+w;xx++){addTile(xx,y);addTile(xx,y+h-1)}
    for(let yy=y+1;yy<y+h-1;yy++){addTile(x,yy);addTile(x+w-1,yy)}
    scene.__v24LevelSolids=group;
    scene.__v24LevelCollider=scene.physics.add.collider(scene.player,group);
  }

  function clearLevel(scene){
    scene.__v24LevelCollider?.destroy?.();scene.__v24LevelCollider=null;
    if(scene.__v24LevelSolids){scene.__v24LevelSolids.clear(true,true);scene.__v24LevelSolids.destroy(true);scene.__v24LevelSolids=null}
    (scene.__v24LevelObjects||[]).forEach(o=>o?.destroy?.());scene.__v24LevelObjects=[];
  }

  function frameFor(kind){const gid=TILE[kind];return Number.isFinite(gid)?`tile_${gid}`:'tile_2'}

  function drawLevel(scene,level,config){
    clearLevel(scene);
    const ts=scene.tileSize,[x,y,w,h]=level.rect,objects=[];
    // Opaque plane hides the surface world while underground/upstairs, exactly one z-level at a time.
    objects.push(scene.add.rectangle(scene.worldW/2,scene.worldH/2,scene.worldW+96,scene.worldH+96,level.z<0?0x151714:0x25241e,1).setDepth(160));
    objects.push(scene.add.rectangle((x+w/2)*ts,(y+h/2)*ts,(w+1)*ts,(h+1)*ts,0x050605,.82).setDepth(164));
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
      const edge=xx===x||xx===x+w-1||yy===y||yy===y+h-1;
      const kind=edge?(level.wall||'wall'):(level.floor||'cobble');
      objects.push(scene.add.image((xx+.5)*ts,(yy+.5)*ts,TEX,frameFor(kind)).setDepth(edge?181:170));
    }
    (level.props||[]).forEach(([kind,px,py])=>{
      objects.push(scene.add.image((px+.5)*ts,(py+1)*ts,TEX,frameFor(kind)).setOrigin(.5,1).setDepth(190+(py*ts)/1000));
    });
    (config.vertical?.transitions||[]).filter(t=>t.fromZ===level.z).forEach(t=>objects.push(makeStair(scene,t.from,t.toZ<level.z?'down':'up',196)));
    const ambient=Number.isFinite(level.ambient)?level.ambient:(level.z<0?.2:.06);
    if(ambient>0)objects.push(scene.add.rectangle((x+w/2)*ts,(y+h/2)*ts,(w-2)*ts,(h-2)*ts,level.z<0?0x1a2519:0xf3d991,ambient).setDepth(185));
    objects.push(scene.add.text((x+w/2)*ts,(y+.42)*ts,`${level.label}  Z${level.z>0?'+':''}${level.z}`,{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#e9dfbf',stroke:'#11140f',strokeThickness:3}).setOrigin(.5).setDepth(199));
    scene.__v24LevelObjects=objects;
    addLevelCollision(scene,level.rect);
  }

  function surfaceUi(scene,visible){
    (scene.__v24SurfaceStairs||[]).forEach(o=>o.setVisible(visible));
    if(!visible){
      const prompt=document.getElementById('v23Prompt');if(prompt)prompt.hidden=true;
      const action=document.getElementById('v23Interact');if(action)action.disabled=true;
      const dialogue=document.getElementById('v23Dialogue');if(dialogue)dialogue.hidden=true;
    }
  }

  function setZ(scene,z,target,config){
    const ts=scene.tileSize;
    scene.stopTouch?.();scene.currentZ=z;scene.__v24TransitionLock=performance.now()+720;
    if(z===0){
      clearLevel(scene);surfaceUi(scene,true);
      scene.player.setDepth(20+scene.player.y/1000);
      scene.setLocation?.('TOWN SQUARE');
    }else{
      const level=(config.vertical?.levels||[]).find(l=>l.z===z);
      if(!level)return;
      drawLevel(scene,level,config);surfaceUi(scene,false);
      scene.setLocation?.(`${level.label} · Z${z>0?'+':''}${z}`);
    }
    const p=tileCenter(scene,target);scene.player.setPosition(p.x,p.y).setVelocity(0,0);
    scene.playerShadow?.setPosition(p.x,p.y+10);scene.playerName?.setPosition(p.x,p.y-31);
  }

  function installVertical(scene,config){
    if(scene.__v24VerticalInstalled)return;scene.__v24VerticalInstalled=true;
    scene.currentZ=0;scene.__v24TransitionLock=0;scene.__v24LevelObjects=[];
    createSurfaceStairs(scene,config);
    scene.events.on(Phaser.Scenes.Events.UPDATE,()=>{
      const z=scene.currentZ??0,now=performance.now();
      if(z!==0){
        // Core scene recalculates world depths every frame; put the active-floor actor back above the occlusion plane.
        scene.player.setDepth(220+scene.player.y/1000);
        scene.playerShadow?.setDepth(218+scene.player.y/1000);
        scene.playerName?.setDepth(222+scene.player.y/1000);
        surfaceUi(scene,false);
      }
      if(now<scene.__v24TransitionLock)return;
      const transitions=(config.vertical?.transitions||[]).filter(t=>t.fromZ===z);
      for(const t of transitions){
        const p=tileCenter(scene,t.from);
        if(Phaser.Math.Distance.Between(scene.player.x,scene.player.y,p.x,p.y)<=13){
          setZ(scene,t.toZ,t.to,config);break;
        }
      }
    });
  }

  async function mount(scene){
    if(scene.__v24Mounted)return;scene.__v24Mounted=true;
    let config=scene.dataMap;
    try{
      const res=await fetch(CONFIG_URL,{cache:'no-store'});if(res.ok)config=await res.json();
    }catch(err){console.warn('[Hoods V2.4] fresh floor config unavailable, using loaded map',err)}
    mergeConfig(scene,config);installReveal(scene);installVertical(scene,config);
    const title=document.querySelector('.v2-hud b');if(title)title.textContent='HOODS V2.4';
    document.title='Hoods V2.4';
  }

  function boot(){
    const scene=getScene();if(scene){mount(scene);return}
    if(++tries<MAX_TRIES)setTimeout(boot,100);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else boot();
})();
