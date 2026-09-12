(function initHoodsRPG(root){
  "use strict";

  const VERSION = 1;
  const SAVE_KEY = "hoods-player-v1";
  const LEGACY_SAVE_KEY = "hoods-town-v02";
  // Tibia-style rule: equipment owns gameplay stats. Outfits are full-body skins
  // managed by HoodsOutfits and never occupy an equipment slot.
  const EQUIPMENT_SLOTS = Object.freeze(["helmet","armor","weapon","shield","legs","boots"]);
  const RARITIES = Object.freeze(["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY"]);
  const BASE_STATS = Object.freeze({ hp:100, attack:5, defense:3, speed:5, luck:1 });

  const catalog = [
    {id:"iron-sword",name:"Iron Sword",slot:"weapon",category:"gear",price:35,rarity:"UNCOMMON",stats:{attack:5}},
    {id:"iron-helmet",name:"Iron Helmet",slot:"helmet",category:"gear",price:25,rarity:"UNCOMMON",stats:{defense:2}},
    {id:"leather-armor",name:"Leather Armor",slot:"armor",category:"gear",price:30,rarity:"COMMON",stats:{hp:10,defense:3}},
    {id:"wooden-shield",name:"Wooden Shield",slot:"shield",category:"gear",price:20,rarity:"COMMON",stats:{defense:2}},
    {id:"ranger-boots",name:"Ranger Boots",slot:"boots",category:"gear",price:18,rarity:"RARE",stats:{speed:2,luck:1}},
    {id:"reinforced-leather",name:"Reinforced Leather Armor",slot:"armor",category:"gear",price:0,shop:false,rarity:"UNCOMMON",stats:{hp:18,defense:5}},
    {id:"warden-blade",name:"Warden Blade",slot:"weapon",category:"gear",price:0,shop:false,rarity:"RARE",stats:{attack:9,luck:1}}
  ];

  function itemById(id){ return catalog.find(item=>item.id===id) || null; }

  function registerItem(item){
    if(!item || typeof item.id!=="string" || !item.id.trim()) throw new Error("HoodsRPG item requires an id");
    if(typeof item.name!=="string" || !item.name.trim()) throw new Error(`HoodsRPG item ${item.id} requires a name`);
    if(item.slot!=null && !EQUIPMENT_SLOTS.includes(item.slot)) throw new Error(`Unsupported equipment slot: ${item.slot}`);
    if(item.rarity!=null && !RARITIES.includes(item.rarity)) throw new Error(`Unsupported rarity: ${item.rarity}`);
    if(itemById(item.id)) return itemById(item.id);
    const normalized={category:"gear",price:0,rarity:"COMMON",stats:{},...item};
    catalog.push(normalized);
    return normalized;
  }

  function createEquipment(seed){
    const equipment=Object.fromEntries(EQUIPMENT_SLOTS.map(slot=>[slot,null]));
    if(seed && typeof seed==="object") {
      EQUIPMENT_SLOTS.forEach(slot=>{ if(typeof seed[slot]==="string") equipment[slot]=seed[slot]; });
    }
    return equipment;
  }

  function normalizeOwned(raw){
    if(raw instanceof Set) return new Set([...raw].filter(id=>typeof id==="string"));
    if(Array.isArray(raw)) return new Set(raw.filter(id=>typeof id==="string"));
    if(raw && typeof raw==="object") return new Set(Object.entries(raw).filter(([,qty])=>Number(qty)>0).map(([id])=>id));
    return new Set();
  }

  function sanitizeEquipment(raw, owned){
    const ownedSet=normalizeOwned(owned);
    const equipment=createEquipment();
    if(!raw || typeof raw!=="object") return equipment;
    EQUIPMENT_SLOTS.forEach(slot=>{
      const id=raw[slot];
      const item=itemById(id);
      if(item && item.slot===slot && ownedSet.has(id)) equipment[slot]=id;
    });
    return equipment;
  }

  function calculateStats(equipment, baseStats=BASE_STATS){
    const total={...baseStats};
    Object.values(equipment||{}).forEach(id=>{
      const item=itemById(id);
      if(!item) return;
      Object.entries(item.stats||{}).forEach(([key,value])=>{
        if(Number.isFinite(value)) total[key]=(total[key]||0)+value;
      });
    });
    return total;
  }

  function sanitizePlayer(raw){
    const source=raw && typeof raw==="object"?raw:{};
    const player={};
    if(Number.isFinite(source.x)) player.x=Math.max(0,source.x);
    if(Number.isFinite(source.y)) player.y=Math.max(0,source.y);
    if(["up","down","left","right"].includes(source.dir)) player.dir=source.dir;
    if(Number.isFinite(source.hp)) player.hp=Math.max(0,source.hp);
    return player;
  }

  function serializeRuntime(runtime){
    const owned=normalizeOwned(runtime?.owned);
    const inventory={};
    owned.forEach(id=>{ inventory[id]=1; });
    if(runtime?.inventory && typeof runtime.inventory==="object") {
      Object.entries(runtime.inventory).forEach(([id,qty])=>{
        const amount=Math.max(0,Math.floor(Number(qty)||0));
        if(amount>0) inventory[id]=amount;
      });
    }
    return {
      version:VERSION,
      currencies:{coins:Math.max(0,Math.floor(Number(runtime?.coins)||0))},
      inventory,
      equipment:{...createEquipment(),...sanitizeEquipment(runtime?.equipped,owned)},
      player:sanitizePlayer(runtime?.player),
      savedAt:new Date().toISOString()
    };
  }

  function migrateLegacy(raw){
    if(!raw || typeof raw!=="object") return null;
    const owned=normalizeOwned(raw.owned);
    return {
      version:VERSION,
      currencies:{coins:Number.isFinite(raw.coins)?Math.max(0,raw.coins):120},
      inventory:Object.fromEntries([...owned].map(id=>[id,1])),
      equipment:sanitizeEquipment(raw.equipped,owned),
      player:sanitizePlayer(raw.player),
      migratedFrom:LEGACY_SAVE_KEY
    };
  }

  const store={
    load(){
      try{
        let parsed=null;
        const current=root.localStorage?.getItem(SAVE_KEY);
        if(current) parsed=JSON.parse(current);
        if(!parsed){
          const legacy=root.localStorage?.getItem(LEGACY_SAVE_KEY);
          if(legacy) parsed=migrateLegacy(JSON.parse(legacy));
        }
        if(!parsed) return null;
        const owned=normalizeOwned(parsed.inventory || parsed.owned);
        return {
          coins:Number.isFinite(parsed.currencies?.coins)?Math.max(0,parsed.currencies.coins):Number.isFinite(parsed.coins)?Math.max(0,parsed.coins):120,
          owned:[...owned],
          inventory:parsed.inventory&&typeof parsed.inventory==="object"?{...parsed.inventory}:Object.fromEntries([...owned].map(id=>[id,1])),
          equipped:sanitizeEquipment(parsed.equipment || parsed.equipped,owned),
          player:sanitizePlayer(parsed.player)
        };
      }catch(_){ return null; }
    },
    save(runtime){
      try{
        const payload=serializeRuntime(runtime);
        root.localStorage?.setItem(SAVE_KEY,JSON.stringify(payload));
        return payload;
      }catch(_){ return null; }
    },
    clear(){ try{ root.localStorage?.removeItem(SAVE_KEY); }catch(_){} }
  };

  root.HoodsRPG=Object.freeze({
    VERSION,SAVE_KEY,LEGACY_SAVE_KEY,EQUIPMENT_SLOTS,RARITIES,BASE_STATS,
    catalog,itemById,registerItem,createEquipment,normalizeOwned,sanitizeEquipment,calculateStats,serializeRuntime,store
  });
})(window);
