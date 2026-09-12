# Hoods enemies V2.4.1

Demon and Dragon are integrated into the canonical `play.html` build.

- Atlas: 9 columns × 4 directions, 80×80 px logical frames.
- Direction rows: down, left, right, up.
- Columns: idle (0), walk (1–4), attack (5–8).
- World footprint: one 32×32 tile each; collision bodies stay at the feet (24×16 Demon, 28×16 Dragon).
- The visual can extend above the tile, while depth sorting and navigation use the feet anchor.
- Assets use nearest-neighbor sampling to match the existing Tibia-like pixel style.
