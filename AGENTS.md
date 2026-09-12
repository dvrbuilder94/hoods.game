# Hoods agent rules

This repository is worked on by multiple AI agents in parallel. Read this file and `docs/ARCHITECTURE.md` before editing.

## Source of truth

- GitHub `main` is the source of truth.
- Always inspect current `main` immediately before starting and again before merging.
- Do not overwrite newer work because your branch started from an older commit.
- Prefer a focused branch + PR when another agent is editing the same area.
- Never merge an outdated parallel implementation just because it is mergeable; compare it with `main` first.

## Product architecture

Use Tibia as a structural benchmark, not as an asset/code source: compact top-down characters, full-body outfits, equipment shown in a set UI, layered data-driven maps, small zones and reusable tilesets.

Do not copy proprietary Tibia assets.

### Maps

- Map content goes in Tiled-compatible JSON under `maps/<zone>/`.
- A zone manifest owns which chunks and tilesets are loaded.
- Standard layers: `ground`, `decor`, `collisions`, `roofs`, `objects`, `triggers`.
- Standard properties: `zoneId`, `chunkId`, `worldX`, `worldY`, `zLevel`.
- New normal Town chunks require map JSON + a `maps/town/manifest.json` entry, not another loader function.
- Run/observe the `Validate Hoods contracts` workflow after map/runtime edits.
- Migration order remains Town -> Wilds -> Ashwood -> Cinder. Do not convert multiple zones in one change.

### Characters

- `phaser-character.js` + `phaser-character-runtime.js` own world character appearance.
- Human outfits use the shared 48x64, four-direction animation contract.
- Appearance is a complete outfit/skin. Do not build RuneScape-style armor layering by default.
- NPCs should reuse the same anatomy/animation language.

### Equipment

- Equipment slots: helmet, armor, weapon, shield, legs, boots.
- Gear affects gameplay stats and appears in the equipment set/inventory UI.
- Gear does not redraw the world character.
- Outfit/skin is separate from equipment and has no combat stats.

## Keep scope disciplined

Unless a task explicitly asks for them, do not add multiplayer, blockchain/token mechanics, Supabase, a new backend, or unrelated systems.

Do not use Lovable for repository implementation. Work in GitHub.

## Safe delivery

- Small coherent commits.
- Preserve legacy fallback while an equivalent data-driven system is still being validated.
- Never invent duplicate sources of truth.
- Validate mobile movement, camera, collisions, entrances, NPC interaction and inventory after touching their runtimes.
- If a change is visual-only, do not silently change gameplay values.
- If a change is architectural-only, keep the current playable build working.

Before each change ask: **What is the smallest improvement that makes Hoods look better or scale better without creating a second source of truth?**
