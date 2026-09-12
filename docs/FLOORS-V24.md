# Hoods V2.4 vertical floors

This pass adds a Tibia-like vertical slice without creating a second map engine.

- `z=0` remains the current Town surface.
- Buildings can declare `frontSide` and `revealMargin`; their roof stays revealed while the player is just outside the facade as well as while inside.
- `vertical.levels` in `maps/town-v2/town-square.json` defines reusable non-surface floor rooms.
- `vertical.transitions` defines stair links between z-levels.
- `v24-floor-system.js` mounts on the current HoodsV2 scene, renders only the active non-surface level above an occlusion plane, adds temporary level-wall collisions, moves the player between stair anchors, and restores the surface when returning to z=0.

This is intentionally a vertical-slice implementation for Town. Future Tiled chunks should preserve the same data contract (`z`, `rect`, `floor`, `props`, transitions) instead of hardcoding more floor logic in JavaScript.
