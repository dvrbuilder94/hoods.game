# Hoods RPG benchmark — GitHub references

This document is the visual/architecture reference for Hoods. We use the patterns, not copyrighted Tibia art.

## 1) OTClient — `edubart/otclient`

License: MIT.

Useful references:
- `src/client/tile.cpp`
- `src/client/mapview.cpp`
- `modules/game_inventory/inventory.otui`
- `modules/game_outfit/outfitwindow.otui`

Patterns to copy conceptually:

### Tile stack, not giant scene illustrations
OTClient renders a tile as an ordered stack: ground -> ground borders -> bottom objects/walls -> normal items -> creatures -> top objects. Hoods should follow the same idea. Buildings, roads and walls belong to map/tile data, not one huge `Graphics` world drawing.

### Floors are first-class
Map rendering explicitly tracks first/last visible floor and renders by z-level. Hoods keeps `zLevel` in map data and must make visibility/collision depend on it.

### Small aware area / camera-centered rendering
The world can be huge while the client reasons about a small visible tile area. Hoods chunks should stay small and composable instead of becoming one continent JSON.

### Equipment UI is a slot grid
The inventory UI has fixed equipment positions (head, body, legs, feet, left/right hand, backpack, ring, ammo, etc.). It is not a full-screen SaaS list. Hoods equipment should be a compact slot grid; backpack content is secondary.

### Outfit is separate from equipment
OTClient has a dedicated outfit window and dedicated equipment window. Hoods follows the same boundary: outfit = appearance; equipment = stats/items.

## 2) Tibia map data — `tibiamaps/tibia-map-data`

The public map-data project stores separate data per floor. The important lesson for Hoods is not the PNG format itself; it is that floors are independent, stable units of world data.

Patterns for Hoods:
- explicit floor/z identifier;
- world data independent from player/gameplay logic;
- map content can be regenerated/validated without editing the gameplay scene;
- pathfinding/collision data is a separate concern from visual map imagery.

## 3) Universal LPC — `LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator`

Useful as a character-pipeline benchmark, not as the target art style. LPC standardizes compatible character bases, directions, animations and metadata. Individual assets have different licenses and attribution requirements, so Hoods should not import arbitrary LPC artwork without checking each asset.

Pattern for Hoods:
- one stable humanoid frame contract;
- 4 directions;
- deterministic animation frame names;
- outfit metadata separate from the animation engine;
- new skins can be added without changing player movement code.

## Hoods target stack

For new map content the renderer should support, in order:

1. `ground`
2. `groundBorders`
3. `walls`
4. `decorBottom`
5. actors / creatures
6. `decorTop`
7. `roofs`
8. UI/text (outside map data)

Legacy `decor` remains supported during migration, but new golden-slice content should use the explicit layers above.

## Non-negotiable rules from this benchmark

- Do not draw new buildings/roads/trees in `TownScene.drawWorld()`.
- Do not add giant building blockers in `TownScene.createSolids()` for map-driven buildings.
- New world content is map data + tilesets + object/trigger data.
- Player/NPC appearance never depends on equipped helmet/armor/weapon sprites.
- Equipment UI is compact slots; backpack is a separate list/container.
- Do not expand to Wilds/Ashwood/Cinder until Town golden slice looks acceptable.
- Do not copy Tibia sprites, maps, UI images or proprietary assets.
