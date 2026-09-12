// Hoods V2.3 enemy combat — additive. Uses maps/town-v2/enemies-v23.json.
// Does not replace phaser-combat.js (legacy wilds blobs) or V2.4.1 floors.
(() => {
  const DIR = { down: 0, left: 1, right: 2, up: 3 };
  const KEY = 'hoods-enemy-combat-v23';

  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem('hoods-wilds-v03') || 'null') || {}; }
    catch { return {}; }
  };

  function directionOf(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  }

  function frames(dir, cols) {
    return cols.map((c) => DIR[dir] * 9 + c);
  }

  function ensureAnims(scene, spec) {
    const key = spec.textureKey;
    ['down', 'left', 'right', 'up'].forEach((dir) => {
      const idle = `${key}-idle-${dir}`;
      const walk = `${key}-walk-${dir}`;
      const atk = `${key}-attack-${dir}`;
      if (!scene.anims.exists(idle)) {
        scene.anims.create({ key: idle, frames: frames(dir, [0]).map((frame) => ({ key, frame })), frameRate: 1, repeat: -1 });
      }
      if (!scene.anims.exists(walk)) {
        scene.anims.create({ key: walk, frames: frames(dir, [1, 2, 3, 4]).map((frame) => ({ key, frame })), frameRate: 9, repeat: -1 });
      }
      if (!scene.anims.exists(atk)) {
        scene.anims.create({ key: atk, frames: frames(dir, [5, 6, 7, 8]).map((frame) => ({ key, frame })), frameRate: 12, repeat: 0 });
      }
    });
  }

  function hidePreviewDuplicates(scene, spec) {
    const preview = window.HoodsEnemyPreview?.enemies || [];
    preview.forEach((item) => {
      if (item.enemy === spec.id) {
        item.sprite?.setVisible(false);
        item.label?.setVisible(false);
        item.update = () => {};
      }
    });
  }

  function attach(scene, defs) {
    if (scene.__hoodsEnemyCombat === 'v23') return;
    scene.__hoodsEnemyCombat = 'v23';

    const player = scene.player;
    if (!player) {
      scene.__hoodsEnemyCombat = null;
      return setTimeout(() => waitAndInstall(), 160);
    }

    const progress = window.HoodsProgression || {
      state: Object.assign({ level: 1, xp: 0, kills: 0, loot: {} }, readProgress()),
      need: (l) => 40 + (l - 1) * 25,
      save() {
        localStorage.setItem('hoods-wilds-v03', JSON.stringify(this.state));
      }
    };

    const say = (text, ms = 1400) => {
      if (scene.__hoodsCombatSay) return scene.__hoodsCombatSay(text, ms);
      let banner = scene.__hoodsEnemyBanner;
      if (!banner) {
        banner = scene.add.text(scene.cameras.main.width / 2, 56, '', {
          fontFamily: 'monospace', fontSize: '12px', color: '#dfeeaa',
          backgroundColor: '#0a0c08dd', padding: { x: 10, y: 6 }
        }).setScrollFactor(0).setOrigin(0.5).setDepth(120);
        scene.__hoodsEnemyBanner = banner;
      }
      banner.setText(text).setVisible(true);
      scene.time.delayedCall(ms, () => { if (banner.text === text) banner.setVisible(false); });
    };

    const floater = (x, y, text, color) => {
      const f = scene.add.text(x, y, text, {
        fontFamily: 'monospace', fontSize: '12px', color, fontStyle: 'bold',
        stroke: '#111', strokeThickness: 3
      }).setOrigin(0.5).setDepth(80);
      scene.tweens.add({ targets: f, y: y - 26, alpha: 0, duration: 650, onComplete: () => f.destroy() });
    };

    const units = defs.enemies.map((spec) => {
      spec.textureKey = spec.textureKey || `hoods-enemy-${spec.id}-v23`;
      ensureAnims(scene, spec);
      hidePreviewDuplicates(scene, spec);
      const sprite = scene.add.sprite(spec.x, spec.y, spec.textureKey, 0)
        .setOrigin(0.5, 0.875)
        .setScale(spec.scale || 1)
        .setDepth(10);
      if (scene.physics?.world) {
        scene.physics.add.existing(sprite);
        sprite.body.setSize(spec.body.w, spec.body.h).setOffset((80 - spec.body.w) / 2, 70 - spec.body.h);
      }
      const label = scene.add.text(spec.x, spec.y - 86, spec.name.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '11px', color: spec.labelColor || '#ffe7a8',
        fontStyle: 'bold', stroke: '#10140d', strokeThickness: 3
      }).setOrigin(0.5).setDepth(12);
      const barBg = scene.add.rectangle(spec.x, spec.y - 70, 48, 5, 0x331c18).setDepth(12);
      const bar = scene.add.rectangle(spec.x - 24, spec.y - 70, 48, 5, 0xc95f42).setOrigin(0, 0.5).setDepth(13);
      sprite.anims.play(`${spec.textureKey}-idle-down`);
      return {
        spec,
        sprite,
        label,
        bar,
        barBg,
        hp: spec.hp,
        maxHp: spec.hp,
        alive: true,
        attackAt: 0,
        respawnAt: 0,
        dir: 'down',
        action: 'idle'
      };
    });

    const play = (unit, action, dir) => {
      unit.action = action;
      unit.dir = dir;
      const key = `${unit.spec.textureKey}-${action}-${dir}`;
      if (unit.sprite.anims.currentAnim?.key !== key) unit.sprite.anims.play(key, true);
    };

    const layout = (unit) => {
      const { x, y } = unit.sprite;
      unit.label.setPosition(x, y - 86).setVisible(unit.alive);
      unit.barBg.setPosition(x, y - 70).setVisible(unit.alive);
      unit.bar.setPosition(x - 24, y - 70).setVisible(unit.alive);
      unit.bar.width = 48 * (unit.hp / unit.maxHp);
    };

    const reward = (unit) => {
      const spec = unit.spec;
      const api = scene.hoodsApi || window.HoodsPhaserApi;
      api?.addCoins?.(spec.coins);
      const st = progress.state;
      st.kills = (st.kills || 0) + 1;
      st.xp = (st.xp || 0) + spec.xp;
      st.loot = st.loot || {};
      let drop = null;
      if (Math.random() <= spec.chance) {
        st.loot[spec.drop] = (st.loot[spec.drop] || 0) + 1;
        drop = spec.drop;
      }
      while (st.xp >= progress.need(st.level || 1)) {
        st.xp -= progress.need(st.level || 1);
        st.level = (st.level || 1) + 1;
      }
      progress.save?.();
      api?.refreshHud?.();
      api?.renderInventory?.();
      say(`${spec.name} down · +${spec.coins}c · +${spec.xp}xp${drop ? ' · ' + drop : ''}`, 1800);
    };

    const strike = () => {
      if (!player.active) return;
      const now = scene.time.now;
      if (scene.__hoodsPlayerAttackAt && now < scene.__hoodsPlayerAttackAt) return;
      scene.__hoodsPlayerAttackAt = now + 420;
      const alive = units.filter((u) => u.alive).sort((a, b) =>
        Phaser.Math.Distance.Between(player.x, player.y, a.sprite.x, a.sprite.y) -
        Phaser.Math.Distance.Between(player.x, player.y, b.sprite.x, b.sprite.y)
      );
      const unit = alive[0];
      if (!unit) return say('No enemy in range', 700);
      const dist = Phaser.Math.Distance.Between(player.x, player.y, unit.sprite.x, unit.sprite.y);
      if (dist > unit.spec.range) return say('Too far', 700);
      const stats = scene.hoodsApi?.stats?.() || { attack: 5 };
      const dmg = Math.max(1, (stats.attack || 5) + Phaser.Math.Between(1, 3));
      unit.hp = Math.max(0, unit.hp - dmg);
      layout(unit);
      floater(unit.sprite.x, unit.sprite.y - 56, `-${dmg}`, '#ffd8bd');
      scene.cameras.main.shake(40, 0.0014);
      play(unit, 'idle', directionOf(player.x - unit.sprite.x, player.y - unit.sprite.y));
      if (unit.hp <= 0) {
        unit.alive = false;
        unit.sprite.setVisible(false);
        layout(unit);
        unit.respawnAt = now + 6500;
        reward(unit);
      }
    };

    scene.input.keyboard.on('keydown-SPACE', (e) => { e.preventDefault(); strike(); });
    scene.input.keyboard.on('keydown-F', strike);
    document.getElementById('mobileAttack')?.addEventListener('pointerdown', strike);

    scene.events.on('update', (_t, delta) => {
      const now = scene.time.now;
      const dt = Math.min(delta, 40) / 1000;
      units.forEach((unit) => {
        if (!unit.alive) {
          if (now >= unit.respawnAt) {
            unit.alive = true;
            unit.hp = unit.maxHp;
            unit.sprite.setPosition(unit.spec.x, unit.spec.y).setVisible(true);
            play(unit, 'idle', 'down');
            layout(unit);
          }
          return;
        }
        const dist = Phaser.Math.Distance.Between(player.x, player.y, unit.sprite.x, unit.sprite.y);
        const dir = directionOf(player.x - unit.sprite.x, player.y - unit.sprite.y);
        if (dist < unit.spec.aggro && dist > 36) {
          const ang = Phaser.Math.Angle.Between(unit.sprite.x, unit.sprite.y, player.x, player.y);
          unit.sprite.x += Math.cos(ang) * unit.spec.speed * dt;
          unit.sprite.y += Math.sin(ang) * unit.spec.speed * dt;
          play(unit, 'walk', dir);
        } else if (dist <= 36) {
          play(unit, now < unit.attackAt ? 'attack' : 'idle', dir);
          if (now >= unit.attackAt) {
            unit.attackAt = now + 1100;
            play(unit, 'attack', dir);
            const stats = scene.hoodsApi?.stats?.() || { defense: 3 };
            const dmg = Math.max(1, unit.spec.attack - Math.floor((stats.defense || 3) / 2));
            floater(player.x, player.y - 48, `-${dmg}`, '#ff8f77');
            scene.cameras.main.shake(60, 0.0024);
            say(`${unit.spec.name} hits · -${dmg}`, 800);
            if (scene.hoodsCombat?.getHp && scene.hoodsCombat.setHp) {
              const next = scene.hoodsCombat.getHp() - dmg;
              scene.hoodsCombat.setHp(Math.max(0, next));
              if (next <= 0) {
                player.setPosition(544, 608);
                scene.hoodsCombat.setHp(stats.hp || 100);
                say('Knocked out · Town Square', 1600);
              }
            }
          }
        } else {
          play(unit, 'idle', unit.dir);
        }
        layout(unit);
      });
    });

    window.HoodsEnemyCombat = { units, strike, data: defs };
    console.info('[Hoods V2.3] enemy combat mounted', units.map((u) => u.spec.id));
  }

  function waitAndInstall() {
    const game = window.Phaser?.GAMES?.find(Boolean);
    const scene = game?.scene?.getScene('TownScene') || game?.scene?.scenes?.[0];
    if (!scene || !scene.sys?.isActive()) return setTimeout(waitAndInstall, 140);
    if (scene.load?.isLoading()) {
      scene.load.once('complete', () => setTimeout(waitAndInstall, 80));
      return;
    }
    fetch('maps/town-v2/enemies-v23.json')
      .then((r) => r.json())
      .then((defs) => {
        const pending = defs.enemies.filter((spec) => {
          spec.textureKey = `hoods-enemy-${spec.id}-v23`;
          return !scene.textures.exists(spec.textureKey);
        });
        const go = () => attach(scene, defs);
        if (!pending.length) return go();
        pending.forEach((spec) => scene.load.spritesheet(spec.textureKey, spec.atlas, {
          frameWidth: spec.frameSize, frameHeight: spec.frameSize
        }));
        scene.load.once('complete', go);
        scene.load.start();
      })
      .catch((err) => console.warn('[Hoods V2.3] enemy data missing', err));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(waitAndInstall, 200));
  else setTimeout(waitAndInstall, 200);
})();
