# Hoods Character V2.3

This branch delivers an original Hoods full-body character animation source for later Phaser integration. Tibia is used only as a structural reference for compact top-down readability; no Tibia art is included.

## Files

- `assets/characters/v23/hood-wanderer-v23.svg` — authoritative visual spritesheet.
- `assets/characters/v23/hood-wanderer-v23.json` — exact named-frame metadata.
- `assets/characters/v23/wanderer-v23-body.svg` — fixed skin, face, hands, boots and shadow.
- `assets/characters/v23/wanderer-v23-hair.svg` — tintable hair layer.
- `assets/characters/v23/wanderer-v23-torso.svg` — tintable tunic layer.
- `assets/characters/v23/wanderer-v23-legs.svg` — tintable trousers layer.
- `assets/characters/v23/wanderer-v23-addon1.svg` — optional traveller cowl.
- `assets/characters/v23/wanderer-v23-addon2.svg` — optional shoulder mantle/satchel.

The SVG is intentionally the source asset: it preserves the current Hoods vector/pixel-grid workflow while using integer coordinates and `shape-rendering="crispEdges"`. If a future production build rasterizes it to PNG/WebP, keep the same 432×256 canvas and do not resample individual frames.

## Visual contract

| Property | Value |
| --- | --- |
| Logical frame | 48×64 px |
| Sheet size | 432×256 px |
| Grid | 9 columns × 4 rows |
| Directions | `down`, `left`, `right`, `up` |
| Actions | `idle` (1), `walk` (4), `attack` (4) |
| Rendering | nearest-neighbor / pixel art |
| Anchor | normalized `0.5, 0.875` (pixel `24,56`) |
| Feet baseline | y=56 |
| Background | transparent |

The anatomy is narrower than V1/V2, with a shaped torso, separated legs, compact hood, and asymmetric side views. The brown/charcoal/ochre palette deliberately continues the current Hoods identity.

## Frame order

Rows are directions; columns are actions and phases.

| Row | y | Direction |
| ---: | ---: | --- |
| 0 | 0 | `down` |
| 1 | 64 | `left` |
| 2 | 128 | `right` |
| 3 | 192 | `up` |

| Column | x | Frame |
| ---: | ---: | --- |
| 0 | 0 | `idle.0` |
| 1 | 48 | `walk.0` |
| 2 | 96 | `walk.1` |
| 3 | 144 | `walk.2` |
| 4 | 192 | `walk.3` |
| 5 | 240 | `attack.0` |
| 6 | 288 | `attack.1` |
| 7 | 336 | `attack.2` |
| 8 | 384 | `attack.3` |

Named keys in the JSON follow:

```text
wanderer.<action>.<direction>.<phase>
```

Examples: `wanderer.idle.down.0`, `wanderer.walk.left.2`, and `wanderer.attack.up.3`.

Do not derive `right` by flipping `left`; both rows are authored so facial, hood, arm, and attack silhouettes remain intentional.

## Animation timing

- Idle: frame 0 held; loop.
- Walk: frames 0 → 1 → 2 → 3 at 110 ms each; loop.
- Attack: frames 0 → 1 → 2 → 3 at 70, 70, 90, 110 ms; play once.
- Attack contact/hit event: when frame 2 begins. Gameplay must still own whether a hit succeeds.
- After attack frame 3, return to the matching directional idle frame.

The attack is an unarmed outfit motion with a subtle arc, not equipment layering. Equipment remains represented in the set/inventory UI as required by the existing architecture.

## Phaser handoff

`phaser-character.js` and `phaser-character-runtime.js` remain the owners of appearance and animation. V2.3 loads the six aligned sheets, applies independent tints to hair/torso/trousers, and toggles the two addon sheets. The chosen appearance is persisted under `hoods-appearance-v23` in local storage.

The inventory now exposes six hair colors, six torso colors, five trouser colors, and independent Addon 1 / Addon 2 toggles. These are cosmetic properties and never change equipment or combat stats.

Loading the grid directly is sufficient:

```js
this.load.spritesheet("wanderer-v23", "assets/characters/v23/hood-wanderer-v23.svg", {
  frameWidth: 48,
  frameHeight: 64
});
```

Phaser numeric frame index is `row * 9 + column`. Therefore:

```js
const directionRow = { down: 0, left: 1, right: 2, up: 3 };
const idleFrame = (direction) => directionRow[direction] * 9;
const walkFrames = (direction) =>
  [1, 2, 3, 4].map((column) => directionRow[direction] * 9 + column);
const attackFrames = (direction) =>
  [5, 6, 7, 8].map((column) => directionRow[direction] * 9 + column);
```

Set the sprite origin to `(0.5, 0.875)`, enable nearest-neighbor texture filtering, and avoid fractional display scale. Collision remains a small feet-area body controlled by the runtime; do not use the full 48×64 visual rectangle.

## Integration scope

V2.3 is integrated only through the existing Phaser character owners plus cache-busting references in `phaser.html`. It does not edit `play.html`, `hoods-v2.js`, map data, movement, collisions, combat values, equipment stats, or world rendering.
