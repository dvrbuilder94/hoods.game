// Hoods V2.3 enemy preview — mounts the first Demon and Dragon in the live Phaser town.
// This is intentionally additive: it owns only the demo creatures and leaves combat/map/player systems untouched.
(() => {
  const ENEMIES = {
    demon: {
      key: 'hoods-enemy-demon-v23',
      url: 'assets/characters/v23/demon-v23.svg?v=23.1',
      label: 'DEMON',
      x: 1008,
      y: 610,
      scale: 1,
      body: { w: 24, h: 16 }
    },
    dragon: {
      key: 'hoods-enemy-dragon-v23',
      url: 'assets/characters/v23/dragon-v23.svg?v=23.1',
      label: 'DRAGON',
      x: 1088,
      y: 610,
      scale: 1,
      body: { w: 28, h: 16 }
    }
  };
  const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };
  const ACTIONS = {
    idle: { columns: [0], duration: 900 },
    walk: { columns: [1, 2, 3, 4], duration: 880 },
    attack: { columns: [5, 6, 7, 8], duration: 340 }
  };

  function frameIndexes(direction, columns) {
    return columns.map(column => DIR_ROW[direction] * 9 + column);
  }

  function ensureAnimations(scene, enemy) {
    for (const direction of Object.keys(DIR_ROW)) {
      for (const [action, spec] of Object.entries(ACTIONS)) {
        const key = `hoods-${enemy}-${action}-${direction}-v23`;
        if (scene.anims.exists(key)) continue;
        scene.anims.create({
          key,
          frames: frameIndexes(direction, spec.columns).map(frame => ({ key: ENEMIES[enemy].key, frame })),
          frameRate: action === 'attack' ? 12 : action === 'walk' ? 9 : 1,
          repeat: action === 'attack' ? 0 : -1
        });
      }
    }
  }

  function mountEnemy(scene, enemy) {
    const spec = ENEMIES[enemy];
    ensureAnimations(scene, enemy);
    const sprite = scene.add.sprite(spec.x, spec.y, spec.key, 0)
      .setOrigin(0.5, 0.875)
      .setScale(spec.scale)
      .setDepth(10);
    sprite.__hoodsEnemy = enemy;
    sprite.__hoodsDirection = 'down';
    scene.physics?.world && scene.physics.add.existing(sprite);
    sprite.body?.setSize(spec.body.w, spec.body.h).setOffset((80 - spec.body.w) / 2, 70 - spec.body.h);
    const label = scene.add.text(spec.x, spec.y - 84, spec.label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: enemy === 'dragon' ? '#c7f17d' : '#ffb073',
      fontStyle: 'bold',
      stroke: '#10140d',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(12);
    const state = { action: 'idle', elapsed: 0, step: 0 };
    const play = (action) => {
      state.action = action;
      state.elapsed = 0;
      state.step = 0;
      sprite.anims.play(`hoods-${enemy}-${action}-down-v23`, true);
    };
    play('idle');
    return {
      enemy,
      sprite,
      label,
      state,
      update(delta) {
        state.elapsed += delta;
        const duration = ACTIONS[state.action].duration;
        if (state.elapsed < duration) return;
        state.step = (state.step + 1) % 3;
        play(state.step === 0 ? 'idle' : state.step === 1 ? 'walk' : 'attack');
      }
    };
  }

  function wait() {
    const game = window.Phaser?.GAMES?.find(Boolean);
    const scene = game?.scene?.getScene('TownScene');
    if (!scene || !scene.sys?.isActive()) return setTimeout(wait, 120);
    if (scene.__hoodsEnemyPreview) return;
    scene.__hoodsEnemyPreview = 'v23';
    const pending = Object.values(ENEMIES).filter(spec => !scene.textures.exists(spec.key));
    if (!pending.length) return install(scene);
    // The modular Wanderer loader may still be running at scene startup. Queue behind it.
    if (scene.load.isLoading()) {
      scene.load.once('complete', () => wait());
      return;
    }
    pending.forEach(spec => scene.load.spritesheet(spec.key, spec.url, {
      frameWidth: 80,
      frameHeight: 80
    }));
    scene.load.once('complete', () => install(scene));
    scene.load.start();
  }

  function install(scene) {
    const mounted = Object.keys(ENEMIES).map(enemy => mountEnemy(scene, enemy));
    scene.__hoodsEnemies = mounted;
    scene.events.on('update', (_time, delta) => mounted.forEach(item => item.update(Math.min(delta, 80))));
    window.HoodsEnemyPreview = { enemies: mounted, definitions: ENEMIES };
    console.info('[Hoods V2.3] Demon + Dragon preview mounted', mounted.map(item => item.enemy));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(wait, 80));
  } else {
    setTimeout(wait, 80);
  }
})();
