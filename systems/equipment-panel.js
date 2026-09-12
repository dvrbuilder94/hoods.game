(function initEquipmentPanel(root){
  "use strict";

  const panel=document.querySelector(".paperdoll");
  if(!panel||!root.hoodsInventory||!root.HoodsRPG)return;

  // Tibia-style rule: equipment changes stats, not the world sprite.
  // Full-body outfits/skins live in HoodsOutfits, outside this equipment set.
  if(typeof drawEquipment==="function") drawEquipment=function(){};

  panel.classList.add("tibia-set");
  panel.innerHTML=`
    <div class="tibia-set-shell">
      <div>
        <div class="tibia-equipment" aria-label="Equipment set">
          <button class="tibia-slot tibia-future-slot slot-amulet empty" type="button" tabindex="-1"><span class="slot-hint">AMULET</span></button>
          <button class="tibia-slot slot-helmet empty" data-slot="helmet" type="button"></button>
          <button class="tibia-slot tibia-future-slot slot-backpack empty" type="button" tabindex="-1"><span class="slot-hint">BAG</span></button>
          <button class="tibia-slot slot-weapon empty" data-slot="weapon" type="button"></button>
          <button class="tibia-slot slot-armor empty" data-slot="armor" type="button"></button>
          <button class="tibia-slot slot-shield empty" data-slot="shield" type="button"></button>
          <div class="tibia-slot tibia-future-slot empty" tabindex="-1"><span class="slot-hint">CHARM</span></div>
          <button class="tibia-slot slot-legs empty" data-slot="legs" type="button"></button>
          <button class="tibia-slot tibia-future-slot slot-ring empty" type="button" tabindex="-1"><span class="slot-hint">RING</span></button>
          <button class="tibia-slot slot-boots empty" data-slot="boots" type="button"></button>
        </div>
        <p class="tibia-set-note"><strong>SET</strong> · Helmet, armor, weapon, shield, legs and boots affect stats. Outfits are separate full-body skins.</p>
      </div>
      <div class="tibia-backpack">
        <div class="tibia-backpack-head"><span>BACKPACK</span><b id="tibiaBagCount">0</b></div>
        <div class="tibia-bag-grid" id="tibiaBagGrid" aria-label="Backpack"></div>
      </div>
    </div>`;

  const slotLabels={helmet:"HELM",armor:"ARM",weapon:"WPN",shield:"SHLD",legs:"LEGS",boots:"BOOTS"};
  const bagGrid=document.getElementById("tibiaBagGrid");
  const bagCount=document.getElementById("tibiaBagCount");

  function abbr(name){
    const words=String(name||"").trim().split(/\s+/).filter(Boolean);
    if(words.length>1)return words.slice(0,3).map(w=>w[0]).join("").toUpperCase();
    return words[0]?.slice(0,4).toUpperCase()||"ITEM";
  }

  function renderSet(){
    const snap=root.hoodsInventory.snapshot();
    const equipped=snap.equipment||{};

    panel.querySelectorAll("[data-slot]").forEach(el=>{
      const slot=el.dataset.slot;
      const id=equipped[slot];
      const item=id?root.hoodsInventory.getItem(id):null;
      el.classList.toggle("empty",!item);
      el.dataset.rarity=item?.rarity||"";
      el.title=item?`${item.name} — click to unequip`:slot.toUpperCase();
      el.innerHTML=item
        ? `<span class="slot-abbr">${abbr(item.name)}</span><span class="slot-name">${item.name}</span>`
        : `<span class="slot-hint">${slotLabels[slot]||slot.toUpperCase()}</span>`;
      el.onclick=item?()=>root.hoodsInventory.unequip(slot):null;
    });

    if(!bagGrid)return;
    bagGrid.innerHTML="";
    const inventory=snap.inventory||{};
    const owned=root.hoodsInventory.list();
    if(bagCount)bagCount.textContent=`${owned.length}/12`;

    owned.slice(0,12).forEach(item=>{
      const cell=document.createElement("button");
      const isEquipped=!!item.slot&&equipped[item.slot]===item.id;
      cell.type="button";
      cell.className=`tibia-bag-cell${isEquipped?" equipped":""}`;
      cell.dataset.rarity=item.rarity||"";
      cell.title=`${item.name}${item.slot?` · ${item.slot}`:""}${isEquipped?" · equipped":""}`;
      const qty=Math.max(1,Number(inventory[item.id])||1);
      cell.innerHTML=`<span class="bag-abbr">${abbr(item.name)}</span>${qty>1?`<span class="bag-qty">${qty}</span>`:""}`;
      cell.onclick=()=>{
        if(!item.slot)return;
        isEquipped?root.hoodsInventory.unequip(item.slot):root.hoodsInventory.equip(item.id);
      };
      bagGrid.appendChild(cell);
    });

    for(let i=owned.length;i<12;i++){
      const empty=document.createElement("div");
      empty.className="tibia-bag-cell empty";
      bagGrid.appendChild(empty);
    }
  }

  const previousUpdateUI=updateUI;
  updateUI=function(){previousUpdateUI();renderSet();};
  const previousRenderInventory=renderInventory;
  renderInventory=function(){previousRenderInventory();renderSet();};

  renderSet();
})(window);