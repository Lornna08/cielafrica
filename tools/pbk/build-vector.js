/* Renders mockup thumbnails (550×710 WebP) for every illustrated cover and colour option.
   Needs the site served on http://localhost:8800 (python3 -m http.server 8800 from the repo root).
   Usage: node tools/pbk/build-vector.js */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = path.join(__dirname, '../../assets/pbk/c/m');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('E:', e.message));
  await p.goto('http://localhost:8800/tools/pbk/preview.html');
  const list = await p.evaluate(async () => {
    const R = PBKR, C = PBKCat, map = await R.mockMap('/tools/pbk/mockmap.png'), res = [];
    const jobs = [];
    C.ORDER.forEach(id => { const t = C.TPL[id]; if (t.kind === 'vector') t.palettes.forEach((_, i) => jobs.push([id, i, t.cat + '-' + t.slug + '-' + i])); });
    C.BLANK.forEach((_, i) => jobs.push(['blank', i, 'blank-' + i]));
    for (const [id, i, name] of jobs) {
      const flat = await R.toCanvas(C.docFor(id, i), 1200);
      const m = R.mock(flat, map);
      const s = document.createElement('canvas'); s.width = 550; s.height = 710;
      const x = s.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(m, 0, 0, 550, 710);
      res.push([name, s.toDataURL('image/webp', 0.86)]);
    }
    return res;
  });
  list.forEach(([n, d]) => fs.writeFileSync(path.join(out, n + '.webp'), Buffer.from(d.split(',')[1], 'base64')));
  console.log(list.length, 'mockups');
  await b.close();
})();
