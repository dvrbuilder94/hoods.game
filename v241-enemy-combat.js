// Additive combat for Hoods V2.4.1 play.html. Does not rewrite hoods-v2.js.
(() => {
  const STATS = {
    demon: { hp: 70, attack: 11, speed: 52, coins: 22, xp: 18, range: 54, aggro: 210 },
    dragon: { hp: 110, attack: 15, speed: 40, coins: 36, xp: 28, range: 62, aggro: 230 }
  };

  function statsFromHud() {
    const text = document.getElementById('v2Stats')?.textContent || '';
    const num = (label) => {
      const m = text.match(new RegExp(label + '\\s+(\\d+)'));
      return m ? Number(m[1]) : null;
    };
    return { hp: num('HP') || 100, attack: num('ATK') || 5, defense: num('DEF') || 3 };
  }

  function say(text) {
    let el = document.getElementById('v2CombatMsg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v2CombatMsg';
      el.style.cssText = 'position:fixed;z-index:30;top:52px;left:50%;transform:translateX(-50%);padding:6px 10px;background:#0a0c08dd;border:1px solid #4b5544;color:#dfeeaa;font:800 11px monospace;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, 1400);
  }

  function attach(scene) {
    if (scene.__hoodsPlayCombat) return;
    if (!scene.enemyActors?.length || !scene.player) return false;
    scene.__hoodsPlayCombat = true;
    scene.playerHp = statsFromHud().hp;
    scene.attackAt = 0;
    scene.enemyActors.forEach((actor) => {
      const spec = STATS[actor.id] || STATS.demon;
      actor.hp = spec.hp;
      actor.maxHp = spec.hp;
      actor.alive = true;
      actor.attackAt = 0;
      actor.sx = actor.sprite.x;
      actor.sy = actor.sprite.y;
      actor.barBg = scene.add.rectangle(actor.sprite.x, actor.sprite.y - 70, 46, 4, 0x331c18).setDepth(40);
      actor.bar = scene.add.rectangle(actor.sprite.x - 23, actor.sprite.y - 70, 46, 4, 0xc95f42).setOrigin(0, 0.5).setDepth(41);
    });

    const layout = (actor) => {
      const vis = actor.alive;
      actor.sprite.setVisible(vis);
      actor.label?.setVisible(vis);
      actor.shadow?.setVisible(vis);
      actor.barBg.setVisible(vis).setPosition(actor.sprite.x, actor.sprite.y - 70);
      actor.bar.setVisible(vis).setPosition(actor.sprite.x - 23, actor.sprite.y - 70);
      actor.bar.width = 46 * (actor.hp / actor.maxHp);
    };

    const strike = () => {
      const now = scene.time.now;
      if (now < scene.attackAt) return;
      scene.attackAt = now + 420;
      const live = scene.enemyActors.filter((a) => a.alive).sort((a, b) =>
        Phaser.Math.Distance.Between(scene.player.x, scene.player.y, a.sprite.x, a.sprite.y) -
        Phaser.Math.Distance.Between(scene.player.x, scene.player.y, b.sprite.x, b.sprite.y)
      );
      const actor = live[0];
      if (!actor) return say('No enemy');
      const spec = STATS[actor.id];
      const dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, actor.sprite.x, actor.sprite.y);
      if (dist > spec.range) return say('Too far');
      const dmg = Math.max(1, statsFromHud().attack + Phaser.Math.Between(0, 2));
      actor.hp = Math.max(0, actor.hp - dmg);
      layout(actor);
      say(`${actor.id} -${dmg}`);
      scene.cameras.main.shake(40, 0.0016);
      if (actor.hp <= 0) {
        actor.alive = false;
        actor.respawnAt = now + 7000;
        layout(actor);
        const coins = document.getElementById('v2Coins');
        const cur = parseInt(coins?.textContent || '120', 10) || 120;
        if (coins) coins.textContent = `${cur + spec.coins}c`;
        say(`${actor.id} down +${spec.coins}c`);
      }
    };

    scene.input.keyboard.on('keydown-SPACE', (e) => { e.preventDefault(); strike(); });
    scene.input.keyboard.on('keydown-F', strike);
    document.getElementById('v2AtkBtn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); strike(); });

    const prev = scene.updateEnemies.bind(scene);
    scene.updateEnemies = function (time) {
      const now = this.time.now;
      const dt = Math.min(this.game.loop.delta, 40) / 1000;
      this.enemyActors.forEach((actor) => {
        const spec = STATS[actor.id];
        if (!actor.alive) {
          if (actor.respawnAt && now >= actor.respawnAt) {
            actor.alive = true;
            actor.hp = actor.maxHp;
            actor.sprite.setPosition(actor.sx, actor.sy);
            layout(actor);
          }
          return;
        }
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, actor.sprite.x, actor.sprite.y);
        const dir = Math.abs(this.player.x - actor.sprite.x) > Math.abs(this.player.y - actor.sprite.y)
          ? (this.player.x < actor.sprite.x ? 'left' : 'right')
          : (this.player.y < actor.sprite.y ? 'up' : 'down');
        if (dist < spec.aggro && dist > 34) {
          const ang = Phaser.Math.Angle.Between(actor.sprite.x, actor.sprite.y, this.player.x, this.player.y);
          actor.sprite.x += Math.cos(ang) * spec.speed * dt;
          actor.sprite.y += Math.sin(ang) * spec.speed * dt;
          actor.sprite.anims.play(`${actor.id}-walk-${dir}`, true);
        } else if (dist <= 34) {
          actor.sprite.anims.play(`${actor.id}-attack-${dir}`, true);
          if (now >= actor.attackAt) {
            actor.attackAt = now + 1050;
            const dmg = Math.max(1, spec.attack - Math.floor(statsFromHud().defense / 2));
            this.playerHp = Math.max(0, this.playerHp - dmg);
            say(`${actor.id} hits -${dmg}`);
            this.cameras.main.shake(55, 0.0022);
            const hud = document.getElementById('v2Stats');
            if (hud) hud.textContent = hud.textContent.replace(/HP \d+/, `HP ${this.playerHp}`);
            if (this.playerHp <= 0) {
              const spawn = this.dataMap?.spawn || { x: 17, y: 19 };
              this.player.setPosition(spawn.x * this.tileSize + 16, spawn.y * this.tileSize + 16);
              this.playerHp = statsFromHud().hp;
              say('Knocked out');
            }
          }
        } else {
          actor.sprite.anims.play(`${actor.id}-idle-${dir}`, true);
        }
        actor.sprite.setDepth(20 + actor.sprite.y / 1000);
        actor.label?.setPosition(actor.sprite.x, actor.sprite.y - 84).setDepth(actor.sprite.depth + 2);
        actor.shadow?.setPosition(actor.sprite.x, actor.sprite.y + 12).setDepth(actor.sprite.depth - 0.02);
        layout(actor);
      });
    };
    scene.__hoodsStrike = strike;
    say('Combat on · Space / F / ATK');
    return true;
  }

  function wait() {
    const game = window.Phaser?.GAMES?.find(Boolean);
    const scene = game?.scene?.getScene('HoodsV2');
    if (!scene || !scene.sys?.isActive() || !scene.enemyActors?.length) return setTimeout(wait, 120);
    attach(scene);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(wait, 200));
  else setTimeout(wait, 200);
})();
