/* Renders the 3D book thumbnails for every cover (assets/pbk/c/3/*.webp, 440×550) and large hero
   versions (assets/pbk/c/3/xl/*.webp, 720×900). Needs the site served on http://localhost:8792
   (any static server with the /photobooks rewrites is fine; preview.html is the only page used).
   Usage: node tools/pbk/build-3d.js [filter] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const XL = ['kenya-nairobi-0', 'kenya-mombasa-0', 'kenya-serengeti-0', 'kenya-kenya-0', 'kenya-kenya-wild-0', 'travel-paris', 'travel-zanzibar', 'travel-tokyo', 'travel-ibiza', 'couple-our-story-0', 'travel-lisbon', 'travel-greece', 'baby-hello-baby-0', 'friends-besties-0', 'event-cheers-0', 'travel-new-york', 'travel-senegal', 'travel-madagascar', 'travel-south-africa', 'pets-good-boy-0', 'travel-mexico', 'travel-sicily', 'family-home-0', 'blank-0'];
(async () => {
  const filter = process.argv[2] || '';
  const out = path.join(__dirname, '../../assets/pbk/c/3');
  fs.mkdirSync(path.join(out, 'xl'), { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.log('E:', e.message));
  await p.goto('http://localhost:8792/tools/pbk/preview.html');
  const jobs = await p.evaluate((filter) => {
    const C = PBKCat, J = [];
    C.ORDER.forEach(id => { const t = C.TPL[id]; if (t.kind === 'vector') t.palettes.forEach((_, i) => J.push([id, i, t.cat + '-' + t.slug + '-' + i])); else J.push([id, 0, 'travel-' + t.slug]); });
    C.BLANK.forEach((_, i) => J.push(['blank', i, 'blank-' + i]));
    return J.filter(j => !filter || j[2].indexOf(filter) >= 0);
  }, filter);
  console.log(jobs.length, 'books');
  for (let k = 0; k < jobs.length; k += 8) {
    const batch = jobs.slice(k, k + 8);
    const res = await p.evaluate(async ([batch, XL]) => {
      const R = PBKR, C = PBKCat, out = [];
      for (const [id, pi, name] of batch) {
        const doc = C.docFor(id, pi);
        const m = await R.renderBook(doc, C.spineFor(doc, id, pi), { pages: 24, large: true, px: 1200 });
        const s = document.createElement('canvas'); s.width = 440; s.height = 550;
        const x = s.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(m, 0, 0, 440, 550);
        out.push([name, s.toDataURL('image/webp', 0.86), XL.indexOf(name) >= 0 ? m.toDataURL('image/webp', 0.86) : null]);
      }
      return out;
    }, [batch, XL]);
    res.forEach(([n, d, xl]) => { fs.writeFileSync(path.join(out, n + '.webp'), Buffer.from(d.split(',')[1], 'base64')); if (xl) fs.writeFileSync(path.join(out, 'xl', n + '.webp'), Buffer.from(xl.split(',')[1], 'base64')); });
    process.stdout.write('.');
  }
  console.log('\ndone');
  await b.close();
})();
