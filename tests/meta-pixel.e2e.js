/* Run from the repo root: node tests/meta-pixel.e2e.js  (needs Playwright with Chromium). */
/* End-to-end check of the Meta events on a local copy of cielafrica.com.
   The site is served as https://cielafrica.com from the repo; Meta's fbevents.js is replaced by a
   recorder that logs every fbq() call (event, parameters, eventID) to sessionStorage, so events
   survive redirects. APIs are mocked: payments can be made to succeed or fail. No real payment. */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), FX = JSON.parse(fs.readFileSync(__dirname + '/fx/fixture.json')), DMCFG = fs.readFileSync(__dirname + '/fx/config.json', 'utf8');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const RECORDER = `(function(){var f=window.fbq;if(!f)return;function log(a){try{var l=JSON.parse(sessionStorage.getItem('__pxlog')||'[]');l.push({u:location.pathname+location.search,a:JSON.parse(JSON.stringify([].slice.call(a)))});sessionStorage.setItem('__pxlog',JSON.stringify(l));}catch(e){}}
f.callMethod=function(){log(arguments);};var q=f.queue||[];f.queue=[];q.forEach(function(a){log(a);});})();`;
const results = []; let PAY = 'paid';
function file(u) {
  let p = decodeURIComponent(u.pathname);
  if (p === '/') p = '/index.html';
  if (/^\/photobooks(\/|$)/.test(p) && !path.extname(p)) p = '/photobooks/index.html';
  if (p === '/domains/terms') p = '/domains-terms.html';
  let f = path.join(ROOT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  return fs.existsSync(f) ? f : null;
}
function api(u, body) {
  const p = u.pathname, q = u.searchParams.get('route');
  if (p === '/api/contact') return { ok: true };
  if (p === '/api/stkpush') return { ok: true, checkoutRequestID: 'ws_CO_TEST_' + Date.now(), amount: body.amount };
  if (p === '/api/stkquery') return { status: PAY };
  if (p.startsWith('/api/domains/')) {
    const r = p.replace('/api/domains/', '');
    if (r === 'config') return JSON.parse(DMCFG);
    if (r === 'search') return /\./.test(body.q) ? FX.search_explicit : FX.search;
    if (r === 'check') return { ok: true, results: body.domains.map(d => FX.checks[d]), invalid: [] };
    if (r === 'quote') return { ok: true, quote: { domain: body.domain, years: body.years || 1, firstYear: 1700, renewal: 1700, total: 1700, tax: 0, tax_rate: 0 }, availability: FX.checks[body.domain], ordering: true, payments: { mpesa: true, card: false } };
    if (r === 'order') return { ok: true, token: 'tok_test', ref: 'DM-TEST1' };
    if (r === 'pay') return PAY === 'paid' ? { ok: true, crid: 'c1', at: 1 } : { ok: true, crid: 'c1', at: 1 };
    if (r === 'status') return { ok: true, status: PAY };
  }
  if (p === '/api/photobooks') {
    if (q === 'pbk-caps') return { ok: true, payments: true, uploads: false };
    if (q === 'pbk-pay') return { ok: true, ref: 'PB-TEST1', intent: 'in1', amount: 4350 };
    if (q === 'pbk-status') return PAY === 'paid' ? { ok: true, status: 'paid', ref: 'PB-TEST1', receipts: [] } : { ok: true, status: 'failed', desc: 'Cancelled by user.' };
    return { ok: true };
  }
  if (p === '/api/hq') return { ok: true };
  return { ok: true };
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|_vercel\/insights/, r => r.fulfill({ status: 200, body: '' }));
  await ctx.route(/connect\.facebook\.net\/.*fbevents\.js/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: RECORDER }));
  await ctx.route(/facebook\.com\/tr/, r => r.fulfill({ status: 200, body: '' }));
  await ctx.route(/^https:\/\/(www\.)?cielafrica\.com\//, async r => {
    const u = new URL(r.request().url());
    if (u.pathname.startsWith('/api/')) { let body = {}; try { body = JSON.parse(r.request().postData() || '{}'); } catch (e) { } return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(api(u, body)) }); }
    const f = file(u); if (!f) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(p.url() + ' :: ' + e.message + ' :: ' + (e.stack || '').split('\n')[1]));
  const S = 'https://cielafrica.com';
  const log = () => p.evaluate(() => JSON.parse(sessionStorage.getItem('__pxlog') || '[]'));
  const clear = () => p.evaluate(() => sessionStorage.setItem('__pxlog', '[]'));
  const evs = l => l.filter(x => x.a[0] === 'track').map(x => ({ ev: x.a[1], p: x.a[2] || {}, id: x.a[3] && x.a[3].eventID, u: x.u }));
  const count = (l, ev) => evs(l).filter(e => e.ev === ev).length;
  function check(name, ok, detail) { results.push([ok ? 'PASS' : 'FAIL', name, detail || '']); }
  const go = async (u, ms = 900) => { await p.goto(S + u, { waitUntil: 'load' }); await p.waitForTimeout(ms); };

  /* 1 PageView: once per page load, base code only once */
  await go('/'); let l = await log();
  check('PageView fires once on the homepage', count(l, 'PageView') === 1, JSON.stringify(evs(l).map(e => e.ev)));
  check('Pixel initialised exactly once', l.filter(x => x.a[0] === 'init').length === 1 && (await p.evaluate(() => document.querySelectorAll('script[src*="fbevents.js"]').length)) === 1);
  check('No ViewContent on the homepage', count(l, 'ViewContent') === 0);
  await clear(); await go('/'); l = await log(); check('Reload: one new PageView, not two', count(l, 'PageView') === 1);

  /* 2 ViewContent on service, product, template and photo book pages */
  for (const [u, want] of [['/services', 'Services'], ['/products', 'Products'], ['/templates', 'Website templates'], ['/mokara/', 'Mokara (live template)'], ['/domains', 'Domains'], ['/photobooks', 'Photo Books']]) {
    await clear(); await go(u, 1500); l = await log(); const vc = evs(l).filter(e => e.ev === 'ViewContent');
    check('ViewContent on ' + u, count(l, 'PageView') === 1 && vc.length === 1 && vc[0].p.content_name === want, JSON.stringify(vc.map(e => e.p)));
  }
  /* in-app navigation in photo books: one PageView + ViewContent per new page, none on the same page */
  await clear();
  await p.evaluate(() => PBK.go('/photobooks/travel')); await p.waitForTimeout(1200);
  await p.evaluate(() => PBK.go('/photobooks/couple')); await p.waitForTimeout(1200);
  await p.goBack(); await p.waitForTimeout(1200);
  l = await log(); const pv = evs(l).filter(e => e.ev === 'PageView').map(e => e.u), vcs = evs(l).filter(e => e.ev === 'ViewContent').map(e => e.p.content_name);
  check('Photo books in-app navigation: PageView per page change', JSON.stringify(pv) === JSON.stringify(['/photobooks/travel', '/photobooks/couple', '/photobooks/travel']), JSON.stringify(pv));
  check('Photo books in-app navigation: ViewContent per category', vcs.join('|') === 'Photo Books · Travel|Photo Books · Couple|Photo Books · Travel', vcs.join('|'));

  /* 3 Contact: WhatsApp, phone, email taps (one per tap) */
  await clear(); await go('/contact');
  await p.evaluate(() => { const ev = (sel) => { const a = document.querySelector(sel); a.addEventListener('click', e => e.preventDefault(), { once: true }); a.click(); }; ev('a.wa-float'); ev('a.wa-float'); ev('a[href^="tel:"]'); ev('a[href^="mailto:"]'); });
  l = await log(); const ct = evs(l).filter(e => e.ev === 'Contact').map(e => e.p.content_name);
  check('Contact on WhatsApp (double tap counted once), phone and email', ct.join(',') === 'WhatsApp,Phone,Email', ct.join(','));
  await clear(); await go('/ember-plate/', 1500);
  await p.evaluate(() => { const a = document.querySelector('a[href*="wa.me"],a[href^="tel:"]'); if (a) { a.addEventListener('click', e => e.preventDefault(), { once: true }); a.click(); } });
  l = await log(); check('No Contact for a sample business’s links inside a live template', count(l, 'Contact') === 0);

  /* 4 Lead: contact form and quote brief, only after the server accepts it, sent on the thank-you page */
  await clear(); await go('/contact');
  await p.fill('form.ciel-form [name="name"]', 'Test Person').catch(() => { });
  await p.evaluate(() => { const f = document.querySelector('form.ciel-form'); f.querySelectorAll('input,textarea,select').forEach(i => { if (i.type === 'email') i.value = 'test@example.com'; else if (i.type === 'tel') i.value = '0712345678'; else if (i.type === 'checkbox') i.checked = true; else if (i.tagName === 'SELECT') i.selectedIndex = Math.min(1, i.options.length - 1); else if (!i.value && i.name !== '_honey' && i.type !== 'hidden') i.value = 'Testing the Meta Lead event please ignore'; }); });
  l = await log(); check('No Lead before the form is sent', count(l, 'Lead') === 0);
  await Promise.all([p.waitForURL(/thanks/), p.evaluate(() => document.querySelector('form.ciel-form').requestSubmit())]); await p.waitForTimeout(900);
  l = await log(); const leads = evs(l).filter(e => e.ev === 'Lead');
  check('Lead after the contact form is accepted (on the thank-you page)', leads.length === 1 && leads[0].p.content_name === 'Contact form' && /thanks/.test(leads[0].u), JSON.stringify(leads));
  await go('/thanks'); l = await log(); check('Reloading the thank-you page doesn’t repeat the Lead', count(l, 'Lead') === 1);
  await clear(); await go('/thanks'); l = await log(); check('Opening the thank-you page directly sends no Lead', count(l, 'Lead') === 0);

  await clear(); await go('/quote', 1200);
  await p.evaluate(() => { try { Object.keys(localStorage).filter(k => /brief/i.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) { } });
  await go('/quote', 1200);
  const typ = async (sel, v) => { await p.fill(sel, v); };
  await typ('#b-name', 'Test Person'); await typ('#b-email', 'test@example.com'); await typ('#b-phone', '+254 712 345 678'); await p.click('#bf-next'); await p.waitForTimeout(300);
  await p.click('[data-c="need"]'); await p.waitForTimeout(200); await typ('#b-details', 'Testing the Meta Lead event, please ignore this brief.'); await p.click('#bf-next'); await p.waitForTimeout(300);
  await p.click('#bf-next'); await p.waitForTimeout(300);
  await p.click('[data-c="budget"]'); await p.click('[data-c="timeline"]'); await p.click('#bf-next'); await p.waitForTimeout(300);
  await p.check('#b-consent'); l = await log(); const before = count(l, 'Lead');
  await Promise.all([p.waitForURL(/thanks/, { timeout: 8000 }).catch(() => { }), p.click('#bf-next')]); await p.waitForTimeout(900);
  l = await log(); const bl = evs(l).filter(e => e.ev === 'Lead');
  check('Lead after the quote brief is accepted', before === 0 && bl.length === 1 && bl[0].p.content_name === 'Project brief', JSON.stringify(bl));

  /* 5 AddToCart, 6 InitiateCheckout, 7 Purchase (site checkout) */
  await p.evaluate(() => localStorage.removeItem('ciel_cart_v1'));
  await clear(); await go('/products', 1200);
  const addBtn = await p.$('[data-add-cart]'); const want = await addBtn.evaluate(b => ({ id: b.dataset.id, price: +b.dataset.price, name: b.dataset.name }));
  await addBtn.click(); await p.waitForTimeout(400);
  l = await log(); const atc = evs(l).filter(e => e.ev === 'AddToCart');
  check('AddToCart when a product is added', atc.length === 1 && atc[0].p.value === want.price && atc[0].p.currency === 'KES' && atc[0].p.content_ids[0] === want.id, JSON.stringify(atc[0] && atc[0].p));
  l = await log(); check('No InitiateCheckout or Purchase on add to cart', count(l, 'InitiateCheckout') === 0 && count(l, 'Purchase') === 0);
  await clear(); await go('/checkout');
  l = await log(); const ic = evs(l).filter(e => e.ev === 'InitiateCheckout');
  check('InitiateCheckout when checkout opens with items', ic.length === 1 && ic[0].p.value === want.price && ic[0].p.currency === 'KES' && ic[0].p.num_items === 1, JSON.stringify(ic[0] && ic[0].p));
  check('No Purchase when checkout starts', count(l, 'Purchase') === 0);
  await go('/checkout'); l = await log(); check('Reloading checkout doesn’t repeat InitiateCheckout', count(l, 'InitiateCheckout') === 1);
  /* failed payment */
  PAY = 'failed'; await clear();
  await p.fill('#coPhone', '0712345678'); await p.fill('#coName', 'Test Person').catch(() => { }); await p.fill('#coEmail', 'test@example.com').catch(() => { });
  await p.click('#payBtn'); await p.waitForTimeout(10500);
  l = await log(); const st1 = await p.$eval('#coStatus', e => e.textContent);
  check('Failed payment: no Purchase', count(l, 'Purchase') === 0 && /not completed/i.test(st1), st1.slice(0, 60));
  /* successful payment */
  PAY = 'paid'; await clear();
  await p.click('#payBtn'); await p.waitForTimeout(10500);
  l = await log(); const pu = evs(l).filter(e => e.ev === 'Purchase'), st2 = await p.$eval('#coStatus', e => e.textContent);
  check('Purchase only after M-Pesa confirms', pu.length === 1 && pu[0].p.value === want.price && pu[0].p.currency === 'KES' && /^co-ws_CO_TEST_/.test(pu[0].id) && /confirmed/i.test(st2), JSON.stringify(pu[0]));

  /* domains: InitiateCheckout when checkout opens, Purchase only when paid */
  for (const mode of ['failed', 'paid']) {
    PAY = mode; await clear(); await go('/domains', 1500);
    await p.fill('#dmQ', 'zuribakery.co.ke'); await p.click('#dmGo'); await p.waitForTimeout(1500);
    const buy = await p.$('[data-buy="zuribakery.co.ke"]'); if (!buy) { check('Domains flow (' + mode + ')', false, 'buy button not found'); continue; }
    await buy.click(); await p.waitForTimeout(1500);
    l = await log(); const dic = evs(l).filter(e => e.ev === 'InitiateCheckout');
    if (mode === 'failed') check('Domains: InitiateCheckout when checkout opens', dic.length === 1 && dic[0].p.content_name === 'zuribakery.co.ke' && dic[0].p.currency === 'KES', JSON.stringify(dic[0] && dic[0].p));
    await p.click('#coNext').catch(() => { }); await p.waitForTimeout(600);
    for (const [s, v] of [['#coName', 'Test Person'], ['#coEmail', 'test@example.com'], ['#coPhone', '0712345678'], ['#coAddr', 'PO Box 1'], ['#coCity', 'Town'], ['#coMp', '0712345678']]) await p.fill(s, v).catch(() => { });
    await p.check('#coAgree').catch(() => { }); await p.click('#coPay').catch(() => { }); await p.waitForTimeout(5500);
    l = await log(); const dp = evs(l).filter(e => e.ev === 'Purchase');
    if (mode === 'failed') check('Domains: failed payment sends no Purchase', dp.length === 0);
    else check('Domains: Purchase after payment is confirmed', dp.length === 1 && dp[0].id === 'dm-DM-TEST1' && dp[0].p.value === 1700, JSON.stringify(dp[0]));
    await p.evaluate(() => { const d = document.querySelector('dialog[open]'); if (d) d.close(); });
  }

  /* photo books checkout: a book line in the cart, then pay (fail, then succeed) */
  const pbItem = { id: 'pbk:test-proj:print', name: 'Our Zanzibar', price: 4350, qty: 1, pb: { p: 'test-proj', product: 'print', pages: 24 } };
  await p.evaluate(it => { localStorage.setItem('ciel_cart_v1', JSON.stringify([it])); }, pbItem);
  await clear(); await go('/photobooks/checkout', 2500);
  l = await log(); const pic = evs(l).filter(e => e.ev === 'InitiateCheckout');
  check('Photo books: InitiateCheckout when checkout opens', pic.length === 1 && pic[0].p.content_ids[0] === 'pb-print' && pic[0].p.content_category === 'Photo Books', JSON.stringify(pic[0] && pic[0].p));
  results.push(['INFO', 'Photo books payment', 'The book itself lives in the browser’s own storage, so the full photo book flow is checked by tests/meta-pixel-photobooks.e2e.js']);

  check('No script errors on any page', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  for (const r of results) console.log(r[0].padEnd(5), r[1], r[2] ? '— ' + r[2] : '');
  console.log(results.filter(r => r[0] === 'PASS').length + ' passed, ' + results.filter(r => r[0] === 'FAIL').length + ' failed');
})();
