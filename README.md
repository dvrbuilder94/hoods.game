# Hoods V2.4.1

Playable pre-alpha of a top-down browser RPG. **Phaser Town is the current build.**
Tibia is a structural reference only. No Tibia assets. No token, wallet, or sale is active.

## Play

Open `phaser.html` (GitHub Pages serves the repo root).

```bash
npx serve .
```

- Move: WASD / arrows / on-screen pad
- Attack: Space, F, or the sword button
- Interact: E (NPCs, shop, stairs)
- Inventory: I

Canonical world version: **V2.4.1** (floors, stairs, roof reveal).
Latest character art: Wanderer V2.3 plus Demon / Green Drake combat preview in Town.

`index.html` is the older canvas prototype. Do not treat it as the live product.

## Current slice

- Data-driven Town V2 map (`maps/town-v2/`)
- Enterable buildings, cellar / upper floor transitions
- Full-body outfits (cosmetic) separate from equipment stats
- Fightable Ash Demon and Green Drake east of the square (`maps/town-v2/enemies-v23.json`)

## Agent rules

Read `AGENTS.md` and `docs/ARCHITECTURE.md` before editing.
`main` is the source of truth. Prefer a branch + PR while another agent is working.
Do not add multiplayer, blockchain, or a backend while foundations are still settling.
