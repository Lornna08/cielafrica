# Photo Books asset tools

- `rig.py` (Blender 4.2, `python3.11 -c "import sys; sys.argv=['x','--','out=r','res=720','ang=40']; exec(open('tools/pbk/rig.py').read())"`):
  renders the standing 3D book in four passes (mask, UV, diffuse light, gloss).
- `pack.py <passes-dir> <out.png> [width]`: packs the passes into the 3-tile map the site uses
  (`assets/pbk/book3d-*.png`). Two models: slim (`t=0.017`, up to 48 pages) and thick (`t=0.034`, 60+ pages);
  `render.js` picks one by page count.
- `build-3d.js`: renders every cover as a 3D book: `assets/pbk/c/3/*.webp` (440×550) and `c/3/xl/*.webp`
  (720×900, hero). Serve the repo with the `/photobooks` rewrites (e.g. `node srv.js` on :8792) first.
  Run it after changing `catalog.js`, `art.js` or the travel covers.
- `covers.py <scratch> <repo>`: travel covers → `assets/pbk/c/{f,p,a}` and `assets/pbk/covers.js`
  (f = flat cover, p = cover with the title removed, a = artwork cut out on a transparent background).
- `preview.html`: renders covers and 3D books in the browser for checking.
- `clean-covers.py` (run from a scratch folder holding the original `f/`, `p/`, `a/` and `covers.js`):
  removes the baked-in CIEL AFRICA mark (now drawn live, smaller and lower), the old years (now live,
  editable text, 2026 by default) and the title ghosts left on plates; detects which titles had a shadow.
  Detection data is in `clean/`.
- `maps.js <repo>`: back-cover map stickers (`assets/pbk/maps/*.svg`) from Natural Earth (world-atlas, public domain):
  the country with a pin on the place, cut out like a sticker, coloured to match each cover.
- `fluent.js`: copies the Fluent Emoji illustrations (Microsoft, MIT) used as stickers and cover art into
  `assets/pbk/fl/` with 112 px thumbnails (`fl/t/`) and the sticker index (`fl/index.js`).
