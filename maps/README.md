# Hoods map data

This folder is the incremental migration path from hardcoded Phaser world drawing to data-driven Tilemaps. GitHub remains the source of truth.

## Active now

- `town/town-core.json`: first migrated chunk only. It overlays the existing Phaser world and keeps legacy gameplay as fallback.
- Reusable tileset: `assets/maps/tiles/town-basic.svg`.

## Map contract

Every zone/chunk JSON should keep these layers:

- `ground`: walkable base tiles.
- `decor`: non-blocking scenery tiles.
- `collisions`: blocking tiles. Invisible at runtime.
- `roofs`: tiles rendered above actors.
- `objects`: data objects such as player/NPC spawns and doors.
- `triggers`: rectangular gameplay/location zones.

Map properties:

- `zoneId`: logical zone, for example `town`.
- `chunkId`: chunk identifier, for example `town-core`.
- `worldX`, `worldY`: position inside the current world coordinate system during migration.
- `zLevel`: floor/z-level. `0` is the current outdoor floor.

Objects can include a `z` property so later floors can reuse the same loader without changing the existing gameplay model.

## Migration order

1. Town core (current step).
2. Remaining Town geometry/buildings/collisions.
3. Wilds.
4. Ashwood.
5. Cinder.

Do not migrate multiple zones in one step. Existing hardcoded systems remain in place until the equivalent map-driven piece is verified.