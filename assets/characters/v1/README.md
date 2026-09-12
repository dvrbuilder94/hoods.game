# Hoods human outfits v1

This directory is the visual source for the human character system.

## Contract

- 48×64 px logical frame size.
- 4 directions in this order: `down`, `left`, `right`, `up`.
- 3 walk frames per direction.
- Full-body outfits: equipment does **not** render as layered helmet/armor/boots/weapon pieces on the body.
- Player and human NPCs share the same base anatomy, frame size, direction rules and animation timing.
- Pixel rendering uses nearest-neighbor filtering.

`humans-v1.svg` is one source atlas. Each outfit occupies 4 rows × 3 columns (144×256 px):

1. Wanderer — player default.
2. Ranger — player purchasable outfit.
3. Warden — NPC language, currently Mara.
4. Merchant — NPC language, currently Old Bram.

The atlas is original Hoods art. Tibia is a benchmark for readability, camera language and outfit-based identity only; no Tibia sprites are used.

## Runtime ownership

`phaser-character.js` owns atlas loading, frame registration, 4-direction animation and outfit rendering.

`phaser-character-runtime.js` owns the selected/owned outfit state, mounts the player/NPC visuals, and bridges the outfit picker into the existing shop/inventory UI. Existing gear remains available for stats and inventory but no longer changes the player sprite.

Future addons should be modeled as outfit variants (for example `ranger-addon-1`) or a deliberately small addon layer, not a return to per-item RuneScape-style body composition.