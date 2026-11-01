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
  var TRIM = { w: BOOK.trimW || 210, h: BOOK.trimH || 280 }, BLEED = 3, DPI = 300;

  function money(n) { return PBK.money(n); }
  function rule(r, pages) { if (!r || r.base == null || r.perExtraPage == null) return null; return Math.round(r.base + Math.max(0, pages - (r.includedPages || BOOK.pages.min)) * r.perExtraPage); }
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
      rows.forEach(function (r) { if (!r.p) return; var n = r.p.pages.length; if (n !== r.i.pb.pages || r.p.name !== r.i.name) CIEL.cart.update(r.i.id, { name: r.p.name, price: r.i.pb.test ? (BOOK.testPrice || 5) : unit(r.i.pb.product, n) || 0, pb: Object.assign({}, r.i.pb, { pages: n }) }); });
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
  function docs(p) { C.fixCover(p.cover, p.tpl); return [p.cover].concat(p.pages).concat([p.back || backDoc(p)]); }
  /** a page at trim size (px wide), optionally with bleed (mirrored edges) */
  function renderPage(doc, src, px, bleedPx) {
    return src.load(doc).then(function () { return R.toCanvas(doc, px, { photo: src.url, empty: 'none' }); }).then(function (c) {
      if (!bleedPx) return c;
      var b = bleedPx, o = document.createElement('canvas'); o.width = c.width + 2 * b; o.height = c.height + 2 * b;
      var x = o.getContext('2d'), W = c.width, H = c.height;
      x.drawImage(c, b, b);
      x.drawImage(c, 0, 0, 1, H, 0, b, b, H); x.drawImage(c, W - 1, 0, 1, H, W + b, b, b, H);
      x.drawImage(o, 0, b, W + 2 * b, 1, 0, 0, W + 2 * b, b); x.drawImage(o, 0, b + H - 1, W + 2 * b, 1, 0, b + H, W + 2 * b, b);
      return o;
    });
  }
  function jpeg(c, q) { return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', q); }); }
  function jpegUnder(c, max) { var qs = [0.92, 0.85, 0.78, 0.7, 0.6]; var i = 0; function next() { return jpeg(c, qs[i]).then(function (b) { if (b.size <= max || i >= qs.length - 1) return b; i++; return next(); }); } return next(); }

  /* ---------- paid PDF (digital purchase, or print file when uploads are off) ---------- */
  function js(src) { return new Promise(function (ok, no) { if (document.querySelector('script[src="' + src + '"]')) return ok(); var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Could not load the PDF tool.')); }; document.head.appendChild(s); }); }
  function pdf(p, receipt, onProgress, withBleed) {
    return api('pbk-verify', { receipt: receipt, projectId: p.id }).then(function () { return js('/assets/vendor/pdf-lib-1.17.1.min.js'); }).then(function () {
      var L = window.PDFLib, mm = 72 / 25.4, b = withBleed ? BLEED : 0;
      var pw = (TRIM.w + 2 * b) * mm, ph = (TRIM.h + 2 * b) * mm, px = Math.round(TRIM.w / 25.4 * (withBleed ? DPI : 200)), bpx = Math.round(b / 25.4 * (withBleed ? DPI : 200));
      var src = photoSource('orig'), list = docs(p), i = 0;
      return L.PDFDocument.create().then(function (doc) {
        doc.setTitle(p.name || 'Photo book'); doc.setCreator('Ciel Africa Photo Books'); doc.setProducer('cielafrica.com');
        function one() {
          if (i >= list.length) { src.done(); return doc.save(); }
          if (onProgress) onProgress(i, list.length);
          return renderPage(list[i], src, px, bpx).then(function (c) { return jpeg(c, 0.9); }).then(function (bl) { return bl.arrayBuffer(); }).then(function (buf) { return doc.embedJpg(buf); }).then(function (im) {
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
      var list = docs(p), total = list.length * 2 + 1, done = 0, sent = pu.sent || { print: [], view: [] };
      var src = photoSource('orig'), srcV = photoSource('prev');
      var px = Math.round(TRIM.w / 25.4 * DPI), bpx = Math.round(BLEED / 25.4 * DPI);
      function up(kind, i, blob) { return fetch('/api/photobooks?route=pbk-upload&kind=' + kind + '&i=' + i, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Requested-With': 'ciel', 'X-Receipt': pu.receipt }, body: blob }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'Upload failed'); }); }); }
      function retry(fn) { var n = 0; function go() { return fn().catch(function (e) { if (++n > 3) throw e; return new Promise(function (ok) { setTimeout(ok, 1500 * n); }).then(go); }); } return go(); }
      function save() { pu.sent = sent; return ST.savePurchase(pu); }
      var bookInfo = { name: p.name, template: p.tpl, colour: p.pal, size: TRIM.w + ' × ' + TRIM.h + ' mm', bleed: BLEED + ' mm', dpi: DPI, files: '000 = front cover, 001–' + String(p.pages.length).padStart(3, '0') + ' = pages, ' + String(p.pages.length + 1).padStart(3, '0') + ' = back cover', spine: C.spineFor(p.cover, p.tpl, p.pal) };
      var i = 0;
      function step() {
        if (onProgress) onProgress(done, total);
        if (i >= list.length) return null;
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
    var st = { delivery: (DEL.filter(function (d) { return d.id === 'nairobi'; })[0] || DEL[0] || {}).id, f: {} };
    try { var ld = localStorage.getItem('pbk_delivery'); if (ld && DEL.some(function (d) { return d.id === ld; })) st.delivery = ld; } catch (e) { }
    try { Object.assign(st.f, JSON.parse(localStorage.getItem('pbk_details') || '{}')); } catch (e) { }
    Promise.all([sync(), caps()]).then(function (r) {
      var rows = r[0], cp = r[1];
      if (!rows.length) { document.getElementById('coMain').innerHTML = '<div class="pk-empty"><p>No photo books in your cart yet.</p><a class="btn btn--p" data-go href="' + BASE + '">Create a photo book</a></div>'; document.getElementById('coSide').innerHTML = ''; return; }
      draw(rows, cp);
    });
    function draw(rows, cp) {
      var test = rows.some(function (r) { return r.item.pb.test; });
      var anyPrint = rows.some(function (r) { return r.item.pb.product === 'print'; }), missing = rows.filter(function (r) { return !r.project; });
      var del = DEL.filter(function (d) { return d.id === st.delivery; })[0] || DEL[0];
      if (test && del) del = Object.assign({}, del, { price: 0 });
      var eta = sendEstimate(rows.filter(function (r) { return r.item.pb.product === 'print'; }).map(function (r) { return r.project; }));
      var lines = rows.map(function (r) { return { label: r.item.name + ' · ' + (r.item.pb.product === 'digital' ? 'PDF' : 'Printed') + ' · ' + r.item.pb.pages + ' pages', amount: r.item.price, qty: r.item.qty }; });
      var total = lines.reduce(function (s, l) { return s + l.amount * l.qty; }, 0) + (anyPrint && del ? (del.price || 0) : 0);
      document.getElementById('coMain').innerHTML =
        '<h2 class="pkco__h">Your books</h2>' + rows.map(function (r) {
          var it = r.item, pr = it.pb.product;
          return '<div class="pkco__item" data-id="' + esc(it.id) + '"><img src="' + esc(it.thumb || '') + '" alt="" draggable="false"><div class="pkco__it"><b>' + esc(it.name) + '</b><span>' + it.pb.pages + ' pages · ' + esc(BOOK.size || '21 × 28 cm') + '</span>' +
            (it.pb.test ? '<p class="pkco__test"><b>TEST order</b> · only for Ciel Africa (you must be signed in to Photo Book orders on this browser). Not printed; deleted after 24 hours.</p>' : '<div class="pkco__seg"><button data-prod="print"' + (pr === 'print' ? ' class="is-on"' : '') + '>Printed hardcover<small>' + money(unit('print', it.pb.pages)) + '</small></button><button data-prod="digital"' + (pr === 'digital' ? ' class="is-on"' : '') + '>Print-ready PDF<small>' + money(unit('digital', it.pb.pages)) + '</small></button></div>') +
            (r.project ? '' : '<p class="pkco__warn">This book isn’t saved on this device. Open checkout on the phone or computer you designed it on.</p>') +
            '</div><div class="pkco__end">' + (pr === 'print' && !it.pb.test ? '<div class="pkco__qty"><button data-q="-1" aria-label="One less">−</button><span>' + it.qty + '</span><button data-q="1" aria-label="One more">+</button></div>' : '') + '<b>' + money(it.price * it.qty) + '</b><button class="pkco__rm" data-rm>Remove</button></div></div>';
        }).join('') +
        (anyPrint ? '<h2 class="pkco__h">Delivery</h2><div class="pkco__del">' + DEL.map(function (d) { return '<label class="pkco__opt' + (d.id === st.delivery ? ' is-on' : '') + '"><input type="radio" name="del" value="' + d.id + '"' + (d.id === st.delivery ? ' checked' : '') + '><span>' + esc(d.name) + '</span><b>' + (d.price && !test ? money(d.price) : 'Free') + '</b></label>'; }).join('') + '</div><p class="pkco__note">Printing and delivery usually take 5–10 working days. We’ll confirm by email and WhatsApp.</p>' : '') +
        '<h2 class="pkco__h">Is this a gift?</h2><div class="pkco__gift"><label class="pkco__opt' + (!st.gift ? ' is-on' : '') + '"><input type="radio" name="gift" value="0"' + (!st.gift ? ' checked' : '') + '><span>No, it’s for me</span></label><label class="pkco__opt' + (st.gift ? ' is-on' : '') + '"><input type="radio" name="gift" value="1"' + (st.gift ? ' checked' : '') + '><span>Yes, it’s a gift for someone 🎁</span></label></div>' +
        (st.gift ? '<div class="pkco__form pkco__form--gift">' + fld('gto', 'Who is it for?', 'text', 'off', 'Their name') + (anyPrint && del && del.needsAddress ? fld('gphone', 'Their phone (for delivery)', 'tel', 'off', 'Optional') : '') + '<label class="pkco__f pkco__f--full"><span>Gift message (optional)</span><textarea data-f="gnote" rows="3" maxlength="400" placeholder="Write a short message">' + esc(st.f.gnote || '') + '</textarea></label></div>' : '') +
        '<h2 class="pkco__h">Your details</h2><div class="pkco__form">' +
        fld('name', 'Full name', 'text', 'name') + fld('phone', 'M-Pesa phone number', 'tel', 'tel', '0712 345 678') + fld('email', 'Email (for your receipt)', 'email', 'email') +
        (anyPrint && del && del.needsAddress ? '</div><h2 class="pkco__h">Delivery address</h2><p class="pkco__note">Where should we bring your book?</p><div class="pkco__form">' + fld('line1', 'Street address or building', 'text', 'address-line1') + fld('area', 'Area / estate', 'text', 'address-line2') + fld('town', 'Town', 'text', 'address-level2') + fld('county', 'County', 'text', 'address-level1') + fld('notes', 'Delivery notes (optional)', 'text', 'off') : '') + '</div>';
      document.getElementById('coSide').innerHTML = '<div class="pkco__sum"><h3>Order summary</h3>' + lines.map(function (l) { return '<div class="pkco__ln"><span>' + esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + '</span><b>' + money(l.amount * l.qty) + '</b></div>'; }).join('') +
        (anyPrint && del ? '<div class="pkco__ln"><span>' + esc(del.name) + '</span><b>' + (del.price ? money(del.price) : 'Free') + '</b></div>' : '') +
        '<div class="pkco__tot"><span>Total</span><b>' + money(total) + '</b></div>' +
        (eta ? '<div class="pkco__eta"><b>After you pay</b><span>Your book’s pages upload from this device so we can print them: about ' + eta + ' on a good connection. More photos and pages take longer. Keep this page open; if it stops, open <a data-go href="' + BASE + '/my-books">My books</a> on this device and tap <b>Send now</b>.</span></div>' : '') +
        (cp.payments ? '<button class="btn btn--p btn--lg pkco__pay" id="coPay"' + (missing.length ? ' disabled' : '') + '>Pay ' + money(total) + ' with M-Pesa</button><p class="pkco__small">You’ll get a prompt on your phone. Enter your M-Pesa PIN to pay.</p>' : '<p class="pkco__warn">M-Pesa checkout is not available right now. Order on WhatsApp below.</p>') +
        '<div class="pkco__or"><span>or</span></div><a class="btn btn--ghost pkco__wa" id="coWa" target="_blank" rel="noopener">Order on WhatsApp</a><p class="pkco__small">We’ll reply with how to pay and send your book.</p><div id="coStatus"></div></div>';
      var M = document.getElementById('coMain');
      M.querySelectorAll('.pkco__item').forEach(function (el) {
        var id = el.getAttribute('data-id');
        el.querySelectorAll('[data-prod]').forEach(function (b) { b.onclick = function () { var it = CIEL.cart.items().filter(function (x) { return x.id === id; })[0]; var prod = b.getAttribute('data-prod'); if (it.pb.product === prod) return; var nid = 'pbk:' + it.pb.p + ':' + prod; CIEL.cart.remove(id); CIEL.cart.addItem(Object.assign({}, it, { id: nid, qty: 1, price: unit(prod, it.pb.pages), pb: Object.assign({}, it.pb, { product: prod }) }), true); refresh(); }; });
        el.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { var it = CIEL.cart.items().filter(function (x) { return x.id === id; })[0]; CIEL.cart.setQty(id, Math.min(CFG.maxQuantity || 10, it.qty + +b.getAttribute('data-q'))); refresh(); }; });
        var rm = el.querySelector('[data-rm]'); rm.onclick = function () { CIEL.cart.remove(id); refresh(); };
      });
      M.querySelectorAll('[name=del]').forEach(function (r2) { r2.onchange = function () { keep(); st.delivery = r2.value; try { localStorage.setItem('pbk_delivery', r2.value); } catch (e) { } draw(rows.map(function (x) { return { item: CIEL.cart.items().filter(function (y) { return y.id === x.item.id; })[0] || x.item, project: x.project }; }), cp); }; });
      M.querySelectorAll('[data-f]').forEach(function (i) { i.addEventListener('input', keep); });
      M.querySelectorAll('[name=gift]').forEach(function (r2) { r2.onchange = function () { keep(); st.gift = r2.value === '1'; draw(rows, cp); }; });
      function waText() {
        keep(); var f = st.f;
        return 'Hello Ciel Africa, I’d like to order:\n' + rows.map(function (r) { return '• ' + r.item.name + ' — ' + (r.item.pb.product === 'digital' ? 'print-ready PDF' : 'printed hardcover × ' + r.item.qty) + ', ' + r.item.pb.pages + ' pages (' + money(r.item.price * r.item.qty) + ')'; }).join('\n') +
          (anyPrint && del ? '\nDelivery: ' + del.name : '') + '\nTotal: ' + money(total) + (f.name ? '\nName: ' + f.name : '') + (f.phone ? '\nPhone: ' + f.phone : '') + (f.line1 ? '\nAddress: ' + [f.line1, f.area, f.town, f.county].filter(Boolean).join(', ') : '') + (st.gift ? '\nIt’s a gift' + (f.gto ? ' for ' + f.gto : '') + (f.gphone ? ' (' + f.gphone + ')' : '') + (f.gnote ? '\nGift message: ' + f.gnote : '') : '');
      }
      var wa = document.getElementById('coWa'); wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText()); wa.onclick = function () { wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(waText()); };
      var pay = document.getElementById('coPay'); if (pay) pay.onclick = function () { keep(); startPay(rows, del, total); };
      function refresh() { sync().then(function (rs) { if (!rs.length) return checkout(main); draw(rs, cp); }); }
    }
    function fld(k, label, type, ac, ph) { return '<label class="pkco__f"><span>' + label + '</span><input data-f="' + k + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(st.f[k] || '') + '"' + (ph ? ' placeholder="' + ph + '"' : '') + '></label>'; }
    function keep() { document.querySelectorAll('[data-f]').forEach(function (i) { st.f[i.getAttribute('data-f')] = i.value.trim(); }); try { var s = Object.assign({}, st.f); delete s.gto; delete s.gphone; delete s.gnote; localStorage.setItem('pbk_details', JSON.stringify(s)); } catch (e) { } }
    function status(h, cls) { var s = document.getElementById('coStatus'); if (s) s.innerHTML = '<div class="pkco__st ' + (cls || '') + '">' + h + '</div>'; }
    function startPay(rows, del, total) {
      var f = st.f, btn = document.getElementById('coPay');
      var body = { items: rows.map(function (r) { return { projectId: r.item.pb.p, name: r.item.name, product: r.item.pb.product, pages: r.item.pb.pages, qty: r.item.qty, test: r.item.pb.test || undefined }; }), delivery: del ? del.id : null, name: f.name, phone: f.phone, email: f.email, address: { line1: f.line1, area: f.area, town: f.town, county: f.county, notes: f.notes }, gift: st.gift ? { is: true, to: f.gto, phone: f.gphone, note: f.gnote } : null };
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
      var saves = s.receipts.map(function (rc) {
        var row = rows.filter(function (r) { return r.item.pb.p === rc.projectId && r.item.pb.product === rc.product; })[0];
        return ST.savePurchase({ id: s.ref + ':' + rc.projectId + ':' + rc.product, app: 'pbk', ref: s.ref, projectId: rc.projectId, product: rc.product, pages: rc.pages, receipt: rc.receipt, name: row ? row.item.name : '', thumb: row ? row.item.thumb : '', at: Date.now(), sent: { print: [], view: [] }, done: rc.product !== 'print' });
      });
      Promise.all(saves).then(function () {
        rows.forEach(function (r) { CIEL.cart.remove(r.item.id); });
        history.replaceState({}, '', BASE + '/checkout?sent=' + encodeURIComponent(s.ref));
        afterPay(main, s.ref);
      });
    }
  }
  /* after payment: thank-you, send printed books, download PDFs */
  function afterPay(main, ref) {
    main.innerHTML = '<section class="pkco wrap pkco--done"><div class="pkco__ok">✓</div><h1>Thank you!</h1><p class="pkco__lead">Payment received for order <b>' + esc(ref) + '</b>. A receipt is on its way to your email.</p><div id="coDone"><p class="pk-empty">Loading…</p></div></section>';
    Promise.all([purchases(), caps()]).then(function (r) {
      var list = r[0].filter(function (x) { return x.ref === ref; }), cp = r[1], box = document.getElementById('coDone');
      if (!list.length) { box.innerHTML = '<p>This order isn’t saved on this device.</p>'; return; }
      box.innerHTML = list.map(function (pu) {
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
    });
  }

  window.PBKShop = { isTest: isTest, backDoc: backDoc, add: add, unit: unit, checkout: checkout, purchases: purchases, pdf: pdf, sendPages: sendPages, resumeBanner: resumeBanner, caps: caps, docs: docs, renderPage: renderPage, photoSource: photoSource };
})();
