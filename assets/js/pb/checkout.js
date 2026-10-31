/* ============================================================
   CIEL PHOTO BOOKS — order, payment and paid files
   1. The customer approves one exact version (a SHA-256 of the
      design + every photo's content hash) which is saved on device.
   2. The server prices it from data/photobooks.js and sends an
      M-Pesa STK push. Only the server's confirmation (Daraja STK
      Query) returns a signed receipt.
   3. The final PDF is built from the approved version, after the
      server re-verifies the receipt for that version.
   ============================================================ */
(function () {
  'use strict';
  var A = window.PBApp, E = A.E, SV = A.SV, ST = A.ST, CFG = A.CFG, S = A.S, esc = A.esc, I = A.icon;
  var app = document.getElementById('app');
  var API = '/api/photobooks?route=';

  function api(route, body, opt) {
    opt = opt || {};
    return fetch(API + route, { method: body === undefined ? 'GET' : 'POST', headers: Object.assign({ 'X-Requested-With': 'ciel' }, body !== undefined && !opt.raw ? { 'Content-Type': 'application/json' } : {}, opt.headers || {}), body: body === undefined ? undefined : (opt.raw ? body : JSON.stringify(body)) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'The server returned an unexpected response (' + r.status + ').' }; }).then(function (j) { if (!r.ok || j.ok === false) { var e = new Error(j.error || 'Request failed'); e.code = j.code; e.status = r.status; throw e; } return j; }); }, function () { throw new Error('Can’t reach Ciel Africa right now. Check your connection and try again.'); });
  }
  A.api = api;
  function hex(buf) { var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += (a[i] < 16 ? '0' : '') + a[i].toString(16); return s; }
  function sha(data) { return crypto.subtle.digest('SHA-256', typeof data === 'string' ? new TextEncoder().encode(data) : data).then(hex); }
  A.designHash = function (project) { return sha(E.canonical(project, S.photos)); };

  var libs = null;
  function loadLibs() {
    if (libs) return libs;
    function js(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Could not load the PDF engine. Check your connection.')); }; document.head.appendChild(s); }); }
    libs = js('/assets/vendor/pdf-lib-1.17.1.min.js').then(function () { return js('/assets/vendor/fontkit-1.1.1.umd.min.js'); }).catch(function (e) { libs = null; throw e; });
    return libs;
  }
  function reencode(id) {
    return ST.blob(id, 'orig').then(function (b) { return PBPhotos.decode(b); }).then(function (img) {
      var c = document.createElement('canvas'); c.width = img.width || img.naturalWidth; c.height = img.height || img.naturalHeight;
      var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0);
      return new Promise(function (ok, no) { c.toBlob(function (bl) { bl ? ok(bl) : no(new Error('encode')); }, 'image/jpeg', 0.95); });
    }).then(function (bl) { return bl.arrayBuffer(); }).then(function (bytes) { return { bytes: bytes }; });
  }
  /** build a PDF of an approved version. kind: book | interior | cover */
  function buildPdf(design, kind, hash, onProgress) {
    return loadLibs().then(function () {
      return PBPdf.build({ L: window.PDFLib, fontkit: window.fontkit, cfg: CFG, project: design, photos: S.photos, kind: kind, hash: hash, onProgress: onProgress,
        bytes: function (id) { return ST.blob(id, 'orig').then(function (b) { return b ? b.arrayBuffer() : null; }); },
        fontBytes: function (f) { return fetch('/assets/fonts/pb/' + f).then(function (r) { if (!r.ok) throw new Error('Font missing'); return r.arrayBuffer(); }); },
        reencode: reencode });
    });
  }
  function saveFile(bytes, name) {
    var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function slug(s) { return String(s || 'photo-book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'photo-book'; }

  /* =============================== ORDER VIEW =============================== */
  A.views.order = function () {
    var p = S.project;
    if (!p.pages || !p.pages.length) { location.hash = '#/p/' + p.id + '/photos'; return; }
    var v = E.validate(CFG, p, S.photos), f = A.fmt(), pages = p.pages.length;
    var printFormats = (CFG.formats || []).filter(function (x) { return x.enabled !== false && x.print && x.print.enabled; });
    var st = { product: 'digital', caps: null, busy: false };
    var bindings = f.print && f.print.enabled ? Object.keys(f.print.bindings || {}).filter(function (k) { return (CFG.bindings || {})[k]; }) : [];
    var form = { binding: bindings.indexOf(p.binding) >= 0 ? p.binding : bindings[0], paper: p.paper || ((CFG.papers || [])[0] || {}).id, quantity: 1, delivery: ((CFG.delivery || []).filter(function (d) { return d.enabled !== false; })[0] || {}).id };
    var saved = {}; try { saved = JSON.parse(localStorage.getItem('pb_contact') || '{}'); } catch (e) { /* storage may be blocked */ }

    function quote() { return E.quote(CFG, { product: st.product, formatId: p.formatId, pages: pages, binding: form.binding, paper: form.paper, quantity: form.quantity, delivery: form.delivery }); }
    function draw() {
      var q = quote(), dq = E.quote(CFG, { product: 'digital', formatId: p.formatId, pages: pages });
      var pq = printFormats.length ? E.quote(CFG, { product: 'print', formatId: p.formatId, pages: pages, binding: form.binding, paper: form.paper, quantity: 1, delivery: form.delivery }) : null;
      var printOk = f.print && f.print.enabled && st.caps && st.caps.orders;
      var del = (CFG.delivery || []).filter(function (d) { return d.id === form.delivery; })[0] || {};
      app.innerHTML = '<section class="st-wrap st-order"><div class="st-head"><div><p class="eyebrow">Step 4 of 4</p><h1>Order your book</h1><p class="lead">Choose a digital PDF or a printed book delivered in Kenya. You approve this exact version before paying.</p></div></div>' +
        '<div class="ord"><div class="ord__main">' +
        (v.errors.length ? '<div class="box box--err"><h3>' + I('alert') + 'Fix ' + v.errors.length + ' thing' + (v.errors.length === 1 ? '' : 's') + ' first</h3><ul>' + v.errors.slice(0, 8).map(function (x) { return '<li>' + esc(x.msg) + '</li>'; }).join('') + '</ul><a class="btn btn--sm btn--dark" href="#/p/' + p.id + '/design">Go to the editor</a></div>' : '') +
        '<h2 class="st-h2">1 · Choose your book</h2><div class="prods">' +
          '<label class="prod' + (st.product === 'digital' ? ' on' : '') + '"><input type="radio" name="prod" value="digital"' + (st.product === 'digital' ? ' checked' : '') + '><b>Digital photo book</b><span>A high-resolution, print-ready PDF of every page and both covers. Yours to keep, share or print anywhere.</span><em>' + (dq.ok ? A.fmtMoney(dq.total) : 'Price not published yet') + '</em></label>' +
          '<label class="prod' + (st.product === 'print' ? ' on' : '') + (printFormats.length ? '' : ' prod--off') + '"><input type="radio" name="prod" value="print"' + (st.product === 'print' ? ' checked' : '') + (printOk ? '' : ' disabled') + '><b>Printed photo book</b><span>Professionally printed and bound by Ciel Africa, collected in Nairobi or delivered in Kenya.</span><em>' + (!printFormats.length ? 'Coming soon' : !(f.print && f.print.enabled) ? 'Not available in this format' : st.caps && !st.caps.orders ? 'Not available online yet' : pq && pq.ok ? 'From ' + A.fmtMoney(pq.lines[0].amount) : 'Price not published yet') + '</em></label></div>' +
        (st.product === 'print' ? '<div class="ord__opts"><div class="st-two"><label class="fld"><span>Binding</span><select data-o="binding">' + bindings.map(function (k) { return '<option value="' + k + '"' + (form.binding === k ? ' selected' : '') + '>' + esc(CFG.bindings[k].name) + '</option>'; }).join('') + '</select></label><label class="fld"><span>Paper</span><select data-o="paper">' + (CFG.papers || []).filter(function (x) { return x.enabled !== false; }).map(function (x) { return '<option value="' + x.id + '"' + (form.paper === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label></div>' +
          '<div class="st-two"><label class="fld"><span>Copies</span><input type="number" data-o="quantity" min="1" max="' + (CFG.maxQuantity || 10) + '" value="' + form.quantity + '"></label><label class="fld"><span>Delivery</span><select data-o="delivery">' + (CFG.delivery || []).filter(function (d) { return d.enabled !== false; }).map(function (d) { return '<option value="' + d.id + '"' + (form.delivery === d.id ? ' selected' : '') + '>' + esc(d.name) + (d.price != null ? ' — ' + (d.price ? A.fmtMoney(d.price) : 'free') : '') + '</option>'; }).join('') + '</select></label></div>' +
          (del.needsAddress ? '<div class="st-two"><label class="fld"><span>Street address, building, house</span><input id="a1" maxlength="120" autocomplete="street-address" value="' + esc(saved.line1 || '') + '"></label><label class="fld"><span>Area / estate</span><input id="a2" maxlength="80" value="' + esc(saved.area || '') + '"></label></div><div class="st-two"><label class="fld"><span>Town</span><input id="a3" maxlength="60" autocomplete="address-level2" value="' + esc(saved.town || '') + '"></label><label class="fld"><span>County</span><input id="a4" maxlength="60" value="' + esc(saved.county || '') + '"></label></div><label class="fld"><span>Directions for the courier <em>optional</em></span><input id="a5" maxlength="200"></label>' : '') +
          '<label class="fld"><span>Notes for us <em>optional</em></span><input id="notes" maxlength="300"></label></div>' : '') +
        '<h2 class="st-h2">2 · Your details</h2><div class="st-two"><label class="fld"><span>Full name</span><input id="cname" autocomplete="name" maxlength="80" value="' + esc(saved.name || '') + '"></label><label class="fld"><span>Email (for your receipt and updates)</span><input id="cemail" type="email" autocomplete="email" maxlength="190" value="' + esc(saved.email || '') + '"></label></div>' +
        '<label class="fld"><span>M-Pesa phone number</span><input id="cphone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0712 345 678" maxlength="16" value="' + esc(saved.phone || '') + '"></label>' +
        '<h2 class="st-h2">3 · Approve and pay</h2><label class="appr"><input type="checkbox" id="appr"> <span>I’ve checked every page in the <a href="#/p/' + p.id + '/preview">preview</a>. ' + (st.product === 'print' ? 'Print exactly this version.' : 'Create my PDF from exactly this version.') + ' Later edits won’t change this order.</span></label>' +
        (v.warnings.length ? '<details class="box box--warn"><summary>' + v.warnings.length + ' note' + (v.warnings.length === 1 ? '' : 's') + ' about this book (optional to fix)</summary><ul>' + v.warnings.slice(0, 12).map(function (x) { return '<li>' + esc(x.msg) + '</li>'; }).join('') + '</ul></details>' : '') +
        '<div class="pay" id="pay"></div></div>' +
        '<aside class="ord__side"><div class="st-sum"><div class="st-sum__cov">' + SV.svg(E.renderFront(CFG, p, S.photos), { url: function (id) { return A.url(id, 'thumb'); }, empty: 'editor' }) + '</div><dl><dt>Book</dt><dd>' + esc(E.coverTexts(p).title || p.name) + '</dd><dt>Format</dt><dd>' + esc(f.name + ' · ' + f.size) + '</dd><dt>Pages</dt><dd>' + pages + '</dd>' + (q.ok ? q.lines.map(function (l) { return '<dt>' + esc(l.label) + (l.qty > 1 ? ' × ' + l.qty : '') + '</dt><dd>' + (l.amount ? A.fmtMoney(l.amount * (l.qty || 1)) : 'Free') + '</dd>'; }).join('') + '<dt class="tot">Total</dt><dd class="tot">' + A.fmtMoney(q.total) + '</dd>' : '') + '</dl>' +
          (!q.ok ? '<p class="muted">' + esc(q.code === 'price_not_set' ? 'Pricing for this option hasn’t been published yet, so it can’t be bought online today. Your book stays saved; contact us if you’d like to order now.' : q.msg) + '</p>' : '') + '</div>' +
          '<aside class="st-note"><h3>How your photos are handled</h3><p>' + (st.product === 'print' ? 'After payment, only the two print-ready PDFs of this approved version are sent to Ciel Africa for printing. We delete them after your order is complete.' : 'Your photos never leave this device. The PDF is created right here, in your browser.') + '</p></aside><div id="buys"></div></aside></div></section>';
      bind(q);
      payArea(q);
      purchases();
    }
    function bind() {
      app.querySelectorAll('[name=prod]').forEach(function (r) { r.onchange = function () { st.product = r.value; keep(); draw(); }; });
      app.querySelectorAll('[data-o]').forEach(function (s) { s.onchange = function () { var k = s.getAttribute('data-o'); form[k] = k === 'quantity' ? Math.max(1, Math.min(CFG.maxQuantity || 10, +s.value || 1)) : s.value; keep(); draw(); }; });
    }
    function keep() { var g = function (id) { var el = document.getElementById(id); return el ? el.value : undefined; }; ['cname', 'cemail', 'cphone', 'a1', 'a2', 'a3', 'a4'].forEach(function (id) { var val = g(id); if (val !== undefined) saved[{ cname: 'name', cemail: 'email', cphone: 'phone', a1: 'line1', a2: 'area', a3: 'town', a4: 'county' }[id]] = val; }); }
    function payArea(q) {
      var el = document.getElementById('pay');
      var blocked = v.errors.length ? 'Fix the problems above first.' : !q.ok ? null : st.caps && !st.caps.payments ? 'Online payment isn’t available right now. Please contact us to order.' : '';
      el.innerHTML = q.ok ? '<button type="button" class="btn btn--p btn--lg btn--block" id="payBtn"' + (blocked ? ' disabled' : '') + '>Pay ' + A.fmtMoney(q.total) + ' with M-Pesa</button>' + (blocked ? '<p class="muted">' + esc(blocked) + '</p>' : '<p class="muted">You’ll get a prompt on your phone to enter your M-Pesa PIN.</p>') + '<div id="payStatus" aria-live="polite"></div>' : '<a class="btn btn--dark" href="/contact">Contact us to order</a>';
      var b = document.getElementById('payBtn'); if (b) b.onclick = function () { pay(q); };
    }
    function msg(html, cls) { var s = document.getElementById('payStatus'); if (s) s.innerHTML = '<div class="box ' + (cls || '') + '">' + html + '</div>'; }
    function pay(q) {
      if (st.busy) return;
      keep();
      var name = (saved.name || '').trim(), email = (saved.email || '').trim(), phone = (saved.phone || '').trim();
      if (name.length < 2) return msg('Enter your full name.', 'box--err');
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return msg('Enter a valid email address.', 'box--err');
      if (!/^(\+?254|0)?[17]\d{8}$/.test(phone.replace(/[\s-]/g, ''))) return msg('Enter an M-Pesa number like 0712 345 678.', 'box--err');
      var del = (CFG.delivery || []).filter(function (d) { return d.id === form.delivery; })[0] || {};
      if (st.product === 'print' && del.needsAddress && (!(saved.line1 || '').trim() || !(saved.town || '').trim())) return msg('Enter your delivery address and town.', 'box--err');
      if (!document.getElementById('appr').checked) return msg('Tick the box to approve this version of your book.', 'box--err');
      try { localStorage.setItem('pb_contact', JSON.stringify(saved)); } catch (e) { /* optional convenience */ }
      st.busy = true; document.getElementById('payBtn').disabled = true;
      msg('Preparing your order…');
      var design = JSON.parse(JSON.stringify(p)), hash;
      A.designHash(design).then(function (h) {
        hash = h;
        return ST.saveVersion({ id: p.id + ':' + h, projectId: p.id, hash: h, design: design, createdAt: Date.now() });
      }).then(function () {
        A.track('checkout_start', { product: st.product, pages: pages });
        return api('pay', { product: st.product, formatId: p.formatId, pages: pages, binding: form.binding, paper: form.paper, quantity: form.quantity, delivery: form.delivery, designHash: hash, projectRef: p.id.slice(-12), phone: phone, name: name, email: email, notes: (document.getElementById('notes') || {}).value, address: { line1: saved.line1, area: saved.area, town: saved.town, county: saved.county, notes: (document.getElementById('a5') || {}).value } });
      }).then(function (r) {
        var buy = { id: r.ref, ref: r.ref, projectId: p.id, hash: hash, product: st.product, intent: r.intent, status: 'pending', amount: r.amount, createdAt: Date.now(), name: E.coverTexts(design).title || p.name };
        return ST.savePurchase(buy).then(function () { return poll(buy); });
      }).catch(function (e) { msg(esc(e.message), 'box--err'); }).then(function () { st.busy = false; var b = document.getElementById('payBtn'); if (b) b.disabled = false; });
    }
    function poll(buy) {
      var tries = 0;
      msg('<b>Check your phone.</b> Enter your M-Pesa PIN to pay. This page updates by itself — keep it open.<div class="spin"></div>');
      return new Promise(function (done) {
        function tick() {
          tries++;
          api('status', { intent: buy.intent }).then(function (r) {
            if (r.status === 'paid') {
              buy.status = 'paid'; buy.receipt = r.receipt; buy.orderToken = r.orderToken; buy.paidAt = Date.now();
              ST.savePurchase(buy).then(function () { A.track('purchase', { product: buy.product }); var pb = document.getElementById('payBtn'); if (pb) pb.remove(); var ap = document.getElementById('appr'); if (ap) ap.checked = false; msg(I('check') + ' <b>Payment confirmed.</b> Order ' + esc(buy.ref) + '. ' + (buy.product === 'print' ? 'Your print files are being prepared below — keep this page open.' : 'Download your PDF from “Your orders”.'), 'box--ok'); purchases(); if (buy.product === 'print') sendPrintFiles(buy); done(); });
            } else if (r.status === 'failed') {
              buy.status = 'failed'; ST.savePurchase(buy); msg('<b>Payment not completed.</b> ' + esc(r.desc || '') + ' You can try again.', 'box--err'); purchases(); done();
            } else if (tries < 40) setTimeout(tick, 4500);
            else { msg('We haven’t had confirmation from M-Pesa yet. If you paid, use <b>Check payment</b> below in a minute — your order is saved on this device.', 'box--warn'); purchases(); done(); }
          }).catch(function (e) { if (tries < 40) setTimeout(tick, 6000); else { msg(esc(e.message), 'box--err'); done(); } });
        }
        setTimeout(tick, 5000);
      });
    }
    function purchases() {
      ST.purchases(p.id).then(function (list) {
        var el = document.getElementById('buys'); if (!el) return;
        list = list.filter(function (b) { return b.status !== 'failed'; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
        if (!list.length) { el.innerHTML = ''; return; }
        el.innerHTML = '<div class="buys"><h3>Your orders for this book</h3>' + list.map(function (b) {
          var acts = b.status === 'pending' ? '<button type="button" class="btn btn--sm btn--dark" data-chk="' + b.id + '">Check payment</button>' :
            b.product === 'digital' ? '<button type="button" class="btn btn--sm btn--p" data-dl="' + b.id + '" data-k="book">' + I('download') + 'Download PDF</button><button type="button" class="btn btn--sm btn--ghost" data-dl="' + b.id + '" data-k="printer">Printer files</button>' :
              (b.filesSent ? '' : '<button type="button" class="btn btn--sm btn--p" data-send="' + b.id + '">Send print files</button>') + (b.orderToken ? '<a class="btn btn--sm btn--ghost" href="/photo-books/order?t=' + encodeURIComponent(b.orderToken) + '">Order status</a>' : '');
          return '<div class="buy"><div><b>' + esc(b.ref) + '</b><span>' + (b.product === 'print' ? 'Printed book' : 'Digital PDF') + ' · ' + A.fmtMoney(b.amount || 0) + ' · ' + (b.status === 'paid' ? 'Paid' : b.status === 'pending' ? 'Awaiting confirmation' : esc(b.status)) + ' · ' + A.when(b.createdAt) + '</span></div><div class="buy__a">' + acts + '</div><div class="buy__p" id="bp-' + b.id + '">' + (notes[b.id] || '') + '</div></div>';
        }).join('') + '</div>';
        el.onclick = function (e) {
          var t = e.target.closest('button'); if (!t) return;
          var id = t.getAttribute('data-dl') || t.getAttribute('data-chk') || t.getAttribute('data-send'), b = list.filter(function (x) { return x.id === id; })[0]; if (!b) return;
          if (t.hasAttribute('data-chk')) { t.disabled = true; poll(b).then(purchases); }
          if (t.hasAttribute('data-dl')) download(b, t.getAttribute('data-k'), t);
          if (t.hasAttribute('data-send')) sendPrintFiles(b);
        };
      });
    }
    var notes = {};
    function prog(b, html) { notes[b.id] = html; var el = document.getElementById('bp-' + b.id); if (el) el.innerHTML = html; }
    function loadVersion(b) {
      return ST.version(b.projectId + ':' + b.hash).then(function (ver) {
        if (!ver) throw new Error('The approved version of this book isn’t on this device anymore.');
        return A.designHash(ver.design).then(function (h) { if (h !== b.hash) throw new Error('Some photos in the approved version have changed or are missing on this device.'); return ver.design; });
      });
    }
    function download(b, k, btn) {
      btn.disabled = true; prog(b, '<p class="muted">Verifying your purchase…</p>');
      var design;
      api('verify', { receipt: b.receipt, designHash: b.hash }).then(function () { return loadVersion(b); }).then(function (d) {
        design = d; var kinds = k === 'printer' ? ['interior', 'cover'] : ['book'];
        var chain = Promise.resolve();
        kinds.forEach(function (kind) {
          chain = chain.then(function () {
            prog(b, '<div class="st-prog__bar"><i style="width:2%"></i></div><p class="muted">Creating your ' + (kind === 'book' ? 'PDF' : kind + ' file') + '… this can take a minute for large books.</p>');
            return buildPdf(design, kind, b.hash, function (n, t) { prog(b, '<div class="st-prog__bar"><i style="width:' + Math.round(n / t * 100) + '%"></i></div><p class="muted">Page ' + n + ' of ' + t + '…</p>'); })
              .then(function (r) { saveFile(r.bytes, slug(design.title || design.name) + (kind === 'book' ? '' : '-' + kind) + '.pdf'); });
          });
        });
        return chain;
      }).then(function () {
        prog(b, '<p class="ok">' + I('check') + ' Downloaded. Keep the file somewhere safe.</p>');
        api('delivered', { receipt: b.receipt }).catch(function () {});
        A.track('pdf_delivered', { kind: k });
      }).catch(function (e) { prog(b, '<p class="err">' + esc(e.message) + '</p>'); }).then(function () { btn.disabled = false; });
    }
    function sendPrintFiles(b) {
      var design;
      prog(b, '<p class="muted">Preparing your print files from the approved version… keep this page open.</p>');
      loadVersion(b).then(function (d) {
        design = d; var chain = Promise.resolve();
        ['interior', 'cover'].forEach(function (kind) {
          chain = chain.then(function () {
            return buildPdf(design, kind, b.hash, function (n, t) { prog(b, '<div class="st-prog__bar"><i style="width:' + Math.round(n / t * 50) + '%"></i></div><p class="muted">Creating the ' + kind + ' file: page ' + n + ' of ' + t + '</p>'); })
              .then(function (r) { return upload(b, kind, r.bytes, r.pages); });
          });
        });
        return chain;
      }).then(function () { b.filesSent = Date.now(); return ST.savePurchase(b); })
        .then(function () { prog(b, '<p class="ok">' + I('check') + ' Print files received by Ciel Africa. We’ll email you as your order moves along.</p>'); purchases(); A.track('print_order_ready'); })
        .catch(function (e) { prog(b, '<p class="err">' + esc(e.message) + ' Use <b>Send print files</b> to try again.</p>'); purchases(); });
    }
    function upload(b, kind, bytes, nPages) {
      return sha(bytes).then(function (h) { return api('file-init', { orderToken: b.orderToken, file: kind, size: bytes.length, sha256: h, designHash: b.hash, pages: nPages }); }).then(function (r) {
        if (r.complete) return;
        var i = 0;
        function next() {
          if (i >= r.chunks) return api('file-done', { orderToken: b.orderToken, file: kind });
          var part = bytes.subarray(i * r.chunk, Math.min(bytes.length, (i + 1) * r.chunk)), tries = 0;
          function send() {
            return api('file-chunk&file=' + kind + '&i=' + i, part, { raw: true, headers: { 'Content-Type': 'application/octet-stream', 'X-Order-Token': b.orderToken } }).catch(function (e) { if (++tries < 4) return new Promise(function (ok) { setTimeout(ok, 1500 * tries); }).then(send); throw e; });
          }
          return send().then(function () { i++; prog(b, '<div class="st-prog__bar"><i style="width:' + (50 + Math.round(i / r.chunks * 50)) + '%"></i></div><p class="muted">Sending the ' + kind + ' file… ' + Math.round(i / r.chunks * 100) + '%</p>'); return next(); });
        }
        return next();
      });
    }
    api('caps').then(function (c) { st.caps = c; }).catch(function () { st.caps = { payments: false, orders: false }; }).then(draw);
    app.innerHTML = '<div class="st-loading">Loading prices…</div>';
  };
})();
