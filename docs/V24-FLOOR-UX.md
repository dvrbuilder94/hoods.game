# Hoods V2.4.1 floor UX

Vertical transitions must be obvious and forgiving.

- Surface stairs/trapdoors render above the interior floor and remain visually legible when a building roof is revealed.
- A transition has a visible label (`CELLAR`, `UPPER FLOOR`, etc.).
- Approaching within roughly one tile shows a contextual prompt.
- Walking onto the transition uses a generous trigger radius instead of requiring pixel-perfect centering.
- `E` also activates the nearest vertical transition when in range.
- HUD location includes the active z-level away from the surface.

The transition coordinates and destinations remain data-driven in `maps/town-v2/town-square.json`.
