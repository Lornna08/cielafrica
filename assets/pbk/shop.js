/* ============================================================
   CIEL AFRICA PHOTO BOOKS — cart, checkout and paid files
   · Books go into the site cart (CIEL.cart) as photo-book items.
   · /photobooks/checkout: delivery, details, M-Pesa STK (server prices
     everything again) or an order request on WhatsApp.
   · After payment: printed books send their print pages (300 dpi,
     3 mm bleed) and preview pages to Ciel Africa from this device;
     a paid PDF can be downloaded. Nothing downloads without payment.
   ============================================================ */
(function () {
  'use strict';
  var R = window.PBKR, C = window.PBKCat, ST = window.PBStore;
  var PBK = window.PBK, esc = PBK.esc, BOOK = PBK.BOOK, BASE = PBK.BASE;
  var CFG = (window.CIEL && CIEL.photobooks) || {};
  var WA = '254706549703';
  var TRIM = { w: BOOK.trimW || 210, h: BOOK.trimH || 297 }, BLEED = 3, DPI = 300;
  var MANUAL = BOOK.manualPay && BOOK.manualPay.enabled !== false ? BOOK.manualPay : null;

  function money(n) { return PBK.money(n); }
  function rule(r, pages) { return PBK.rule(r, pages); }
  function unit(product, pages) { return rule(product === 'digital' ? BOOK.digital : BOOK.price, pages); }
  function api(route, body, opt) {
    opt = opt || {};
    return fetch('/api/photobooks?route=' + route + (opt.qs || ''), { method: opt.method || 'POST', headers: Object.assign({ 'Content-Type': opt.type || 'application/json', 'X-Requested-With': 'ciel' }, opt.headers || {}), body: opt.method === 'GET' ? undefined : (opt.raw || JSON.stringify(body || {})), credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response (' + r.status + ').' }; }).then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || 'Request failed'); e.code = j.code; throw e; } return j; }); },
        function () { throw new Error('Can’t reach Ciel Africa right now. Check your connection and try again.'); });
  }
  var capsP = null;
  function caps() { return capsP || (capsP = api('pbk-caps', null, { method: 'GET' }).catch(function () { return { payments: false, uploads: false }; })); }

  /* ---------- cart ---------- */
  function thumb(p) {
    return R.toCanvas(p.cover, 160, { photo: function () { return null; } }).then(function (c) { return c.toDataURL('image/jpeg', 0.7); }).catch(function () { return ''; });
  }
  function isTest(p) { var t = C.TPL[p.tpl]; return !!(t && t.test); }
  function add(p, product, opts) {
    var n = p.pages.length, test = isTest(p), price = test ? (BOOK.testPrice || 5) : unit(product, n);
    if (test) product = 'print';
    return thumb(p).then(function (t) {
      if (test) CIEL.cart.pbItems().forEach(function (i) { CIEL.cart.remove(i.id); });
      CIEL.cart.addItem({ id: 'pbk:' + p.id + ':' + (test ? 'test' : product), name: (p.name || 'Photo book'), price: price || 0, qty: 1, thumb: t, pb: { p: p.id, product: product, pages: n, test: test || undefined } }, opts && opts.silent);
    });
  }
  /** refresh pages and prices of photo-book items from the books saved on this device */
  function sync() {
    var items = CIEL.cart.pbItems();
    return Promise.all(items.map(function (i) { return ST.project(i.pb.p).then(function (p) { return { i: i, p: p }; }).catch(function () { return { i: i, p: null }; }); })).then(function (rows) {
      /* PDFs off: books in the cart as a PDF become printed books */
      if (BOOK.pdf === false) rows.forEach(function (r) { if (r.i.pb.product === 'digital') { CIEL.cart.update(r.i.id, { price: unit('print', r.i.pb.pages) || 0, pb: Object.assign({}, r.i.pb, { product: 'print' }) }); r.i = CIEL.cart.items().filter(function (x) { return x.id === r.i.id; })[0] || r.i; } });
      /* prices always follow data/photobooks.js (a cart can be older than a price change) */
      rows.forEach(function (r) { if (r.i.pb.test) return; var want = unit(r.i.pb.product, r.p ? r.p.pages.length : r.i.pb.pages); if (want != null && want !== r.i.price && !r.p) { CIEL.cart.update(r.i.id, { price: want }); r.i = CIEL.cart.items().filter(function (x) { return x.id === r.i.id; })[0] || r.i; } });
      rows.forEach(function (r) { if (!r.p) return; var n = r.p.pages.length; if (n !== r.i.pb.pages || r.p.name !== r.i.name || (!r.i.pb.test && unit(r.i.pb.product, n) !== r.i.price)) CIEL.cart.update(r.i.id, { name: r.p.name, price: r.i.pb.test ? (BOOK.testPrice || 5) : unit(r.i.pb.product, n) || 0, pb: Object.assign({}, r.i.pb, { pages: n }) }); });
      return rows.map(function (r) { return { item: CIEL.cart.items().filter(function (x) { return x.id === r.i.id; })[0] || r.i, project: r.p }; });
    });
  }

  /* ---------- rendering pages for files ---------- */
  function photoSource(kind) {
    var urls = {};
    return {
      load: function (doc) {
        var ids = []; (doc.els || []).forEach(function (e) { if (e.photo) ids.push(e.photo); if (e.mask) ids.push(e.mask); });
        return Promise.all(ids.map(function (id) { if (urls[id]) return; return ST.blob(id, kind).then(function (b) { if (!b && kind !== 'prev') return ST.blob(id, 'prev'); return b; }).then(function (b) { if (b) urls[id] = URL.createObjectURL(b); }); }));
      },
      url: function (id) { return urls[id] || null; },
      done: function () { Object.keys(urls).forEach(function (id) { R.forget(urls[id]); URL.revokeObjectURL(urls[id]); }); urls = {}; }
    };
  }
  /* back cover: the cover colour, a small sticker (a map of the place for travel and Kenya covers,
     otherwise the cover's own artwork) and cielafrica.com / hello@cielafrica.com bottom right */
  function backDoc(p) {
    var t = C.TPL[p.tpl], c = p.cover;
    var bg = c.img && t ? t.bg : c.bg, brand = c.brand || (t && (t.bc || t.tc)) || '#ffffff';
    var doc = { kind: 'back', bg: bg || '#ffffff', brand: brand, els: [] };
    return R.toA4(backEls(doc, t, c, p, brand));
  }
  function backEls(doc, t, c, p, brand) {
    var map = null;
    if (t && t.kind === 'raster' && t.slug !== 'asia') map = '/assets/pbk/maps/' + t.slug + '.svg';
    else if (t && t.cat === 'kenya') map = '/assets/pbk/maps/kenya-' + t.slug + '-' + (p.pal || 0) + '.svg';
    if (map) {
      doc.els.push({ id: 'map', t: 'img', src: map, x: 210, y: 380, w: 680, h: 680 });
      var lab = t.cat === 'kenya' ? ({ nairobi: 'NAIROBI · KENYA', mombasa: 'MOMBASA · KENYA', serengeti: 'SERENGETI' }[t.slug] || 'KENYA') : t.name.toUpperCase();
      doc.els.push({ id: 'place', t: 'text', role: 'place', text: lab, x: 200, y: 1100, w: 700, h: 44, cap: 40, align: 'center', font: 'spartan', color: brand, ls: 0.18 });
      return doc;
    }
    var art = (c.els || []).filter(function (e) { return e.id === 'art' && (e.t === 'art' || (e.t === 'img' && e.src)); })[0];
    if (!art && t && t.layered) art = { t: 'img', src: t.art, w: t.artBox[2], h: t.artBox[3] };
    if (art) {
      var k = Math.min(560 / art.w, 560 / art.h), w = art.w * k, h = art.h * k;
      var e = { id: 'art', t: art.t, x: 550 - w / 2, y: 740 - h / 2, w: w, h: h }; if (art.t === 'art') e.art = art.art; else e.src = art.src;
      doc.els.push(e);
    }
    return doc;
  }
  /** docs in print order: front cover, pages…, back cover */
  function docs(p) { C.fixCover(p.cover, p.tpl); [p.cover].concat(p.pages).forEach(function (d) { R.toA4(d); }); if (p.back) R.toA4(p.back); return [p.cover].concat(p.pages).concat([p.back || backDoc(p)]); }
  /** what goes on the spine: the cover's title and colours, or what the customer chose for it */
  function spineOf(p) {
    var o = Object.assign({}, C.spineFor(p.cover, p.tpl, p.pal)), u = p.spine || {};
    if (u.title != null && u.title !== '') o.title = u.title;
    if (u.bg) o.bg = u.bg;
    if (u.tc) { o.tc = u.tc; o.bc = u.tc; }
    if (u.hideTitle) o.hideTitle = true;
    if (u.font) o.font = u.font; if (u.scale) o.scale = u.scale; if (u.noPic) o.noPic = true;
    o.mm = R.spineMm(p.pages.length); o.pages = p.pages.length;
    return o;
  }
  /** a page at trim size (px wide), optionally with bleed (the edge pixels carried out to the bleed) */
  function renderPage(doc, src, px, bleedPx) {
    return src.load(doc).then(function () { return R.toCanvas(doc, px, { photo: src.url, empty: 'none' }); }).then(function (c) { return bleed(c, bleedPx, doc.bg); });
  }
  function bleed(c, b, bg) {
    if (!b) return c;
    var o = document.createElement('canvas'); o.width = c.width + 2 * b; o.height = c.height + 2 * b;
    var x = o.getContext('2d'), W = c.width, H = c.height;
    x.fillStyle = bg || '#ffffff'; x.fillRect(0, 0, o.width, o.height); /* never see-through: transparent pixels print grey or black */
    x.drawImage(c, b, b);
    x.drawImage(c, 0, 0, 1, H, 0, b, b, H); x.drawImage(c, W - 1, 0, 1, H, W + b, b, b, H);
    x.drawImage(c, 0, 0, W, 1, b, 0, W, b); x.drawImage(c, 0, H - 1, W, 1, b, H + b, W, b);
    x.drawImage(c, 0, 0, 1, 1, 0, 0, b, b); x.drawImage(c, W - 1, 0, 1, 1, W + b, 0, b, b); x.drawImage(c, 0, H - 1, 1, 1, 0, H + b, b, b); x.drawImage(c, W - 1, H - 1, 1, 1, W + b, H + b, b, b);
    return o;
  }
  /** the spine as a print image: spine width × (trim height + bleed top and bottom), at dpi */
  function renderSpine(p, dpi, bleedMm) {
    var so = spineOf(p), mm = so.mm, b = bleedMm == null ? BLEED : bleedMm;
    return R.loadSpine(so).then(function () {
      var w = Math.max(8, Math.round(mm / 25.4 * dpi)), th = Math.round(TRIM.h / 25.4 * dpi), bp = Math.round(b / 25.4 * dpi);
      var c = document.createElement('canvas'); c.width = w; c.height = th + 2 * bp;
      var x = c.getContext('2d'); x.fillStyle = so.bg || '#ffffff'; x.fillRect(0, 0, c.width, c.height);
      var su = R.spineUnits(p.pages.length); x.setTransform(w / su, 0, 0, th / R.H, 0, bp); R.drawSpine(x, so, su);
      return { canvas: c, mm: mm };
    });
  }
  /** one PDF page: back cover · spine · front cover, with bleed all round (pdf-lib images: back, front, spine) */
  function wrapPage(doc, L, back, front, spine, spineMm, opt) {
    opt = opt || {};
    var mm = 72 / 25.4, b = opt.bleed == null ? BLEED : opt.bleed, tw = opt.trimW || TRIM.w, th = opt.trimH || TRIM.h;
    var pw = (2 * tw + spineMm + 2 * b) * mm, ph = (th + 2 * b) * mm, pg = doc.addPage([pw, ph]);
    var face = (tw + 2 * b) * mm;
    pg.drawImage(back, { x: 0, y: 0, width: face, height: ph });
    pg.drawImage(front, { x: (tw + spineMm) * mm, y: 0, width: face, height: ph });
    if (spine) pg.drawImage(spine, { x: (b + tw) * mm, y: 0, width: spineMm * mm, height: ph });
    pg.setTrimBox(b * mm, b * mm, (2 * tw + spineMm) * mm, th * mm); pg.setBleedBox(0, 0, pw, ph);
    return pg;
  }
  function jpeg(c, q) { return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', q); }); }
  function jpegUnder(c, max) { var qs = [0.92, 0.85, 0.78, 0.7, 0.6]; var i = 0; function next() { return jpeg(c, qs[i]).then(function (b) { if (b.size <= max || i >= qs.length - 1) return b; i++; return next(); }); } return next(); }

  /* ---------- paid PDF (digital purchase, or print file when uploads are off) ---------- */
  function js(src) { return new Promise(function (ok, no) { if (document.querySelector('script[src="' + src + '"]')) return ok(); var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Could not load the PDF tool.')); }; document.head.appendChild(s); }); }
  function pdf(p, receipt, onProgress, withBleed) {
    return api('pbk-verify', { receipt: receipt, projectId: p.id }).then(function () { return js('/assets/vendor/pdf-lib-1.17.1.min.js'); }).then(function () {
      var L = window.PDFLib, mm = 72 / 25.4, b = withBleed ? BLEED : 0;
      var pw = (TRIM.w + 2 * b) * mm, ph = (TRIM.h + 2 * b) * mm, px = Math.round(TRIM.w / 25.4 * (withBleed ? DPI : 200)), bpx = Math.round(b / 25.4 * (withBleed ? DPI : 200));
      var src = photoSource('orig'), list = docs(p), i = 0, ims = {};
      return L.PDFDocument.create().then(function (doc) {
        doc.setTitle(p.name || 'Photo book'); doc.setCreator('Ciel Africa Photo Books'); doc.setProducer('cielafrica.com');
        function one() {
          if (i >= list.length) {
            src.done();
            if (!withBleed) return doc.save();
            /* last page: the whole cover in one piece (back · spine · front), sized for this number of pages */
            return renderSpine(p, DPI).then(function (sp) { return jpeg(sp.canvas, 0.92).then(function (bl) { return bl.arrayBuffer(); }).then(function (buf) { return doc.embedJpg(buf); }).then(function (spi) { wrapPage(doc, L, ims.back, ims.front, spi, sp.mm); return doc.save(); }); });
          }
          if (onProgress) onProgress(i, list.length);
          return renderPage(list[i], src, px, bpx).then(function (c) { return jpeg(c, 0.9); }).then(function (bl) { return bl.arrayBuffer(); }).then(function (buf) { return doc.embedJpg(buf); }).then(function (im) {
            if (i === 0) ims.front = im; if (i === list.length - 1) ims.back = im;
            var pg = doc.addPage([pw, ph]); pg.drawImage(im, { x: 0, y: 0, width: pw, height: ph });
            if (b) { pg.setTrimBox(b * mm, b * mm, TRIM.w * mm, TRIM.h * mm); pg.setBleedBox(0, 0, pw, ph); }
            i++; return one();
          });
        }
        return one();
      });
    }).then(function (bytes) {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      a.href = url; a.download = (p.name || 'photo-book').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.pdf';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    });
  }

  /* ---------- sending a paid printed book to Ciel Africa ---------- */
  function sendPages(pu, onProgress) {
    return ST.project(pu.projectId).then(function (p) {
      if (!p) throw new Error('This book isn’t saved on this device, so its pages can’t be sent from here.');
      var list = docs(p), total = list.length * 2 + 2, done = 0, sent = pu.sent || { print: [], view: [] };
      var src = photoSource('orig'), srcV = photoSource('prev');
      var px = Math.round(TRIM.w / 25.4 * DPI), bpx = Math.round(BLEED / 25.4 * DPI);
      function up(kind, i, blob) { return fetch('/api/photobooks?route=pbk-upload&kind=' + kind + '&i=' + i, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Requested-With': 'ciel', 'X-Receipt': pu.receipt }, body: blob }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'Upload failed'); }); }); }
      function retry(fn) { var n = 0; function go() { return fn().catch(function (e) { if (++n > 3) throw e; return new Promise(function (ok) { setTimeout(ok, 1500 * n); }).then(go); }); } return go(); }
      function save() { pu.sent = sent; return ST.savePurchase(pu); }
      var so = spineOf(p);
      var bookInfo = { name: p.name, template: p.tpl, colour: p.pal, size: TRIM.w + ' × ' + TRIM.h + ' mm', trimW: TRIM.w, trimH: TRIM.h, bleed: BLEED + ' mm', bleedMm: BLEED, dpi: DPI, spineMm: so.mm, cover: R.coverCfg(), files: '000 = front cover, 001–' + String(p.pages.length).padStart(3, '0') + ' = pages, ' + String(p.pages.length + 1).padStart(3, '0') + ' = back cover; spine/000 = spine (' + so.mm + ' mm wide)', spine: so };
      var i = 0;
      function step() {
        if (onProgress) onProgress(done, total);
        if (i >= list.length) {
          if (sent.spine) { done++; return null; }
          return renderSpine(p, DPI).then(function (sp) { return jpeg(sp.canvas, 0.92); }).then(function (b) { return retry(function () { return up('spine', 0, b); }); }).then(function () { sent.spine = true; done++; return save(); });
        }
        var k = i++;
        var needP = sent.print.indexOf(k) < 0, needV = sent.view.indexOf(k) < 0;
        return (needV ? renderPage(list[k], srcV, 700, 0).then(function (c) { return jpeg(c, 0.8); }).then(function (b) { return retry(function () { return up('view', k, b); }); }).then(function () { sent.view.push(k); srcV.done(); }) : Promise.resolve())
          .then(function () { done++; if (onProgress) onProgress(done, total); if (!needP) return; return renderPage(list[k], src, px, bpx).then(function (c) { return jpegUnder(c, 4.3 * 1024 * 1024); }).then(function (b) { return retry(function () { return up('print', k, b); }); }).then(function () { sent.print.push(k); src.done(); }); })
          .then(function () { done++; return save(); }).then(step);
      }
      return retry(function () { return up('book', 0, new Blob([JSON.stringify(bookInfo)], { type: 'application/octet-stream' })); }).then(step).then(function () {
        return api('pbk-upload-done', { receipt: pu.receipt });
      }).then(function () { done = total; if (onProgress) onProgress(total, total); pu.done = true; pu.sentAt = Date.now(); return save(); });
    });
  }
  /** purchases saved on this device */
  function purchases(projectId) { return ST.purchases(projectId).then(function (l) { return (l || []).filter(function (x) { return x.app === 'pbk'; }); }).catch(function () { return []; }); }
  /** a banner for paid printed books whose pages haven't finished sending */
  function resumeBanner(host) {
    manualList().slice(0, 3).forEach(function (m) { if (Date.now() - m.at < 30 * 864e5) manualCheck(m).then(function (s) { if (s.status === 'paid' && host) { var b = document.createElement('div'); b.className = 'pk-resume wrap'; b.innerHTML = '<div class="pk-resume__in"><b>Payment confirmed</b><span>Order ' + esc(m.ref) + ' is confirmed. Thank you!</span><button class="btn btn--p btn--sm">View order</button></div>'; host.insertAdjacentElement('afterbegin', b); b.querySelector('button').onclick = function () { PBK.go(BASE + '/checkout?sent=' + encodeURIComponent(m.ref)); }; } }).catch(function () {}); });
    purchases().then(function (l) {
      var todo = l.filter(function (x) { return x.product === 'print' && !x.done; }); if (!todo.length || !host) return;
      var b = document.createElement('div'); b.className = 'pk-resume wrap';
      b.innerHTML = '<div class="pk-resume__in"><b>Finish sending your paid book' + (todo.length > 1 ? 's' : '') + '</b><span>Order ' + esc(todo[0].ref) + ': the pages still need to reach Ciel Africa from this device.</span><button class="btn btn--p btn--sm">Send now</button></div>';
      host.insertAdjacentElement('afterbegin', b);
      b.querySelector('button').onclick = function () { PBK.go(BASE + '/checkout?sent=' + encodeURIComponent(todo[0].ref)); };
    });
  }

  /** a rough upload time for printed books: pages × (render + upload), more photos take longer */
  function sendEstimate(projects) {
    var sec = 0;
    (projects || []).forEach(function (p) {
      if (!p) return; var docs2 = [p.cover].concat(p.pages).concat([p.back || {}]), photos = 0;
      docs2.forEach(function (d) { (d.els || []).forEach(function (e) { if (e.photo) photos++; }); });
      sec += docs2.length * 4 + photos * 1.5;
    });
    if (!sec) return '';
    var lo = Math.max(1, Math.round(sec / 60)), hi = Math.max(lo + 1, Math.round(sec * 2 / 60));
    return lo + '–' + hi + ' minutes';
  }
  /* ---------- checkout page ---------- */
  var DEL = (CFG.delivery || []).filter(function (d) { return d.enabled !== false; });
  function checkout(main) {
    document.title = 'Checkout · Photo Books — Ciel Africa';
    var q = new URLSearchParams(location.search);
    if (q.get('sent')) return afterPay(main, q.get('sent'));
    main.innerHTML = '<section class="pkco wrap"><div class="crumb"><a data-go href="' + BASE + '">Photo Books</a> <span class="brk">‹</span> Checkout</div><h1>Checkout</h1><div class="pkco__grid"><div class="pkco__main" id="coMain"><p class="pk-empty">Loading your cart…</p></div><aside class="pkco__side" id="coSide"></aside></div></section>';
    var st = { delivery: null, f: {} }; /* the customer picks the delivery (and sees its price) themselves */
    try { Object.assign(st.f, JSON.parse(localStorage.getItem('pbk_details') || '{}')); } catch (e) { }
    Promise.all([sync(), caps()]).then(function (r) {
      var rows = r[0], cp = r[1];
      if (!rows.length) { document.getElementById('coMain').innerHTML = '<div class="pk-empty"><p>No photo books in your cart yet.</p><a class="btn btn--p" data-go href="' + BASE + '">Create a photo book</a></div>'; document.getElementById('coSide').innerHTML = ''; return; }
      draw(rows, cp);
    });
    function draw(rows, cp) {
      var test = rows.some(function (r) { return r.item.pb.test; });
      var anyPrint = rows.some(function (r) { return r.item.pb.product === 'print'; }), missing = rows.filter(function (r) { return !r.project; });
      if (!st.f.country) st.f.country = 'Kenya';
      var reg = region(), dl = reg === 'ke' ? DEL.filter(function (d) { return d.id !== 'eastafrica'; }) : reg === 'ea' ? DEL.filter(function (d) { return d.id === 'eastafrica'; }) : [];
      if (st.delivery && !dl.some(function (d) { return d.id === st.delivery; })) st.delivery = null;
      var del = dl.filter(function (d) { return d.id === st.delivery; })[0] || null;
      if (test && del) del = Object.assign({}, del, { price: 0 });
      var eta = sendEstimate(rows.filter(function (r) { return r.item.pb.product === 'print'; }).map(function (r) { return r.project; }));
      var lines = rows.map(function (r) { return { label: r.item.name + ' · ' + (r.item.pb.product === 'digital' ? 'PDF' : 'Printed') + ' · ' + r.item.pb.pages + ' pages', amount: r.item.price, qty: r.item.qty }; });
      var sub = lines.reduce(function (s, l) { return s + l.amount * l.qty; }, 0), cpn = st.coupon, off = 0;
      if (cpn) off = Math.min(sub, cpn.type === 'percent' ? Math.round(sub * cpn.value / 100) : Math.round(cpn.value));
      var total = sub - off + (anyPrint && del ? (del.price || 0) : 0);
      document.getElementById('coMain').innerHTML =
        '<h2 class="pkco__h">Your books</h2>' + rows.map(function (r) {
          var it = r.item, pr = it.pb.product;
          return '<div class="pkco__item" data-id="' + esc(it.id) + '"><img src="' + esc(it.thumb || '') + '" alt="" draggable="false"><div class="pkco__it"><b>' + esc(it.name) + '</b><span>' + it.pb.pages + ' pages · A4 hardcover</span>' +
            (it.pb.test ? '<p class="pkco__test"><b>TEST order</b> · only for Ciel Africa (you must be signed in to Photo Book orders on this browser). Not printed; it stays in your orders until you delete it.</p>' : (BOOK.pdf === false ? '' : '<div class="pkco__seg"><button data-prod="print"' + (pr === 'print' ? ' class="is-on"' : '') + '>Printed hardcover<small>' + money(unit('print', it.pb.pages)) + '</small></button><button data-prod="digital"' + (pr === 'digital' ? ' class="is-on"' : '') + '>Print-ready PDF<small>' + money(unit('digital', it.pb.pages)) + '</small></button></div>')) +
            (r.project ? '' : '<p class="pkco__warn">This book isn’t saved on this device. Open checkout on the phone or computer you designed it on.</p>') +
            '</div><div class="pkco__end">' + (pr === 'print' && !it.pb.test ? '<div class="pkco__qty"><button data-q="-1" aria-label="One less">−</button><span>' + it.qty + '</span><button data-q="1" aria-label="One more">+</button></div>' : '') + '<b>' + money(it.price * it.qty) + '</b><button class="pkco__rm" data-rm>Remove</button></div></div>';
        }).join('') +
        '<h2 class="pkco__h">Your details</h2><div class="pkco__form">' +
        fld('name', 'Full name', 'text', 'name', '', true) + fld('phone', 'Mobile number', 'tel', 'tel', '0712 345 678', true) + fld('email', 'Email (for your receipt)', 'email', 'email', '', true) + '</div>' +
        (anyPrint ? '<h2 class="pkco__h">Delivery address</h2><div class="pkco__form">' + fld('line1', 'Street address or building', 'text', 'address-line1', '', true) + fld('area', 'Area / estate', 'text', 'address-line2', '', true) + fld('town', 'Town', 'text', 'address-level2', '', true) + fld('county', 'County', 'text', 'address-level1', '', true) +
          '<label class="pkco__f"><span>Country <i class="pkco__req">*</i></span><select id="coCtry" autocomplete="country-name">' + COUNTRIES.concat(['Another country']).map(function (c) { return '<option' + (c === st.f.country ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
          (st.f.country === 'Another country' ? fld('ctryo', 'Which country?', 'text', 'country-name', '', true) : '') + fld('notes', 'Delivery notes (optional)', 'text', 'off') + '</div>' : '') +
        (anyPrint ? (reg === 'world' ? '<h2 class="pkco__h">Delivery</h2><div class="pkco__intl"><b>Delivery outside East Africa</b><span>We’ll get in touch with the delivery cost and how to pay.</span></div>'
          : '<h2 class="pkco__h">Delivery</h2><div class="pkco__del">' + dl.map(function (d) { return '<label class="pkco__opt' + (d.id === st.delivery ? ' is-on' : '') + '"><input type="radio" name="del" value="' + d.id + '"' + (d.id === st.delivery ? ' checked' : '') + '><span>' + esc(d.name) + '</span>' + (d.id === st.delivery ? '<b>' + (d.id === 'uber' ? 'Pay rider' : d.price && !test ? money(d.price) : 'Free') + '</b>' : '') + '</label>'; }).join('') + '</div><p class="pkco__note">' + (del && del.note ? esc(del.note) + ' ' : '') + 'Delivered within 1–3 working days of dispatch.</p>') : '') +
        '<label class="pkco__giftck"><input type="checkbox" id="coGift"' + (st.gift ? ' checked' : '') + '><span>This is a gift 🎁</span></label>' +
        (st.gift ? '<div class="pkco__form pkco__form--gift">' + fld('gto', 'Who is it for?', 'text', 'off', 'Their name', true) + (anyPrint ? fld('gphone', 'Their phone (for delivery)', 'tel', 'off', 'Optional') : '') + '<label class="pkco__f pkco__f--full"><span>Gift message (optional)</span><textarea data-f="gnote" rows="3" maxlength="400" placeholder="Write a short message">' + esc(st.f.gnote || '') + '</textarea></label></div>' : '');
      document.getElementById('coSide').innerHTML = '<div class="pkco__sum"><h3>Order summary</h3>' + lines.map(function (l) { return '<div class="pkco__ln"><span>' + esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + '</span><b>' + money(l.amount * l.qty) + '</b></div>'; }).join('') +
        (anyPrint && del ? '<div class="pkco__ln"><span>' + esc(del.name) + '</span><b>' + (del.id === 'uber' ? 'On arrival' : del.price ? money(del.price) : 'Free') + '</b></div>' : '') +
        (cpn ? '<div class="pkco__ln pkco__ln--cpn"><span>Coupon ' + esc(cpn.code) + (cpn.type === 'percent' ? ' · ' + cpn.value + '% off' : '') + ' <button type="button" class="pkco__cpx" id="coCpnX">Remove</button></span><b>−' + money(off) + '</b></div>'
          : (test ? '' : '<div class="pkco__cpn"><input id="coCpn" placeholder="Coupon code" autocomplete="off" autocapitalize="characters" maxlength="24"><button type="button" class="btn btn--ghost btn--sm" id="coCpnGo">Apply</button></div><p class="pkco__cpnmsg" id="coCpnMsg"></p>')) +
        '<div class="pkco__tot"><span>Total</span><b>' + money(total) + '</b></div>' +
        (anyPrint ? '<div class="pkco__eta"><b>Dispatch in 24–48 hours</b><span>Printed books leave our studio for delivery 24–48 hours after all your pages reach us. Delivery time depends on where you are.</span></div>' : '') +
        (eta ? '<div class="pkco__eta"><b>After you pay</b><span>Your book’s pages upload from this device so we can print them: about ' + eta + ' on a good connection. More photos and pages take longer. Keep this page open; if it stops, open <a data-go href="' + BASE + '/my-books">My books</a> on this device and tap <b>Send now</b>.</span></div>' : '') +
        (anyPrint && reg === 'world' ? '<a class="btn btn--p btn--lg pkco__pay" id="coIntl" target="_blank" rel="noopener">Send my order request</a><p class="pkco__small">Opens WhatsApp with your order. We’ll reply with the delivery cost and how to pay.</p><div id="coStatus"></div></div>' :
        payBox(cp, total, missing) +
        '<div class="pkco__or"><span>or</span></div><a class="btn btn--ghost pkco__wa" id="coWa" target="_blank" rel="noopener">Order on WhatsApp</a><p class="pkco__small">We’ll reply with how to pay and send your book.</p><div id="coStatus"></div></div>');
      var M = document.getElementById('coMain');
      M.querySelectorAll('.pkco__item').forEach(function (el) {
        var id = el.getAttribute('data-id');
        el.querySelectorAll('[data-prod]').forEach(function (b) { b.onclick = function () { var it = CIEL.cart.items().filter(function (x) { return x.id === id; })[0]; var prod = b.getAttribute('data-prod'); if (it.pb.product === prod) return; var nid = 'pbk:' + it.pb.p + ':' + prod; CIEL.cart.remove(id); CIEL.cart.addItem(Object.assign({}, it, { id: nid, qty: 1, price: unit(prod, it.pb.pages), pb: Object.assign({}, it.pb, { product: prod }) }), true); refresh(); }; });
        el.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { var it = CIEL.cart.items().filter(function (x) { return x.id === id; })[0]; CIEL.cart.setQty(id, Math.min(CFG.maxQuantity || 10, it.qty + +b.getAttribute('data-q'))); refresh(); }; });
        var rm = el.querySelector('[data-rm]'); rm.onclick = function () { CIEL.cart.remove(id); refresh(); };
      });
      M.querySelectorAll('[name=del]').forEach(function (r2) { r2.onchange = function () { keep(); st.delivery = r2.value; try { localStorage.setItem('pbk_delivery', r2.value); } catch (e) { } draw(rows.map(function (x) { return { item: CIEL.cart.items().filter(function (y) { return y.id === x.item.id; })[0] || x.item, project: x.project }; }), cp); }; });
      M.querySelectorAll('[data-f]').forEach(function (i) { i.addEventListener('input', keep); });
      var gk = document.getElementById('coGift'); if (gk) gk.onchange = function () { keep(); st.gift = gk.checked; draw(rows, cp); };
      var cs = document.getElementById('coCtry'); if (cs) cs.onchange = function () { keep(); st.f.country = cs.value; draw(rows, cp); };
      var ms = document.getElementById('coMpSame'); if (ms) ms.onchange = function () { keep(); st.mpOther = !ms.checked; draw(rows, cp); };
      var cg = document.getElementById('coCpnGo'), ci = document.getElementById('coCpn');
      if (cg) { cg.onclick = function () { var code = (ci.value || '').trim(); if (!code) return; cg.disabled = true; var cm2 = document.getElementById('coCpnMsg'); cm2.textContent = 'Checking…'; cm2.className = 'pkco__cpnmsg';
        api('pbk-coupon', { coupon: code, items: rows.map(function (r) { return { projectId: r.item.pb.p, name: r.item.name, product: r.item.pb.product, pages: r.item.pb.pages, qty: r.item.qty }; }) }).then(function (r) { keep(); st.coupon = r.coupon; draw(rows, cp); }, function (e) { cg.disabled = false; cm2.textContent = e.message; cm2.className = 'pkco__cpnmsg is-err'; }); };
        ci.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); cg.click(); } }; }
      var cx = document.getElementById('coCpnX'); if (cx) cx.onclick = function () { keep(); st.coupon = null; draw(rows, cp); };
      var intl = document.getElementById('coIntl'); if (intl) { intl.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText()); intl.onclick = function (e) { if (!check(rows, null, true)) { e.preventDefault(); return; } intl.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText()); }; }
      function waText() {
        keep(); var f = st.f;
        return 'Hello Ciel Africa, I’d like to order:\n' + rows.map(function (r) { return '• ' + r.item.name + ' — ' + (r.item.pb.product === 'digital' ? 'print-ready PDF' : 'printed hardcover × ' + r.item.qty) + ', ' + r.item.pb.pages + ' pages (' + money(r.item.price * r.item.qty) + ')'; }).join('\n') +
          (anyPrint && del ? '\nDelivery: ' + del.name : '') + '\nTotal: ' + money(total) + (f.name ? '\nName: ' + f.name : '') + (f.phone ? '\nPhone: ' + f.phone : '') + (f.line1 ? '\nAddress: ' + [f.line1, f.area, f.town, f.county, countryName()].filter(Boolean).join(', ') : '') + (st.coupon ? '\nCoupon: ' + st.coupon.code : '') + (st.gift ? '\nIt’s a gift' + (f.gto ? ' for ' + f.gto : '') + (f.gphone ? ' (' + f.gphone + ')' : '') + (f.gnote ? '\nGift message: ' + f.gnote : '') : '');
      }
      var wa = document.getElementById('coWa'); if (wa) { wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText()); wa.onclick = function () { wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText()); }; }
      var pay = document.getElementById('coPay'); if (pay) pay.onclick = function () { if (check(rows, del)) startPay(rows, del, total); };
      var man = document.getElementById('coManual'); if (man) man.onclick = function () { if (check(rows, del)) startManual(rows, del, total); };
      document.querySelectorAll('[name=pm]').forEach(function (r2) { r2.onchange = function () { keep(); st.method = r2.value; draw(rows, cp); }; });
      document.querySelectorAll('[data-copy]').forEach(function (b) { b.onclick = function () { var v = b.getAttribute('data-copy'); try { navigator.clipboard.writeText(v).then(function () { b.classList.add('is-copied'); setTimeout(function () { b.classList.remove('is-copied'); }, 1200); }); } catch (e) { } }; });
      var cm = document.getElementById('coMsg'); if (cm) { cm.value = st.msg || ''; cm.oninput = function () { st.msg = cm.value; }; }
      function refresh() { sync().then(function (rs) { if (!rs.length) return checkout(main); draw(rs, cp); }); }
    }
    /* how to pay: the M-Pesa prompt (STK), or Paybill paid by hand and confirmed by Ciel Africa */
    function payBox(cp, total, missing) {
      var methods = []; if (cp.payments) methods.push('stk'); if (MANUAL && cp.manual) methods.push('manual');
      if (methods.indexOf(st.method) < 0) st.method = methods[0] || null;
      if (!methods.length) return '<p class="pkco__warn">M-Pesa checkout is not available right now. Order on WhatsApp below.</p>';
      var h = '<h3 class="pkco__pmh">How would you like to pay?</h3>';
      if (methods.length > 1) h += '<div class="pkco__pm">' +
        '<label class="pkco__opt' + (st.method === 'stk' ? ' is-on' : '') + '"><input type="radio" name="pm" value="stk"' + (st.method === 'stk' ? ' checked' : '') + '><span>M-Pesa prompt<small>We send a payment request to your phone</small></span></label>' +
        '<label class="pkco__opt' + (st.method === 'manual' ? ' is-on' : '') + '"><input type="radio" name="pm" value="manual"' + (st.method === 'manual' ? ' checked' : '') + '><span>M-Pesa Paybill<small>Pay from your M-Pesa menu, then paste the message</small></span></label></div>';
      if (st.method === 'stk') return h + '<label class="pkco__giftck pkco__mpsame"><input type="checkbox" id="coMpSame"' + (st.mpOther ? '' : ' checked') + '><span>Use my mobile number for M-Pesa' + (st.f.phone ? ' (' + esc(st.f.phone) + ')' : '') + '</span></label>' + (st.mpOther ? '<div class="pkco__form">' + fld('mpesa', 'M-Pesa number', 'tel', 'tel', '0712 345 678', true) + '</div>' : '') + '<button class="btn btn--p btn--lg pkco__pay" id="coPay"' + (missing.length ? ' disabled' : '') + '>Pay ' + money(total) + ' with M-Pesa</button><p class="pkco__small">You’ll get a prompt on your phone. Enter your M-Pesa PIN to pay.</p>';
      return h + '<div class="pkco__man"><ol>' +
        '<li>On your phone open <b>M-Pesa → Lipa na M-Pesa → Pay Bill</b>.</li>' +
        '<li>Business number <button type="button" class="pkco__cp" data-copy="' + esc(MANUAL.paybill) + '" title="Copy">' + esc(MANUAL.paybill) + '</button></li>' +
        '<li>Account number <button type="button" class="pkco__cp" data-copy="' + esc(MANUAL.account) + '" title="Copy">' + esc(MANUAL.account) + '</button></li>' +
        '<li>Amount <b>' + money(total) + '</b>, then enter your M-Pesa PIN.</li></ol>' +
        '<label class="pkco__f pkco__f--full"><span>Paste the M-Pesa confirmation message</span><textarea id="coMsg" rows="4" maxlength="800" placeholder="e.g. SKL4ABC12D Confirmed. Ksh' + (total || 0).toLocaleString('en-KE') + '.00 sent to …"></textarea></label>' +
        '<button class="btn btn--p btn--lg pkco__pay" id="coManual"' + (missing.length ? ' disabled' : '') + '>I’ve paid: place my order</button>' +
        '<p class="pkco__small">Your order is confirmed as soon as we’ve checked your payment.</p></div>';
    }
    function rowsHavePrint() { return CIEL.cart.pbItems().some(function (i) { return i.pb.product === 'print'; }); }
    function startManual(rows, del, total) {
      var f = st.f, btn = document.getElementById('coManual'), msg = (document.getElementById('coMsg') || {}).value || '';
      if (msg.trim().length < 10) { status('Paste the confirmation message M-Pesa sent you after paying (it starts with a code like SKL4ABC12D).', 'is-err'); return; }
      var body = { items: rows.map(function (r) { return { projectId: r.item.pb.p, name: r.item.name, product: r.item.pb.product, pages: r.item.pb.pages, qty: r.item.qty, test: r.item.pb.test || undefined }; }), delivery: del ? del.id : null, name: f.name, phone: f.phone, email: f.email, address: { line1: f.line1, area: f.area, town: f.town, county: f.county, country: countryName(), notes: f.notes }, coupon: st.coupon ? st.coupon.code : undefined, gift: st.gift ? { is: true, to: f.gto, phone: f.gphone, note: f.gnote } : null, message: msg.trim() };
      btn.disabled = true; status('<span class="pkco__spin"></span> Placing your order…');
      api('pbk-manual', body).then(function (r) {
        var pend = { ref: r.ref, intent: r.intent, at: Date.now(), total: r.amount, items: rows.map(function (x) { return { projectId: x.item.pb.p, name: x.item.name, product: x.item.pb.product, pages: x.item.pb.pages, thumb: x.item.thumb }; }) };
        manualSave(pend);
        return savePurchases(r.ref, r.receipts || [], rows, true).then(function () {
          rows.forEach(function (x) { CIEL.cart.remove(x.item.id); });
          history.replaceState({}, '', BASE + '/checkout?sent=' + encodeURIComponent(r.ref) + '&manual=1');
          afterPay(main, r.ref);
        });
      }).catch(function (e) { status(esc(e.message), 'is-err'); btn.disabled = false; });
    }
    var COUNTRIES = ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Ethiopia', 'Somalia', 'DR Congo'];
    function countryName() { return st.f.country === 'Another country' ? (st.f.ctryo || '') : (st.f.country || 'Kenya'); }
    /** ke = Kenya, ea = elsewhere in East Africa, world = outside (delivery and payment arranged with the customer) */
    function region() { var c = countryName().trim().toLowerCase(); if (!c || c === 'kenya') return 'ke'; return COUNTRIES.some(function (x) { return x.toLowerCase() === c; }) || /^(uganda|tanzania|rwanda|burundi|south sudan|ethiopia|somalia|d\.?r\.? ?congo|congo)/.test(c) ? 'ea' : 'world'; }
    function fld(k, label, type, ac, ph, req) { return '<label class="pkco__f"><span>' + label + (req ? ' <i class="pkco__req">*</i>' : '') + '</span><input data-f="' + k + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(st.f[k] || '') + '"' + (ph ? ' placeholder="' + ph + '"' : '') + (req ? ' required' : '') + '></label>'; }
    /** everything but the delivery notes (and the gift message) must be filled in */
    function check(rows, del, intl) {
      keep(); var f = st.f, anyPrint = rows.some(function (r) { return r.item.pb.product === 'print'; }), miss = [];
      if (anyPrint && !del && !intl) { status('Choose how you’d like your book delivered.', 'is-err'); var dl = document.querySelector('.pkco__del'); if (dl) dl.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
      var need = ['name', 'phone', 'email'].concat(anyPrint && (intl || (del && del.needsAddress)) ? ['line1', 'area', 'town', 'county'] : []).concat(anyPrint && f.country === 'Another country' ? ['ctryo'] : []).concat(st.gift ? ['gto'] : []).concat(!intl && st.method === 'stk' && st.mpOther ? ['mpesa'] : []);
      document.querySelectorAll('[data-f]').forEach(function (i) { i.classList.remove('is-bad'); });
      need.forEach(function (k) { if (!f[k] || String(f[k]).trim().length < 2) { miss.push(k); var i = document.querySelector('[data-f="' + k + '"]'); if (i) i.classList.add('is-bad'); } });
      if (miss.length) { status('Please fill in all the details marked *.', 'is-err'); var b = document.querySelector('[data-f].is-bad'); if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); b.focus({ preventScroll: true }); } return false; }
      return true;
    }
    function keep() { document.querySelectorAll('[data-f]').forEach(function (i) { st.f[i.getAttribute('data-f')] = i.value.trim(); }); try { var s = Object.assign({}, st.f); delete s.gto; delete s.gphone; delete s.gnote; localStorage.setItem('pbk_details', JSON.stringify(s)); } catch (e) { } }
    function status(h, cls) { var s = document.getElementById('coStatus'); if (s) s.innerHTML = '<div class="pkco__st ' + (cls || '') + '">' + h + '</div>'; }
    function startPay(rows, del, total) {
      var f = st.f, btn = document.getElementById('coPay');
      var body = { items: rows.map(function (r) { return { projectId: r.item.pb.p, name: r.item.name, product: r.item.pb.product, pages: r.item.pb.pages, qty: r.item.qty, test: r.item.pb.test || undefined }; }), delivery: del ? del.id : null, name: f.name, phone: st.mpOther && f.mpesa ? f.mpesa : f.phone, mobile: f.phone, email: f.email, address: { line1: f.line1, area: f.area, town: f.town, county: f.county, country: countryName(), notes: f.notes }, coupon: st.coupon ? st.coupon.code : undefined, gift: st.gift ? { is: true, to: f.gto, phone: f.gphone, note: f.gnote } : null };
      btn.disabled = true; status('<span class="pkco__spin"></span> Sending the payment request…');
      api('pbk-pay', body).then(function (r) {
        status('<span class="pkco__spin"></span> <b>Check your phone.</b> Enter your M-Pesa PIN to pay ' + money(r.amount) + '. Order ' + esc(r.ref) + '.');
        var t0 = Date.now();
        (function poll() {
          setTimeout(function () {
            api('pbk-status', { intent: r.intent }).then(function (s) {
              if (s.status === 'pending') { if (Date.now() - t0 < 150000) return poll(); status('We haven’t had a confirmation yet. If you paid, wait a moment and tap <button class="pkco__link" id="coRe">check again</button>.', 'is-warn'); document.getElementById('coRe').onclick = function () { t0 = Date.now() - 120000; status('<span class="pkco__spin"></span> Checking…'); poll(); }; btn.disabled = false; return; }
              if (s.status === 'failed') { status(esc(s.desc || 'The payment was not completed.') + ' You can try again.', 'is-err'); btn.disabled = false; return; }
              paid(s, rows);
            }).catch(function (e) { if (Date.now() - t0 < 150000) return poll(); status(esc(e.message), 'is-err'); btn.disabled = false; });
          }, 4000);
        })();
      }).catch(function (e) { status(esc(e.message), 'is-err'); btn.disabled = false; });
    }
    function paid(s, rows) {
      savePurchases(s.ref, s.receipts, rows).then(function () {
        rows.forEach(function (r) { CIEL.cart.remove(r.item.id); });
        history.replaceState({}, '', BASE + '/checkout?sent=' + encodeURIComponent(s.ref));
        afterPay(main, s.ref);
      });
    }
  }
  /** saves paid (or Paybill-pending) purchases on this device */
  function savePurchases(ref, receipts, rows, manual) {
    return Promise.all((receipts || []).map(function (rc) {
      var row = (rows || []).filter(function (r) { var it = r.item || r; return (it.pb ? it.pb.p : it.projectId) === rc.projectId && (it.pb ? it.pb.product : it.product) === rc.product; })[0];
      var it = row ? (row.item || row) : {};
      return ST.purchases(rc.projectId).catch(function () { return []; }).then(function (l) {
        var id = ref + ':' + rc.projectId + ':' + rc.product, old = (l || []).filter(function (x) { return x.id === id; })[0];
        if (old) { old.receipt = rc.receipt; old.manual = manual || undefined; if (!manual) delete old.manual; return ST.savePurchase(old); }
        return ST.savePurchase({ id: id, app: 'pbk', ref: ref, projectId: rc.projectId, product: rc.product, pages: rc.pages, receipt: rc.receipt, name: it.name || '', thumb: it.thumb || '', at: Date.now(), sent: { print: [], view: [] }, done: rc.product !== 'print', manual: manual || undefined });
      });
    }));
  }
  /* Paybill orders waiting for Ciel Africa to confirm the payment (kept on this device) */
  function manualList() { try { return JSON.parse(localStorage.getItem('pbk_manual') || '[]'); } catch (e) { return []; } }
  function manualSave(o) { var l = manualList().filter(function (x) { return x.ref !== o.ref; }); if (o.done !== true) l.unshift(o); try { localStorage.setItem('pbk_manual', JSON.stringify(l.slice(0, 20))); } catch (e) { } }
  function manualDone(ref) { try { localStorage.setItem('pbk_manual', JSON.stringify(manualList().filter(function (x) { return x.ref !== ref; }))); } catch (e) { } }
  /** asks whether a Paybill order has been confirmed; once it is, the PDFs unlock on this device */
  function manualCheck(m) {
    return api('pbk-manual-status', { intent: m.intent }).then(function (s) {
      if (s.status === 'paid') return savePurchases(m.ref, s.receipts, m.items).then(function () { manualDone(m.ref); return s; });
      if (s.status === 'rejected') manualDone(m.ref);
      return s;
    });
  }
  /* after payment: thank-you, send printed books, download PDFs */
  function afterPay(main, ref) {
    var pend = manualList().filter(function (x) { return x.ref === ref; })[0];
    main.innerHTML = '<section class="pkco wrap pkco--done"><div class="pkco__ok' + (pend ? ' is-wait' : '') + '">' + (pend ? '⏳' : '✓') + '</div><h1>' + (pend ? 'Order received!' : 'Thank you!') + '</h1><p class="pkco__lead">' +
      (pend ? 'We’re confirming your M-Pesa Paybill payment for order <b>' + esc(ref) + '</b>. You’ll get an email as soon as it’s confirmed, usually within a few minutes.' + (pend.items.some(function (i) { return i.product === 'print'; }) ? ' Printed books are dispatched 24–48 hours after the payment is confirmed and your pages reach us.' : '') :
        'Payment received for order <b>' + esc(ref) + '</b>. A receipt is on its way to your email. Printed books are dispatched for delivery 24–48 hours after your pages reach us.') + '</p><div id="coDone"><p class="pk-empty">Loading…</p></div></section>';
    Promise.all([purchases(), caps()]).then(function (r) {
      var list = r[0].filter(function (x) { return x.ref === ref; }), cp = r[1], box = document.getElementById('coDone');
      var waiting = pend ? pend.items.filter(function (i) { return !list.some(function (x) { return x.projectId === i.projectId && x.product === i.product; }); }) : [];
      if (!list.length && !waiting.length) { box.innerHTML = '<p>This order isn’t saved on this device.</p>'; return; }
      box.innerHTML = waiting.map(function (i) {
        return '<div class="pkco__book"><img src="' + esc(i.thumb || '') + '" alt="" draggable="false"><div><b>' + esc(i.name || 'Photo book') + '</b><span>' + (i.product === 'print' ? 'Printed hardcover' : 'Print-ready PDF') + ' · ' + i.pages + ' pages</span><p class="pkco__small" data-wait>Waiting for your payment to be confirmed. Your PDF unlocks here (and in My books) once it is.</p><button class="btn btn--ghost btn--sm" data-check>Check again</button></div></div>';
      }).join('') + list.map(function (pu) {
        return '<div class="pkco__book" data-pu="' + esc(pu.id) + '"><img src="' + esc(pu.thumb || '') + '" alt="" draggable="false"><div><b>' + esc(pu.name || 'Photo book') + '</b><span>' + (pu.product === 'print' ? 'Printed hardcover' : 'Print-ready PDF') + ' · ' + pu.pages + ' pages</span>' +
          (pu.product === 'print' ? (cp.uploads ? '<div class="pkco__prog"><i style="width:' + (pu.done ? 100 : 0) + '%"></i></div><p class="pkco__small" data-msg>' + (pu.done ? 'Your pages have reached Ciel Africa. We’ll be in touch when it goes to print.' : 'Sending your pages to Ciel Africa. Keep this page open — it takes a few minutes.') + '</p>' + (pu.done ? '' : '<button class="btn btn--p btn--sm" data-send>Send my book now</button>')
            : '<p class="pkco__small">Download your print file and send it to us on WhatsApp (+254 706 549 703) or hello@cielafrica.com, quoting ' + esc(ref) + '.</p><button class="btn btn--p btn--sm" data-pdf="bleed">Download print file</button>')
            : '<button class="btn btn--p btn--sm" data-pdf>Download PDF</button><p class="pkco__small" data-msg></p>') + '</div></div>';
      }).join('') + '<div class="pkco__acts"><a class="btn btn--dark" data-go href="' + BASE + '/track?ref=' + encodeURIComponent(ref) + '">Track this order</a><a class="btn btn--ghost" data-go href="' + BASE + '/my-books">My books</a><a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello Ciel Africa, about my photo book order ' + ref) + '">Questions? WhatsApp us</a></div>';
      list.forEach(function (pu) {
        var el = box.querySelector('[data-pu="' + pu.id + '"]'), msg = el.querySelector('[data-msg]'), bar = el.querySelector('.pkco__prog i');
        var sb = el.querySelector('[data-send]');
        var sending = false;
        function send() {
          if (sending) return; sending = true;
          if (sb) sb.disabled = true;
          var t0 = Date.now(), d0 = null;
          window.addEventListener('beforeunload', warn);
          sendPages(pu, function (d, t) {
            if (d0 == null) d0 = d;
            if (bar) bar.style.width = Math.round(d / t * 100) + '%';
            if (!msg) return;
            if (d >= t) { msg.textContent = 'Done — your pages have reached Ciel Africa.'; return; }
            var left = '', done = d - d0; if (done > 1) { var s2 = (Date.now() - t0) / done * (t - d) / 1000; left = s2 > 90 ? ' About ' + Math.round(s2 / 60) + ' min left.' : ' Less than ' + Math.max(1, Math.ceil(s2 / 60)) + ' min left.'; }
            msg.textContent = 'Sending page ' + Math.min(Math.ceil(t / 2), Math.ceil(d / 2) + 1) + ' of ' + Math.ceil(t / 2) + '… keep this page open.' + left;
          })
            .then(function () { sending = false; window.removeEventListener('beforeunload', warn); if (sb) sb.remove(); })
            .catch(function (e) {
              sending = false; window.removeEventListener('beforeunload', warn); if (sb) sb.disabled = false;
              if (!navigator.onLine) { if (msg) msg.textContent = 'Your connection dropped. Sending continues by itself when you’re back online; everything sent so far is kept.'; window.addEventListener('online', send, { once: true }); return; }
              if (msg) msg.textContent = (e.message || 'Sending stopped.') + ' Tap “Send my book now” to continue from where it stopped. You can also come back later: My books → Send now, on this device.';
            });
        }
        function warn(ev) { ev.preventDefault(); ev.returnValue = 'Your book is still sending. Leave anyway?'; return ev.returnValue; }
        if (sb) { sb.onclick = send; if (!pu.done) send(); }
        var pb = el.querySelector('[data-pdf]');
        if (pb) pb.onclick = function () {
          ST.project(pu.projectId).then(function (p) {
            if (!p) throw new Error('This book isn’t saved on this device.');
            pb.disabled = true; return pdf(p, pu.receipt, function (i, n) { pb.textContent = 'Preparing ' + (i + 1) + ' of ' + n + '…'; }, pb.getAttribute('data-pdf') === 'bleed');
          }).then(function () { pb.textContent = 'Downloaded'; }, function (e) { pb.disabled = false; pb.textContent = 'Try again'; if (msg) msg.textContent = e.message; });
        };
      });
      box.querySelectorAll('[data-check]').forEach(function (b) {
        b.onclick = function () {
          b.disabled = true; b.textContent = 'Checking…';
          manualCheck(pend).then(function (s) {
            if (s.status === 'paid') return afterPay(main, ref);
            b.disabled = false; b.textContent = 'Check again';
            var w = b.parentNode.querySelector('[data-wait]'); if (w) w.textContent = s.status === 'rejected' ? 'We couldn’t match this payment. Check your email or WhatsApp us on +254 706 549 703.' : 'Not confirmed yet. We check Paybill payments by hand: try again in a little while, or watch your email.';
          }, function (e) { b.disabled = false; b.textContent = 'Check again'; });
        };
      });
    });
  }

  window.PBKShop = { manualList: manualList, manualCheck: manualCheck, spineOf: spineOf, renderSpine: renderSpine, wrapPage: wrapPage, bleed: bleed, isTest: isTest, backDoc: backDoc, add: add, unit: unit, checkout: checkout, purchases: purchases, pdf: pdf, sendPages: sendPages, resumeBanner: resumeBanner, caps: caps, docs: docs, renderPage: renderPage, photoSource: photoSource };
})();
