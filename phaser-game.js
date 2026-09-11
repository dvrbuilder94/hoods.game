// Hoods Phaser migration v0.1 — parallel runtime. Keeps the legacy build intact while core movement/world move to Phaser.
(() => {
  const WORLD_W = 1800;
  const WORLD_H = 1200;
  const BASE_SPEED = 185;
  const SAVE_KEY = "hoods-town-v02";
  const WORLD_SAVE_KEY = "hoods-world-v05";

  function readJson(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
    catch (_) { return fallback; }
  }

  const save = readJson(SAVE_KEY, {});
  const worldSave = readJson(WORLD_SAVE_KEY, {});
  const equipped = save.equipped || {};
  const coins = Number.isFinite(save.coins) ? save.coins : 120;

  class TownScene extends Phaser.Scene {
    constructor() { super("TownScene"); }

    create() {
      this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.setBackgroundColor("#6d8d45");
      this.drawWorld();
      this.createColliders();
      this.createPlayer();
      this.createNpcs();
      this.createControls();
      this.createWorldLabels();

      this.cameras.main.startFollow(this.player, true, 0.11, 0.11);
      this.cameras.main.setRoundPixels(true);
      this.cameras.main.setZoom(1);

      document.getElementById("phaserCoins").textContent = `${coins} COINS`;
    }

    drawWorld() {
      const g = this.add.graphics();
      g.fillStyle(0x6d8d45, 1).fillRect(0, 0, WORLD_W, WORLD_H);

      // Subtle grass tile variation.
      for (let x = 0; x < WORLD_W; x += 48) {
        for (let y = 0; y < WORLD_H; y += 48) {
          const n = ((x / 48) * 17 + (y / 48) * 31) % 5;
          if (n === 0) g.fillStyle(0x668440, 0.75).fillRect(x, y, 48, 48);
          else if (n === 1) g.fillStyle(0x72934a, 0.55).fillRect(x, y, 48, 48);
        }
      }

      // Roads + water, ported from the legacy map.
      g.fillStyle(0x8a8678, 1).fillRect(805, 0, 190, WORLD_H);
      g.fillStyle(0x8a8678, 1).fillRect(0, 670, WORLD_W, 180);
      g.fillStyle(0x466f83, 1).fillRect(1420, 430, 250, 160);

      this.drawBuilding(g, 345, 360, 290, 190, "INN");
      this.drawBuilding(g, 760, 330, 260, 190, "BANK");
      this.drawBuilding(g, 1110, 610, 250, 170, "OLD BRAM'S SHOP");

      // North Gate.
      g.fillStyle(0x5c4430).fillRect(810, 285, 24, 100).fillRect(966, 285, 24, 100);
      g.fillStyle(0x3a3028).fillRect(830, 295, 140, 18);

      // Ashwood gate is already part of the v0.7 world state.
      g.fillStyle(0x493724).fillRect(1435, 650, 18, 210).fillRect(1463, 650, 18, 210);
      if (!worldSave.ashwoodUnlocked) {
        for (let y = 668; y < 842; y += 26) g.fillStyle(0x6f4d2e).fillRect(1440, y, 36, 8);
      }

      const trees = [[160,180],[280,220],[420,140],[1450,180],[1580,250],[1660,430],[190,910],[330,1010],[1510,930],[1650,1020],[180,520],[1600,650],[520,1040],[1360,1060],[570,170],[1260,180]];
      trees.forEach(([x,y]) => this.drawTree(g,x,y));
    }

    drawBuilding(g, x, y, w, h, label) {
      g.fillStyle(0x6f5337).fillRect(x, y + 46, w, h - 46);
      g.fillStyle(0x342c27).fillRect(x - 10, y + 28, w + 20, 24);
      g.fillStyle(0x7b3e32);
      g.fillTriangle(x - 14, y + 35, x + w / 2, y - 20, x + w + 14, y + 35);
      g.fillStyle(0xd0a25d).fillRect(x + w / 2 - 22, y + h - 64, 44, 64);
      this.add.text(x + w / 2, y + 68, label, {fontFamily:"monospace",fontSize:"13px",color:"#f0dcae",fontStyle:"bold"}).setOrigin(.5,0);
    }

    drawTree(g, x, y) {
      g.fillStyle(0x5b4027).fillRect(x - 7, y, 14, 36);
      g.fillStyle(0x365e2e).fillRect(x - 28, y - 28, 56, 38);
      g.fillStyle(0x477838).fillRect(x - 20, y - 38, 42, 28);
      g.fillStyle(0x6b9a46).fillRect(x - 12, y - 31, 20, 8);
    }

    createColliders() {
      this.solids = this.physics.add.staticGroup();
      const block = (x,y,w,h) => {
        const z = this.add.zone(x + w/2, y + h/2, w, h);
        this.physics.add.existing(z, true);
        this.solids.add(z);
      };
      block(321,336,338,238);
      block(736,306,308,238);
      block(1086,586,298,218);
      if (!worldSave.ashwoodUnlocked) block(1430,640,56,230);
    }

    createPlayer() {
      this.player = this.add.container(900, 760);
      this.player.setSize(30, 46);
      this.physics.add.existing(this.player);
      this.player.body.setCollideWorldBounds(true).setSize(30, 42).setOffset(-15, -21);
      this.physics.add.collider(this.player, this.solids);

      this.shadow = this.add.rectangle(0, 20, 28, 7, 0x000000, .22);
      this.legs = this.add.rectangle(0, 12, 20, 18, 0x71624f).setStrokeStyle(2,0x2a211d);
      this.bodyShape = this.add.rectangle(0, -5, 22, 22, 0xd89a70).setStrokeStyle(2,0x2a211d);
      this.head = this.add.rectangle(0, -24, 16, 17, 0xd89a70).setStrokeStyle(2,0x2a211d);
      this.player.add([this.shadow,this.legs,this.bodyShape,this.head]);
      this.addEquipmentLayers();

      this.nameTag = this.add.text(0,-45,"Hood",{fontFamily:"monospace",fontSize:"12px",color:"#f4ead2",fontStyle:"bold"}).setOrigin(.5);
      this.player.add(this.nameTag);
    }

    addEquipmentLayers() {
      if (equipped.armor) this.player.add(this.add.rectangle(0,-5,24,20,0x7f5639).setStrokeStyle(2,0x33271f));
      if (equipped.helmet) this.player.add(this.add.rectangle(0,-28,20,10,0xaeb6b8).setStrokeStyle(2,0x3a4042));
      if (equipped.weapon) {
        this.player.add(this.add.rectangle(17,2,3,25,0x6d4b2f));
        this.player.add(this.add.rectangle(17,-10,7,15,0xc8d0d1));
      }
      if (equipped.shield) this.player.add(this.add.rectangle(-18,0,12,18,0x8a6038).setStrokeStyle(2,0x4d351f));
      if (equipped.boots) {
        this.player.add(this.add.rectangle(-7,21,10,6,0x32281f));
        this.player.add(this.add.rectangle(7,21,10,6,0x32281f));
      }
    }

    createNpcs() {
      this.bram = this.createNpc(1235, 822, "OLD BRAM", 0x5c4733);
      this.mara = this.createNpc(690, 625, "MARA THE WARDEN", 0x394d42);
      this.npcPrompt = this.add.text(0,0,"",{fontFamily:"monospace",fontSize:"11px",color:"#f3e4bf",backgroundColor:"#10140ddd",padding:{x:8,y:5}}).setOrigin(.5).setDepth(20).setVisible(false);
    }

    createNpc(x,y,name,color) {
      const c = this.add.container(x,y);
      c.add(this.add.rectangle(0,17,24,6,0x000000,.22));
      c.add(this.add.rectangle(0,-10,14,16,0xc4875e));
      c.add(this.add.rectangle(0,7,20,18,color));
      c.add(this.add.text(0,-32,name,{fontFamily:"monospace",fontSize:"10px",color:"#f3e4bf",fontStyle:"bold"}).setOrigin(.5));
      return c;
    }

    createControls() {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D,E");
      this.input.keyboard.on("keydown-E", () => this.interact());
    }

    createWorldLabels() {
      const style = {fontFamily:"monospace",fontSize:"12px",color:"#d8c697",fontStyle:"bold"};
      this.add.text(900,265,"THE WILDS — OPEN",style).setOrigin(.5);
      this.add.text(1458,625,worldSave.ashwoodUnlocked?"ASHWOOD TRAIL — OPEN":"ASHWOOD TRAIL — LOCKED",style).setOrigin(.5);
    }

    interact() {
      const dB = Phaser.Math.Distance.Between(this.player.x,this.player.y,this.bram.x,this.bram.y);
      const dM = Phaser.Math.Distance.Between(this.player.x,this.player.y,this.mara.x,this.mara.y);
      if (dB < 110) this.flashPrompt("Old Bram · shop migration comes next", this.bram.x, this.bram.y - 58);
      else if (dM < 110) this.flashPrompt("Mara · quest dialogue migration comes next", this.mara.x, this.mara.y - 58);
    }

    flashPrompt(text,x,y) {
      this.npcPrompt.setText(text).setPosition(x,y).setVisible(true);
      this.time.delayedCall(1500,()=>this.npcPrompt.setVisible(false));
    }

    update() {
      const body = this.player.body;
      let dx = 0, dy = 0;
      if (this.cursors.left.isDown || this.keys.A.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.keys.D.isDown) dx += 1;
      if (this.cursors.up.isDown || this.keys.W.isDown) dy -= 1;
      if (this.cursors.down.isDown || this.keys.S.isDown) dy += 1;
      const v = new Phaser.Math.Vector2(dx,dy);
      if (v.lengthSq() > 0) v.normalize().scale(BASE_SPEED);
      body.setVelocity(v.x,v.y);

      // Tiny walk bob to keep the procedural character alive while assets are still being migrated.
      const moving = v.lengthSq() > 0;
      this.bodyShape.y = moving ? -5 + Math.sin(this.time.now / 95) : -5;
      this.head.y = moving ? -24 + Math.sin(this.time.now / 95) : -24;

      const location = this.player.y < 260 ? "THE WILDS" : this.player.x > 1480 ? "ASHWOOD TRAIL" : this.player.x < 500 ? "WEST GREEN" : this.player.x > 1320 ? "EAST GREEN" : "TOWN SQUARE";
      document.getElementById("phaserLocation").textContent = location;

      const nearB = Phaser.Math.Distance.Between(this.player.x,this.player.y,this.bram.x,this.bram.y) < 115;
      const nearM = Phaser.Math.Distance.Between(this.player.x,this.player.y,this.mara.x,this.mara.y) < 115;
      if (!this.npcPrompt.visible && (nearB || nearM)) {
        const npc = nearM ? this.mara : this.bram;
        this.npcPrompt.setText("E · INTERACT").setPosition(npc.x,npc.y-58).setVisible(true);
      } else if (this.npcPrompt.visible && !nearB && !nearM && this.npcPrompt.text === "E · INTERACT") {
        this.npcPrompt.setVisible(false);
      }
    }
  }

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-root",
    width: 960,
    height: 600,
    backgroundColor: "#11160e",
    pixelArt: true,
    roundPixels: true,
    physics: { default: "arcade", arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [TownScene]
  });
})();
