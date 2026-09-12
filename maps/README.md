# Hoods map data

This folder is the incremental migration path from hardcoded Phaser world drawing to data-driven Tilemaps. GitHub remains the source of truth.

## Active now

- `town/town-core.json`: Town core chunk; owns Bank + Old Bram's Shop geometry, doors, triggers, collisions, player spawn and NPC spawns.
- `town/town-west.json`: west Town chunk; owns The Inn geometry, collisions and map-driven interior art.
- `town/town-central-art.json`: P5 art chunk for Bank + Old Bram's Shop. It contains their tile floors, walls and interior props while geometry remains owned by `town-core.json`.
- `town/town-exterior.json`: P6 exterior chunk for central Town grass, roads/plaza and static decor. It replaces the legacy static plaza/road dressing when loaded.
- `town/town-east-gate.json`: temporary data-driven locked boundary until Ashwood itself is migrated.
- `assets/maps/tiles/town-basic.svg`: migration/base terrain tiles.
- `assets/maps/tiles/hoods-town-v1.svg`: original 32×32 production-oriented Town tileset with floors, walls, doors, windows, furniture and props. Inn, Bank, Shop and central Town exterior now use it.

## Map contract

Every zone/chunk JSON should keep these layers:

- `ground`: walkable base tiles.
- `decor`: non-blocking scenery tiles and interior props.
- `collisions`: invisible blocking geometry. Precise object rectangles are supported during migration; tile collisions can be used where the grid fits.
- `roofs`: tiles rendered above actors.
- `objects`: data objects such as player/NPC spawns, buildings, doors and temporary art-source markers during migration.
- `triggers`: rectangular gameplay/location/door zones.

Map properties:

- `zoneId`: logical zone, for example `town`.
- `chunkId`: chunk identifier, for example `town-core`, `town-west`, `town-central-art` or `town-exterior`.
- `worldX`, `worldY`: position inside the current world coordinate system during migration.
- `zLevel`: floor/z-level. `0` is the current outdoor floor.

Objects can include a `z` property so later floors can reuse the same loader without changing the existing gameplay model. A building uses `artSource=tilemap` once its legacy rectangle/furniture drawing has been replaced by map layers. Geometry and art may live in separate migration chunks temporarily, but should be consolidated when Town is finalized.

## Migration order

1. Town core.
2. Town buildings/collisions: Bank + Shop + Inn migrated.
3. The Inn art pilot using `hoods-town-v1`.
4. Bank + Shop art using `hoods-town-v1`.
5. Central Town exterior paths/plaza/static decor using `town-exterior.json`.
6. Finish remaining Town hardcoded exterior edges/spawns/triggers and consolidate temporary chunks where useful.
7. Wilds.
8. Ashwood.
9. Cinder.
10. Add additional `zLevel` floors and stairs once Town is stable.

Do not migrate multiple zones in one step. Existing hardcoded systems remain in place until the equivalent map-driven piece is verified.