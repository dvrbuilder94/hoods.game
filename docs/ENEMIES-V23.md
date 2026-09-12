# Hoods Enemies V2.3

The first two Hoods enemies are `demon` and `dragon`. Both atlases are original Hoods pixel-grid art and use the same animation order as the V2.3 Wanderer.

## Runtime assets

- `assets/characters/v23/demon-v23.svg`
- `assets/characters/v23/demon-v23.json`
- `assets/characters/v23/dragon-v23.svg`
- `assets/characters/v23/dragon-v23.json`

## Shared atlas contract

| Property | Value |
| --- | --- |
| Logical frame | 80×80 px |
| Sheet size | 720×320 px |
| Grid | 9 columns × 4 rows |
| Directions | `down`, `left`, `right`, `up` |
| Actions | `idle` (1), `walk` (4), `attack` (4) |
| Anchor | normalized `0.5, 0.875` (pixel `40,70`) |
| Background | transparent |
| Sampling | nearest-neighbor |

Rows and columns match `CHARACTER-V23.md`: direction is selected by row; idle, walk, and attack are selected by column. Named JSON keys use `<enemy>.<action>.<direction>.<phase>`.

## Scale and world footprint

Visual size and navigation size are deliberately separate, as in classic tile-based MMORPGs.

| Creature | Visual scale vs. Wanderer | Navigation footprint | Collision body |
| --- | ---: | ---: | ---: |
| Wanderer | 1.00× | 1×1 tile | feet-area body owned by runtime |
| Demon | 1.25× | 1×1 tile | 24×16 px at feet |
| Dragon | 1.45× mass | 1×1 tile | 28×16 px at feet |

The larger 80×80 frame is visual overflow only. It gives horns, wings, tail, and attack effects room to extend above and beside the occupied tile. Pathfinding, melee adjacency, sorting, and collision must use `worldFootprint` and `anchorPixel` from JSON rather than the complete visual rectangle.

This keeps corridors and creature placement predictable while allowing bosses and large enemies to look physically larger. If a future enemy truly occupies multiple tiles, it must declare that explicitly in `worldFootprint`; display size alone must never imply it.

## Combat readability

- Demon: tall biped silhouette, red/charcoal palette, horn and wing landmarks, circular fire-claw attack.
- Dragon: broad quadruped silhouette, green scale palette, wings and tail landmarks, directional fire-breath attack.
- Attack contact occurs when phase 2 begins.
- Side directions are authored as separate atlas rows; the runtime must not flip rows dynamically.

## Integration note

No runtime or map file is changed by this enemy asset pass. Phaser can load either SVG as an 80×80 spritesheet. Set origin to `(0.5, 0.875)`, use integer display scale, and keep depth sorting tied to the anchor at the feet.
