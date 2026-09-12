(function bridgeHoodsRPG(root){
  "use strict";

  if(!root.HoodsRPG) throw new Error("HoodsRPG core must load before rpg-bridge.js");

  // Keep the current pre-alpha APIs working while moving ownership of item rules
  // and persistence into a reusable RPG layer.
  items.splice(0,items.length,...root.HoodsRPG.catalog);
  const nativePush=items.push.bind(items);
  items.push=(...newItems)=>{
    newItems.forEach(item=>root.HoodsRPG.registerItem(item));
    return nativePush(...newItems);
  };

  state.equipped={...root.HoodsRPG.createEquipment(),...state.equipped};
  state.inventory=state.inventory&&typeof state.inventory==="object"?state.inventory:{};

  getStats=function(){
    return root.HoodsRPG.calculateStats(state.equipped,BASE_STATS);
  };

  saveGame=function(){
    return root.HoodsRPG.store.save({
      coins:state.coins,
      owned:state.owned,
      inventory:state.inventory,
      equipped:state.equipped,
      player:state.player
    });
  };

  function applyStoredState(){
    const saved=root.HoodsRPG.store.load();
    if(!saved) return false;
    if(Number.isFinite(saved.coins)) state.coins=Math.max(0,saved.coins);
    state.owned=new Set(saved.owned||[]);
    state.inventory=saved.inventory&&typeof saved.inventory==="object"?{...saved.inventory}:{};
    state.equipped={...root.HoodsRPG.createEquipment(),...saved.equipped};
    if(saved.player && typeof saved.player==="object") Object.assign(state.player,saved.player);
    return true;
  }

  loadGame=function(){
    const loaded=applyStoredState();
    if(loaded){ updateUI();renderInventory();renderShop(); }
    return loaded;
  };

  // The original game loads before this bridge, so apply v1/migrated state once now.
  applyStoredState();

  const inventoryApi={
    slots:root.HoodsRPG.EQUIPMENT_SLOTS,
    getItem:id=>root.HoodsRPG.itemById(id),
    list(){
      return [...state.owned].map(id=>root.HoodsRPG.itemById(id)).filter(Boolean);
    },
    has(id){ return state.owned.has(id); },
    grant(id,quantity=1){
      const item=root.HoodsRPG.itemById(id);
      if(!item) return false;
      const qty=Math.max(1,Math.floor(Number(quantity)||1));
      state.inventory[id]=(state.inventory[id]||0)+qty;
      state.owned.add(id);
      saveGame();updateUI();renderInventory();renderShop();
      return true;
    },
    remove(id,quantity=1){
      if(!state.owned.has(id)) return false;
      const current=Math.max(1,state.inventory[id]||1);
      const next=Math.max(0,current-Math.max(1,Math.floor(Number(quantity)||1)));
      if(next===0){
        delete state.inventory[id];
        state.owned.delete(id);
        Object.keys(state.equipped).forEach(slot=>{if(state.equipped[slot]===id)state.equipped[slot]=null;});
      }else state.inventory[id]=next;
      saveGame();updateUI();renderInventory();renderShop();
      return true;
    },
    equip(id){
      const item=root.HoodsRPG.itemById(id);
      if(!item?.slot || !state.owned.has(id)) return false;
      state.equipped[item.slot]=id;
      saveGame();updateUI();renderInventory();renderShop();
      return true;
    },
    unequip(slot){
      if(!root.HoodsRPG.EQUIPMENT_SLOTS.includes(slot)) return false;
      state.equipped[slot]=null;
      saveGame();updateUI();renderInventory();renderShop();
      return true;
    },
    snapshot(){
      return root.HoodsRPG.serializeRuntime({coins:state.coins,owned:state.owned,inventory:state.inventory,equipped:state.equipped,player:state.player});
    }
  };

  root.hoodsInventory=Object.freeze(inventoryApi);
  updateUI();renderInventory();renderShop();
})(window);
