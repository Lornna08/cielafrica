/* Run from the repo root: node tests/meta-pixel.e2e.js  (needs Playwright with Chromium). */
/* Photo books: AddToCart from the editor's shop, InitiateCheckout, failed and confirmed M-Pesa payment,
   the Paybill-by-hand confirmation, admin test orders and the WhatsApp order. Same recorder and mocks as pxe2e.js. */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const RECORDER = `(function(){var f=window.fbq;if(!f)return;function log(a){try{var l=JSON.parse(sessionStorage.getItem('__pxlog')||'[]');l.push({u:location.pathname+location.search,a:JSON.parse(JSON.stringify([].slice.call(a)))});sessionStorage.setItem('__pxlog',JSON.stringify(l));}catch(e){}}
f.callMethod=function(){log(arguments);};var q=f.queue||[];f.queue=[];q.forEach(function(a){log(a);});})();`;
let PAY = 'failed', MANUAL = 'pending'; const results = [];
function file(u) { let p = decodeURIComponent(u.pathname); if (/^\/photobooks(\/|$)/.test(p) && !path.extname(p)) p = '/photobooks/index.html'; let f = path.join(ROOT, p); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html'; return fs.existsSync(f) ? f : null; }
function api(q) {
  if (q === 'pbk-caps') return { ok: true, payments: true, uploads: false, manual: true };
  if (q === 'pbk-pay') return { ok: true, ref: 'PB-TEST' + PAY.toUpperCase(), intent: 'in-' + PAY, amount: 3850 };
  if (q === 'pbk-status') return PAY === 'paid' ? { ok: true, status: 'paid', ref: 'PB-TESTPAID', receipts: [] } : { ok: true, status: 'failed', desc: 'Cancelled by user.' };
  if (q === 'pbk-manual-status') return { ok: true, status: MANUAL, receipts: [] };
  if (q === 'pbk-wa') return { ok: true, ref: 'PB-WA1', receipts: [] };
  return { ok: true };
}
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|_vercel\/insights/, r => r.fulfill({ status: 200, body: '' }));
  await ctx.route(/connect\.facebook\.net\/.*fbevents\.js/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: RECORDER }));
  await ctx.route(/^https:\/\/cielafrica\.com\//, r => { const u = new URL(r.request().url());
    if (u.pathname.startsWith('/api/')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(api(u.searchParams.get('route'))) });
    const f = file(u); if (!f) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(p.url() + ' :: ' + e.message));
  p.on('popup', pp => pp.close().catch(() => { }));
  const log = () => p.evaluate(() => JSON.parse(sessionStorage.getItem('__pxlog') || '[]'));
  const clear = () => p.evaluate(() => sessionStorage.setItem('__pxlog', '[]'));
  const evs = l => l.filter(x => x.a[0] === 'track').map(x => ({ ev: x.a[1], p: x.a[2] || {}, id: x.a[3] && x.a[3].eventID }));
  const of = (l, ev) => evs(l).filter(e => e.ev === ev);
  const check = (n, ok, d) => results.push([ok ? 'PASS' : 'FAIL', n, d || '']);

  await p.goto('https://cielafrica.com/photobooks', { waitUntil: 'load' }); await p.waitForTimeout(2500);
  await p.evaluate(() => localStorage.removeItem('ciel_cart_v1'));
  /* a 24-page travel book saved on this device, as the editor would */
  await p.evaluate(() => { const pages = []; for (let i = 0; i < 24; i++) pages.push({ els: [] }); return PBStore.saveProject({ id: 'pbtest1', app: 'pbk', tpl: 'travel/zanzibar', name: 'Our Zanzibar', cover: { els: [] }, pages: pages, createdAt: Date.now() }); });
  await clear();
  await p.evaluate(() => PBStore.project('pbtest1').then(pr => PBKShop.add(pr, 'print'))); await p.waitForTimeout(800);
  let l = await log(), atc = of(l, 'AddToCart');
  check('AddToCart when a photo book is added', atc.length === 1 && atc[0].p.content_ids[0] === 'pb-print' && atc[0].p.value > 0 && atc[0].p.currency === 'KES' && atc[0].p.content_category === 'Photo Books', JSON.stringify(atc[0] && atc[0].p));

  await p.evaluate(() => { ['cartDrawer', 'cartOv'].forEach(id => { const e = document.getElementById(id); if (e) e.classList.remove('on'); }); });
  await clear(); await p.evaluate(() => PBK.go('/photobooks/checkout')); await p.waitForTimeout(2500);
  l = await log(); const ic = of(l, 'InitiateCheckout');
  check('InitiateCheckout once, when photo book checkout opens', ic.length === 1 && ic[0].p.value === atc[0].p.value, JSON.stringify(ic[0] && ic[0].p));
  check('PageView for the checkout page change, no ViewContent there', of(l, 'PageView').length === 1 && of(l, 'ViewContent').length === 0);

  /* fill the delivery details */
  const fill = async () => {
    for (const [k, v] of [['name', 'Test Person'], ['phone', '0712345678'], ['email', 'test@example.com'], ['line1', 'Test Street 1'], ['area', 'Westpark'], ['town', 'Testtown'], ['county', 'Kiambu']]) {
      const el = await p.$('[data-f="' + k + '"]'); if (el) { await el.fill(v); await el.dispatchEvent('input'); } }
    const d = await p.$('input[name=del]'); if (d) { await d.check().catch(() => { }); await p.waitForTimeout(400); }
    const m = await p.$('input[name=pm][value="mpesa"],input[name=pm][value="stk"]'); if (m) { await m.check().catch(() => { }); await p.waitForTimeout(300); }
  };
  await fill(); await clear();
  const pay = await p.$('#coPay');
  if (!pay) check('Photo books pay button present', false, await p.$eval('#coMain', e => e.textContent.slice(0, 200)));
  else {
    await pay.click(); await p.waitForTimeout(6500);
    l = await log(); const st = await p.$eval('#coStatus', e => e.textContent).catch(() => '');
    check('Photo books: failed M-Pesa payment sends no Purchase', of(l, 'Purchase').length === 0 && /not completed|Cancelled/i.test(st), st.slice(0, 80));
    PAY = 'paid'; await clear(); await fill();
    await p.click('#coPay'); await p.waitForTimeout(7500);
    l = await log(); const pu = of(l, 'Purchase');
    check('Photo books: Purchase once M-Pesa confirms, with the amount charged', pu.length === 1 && pu[0].p.value === 3850 && pu[0].p.currency === 'KES' && pu[0].id === 'pb-PB-TESTPAID', JSON.stringify(pu[0]));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(2500);
    l = await log(); check('Photo books: reopening the order page doesn’t repeat Purchase', of(l, 'Purchase').length === 1);
  }

  /* Paybill paid by hand: Purchase only when Ciel Africa confirms it */
  await p.evaluate(() => localStorage.setItem('pbk_manual', JSON.stringify([{ ref: 'PB-MAN1', intent: 'man1', at: Date.now(), total: 3850, items: [{ projectId: 'pbtest1', name: 'Our Zanzibar', product: 'print', pages: 24 }] }])));
  await clear(); MANUAL = 'pending';
  await p.evaluate(() => PBKShop.manualCheck(PBKShop.manualList()[0])); await p.waitForTimeout(500);
  l = await log(); check('Paybill by hand: no Purchase while it is unconfirmed', of(l, 'Purchase').length === 0);
  MANUAL = 'paid';
  await p.evaluate(() => PBKShop.manualCheck(PBKShop.manualList()[0])); await p.waitForTimeout(800);
  l = await log(); const mp = of(l, 'Purchase');
  check('Paybill by hand: Purchase once Ciel Africa confirms it', mp.length === 1 && mp[0].p.value === 3850 && mp[0].id === 'pb-PB-MAN1', JSON.stringify(mp[0]));

  /* WhatsApp order: Contact */
  await p.evaluate(() => PBStore.project('pbtest1').then(pr => PBKShop.add(pr, 'print', { silent: true }))); await p.waitForTimeout(500);
  await p.evaluate(() => PBK.go('/photobooks/checkout')); await p.waitForTimeout(2500); await fill(); await clear();
  const wa = await p.$('#coWa'); if (wa) { await wa.click(); await p.waitForTimeout(1500); }
  l = await log(); const ct = of(l, 'Contact');
  check('WhatsApp order from photo book checkout: Contact', !!wa && ct.length === 1 && ct[0].p.content_name === 'WhatsApp order', wa ? JSON.stringify(ct) : 'no WhatsApp button');

  check('No script errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  for (const r of results) console.log(r[0].padEnd(5), r[1], r[2] ? '— ' + r[2] : '');
  console.log(results.filter(r => r[0] === 'PASS').length + ' passed, ' + results.filter(r => r[0] === 'FAIL').length + ' failed');
})();
