// Hoods V2.3 interaction/facade layer.
// Kept separate from the character-animation work so the two branches can merge cleanly.
(() => {
  const MAX_TRIES = 120;
  let tries = 0;

  const css = `
    #v23Prompt{position:fixed;z-index:28;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);padding:7px 10px;border:1px solid #66745c;border-radius:7px;background:#090c08dc;color:#efe9d4;font:900 9px monospace;letter-spacing:.04em;box-shadow:0 4px 18px #0008;pointer-events:none;transition:opacity .12s ease,transform .12s ease;white-space:nowrap}
    #v23Prompt[hidden]{display:none}.v23-key{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 4px;margin-right:5px;border:1px solid #8da07c;border-radius:4px;background:#1a2416;color:#b9ef5a}
    #v23Dialogue{position:fixed;z-index:45;left:50%;bottom:max(20px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(92vw,460px);padding:13px;background:#0b100af2;border:1px solid #65725c;border-radius:10px;box-shadow:0 12px 34px #000a;backdrop-filter:blur(8px);touch-action:pan-y}
    #v23Dialogue[hidden]{display:none}.v23-dialogue-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #30382c}.v23-dialogue-head small{display:block;color:#b9ef5a;font:900 8px monospace;letter-spacing:.12em}.v23-dialogue-head strong{font-size:15px}.v23-dialogue-head button{width:30px;height:30px;border:1px solid #56614e;background:#11170e;color:#eee9d3;font-size:18px}.v23-dialogue-body{color:#d7d2be;font-size:13px;line-height:1.48}
    .v23-interact{background:#5d7440e8!important;border-color:#b9ef5a!important;color:#10140d!important}.v23-interact[disabled]{opacity:.3;filter:saturate(.3)}
    @media(max-width:899px){#v23Prompt{bottom:calc(78px + env(safe-area-inset-bottom));font-size:8px}.v2-actions .v23-interact{display:block}#v23Dialogue{bottom:calc(88px + env(safe-area-inset-bottom))}}
    @media(min-width:900px){.v2-actions .v23-interact{display:none}#v23Prompt{bottom:18px}}
  `;

  function injectStyle(){
    if(document.getElementById('v23InteractionStyle')) return;
    const style=document.createElement('style');style.id='v23InteractionStyle';style.textContent=css;document.head.appendChild(style);
  }

  function injectUi(){
    injectStyle();
    if(!document.getElementById('v23Prompt')){
      const prompt=document.createElement('div');prompt.id='v23Prompt';prompt.hidden=true;document.body.appendChild(prompt);
    }
    if(!document.getElementById('v23Dialogue')){
      const dialogue=document.createElement('section');dialogue.id='v23Dialogue';dialogue.hidden=true;
      dialogue.innerHTML='<div class="v23-dialogue-head"><div><small>WORLD DIALOGUE</small><strong id="v23Speaker">Mara</strong></div><button id="v23DialogueClose" aria-label="Close">×</button></div><div id="v23DialogueBody" class="v23-dialogue-body"></div>';
      document.body.appendChild(dialogue);
      document.getElementById('v23DialogueClose').addEventListener('click',()=>{dialogue.hidden=true});
    }
    const actions=document.querySelector('.v2-actions');
    if(actions&&!document.getElementById('v23Interact')){
      const button=document.createElement('button');button.id='v23Interact';button.className='v23-interact';button.textContent='E';button.disabled=true;button.setAttribute('aria-label','Interact');
      actions.prepend(button);
    }
  }

  function getScene(){
    const games=(window.Phaser&&Phaser.GAMES)||[];
    for(const game of games){
      if(!game||!game.scene) continue;
      const scene=game.scene.getScene('HoodsV2');
      if(scene&&scene.sys&&scene.sys.isActive()&&scene.player&&scene.dataMap) return scene;
    }
    return null;
  }

  function decorateBuildings(scene){
    if(scene.__v23Decorated) return;scene.__v23Decorated=true;
    const ts=scene.tileSize;
    const labels={inn:'INN',bank:'BANK',shop:'GEAR'};
    const plate={inn:0x714838,bank:0x4b5556,shop:0x795037};
    (scene.dataMap.buildings||[]).forEach(b=>{
      const [x,y,w,h]=b.rect,[dx,dy]=b.door;
      // Warm interior wash becomes visible only when the roof fades.
      scene.add.rectangle((x+w/2)*ts,(y+h/2)*ts,Math.max(ts,w*ts-10),Math.max(ts,h*ts-10),0xd6a665,.055).setDepth(3);
      // A front eave, plaque and lamps keep the building readable even while the roof is opaque.
      scene.add.rectangle((dx+.5)*ts,(dy+.18)*ts,ts*1.28,5,0x241b16,.78).setDepth(31);
      scene.add.rectangle((dx+.5)*ts,(dy+.12)*ts,ts*.92,10,plate[b.id]||0x665044,.96).setDepth(31.01);
      scene.add.text((dx+.5)*ts,(dy+.12)*ts,labels[b.id]||String(b.label||b.id).toUpperCase(),{fontFamily:'monospace',fontSize:'6px',fontStyle:'bold',color:'#f3e4b4',stroke:'#1b1713',strokeThickness:2}).setOrigin(.5).setDepth(31.1);
      [-.56,.56].forEach(offset=>{
        scene.add.circle((dx+.5+offset)*ts,(dy+.42)*ts,3.2,0xf1c765,.9).setDepth(31.1);
        scene.add.circle((dx+.5+offset)*ts,(dy+.42)*ts,6.6,0xf1c765,.08).setDepth(31.05);
      });
    });
  }

  function mount(scene){
    if(scene.__v23InteractionsMounted) return;scene.__v23InteractionsMounted=true;
    injectUi();decorateBuildings(scene);
    const prompt=document.getElementById('v23Prompt');
    const action=document.getElementById('v23Interact');
    const dialogue=document.getElementById('v23Dialogue');
    let current=null;

    const setMovementEnabled=enabled=>{
      const keys=[scene.keys?.W,scene.keys?.A,scene.keys?.S,scene.keys?.D,scene.cursors?.left,scene.cursors?.right,scene.cursors?.up,scene.cursors?.down].filter(Boolean);
      keys.forEach(key=>{if(!enabled)key.reset?.();key.enabled=enabled});
      if(!enabled){scene.stopTouch?.();scene.player?.setVelocity(0)}
    };

    const setPrompt=(html,interactive=false)=>{
      if(!html){prompt.hidden=true;action.disabled=true;return}
      prompt.innerHTML=html;prompt.hidden=false;action.disabled=!interactive;
    };

    const nearestNpc=()=>{
      let best=null,bestDist=Infinity;
      (scene.npcs||[]).forEach((npc,i)=>{
        const dist=Phaser.Math.Distance.Between(scene.player.x,scene.player.y,npc.sprite.x,npc.sprite.y);
        if(dist<bestDist){bestDist=dist;best={npc,data:(scene.dataMap.npcs||[])[i],dist}}
      });
      return bestDist<=62?best:null;
    };

    const refreshTarget=()=>{
      if(!dialogue.hidden){current=null;setPrompt('',false);return}
      const hit=nearestNpc();
      if(hit&&hit.data){
        if(hit.data.name==='Old Bram'){
          current={type:'gear',name:'Old Bram'};
          setPrompt('<span class="v23-key">E</span> OLD BRAM · OPEN GEAR',true);return;
        }
        if(hit.data.name==='Mara'){
          current={type:'talk',name:'Mara'};
          setPrompt('<span class="v23-key">E</span> MARA · TALK',true);return;
        }
      }
      current=null;
      const building=scene.activeBuilding&&scene.activeBuilding.b;
      if(building){
        if(building.id==='shop') setPrompt('OLD BRAM\'S GEAR · FIND BRAM INSIDE');
        else if(building.id==='inn') setPrompt('THE INN · ROOMS SOON');
        else if(building.id==='bank') setPrompt('BANK · VAULT SOON');
        else setPrompt(String(building.label||building.id).toUpperCase());
      }else setPrompt('',false);
    };

    const openDialogue=(speaker,body)=>{
      setMovementEnabled(false);
      document.getElementById('v23Speaker').textContent=speaker;
      document.getElementById('v23DialogueBody').textContent=body;
      dialogue.hidden=false;refreshTarget();
    };

    const closeDialogue=()=>{
      dialogue.hidden=true;
      setMovementEnabled(true);
      refreshTarget();
    };

    const interact=()=>{
      if(!dialogue.hidden){closeDialogue();return}
      if(!current) return;
      if(current.type==='gear'){
        scene.stopTouch?.();
        const bag=document.getElementById('v2Bag');
        if(bag){bag.hidden=false;scene.renderBag?.()}
      }else if(current.type==='talk'){
        openDialogue('Mara','The east road has been too quiet. Gear up with Old Bram before you leave town. Soon I will have work for anyone willing to cross the gate.');
      }
    };

    document.getElementById('v23DialogueClose')?.addEventListener('click',()=>setMovementEnabled(true));
    action?.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();interact()});
    scene.input.keyboard?.on('keydown-E',interact);
    scene.events.on(Phaser.Scenes.Events.UPDATE,refreshTarget);
    refreshTarget();
  }

  function boot(){
    const scene=getScene();
    if(scene){mount(scene);return}
    if(++tries<MAX_TRIES) setTimeout(boot,100);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));
  else boot();
})();
