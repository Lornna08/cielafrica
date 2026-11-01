# Photo Books asset tools

- `rig.py` (Blender 4.2, `python3.11 -c "import sys; sys.argv=['x','--','out=r','res=720','ang=40']; exec(open('tools/pbk/rig.py').read())"`):
  renders the standing 3D book in four passes (mask, UV, diffuse light, gloss).
- `pack.py <passes-dir> <out.png> [width]`: packs the passes into the 3-tile map the site uses
  (`assets/pbk/book3d-440.png` for the editor, `tools/pbk/book3d-720.png` for thumbnails).
- `build-3d.js`: renders every cover as a 3D book: `assets/pbk/c/3/*.webp` (440×550) and `c/3/xl/*.webp`
  (720×900, hero). Serve the repo with the `/photobooks` rewrites (e.g. `node srv.js` on :8792) first.
  Run it after changing `catalog.js`, `art.js` or the travel covers.
- `covers.py <scratch> <repo>`: travel covers → `assets/pbk/c/{f,p,a}` and `assets/pbk/covers.js`
  (f = flat cover, p = cover with the title removed, a = artwork cut out on a transparent background).
- `preview.html`: renders covers and 3D books in the browser for checking.
