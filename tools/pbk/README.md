# Photo Books asset tools

- `covers.py <scratch> <repo>`: turns the processed travel covers into `assets/pbk/c/{f,p,m}/*.webp` and `assets/pbk/covers.js`.
  Inputs are the flat covers (1200×1600, spine side padded), title-free plates and normalised mockups produced from the
  source mockup PNGs (Ciel_Africa_covers.zip). A cover is "editable" when its title could be removed cleanly; its title and
  subtitle are then redrawn as live text in League Spartan.
- `build-vector.js`: renders mockup thumbnails for every illustrated cover and colour option (needs the site on
  http://localhost:8800). Run it after changing `assets/pbk/catalog.js` or `assets/pbk/art.js`.
- `mockmap.png`: full-size shading map of the book mockup (R = multiply ×1.5, G = add, A = silhouette); the site uses
  `assets/pbk/mockmap-sm.png`.
- `preview.html`: renders covers in the browser for checking.
