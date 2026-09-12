# Hoods map data

This folder is the incremental migration path from hardcoded Phaser world drawing to data-driven Tilemaps. GitHub remains the source of truth.

## Active now

- `town/manifest.json`: Town registry. It declares reusable tilesets, ordered chunks, scene aliases and layer depths so the runtime does not need a new hardcoded loader function for every chunk.
- `town/town-core.json`: Town core chunk; owns Bank + Old Bram's Shop geometry, doors, triggers, collisions, player spawn and NPC spawns.
- `town/town-west.json`: The Inn geometry, collisions and interior art.
- `town/town-central-art.json`: Bank + Old Bram's Shop tile floors, walls and interior props while geometry remains owned by `town-core.json`.
- `town/town-exterior.json`: central Town grass, roads/plaza and static decor.
- `town/town-west-green.json`: west green + the west continuation of the main road.
- `town/town-south.json`: south green + continuation of the north/south road to the world edge.
- `town/town-east-gate.json`: temporary data-driven locked boundary until Ashwood itself is migrated.
- `assets/maps/tiles/town-basic.svg`: migration/base terrain tiles.
- `assets/maps/tiles/hoods-town-v1.svg`: original 32×32 Town tileset with terrain, floors, walls, doors, windows, furniture and props. Tile IDs are stable so art can improve without rewriting map JSON.

## Zone manifest contract

Each zone should eventually have `maps/<zone>/manifest.json`. The manifest owns:

- `zoneId`
- `tileSize`
- reusable `tilesets`
- ordered `chunks`
- optional per-chunk layer depths
- optional scene compatibility aliases during migration

Normal new chunks should require map data + one manifest entry only. Do not add another loader function for each chunk.

## Map contract

Every normal zone/chunk JSON should keep these layers:

- `ground`: walkable base tiles.
- `decor`: non-blocking scenery tiles and interior props.
- `collisions`: invisible blocking geometry. Precise object rectangles are supported during migration; tile collisions can be used where the grid fits.
- `roofs`: tiles rendered above actors.
- `objects`: data objects such as player/NPC spawns, buildings and doors.
- `triggers`: rectangular gameplay/location/door zones.

Map properties:

- `zoneId`: logical zone, for example `town`.
- `chunkId`: chunk identifier.
- `worldX`, `worldY`: position inside the world coordinate system.
- `zLevel`: floor/z-level. `0` is the current outdoor floor.

Objects can include a `z` property so later floors can reuse the same loader. A building uses `artSource=tilemap` once its legacy rectangle/furniture drawing has been replaced by map layers. Geometry and art may live in separate migration chunks temporarily, but should be consolidated when Town is finalized.

## Runtime API

`phaser-map-runtime.js` exposes the installed Town through:

- `scene.__hoodsTownChunks`
- `scene.__hoodsTownByZ`
- `scene.mapObject(name)`
- `scene.mapTrigger(name)`
- `scene.mapChunks(zLevel)`
- `scene.setMapZLevel(zLevel)`
- `window.HoodsMaps`

`setMapZLevel` now toggles map-layer visibility and map collision bodies, so the floor contract is functional even though current gameplay remains on z=0. Location triggers run after the old fallback label logic so map data is the final source of truth where a zone trigger exists.

## Validation

`scripts/validate-maps.mjs` checks the manifest/chunk contract, required layers, properties, tilesets, collision dimensions and duplicate object names. `.github/workflows/validate-maps.yml` runs it whenever map/runtime files change.

## Migration order

1. Town core.
2. Town buildings/collisions: Bank + Shop + Inn migrated.
3. Building art using `hoods-town-v1`.
4. Central Town exterior.
5. Manifest-driven Town loading.
6. West/south Town edges and map-owned location triggers.
7. Finish the east approach and remove redundant Town fallback drawing only after mobile validation.
8. Wilds using the same manifest/chunk contract.
9. Ashwood.
10. Cinder.
11. Additional floors/stairs once at least two zones use the same contract successfully.

Do not migrate multiple zones in one step. Existing hardcoded systems remain in place until the equivalent map-driven piece is verified.
