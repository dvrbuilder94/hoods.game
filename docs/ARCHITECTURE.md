# Hoods scalable RPG architecture

This document is the working contract for future contributors and AI agents. GitHub `main` is the source of truth.

## Product direction

Hoods is a small, top-down browser MMORPG/RPG prototype. Use Tibia as a structural benchmark: simple readable tiles, layered maps, compact character sprites, data-driven content and systems that can grow without redrawing or rewriting the whole world. Do not copy Tibia assets or proprietary code.

## Core rules

1. Prefer data over coordinates in JavaScript. New map content belongs in Tiled-compatible JSON chunks.
2. Keep zones small and independently verifiable. Town first, then Wilds, then Ashwood, then Cinder.
3. A chunk declares `zoneId`, `chunkId`, `worldX`, `worldY`, and `zLevel`.
4. Standard map layers are `ground`, `decor`, `collisions`, `roofs`, `objects`, and `triggers`.
5. Zone manifests own which chunks and tilesets are loaded. Runtime code must not grow a new hardcoded loader branch for every chunk.
6. `zLevel` is part of the data contract now even while gameplay remains on floor 0.
7. Keep a legacy fallback during migration. Remove fallback code only after the equivalent data-driven path has been tested.
8. Do not couple quests, combat, economy, characters or inventory to a specific map chunk.
9. Equipment and character appearance are separate. Gear lives in the set/inventory and changes stats. Full-body outfits/skins change the world sprite.
10. Do not add multiplayer, blockchain, a backend, or unrelated systems while map/character foundations are still being stabilized.

## Map ownership

`maps/<zone>/manifest.json` is the zone registry. It lists reusable tilesets and ordered chunks. `phaser-map-runtime.js` reads the Town manifest and exposes:

- `scene.__hoodsTownChunks`
- `scene.__hoodsTownByZ`
- `scene.mapObject(name)`
- `scene.mapTrigger(name)`
- `scene.mapChunks(zLevel)`
- `window.HoodsMaps`

Adding a normal Town chunk should require editing map data + the manifest, not adding another loader function.

## Character ownership

`phaser-character.js` owns the sprite/frame contract. `phaser-character-runtime.js` mounts the selected outfit on the player and NPCs. Human outfits share the same 48x64 frame size and four-direction animation contract.

Gear must never be drawn as layered armor/weapon pieces on the world character by default. If a future exceptional weapon is visible, it must be an explicit cosmetic feature rather than a requirement of the equipment system.

## Safe incremental workflow

For every change:

- inspect `main` first;
- reuse current contracts instead of creating a parallel system;
- change the smallest coherent surface;
- keep the build functional;
- preserve gameplay unless the task explicitly changes it;
- validate mobile controls, collisions, camera and interaction after map/runtime edits;
- make one source of truth for each piece of content;
- merge only after checking current `main` so parallel agents do not revert newer work.

## Current migration order

Town buildings and central exterior are data-driven. Finish the remaining Town static geometry/decor and remove redundant hardcoded Town drawing only when coverage is complete. Then create a Wilds manifest using the same runtime pattern. Ashwood and Cinder follow. Multi-floor/z-level gameplay comes after at least two zones use the same contract successfully.

## Agent self-prompt

When continuing Hoods, ask internally: "What is the smallest change that makes the game look or scale better without creating a second source of truth? Can this content become data instead of JavaScript? Does it preserve current gameplay and the Tibia-like separation of map layers, full-body outfits and equipment-set UI?"
