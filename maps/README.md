# Hoods map data

This folder is the incremental migration path from hardcoded Phaser world drawing to data-driven Tilemaps. GitHub remains the source of truth.

## Active now

- `town/town-core.json`: first migrated Town chunk. It overlays the existing Phaser world and keeps legacy gameplay as fallback.
- Bank and Old Bram's Shop now read their building bounds, doors, door trigger zones and perimeter collisions from this map data.
- The Inn is intentionally still legacy/hardcoded for the next migration step.
- Reusable tileset: `assets/maps/tiles/town-basic.svg`.

## Map contract

Every zone/chunk JSON should keep these layers:

- `ground`: walkable base tiles.
- `decor`: non-blocking scenery tiles.
- `collisions`: invisible blocking geometry. Precise object rectangles are supported during migration; tile collisions can be used where the grid fits.
- `roofs`: tiles rendered above actors.
- `objects`: data objects such as player/NPC spawns, buildings and doors.
- `triggers`: rectangular gameplay/location/door zones.

Map properties:

- `zoneId`: logical zone, for example `town`.
- `chunkId`: chunk identifier, for example `town-core`.
- `worldX`, `worldY`: position inside the current world coordinate system during migration.
- `zLevel`: floor/z-level. `0` is the current outdoor floor.

Objects can include a `z` property so later floors can reuse the same loader without changing the existing gameplay model.

## Migration order

1. Town core.
2. Town buildings/collisions: Bank + Shop migrated; Inn next.
3. Remaining Town geometry/spawns/triggers.
4. Wilds.
5. Ashwood.
6. Cinder.

Do not migrate multiple zones in one step. Existing hardcoded systems remain in place until the equivalent map-driven piece is verified.