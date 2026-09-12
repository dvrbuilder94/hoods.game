# Hoods map data

This folder is the incremental migration path from hardcoded Phaser world drawing to data-driven Tilemaps. GitHub remains the source of truth.

## Active now

- `town/town-core.json`: first migrated Town chunk. It overlays the existing Phaser world and keeps legacy gameplay as fallback.
- Bank and Old Bram's Shop read their building bounds, doors, door trigger zones and perimeter collisions from this map data.
- `town/manifest.json`: scalable chunk manifest for Town.
- `town/inn-pilot.json`: first building whose interior art, geometry, collisions and triggers live in map data.
- `assets/maps/tiles/hoods-town-v1.svg`: original 32×32 Hoods town tileset with floors, walls, doors, furniture and props.
- `phaser-chunks-runtime.js`: manifest/chunk loader. During validation it is opt-in with `?chunks=v1`; the normal build keeps the current fallback path.

## Map contract

Every zone/chunk JSON should keep these layers:

- `ground`: walkable base tiles.
- `decor`: non-blocking scenery tiles and furniture.
- `collisions`: invisible blocking geometry. Precise object rectangles are supported during migration; tile collisions can be used where the grid fits.
- `roofs`: tiles rendered above actors.
- `objects`: data objects such as player/NPC spawns, buildings and doors.
- `triggers`: rectangular gameplay/location/door zones.

Map properties:

- `zoneId`: logical zone, for example `town`.
- `chunkId`: chunk identifier, for example `town-inn-pilot`.
- `worldX`, `worldY`: position inside the current world coordinate system during migration.
- `zLevel`: floor/z-level. `0` is the current outdoor floor.

Objects can include a `z` property so later floors can reuse the same loader without changing the existing gameplay model. Buildings can set `artSource=tilemap` once their visual interior is fully represented by map layers; until then the legacy Phaser art remains the fallback.

## Chunk rules

1. Use a 32×32 tile grid.
2. Keep each chunk independently loadable; do not build one giant Town JSON.
3. Register new chunks in the zone manifest instead of hardcoding URLs in gameplay code.
4. Keep gameplay state outside the map. Maps define geometry, visuals, objects and triggers; quests/combat/economy remain systems.
5. Migrate one verified area at a time and preserve legacy fallback until the replacement is proven on desktop and mobile.

## Migration order

1. Town core.
2. Inn pilot with Hoods Town Tileset v1.
3. Remaining Town buildings, geometry, spawns and triggers.
4. Split Town into production chunks and enable chunk loading by default.
5. Wilds.
6. Ashwood.
7. Cinder.
8. Add higher/lower `zLevel` floors and stairs after Town is stable.

Do not migrate multiple zones in one step. Existing hardcoded systems remain in place until the equivalent map-driven piece is verified.