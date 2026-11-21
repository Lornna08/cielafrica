/* ============================================================
   CIEL ADMIN — receipts & invoices (PDF), quick WhatsApp replies,
   payment reminders and review requests on orders, costs, and the
   business details / backup cards in Setup.
   PDFs are made in the browser with pdf-lib (MIT, /assets/vendor).
   ============================================================ */
(function () {
  'use strict';
  var H, BIZ = null, WA = null;
  var esc = function (s) { return H.esc(s); };
  var IC = {
    pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M9 11h2"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>'
  };
  IC.clip = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
  IC.send = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>';
  var SITE = 'https://cielafrica.com';
  function biz() { return BIZ ? Promise.resolve(BIZ) : H.api('/api/hq?route=settings-get&k=business').then(function (r) { BIZ = r.value; return BIZ; }); }
  function waSet() { return WA ? Promise.resolve(WA) : H.api('/api/hq?route=settings-get&k=wa').then(function (r) { WA = r.value; return WA; }); }
  function kes(n) { return 'KES ' + (Math.round((n || 0) * 100) / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function ymd(t) { var d = t ? new Date(t) : new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function nice(s) { if (!s) return ''; var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T12:00' : s); return isNaN(d) ? String(s) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function waNum(p) { p = String(p || '').replace(/\D/g, ''); if (/^0\d{9}$/.test(p)) p = '254' + p.slice(1); if (/^7\d{8}$|^1\d{8}$/.test(p)) p = '254' + p; return p.length >= 10 ? p : ''; }
  function b64(bytes) { var s = '', i, c = 0x8000; for (i = 0; i < bytes.length; i += c) s += String.fromCharCode.apply(null, bytes.subarray(i, i + c)); return btoa(s); }

  /* ---------- turning an order into a document ---------- */
  function fromOrder(o) {
    var r = o.raw || {}, c = o.customer || {}, items = [];
    if (r.lines && r.lines.length) items = r.lines.map(function (l) { return { desc: l.label, qty: l.qty || 1, price: l.amount || 0 }; });
    else if (o.kind === 'photobook' && r.items) items = r.items.map(function (i) { return { desc: i.name + ' · ' + (i.product === 'print' ? 'printed hardcover' : 'PDF') + ' · ' + i.pages + ' pages', qty: i.product === 'print' ? i.qty || 1 : 1, price: 0 }; });
    if (!items.length) items = [{ desc: o.summary || H.KIND[o.kind][0] + ' order', qty: 1, price: o.total || 0 }];
    var sum = items.reduce(function (n, l) { return n + l.qty * l.price; }, 0), extra = Math.round(((o.total || 0) - sum) * 100) / 100, delivery = 0, discount = 0;
    if (sum === 0 && items.length) { items[0].price = (o.total || 0) / (items[0].qty || 1); }
    else if (extra > 0) delivery = extra; else if (extra < 0) discount = -extra;
    if (delivery && r.delivery) items.push({ desc: 'Delivery · ' + (r.delivery.name || r.delivery), qty: 1, price: delivery }), delivery = 0;
    var a = r.address, addr = a ? [a.line1, a.area, a.town, a.county].filter(Boolean).join(', ') : '';
    var paid = o.paid && !/refund/.test(o.status);
    return { type: paid ? 'receipt' : 'invoice', number: o.ref, ref: o.ref, date: ymd(o.at), paidAt: paid ? ymd(r.paidAt || o.at) : '', client: c.name || '', email: c.email || '', phone: c.phone ? '+' + String(c.phone).replace(/^\+/, '') : '', address: addr, items: items, delivery: delivery, discount: discount, total: o.total || 0, method: methodOf(o), code: (r.payment && r.payment.code) || r.mpesaReceipt || r.receiptNumber || '', notes: o.test ? 'TEST ORDER: no payment was taken.' : '' };
  }
  function methodOf(o) { var r = o.raw || {}; if (o.kind === 'invoice') return r.method || ''; if (o.kind === 'whatsapp') return 'Arranged on WhatsApp'; if (r.payment && r.payment.method === 'paybill') return 'M-Pesa Paybill ' + (r.payment.paybill || ''); return o.paid ? 'M-Pesa' : ''; }
  function fromInvoice(v, asReceipt) { return { type: asReceipt ? 'receipt' : 'invoice', number: v.number, ref: v.number, date: v.date || ymd(v.createdAt), due: v.due, paidAt: v.paidAt || '', client: v.client, email: v.email, phone: v.phone, address: v.address, items: v.items || [], delivery: v.delivery || 0, discount: v.discount || 0, total: v.total || 0, method: v.method || '', code: v.code || '', notes: v.notes || '', projTitle: v.projTitle || '', projDomain: v.projDomain || '', projDesc: v.projDesc || '', schedule: asReceipt ? [] : v.schedule || [], recurring: asReceipt ? [] : v.recurring || [], eta: asReceipt ? '' : v.eta || '', etaNote: asReceipt ? '' : v.etaNote || '', assumptions: asReceipt ? '' : v.assumptions || '', preparedBy: v.preparedBy || '', preparedRole: v.preparedRole || '' }; }

  /* ---------- the PDF ---------- */
  var libP = null;
  function lib() { return libP || (libP = window.PDFLib ? Promise.resolve(window.PDFLib) : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/vendor/pdf-lib-1.17.1.min.js'; s.onload = function () { ok(window.PDFLib); }; s.onerror = function () { libP = null; no(new Error('Couldn’t load the PDF maker. Check your connection.')); }; document.head.appendChild(s); })); }
  var OK = '’‘“”–—…•€™‚„†‡‰‹›';
  function san(s) { return String(s == null ? '' : s).replace(/[→]/g, '->').replace(/[ ]/g, ' ').replace(/./g, function (ch) { var c = ch.charCodeAt(0); return (c >= 32 && c < 127) || (c >= 160 && c < 256) || OK.indexOf(ch) >= 0 ? ch : (c === 10 ? ch : '?'); }); }
  /* Ciel Africa document layout (invoices, receipts and order documents all use it):
     logo + big title, orange rule, From / Bill to, project, dark-headed items table, orange total band,
     payment schedule + payment details; a second page for recurring services, delivery time,
     assumptions and who prepared it; footer with page numbers on every page. */
  /* draws the real PDF pages as pictures, so the preview looks the same on every phone and computer */
  var pjsP = null;
  function pdfjs() { return pjsP || (pjsP = window.pdfjsLib ? Promise.resolve(window.pdfjsLib) : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/vendor/pdfjs-3.11.174.min.js'; s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs-3.11.174.worker.min.js'; ok(window.pdfjsLib); }; s.onerror = function () { pjsP = null; no(new Error('Couldn’t load the preview.')); }; document.head.appendChild(s); })); }
  function drawPages(bytes, el) {
    return pdfjs().then(function (pj) { return pj.getDocument({ data: bytes.slice(0) }).promise; }).then(function (pdf) {
      el.innerHTML = '<div class="pv-pages"></div>'; var box = el.firstChild, w = Math.max(280, el.clientWidth - 24), dpr = Math.min(2.5, window.devicePixelRatio || 1);
      var chain = Promise.resolve();
      for (var i = 1; i <= pdf.numPages; i++) (function (n) { chain = chain.then(function () { return pdf.getPage(n).then(function (pg) {
        var v0 = pg.getViewport({ scale: 1 }), sc = w / v0.width, vp = pg.getViewport({ scale: sc * dpr }), c = document.createElement('canvas');
        c.width = vp.width; c.height = vp.height; c.style.width = w + 'px'; c.className = 'pv-page'; c.setAttribute('aria-label', 'Page ' + n + ' of ' + pdf.numPages);
        box.appendChild(c); return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      }); }); })(i);
      return chain.then(function () { if (pdf.numPages > 1) { var t = document.createElement('p'); t.className = 'pv-n'; t.textContent = pdf.numPages + ' pages'; box.appendChild(t); } });
    });
  }
  /* preview only: from the invoice form, before saving */
  function previewDoc(doc) {
    var m = H.modal('<div class="pv-m"><div class="row" style="justify-content:space-between;gap:.5rem"><h2>Preview · ' + esc(doc.number || 'New') + '</h2><button class="b b--sm b--ghost" data-x>' + H.I.x + '</button></div><div class="pv-box" id="pvB"><div class="sk" style="height:60vh"></div></div></div>');
    m.querySelector('.modal__p').classList.add('pv-modal');
    makePdf(doc).then(function (b) { return drawPages(b, m.querySelector('#pvB')); }).catch(function (e) { m.querySelector('#pvB').innerHTML = '<p class="muted" style="padding:1rem">' + esc(e.message) + '</p>'; });
  }
  function makePdf(doc) {
    return Promise.all([lib(), biz(), fetch('/assets/img/logo-dark.png?v=20261021i').then(function (r) { return r.arrayBuffer(); }).catch(function () { return null; })]).then(function (x) {
      var L = x[0], B = x[1], logo = x[2];
      return L.PDFDocument.create().then(function (pdf) {
        var R = doc.type === 'receipt';
        pdf.setTitle(san((R ? 'Receipt ' : 'Invoice ') + doc.number)); pdf.setAuthor(san(B.name)); pdf.setCreator('Ciel Admin');
        return Promise.all([pdf.embedFont(L.StandardFonts.Helvetica), pdf.embedFont(L.StandardFonts.HelveticaBold), logo ? pdf.embedPng(logo).catch(function () { return null; }) : null]).then(function (f) {
          var F = f[0], FB = f[1], img = f[2], W = 595.28, H0 = 841.89, M = 50, CW = W - 2 * M, BOT = 92, pages = [], p, y;
          var rgb = function (r, g, b) { return L.rgb(r / 255, g / 255, b / 255); };
          var ORG = rgb(241, 90, 36), DARK = rgb(32, 35, 40), INK = rgb(55, 57, 62), SOFT = rgb(110, 114, 122), FAINT = rgb(150, 154, 160), LINE = rgb(226, 228, 232), BOX = rgb(244, 245, 247), BOXL = rgb(210, 213, 218), PEACH = rgb(254, 241, 234), WHITE = rgb(255, 255, 255), GREEN = rgb(22, 128, 61);
          var num = function (n) { return (Math.round((n || 0) * 100) / 100).toLocaleString('en-KE', { maximumFractionDigits: 2 }); };
          var up = function (s) { return String(s || '').toUpperCase(); };
          function page() { p = pdf.addPage([W, H0]); pages.push(p); y = H0 - 60; }
          function t(s, x0, y0, o) { o = o || {}; var fn = o.b ? FB : F, sz = o.s || 9, str = san(s); var w = fn.widthOfTextAtSize(str, sz); if (o.r) x0 -= w; else if (o.c2) x0 -= w / 2; p.drawText(str, { x: x0, y: y0, size: sz, font: fn, color: o.c || INK }); return w; }
          function wrap(s, w, sz, fn) { var out = []; String(san(s)).split('\n').forEach(function (para) { var words = para.split(/\s+/).filter(Boolean), cur = ''; words.forEach(function (wd) { var tr = cur ? cur + ' ' + wd : wd; if (fn.widthOfTextAtSize(tr, sz) > w && cur) { out.push(cur); cur = wd; } else cur = tr; }); out.push(cur); }); return out.length ? out : ['']; }
          function rect(x0, y0, w, h, c, o) { p.drawRectangle(Object.assign({ x: x0, y: y0, width: w, height: h, color: c }, o || {})); }
          function hline(x0, x1, y0, c, th) { p.drawLine({ start: { x: x0, y: y0 }, end: { x: x1, y: y0 }, thickness: th || 0.6, color: c || LINE }); }
          function vline(x0, y0, y1, c) { p.drawLine({ start: { x: x0, y: y0 }, end: { x: x0, y: y1 }, thickness: 0.6, color: c || BOXL }); }
          function label(s, x0) { t(up(s), x0 == null ? M : x0, y, { b: true, s: 9, c: ORG }); }
          function need(h, again) { if (y - h < BOT) { page(); if (again) again(); } }

          /* ---- page 1 header ---- */
          page();
          if (img) { var lh = 38, sc = lh / img.height; p.drawImage(img, { x: M, y: y - 30, width: img.width * sc, height: lh }); } else t(B.name, M, y - 14, { b: true, s: 18 });
          t(R ? 'RECEIPT' : 'INVOICE', W - M, y - 18, { b: true, s: 30, c: DARK, r: true });
          t(doc.number, W - M, y - 34, { b: true, s: 10.5, c: DARK, r: true });
          var when = (R ? 'PAID · ' + up(nice(doc.paidAt || doc.date)) : 'ISSUED · ' + up(nice(doc.date))) + (!R && doc.due ? '   ·   DUE · ' + up(nice(doc.due)) : '');
          t(when, W - M, y - 50, { b: true, s: 7.5, c: FAINT, r: true });
          y -= 68; hline(M, W - M, y, ORG, 1.4); y -= 26;

          /* ---- from / bill to ---- */
          var colX = W / 2 + 12, top = y;
          label('From'); label(R ? 'Received from' : 'Bill to', colX); y -= 15;
          var from = [B.name, B.address, B.phone, B.email, B.web, B.taxId ? 'KRA PIN ' + B.taxId : ''].filter(Boolean);
          var to = [doc.client || '—'].concat(doc.phone ? ['Phone: ' + doc.phone] : [], doc.email ? [doc.email] : [], doc.address ? wrap(doc.address, W - M - colX, 9, F) : []);
          var ya = y; from.forEach(function (s2, i) { t(s2, M, ya, { b: i === 0, s: 9, c: INK }); ya -= 12.5; });
          var yb = y; to.forEach(function (s2, i) { wrap(s2, W - M - colX, 9, i === 0 ? FB : F).forEach(function (ln) { t(ln, colX, yb, { b: i === 0, s: 9, c: INK }); yb -= 12.5; }); });
          y = Math.min(ya, yb); vline(colX - 14, top + 10, y + 4); y -= 14;

          /* ---- project ---- */
          if (doc.projTitle || doc.projDomain || doc.projDesc) {
            label('Project', M + 6); y -= 14;
            if (doc.projTitle) { wrap(doc.projTitle, CW - 12, 9, FB).forEach(function (ln) { t(ln, M + 6, y, { b: true, s: 9 }); y -= 12; }); }
            if (doc.projDomain) { var dw = t('Domain: ', M + 6, y, { s: 9, c: SOFT }); t(doc.projDomain, M + 6 + dw, y, { s: 9 }); y -= 12; }
            if (doc.projDesc) wrap(doc.projDesc, CW - 12, 9, F).forEach(function (ln) { t(ln, M + 6, y, { s: 9 }); y -= 12; });
            y -= 8;
          }

          /* ---- items ---- */
          var cQ = W - M - 205, cP = W - M - 105, cA = W - M - 10;
          function thead() { rect(M, y - 24, CW, 24, DARK); [['What it’s for', M + 10], ['Qty', cQ, 'c'], ['Price (KES)', cP, 'r'], ['Amount (KES)', cA, 'r']].forEach(function (h) { t(up(h[0]), h[1], y - 15.5, { b: true, s: 7.2, c: WHITE, r: h[2] === 'r', c2: h[2] === 'c' }); }); y -= 24; }
          need(80); label(R ? 'Items paid' : 'Itemised charges / one-time invoice', M + 6); y -= 9; thead();
          var sub = 0, rows = (doc.items || []).map(function (l) { var a = (l.qty || 0) * (l.price || 0); sub += a; return [l.desc || '', String(l.qty == null ? '' : num(l.qty)), num(l.price), num(a)]; });
          if (doc.delivery) rows.push(['Delivery', '1', num(doc.delivery), num(doc.delivery)]);
          if (doc.discount) rows.push(['Discount', '', '', '–' + num(doc.discount)]);
          rows.forEach(function (r0) {
            var ls = wrap(r0[0], cQ - M - 40, 9, F), h = Math.max(22, ls.length * 11.5 + 11);
            need(h, thead);
            ls.forEach(function (ln, i) { t(ln, M + 10, y - 14 - i * 11.5, { s: 9 }); });
            t(r0[1], cQ, y - 14, { s: 9, c2: true }); t(r0[2], cP, y - 14, { s: 9, r: true }); t(r0[3], cA, y - 14, { s: 9, r: true });
            y -= h; hline(M, W - M, y, LINE, 0.6);
          });
          var total = Math.max(0, sub + (doc.delivery || 0) - (doc.discount || 0)); if (doc.total && Math.abs(doc.total - total) < 1) total = doc.total;
          y -= 12; need(40);
          rect(M, y - 36, CW, 36, ORG);
          t((R ? 'Total paid' : 'Total invoice value').toUpperCase() + ' · KENYAN SHILLINGS', M + 12, y - 22, { b: true, s: 8, c: WHITE });
          t(kes(total), W - M - 12, y - 25, { b: true, s: 17, c: WHITE, r: true });
          y -= 48;

          /* ---- payment schedule / payment details (invoice) or payment received (receipt) ---- */
          var half = CW / 2, lx = M + 12, rx = M + half + 12, cw2 = half - 24;
          var left = [], right = [];   /* [text, opts] lines; opts.gap = extra space after */
          if (R) {
            left.push(['Payment received', { lab: true }]);
            if (doc.method) left.push(['Method', { b: true }], [doc.method, {}]);
            if (doc.code) left.push(['M-Pesa code', { b: true }], [doc.code, {}]);
            left.push(['Received on', { b: true }], [nice(doc.paidAt || doc.date), {}]);
            right.push(['Status', { lab: true }], ['Paid in full', { b: true, s: 12, c: GREEN }], [kes(total) + ' received with thanks.', { c: SOFT }]);
          } else {
            var sch = (doc.schedule || []).filter(function (x0) { return x0.label || x0.pct; });
            left.push([sch.length ? 'Payment schedule' : 'Payment due', { lab: true }]);
            if (sch.length) sch.forEach(function (x0, i) { left.push([x0.label || (x0.pct + '%'), { b: true }], [kes(Math.round(total * (x0.pct || 0)) / 100), { b: true, s: 12, c: DARK }]); if (x0.note) left.push([x0.note, { c: SOFT, gap: i < sch.length - 1 ? 6 : 0 }]); else left[left.length - 1][1].gap = 6; });
            else left.push([doc.due ? 'Please pay by ' + nice(doc.due) : 'Payable on receipt of this invoice.', {}]);
            right.push(['Payment details', { lab: true }]);
            if (B.paybill) right.push(['M-Pesa Paybill', { b: true }], [B.paybill, {}], ['Account number', { b: true }], [B.account || doc.number, {}]);
            right.push(['Payment reference', { b: true }], [doc.number, {}]);
          }
          function hgt(list) { return list.reduce(function (n, l) { var o = l[1], sz = o.s || 8.5; return n + (o.lab ? 15 : wrap(l[0], cw2, sz, o.b ? FB : F).length * (sz + 2.5)) + (o.gap || 0); }, 0); }
          var bh = Math.max(hgt(left), hgt(right)) + 22;
          need(bh + 4);
          rect(M, y - bh, CW, bh, BOX, { borderColor: BOXL, borderWidth: 0.6 }); vline(M + half, y - 8, y - bh + 8);
          function col(list, x0) { var yy = y - 16; list.forEach(function (l) { var o = l[1], sz = o.s || 8.5; if (o.lab) { t(up(l[0]), x0, yy, { b: true, s: 9, c: ORG }); yy -= 15; } else { wrap(l[0], cw2, sz, o.b ? FB : F).forEach(function (ln) { t(ln, x0, yy, { b: o.b, s: sz, c: o.c || INK }); yy -= sz + 2.5; }); } yy -= o.gap || 0; }); }
          col(left, lx); col(right, rx); y -= bh + 16;

          if (doc.notes) { need(40); label('Notes', M + 6); y -= 13; wrap(doc.notes, CW - 12, 8.5, F).forEach(function (ln) { need(12); t(ln, M + 6, y, { s: 8.5, c: SOFT }); y -= 11.5; }); y -= 8; }

          /* ---- page 2: service & delivery details ---- */
          var rec = (doc.recurring || []).filter(function (r0) { return r0.service; }), asm = String(doc.assumptions || '').split('\n').map(function (a) { return a.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim(); }).filter(Boolean);
          if (rec.length || doc.eta || asm.length) {
            page();
            t('SERVICE & DELIVERY DETAILS', M, y - 16, { b: true, s: 20, c: DARK }); y -= 28;
            t('Ongoing service rates and the conditions attached to this engagement', M, y, { s: 7.5, c: SOFT }); y -= 22;
            if (rec.length) {
              label('Recurring services / not included in the one-time total', M + 6); y -= 9;
              var c1 = M + 10, c2 = M + 250, c3 = M + 330, c4 = M + 350;
              rect(M, y - 24, CW, 24, DARK); [['Service', c1], ['Monthly', c2, 'r'], ['Annual', c3, 'r'], ['Billing details', c4]].forEach(function (h) { t(up(h[0]), h[1], y - 15.5, { b: true, s: 7.2, c: WHITE, r: h[2] === 'r' }); }); y -= 24;
              rec.forEach(function (r0) {
                var bl = wrap(r0.billing || '', W - M - 10 - c4, 8.5, F), sl = wrap(r0.service, c2 - c1 - 70, 8.5, FB), h = Math.max(28, Math.max(bl.length, sl.length) * 11 + 17);
                need(h); rect(M, y - h, CW, h, BOX, { borderColor: BOXL, borderWidth: 0.5 });
                sl.forEach(function (ln, i) { t(ln, c1, y - 17 - i * 11, { b: true, s: 8.5, c: DARK }); });
                t(r0.monthly ? kes(r0.monthly) : '—', c2, y - 17, { s: 8.5, r: true, c: r0.monthly ? INK : FAINT }); t(r0.annual ? kes(r0.annual) : '—', c3, y - 17, { s: 8.5, r: true, c: r0.annual ? INK : FAINT });
                bl.forEach(function (ln, i) { t(ln, c4, y - 17 - i * 11, { s: 8.5 }); }); y -= h;
              });
              y -= 10;
              var ab = rec.filter(function (r0) { return r0.about; });
              for (var i = 0; i < ab.length; i += 2) {
                var pair = ab.slice(i, i + 2), hh = Math.max.apply(null, pair.map(function (r0) { return wrap(r0.about, half - 28, 8, F).length * 10.5 + 30; }));
                need(hh + 4); rect(M, y - hh, CW, hh, PEACH);
                pair.forEach(function (r0, k) { var x0 = M + 12 + k * half, yy = y - 15; if (k) p.drawLine({ start: { x: M + half, y: y }, end: { x: M + half, y: y - hh }, thickness: 1.2, color: ORG }); t(up(r0.service), x0, yy, { b: true, s: 8, c: DARK }); yy -= 12; wrap(r0.about, half - 28, 8, F).forEach(function (ln) { t(ln, x0, yy, { s: 8, c: INK }); yy -= 10.5; }); });
                y -= hh + 8;
              }
              y -= 8;
            }
            if (doc.eta) {
              var ex = M + 130, toks = (san(doc.eta) + '|' + san(doc.etaNote || '')).split('|'), lines = [], cur = [], cw = 0, maxw = W - M - 12 - ex;
              [[toks[0], FB], [toks[1], F]].forEach(function (part) { part[0].split(/\s+/).filter(Boolean).forEach(function (wd) { var ww = part[1].widthOfTextAtSize(wd + ' ', 8.5); if (cw + ww > maxw && cur.length) { lines.push(cur); cur = []; cw = 0; } cur.push([wd + ' ', part[1]]); cw += ww; }); });
              if (cur.length) lines.push(cur);
              var eh = Math.max(36, lines.length * 11 + 22); need(eh + 4);
              rect(M, y - eh, CW, eh, BOX); rect(M, y - eh, 3, eh, ORG);
              t('ESTIMATED DELIVERY', M + 12, y - eh / 2 - 3, { b: true, s: 8, c: ORG });
              lines.forEach(function (ln, k) { var xx = ex; ln.forEach(function (w0) { p.drawText(w0[0], { x: xx, y: y - 15 - k * 11, size: 8.5, font: w0[1], color: w0[1] === FB ? DARK : INK }); xx += w0[1].widthOfTextAtSize(w0[0], 8.5); }); });
              y -= eh + 16;
            }
            if (asm.length) {
              need(50); label('Project assumptions & notes', M + 6); y -= 14;
              var hc = Math.ceil(asm.length / 2), aw = half - 40, ystart = y, ycol = [y, y];
              asm.forEach(function (a, k) { var c0 = k < hc ? 0 : 1, x0 = M + 6 + c0 * half, ls = wrap(a, aw, 8, F); t((k < 9 ? '0' : '') + (k + 1), x0, ycol[c0], { b: true, s: 8, c: ORG }); ls.forEach(function (ln, j) { t(ln, x0 + 24, ycol[c0] - j * 10.5, { s: 8, c: INK }); }); ycol[c0] -= ls.length * 10.5 + 7; });
              vline(M + half - 6, ystart + 6, Math.min(ycol[0], ycol[1]) + 4); y = Math.min(ycol[0], ycol[1]) - 14;
            }
          }

          /* ---- prepared by ---- */
          var pb = doc.preparedBy || B.preparer, pr = doc.preparedRole || B.preparerRole;
          if (y - 84 < 68) page(); y -= 6; hline(M, W - M, y, LINE, 0.8); y -= 20;
          var yt = y; label(R ? 'Issued by' : 'Prepared by'); y -= 14;
          [[pb, true], [pr], [B.name]].filter(function (l) { return l[0]; }).forEach(function (l) { t(l[0], M, y, { b: l[1], s: 8.5, c: l[1] ? DARK : INK }); y -= 11.5; });
          var y3 = yt; vline(colX - 14, yt + 8, y + 4); t(up(B.name), colX, y3, { b: true, s: 9.5, c: DARK }); y3 -= 12;
          [B.address, B.phone, [B.email, B.web].filter(Boolean).join('  ·  ')].filter(Boolean).forEach(function (s2) { t(s2, colX, y3, { s: 8, c: SOFT }); y3 -= 10.5; });
          y = Math.min(y, y3) - 10;
          if (B.invoiceNote && y > 66) t(B.invoiceNote, M, y, { b: true, s: 8.5, c: DARK });

          /* ---- footer on every page ---- */
          var n = pages.length, two = function (k) { return (k < 10 ? '0' : '') + k; };
          pages.forEach(function (pg, k) { p = pg; hline(M, W - M, 58, LINE, 0.6); t(up(B.name) + '  ·  ' + up(B.tagline || 'Software engineering & digital products'), M, 44, { s: 6.8, c: FAINT }); t(two(k + 1) + '  /  ' + two(n), W - M, 44, { s: 6.8, c: FAINT, r: true }); });
          return pdf.save();
        });
      });
    });
  }
  function fileName(doc) { return (doc.type === 'receipt' ? 'Receipt-' : 'Invoice-') + String(doc.number).replace(/[^\w-]+/g, '') + '.pdf'; }
  function save(bytes, name) { var a = document.createElement('a'), u = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }
  function waText(doc, B) { var first = String(doc.client || '').split(' ')[0]; return doc.type === 'receipt' ? 'Hi ' + (first || 'there') + ', here is your receipt for ' + doc.number + ' (' + kes(doc.total) + '). Thank you for choosing ' + B.name + '!' : 'Hi ' + (first || 'there') + ', here is invoice ' + doc.number + ' for ' + kes(doc.total) + '.' + (B.paybill ? ' You can pay to M-Pesa Paybill ' + B.paybill + ', account ' + (B.account || doc.number) + '.' : '') + ' Thank you!'; }
  /* the document panel: preview, then send it — by email (your own message, extra files) or WhatsApp */
  function firstOf(n) { return String(n || '').split(' ')[0] || 'there'; }
  function emailText(doc, B) {
    var f = firstOf(doc.client);
    if (doc.type === 'receipt') return 'Hi ' + f + ',\n\nThank you for your payment of ' + kes(doc.total) + '. Your receipt for ' + doc.number + ' is attached.\n\nKind regards,\n' + B.name;
    return 'Hi ' + f + ',\n\nPlease find invoice ' + doc.number + ' for ' + kes(doc.total) + ' attached.' + (doc.due ? ' It’s due by ' + nice(doc.due) + '.' : '') + (B.paybill ? '\n\nYou can pay by M-Pesa: Paybill ' + B.paybill + ', account ' + (B.account || doc.number) + '.' : '') + '\n\nKind regards,\n' + B.name;
  }
  function docPanel(doc, opts) {
    opts = opts || {};
    var R = doc.type === 'receipt', label = R ? 'Receipt' : 'Invoice';
    var m = H.modal('<div class="doc-m"><div class="row" style="justify-content:space-between;gap:.5rem"><h2>Send ' + label.toLowerCase() + ' · ' + esc(doc.number) + '</h2><button class="b b--sm b--ghost" data-x>' + H.I.x + '</button></div>' +
      '<div class="doc-g"><div class="doc-pv" id="dPv"><div class="sk" style="height:100%"></div></div>' +
      '<div class="doc-send"><div class="tabs" id="dT"><button data-t="email" class="is-on">' + H.I.mail + ' Email</button><button data-t="wa">' + H.I.wa + ' WhatsApp</button><button data-t="dl">' + IC.dl + ' Download</button></div>' +
      '<div data-p="email" class="doc-p"><label class="field"><span>To</span><input class="hq-in" id="dTo" type="email" value="' + esc(doc.email || '') + '" placeholder="client@email.com"></label>' +
      '<label class="field"><span>Subject</span><input class="hq-in" id="dSu" value="' + esc((R ? 'Receipt for ' : 'Invoice ') + doc.number + ' · Ciel Africa') + '"></label>' +
      '<label class="field"><span>Message</span><textarea class="hq-in" id="dMs" rows="8"></textarea></label>' +
      '<label class="doc-att"><input type="file" id="dAt" multiple hidden><span>' + IC.clip + ' Attach more files (optional)</span></label><div class="doc-atl" id="dAl"></div>' +
      '<p class="faint" style="font-size:.76rem">The ' + label.toLowerCase() + ' PDF is attached automatically. Sent from ' + esc('hello@cielafrica.com') + '; replies come to your inbox.</p>' +
      '<button class="b b--p" id="dEm">' + IC.send + '<span>Send email</span></button></div>' +
      '<div data-p="wa" class="doc-p" hidden><label class="field"><span>WhatsApp number</span><input class="hq-in" id="dPh" value="' + esc(doc.phone || '') + '" placeholder="0712 345 678"></label>' +
      '<label class="field"><span>Message</span><textarea class="hq-in" id="dWm" rows="7"></textarea></label>' +
      '<p class="faint" style="font-size:.76rem" id="dWn"></p><button class="b b--p" id="dWa">' + H.I.wa + '<span>Send on WhatsApp</span></button></div>' +
      '<div data-p="dl" class="doc-p" hidden><p class="muted" style="font-size:.86rem">Save the PDF to print it or send it another way.</p><button class="b b--p" id="dDl">' + IC.dl + '<span>Download PDF</span></button></div>' +
      '</div></div></div>');
    m.querySelector('.modal__p').classList.add('doc-modal');
    var share = !!(navigator.canShare && /iphone|ipad|android/i.test(navigator.userAgent));
    m.querySelector('#dWn').textContent = share ? 'Your phone’s share sheet opens with the PDF and this message: pick WhatsApp, then the chat.' : 'WhatsApp opens with this message, and the PDF downloads: drop it into the chat to attach it.';
    biz().then(function (B) { m.querySelector('#dMs').value = emailText(doc, B); m.querySelector('#dWm').value = waText(doc, B); });
    m.querySelectorAll('#dT [data-t]').forEach(function (b) { b.onclick = function () { m.querySelectorAll('#dT button').forEach(function (x) { x.classList.toggle('is-on', x === b); }); m.querySelectorAll('[data-p]').forEach(function (p) { p.hidden = p.getAttribute('data-p') !== b.getAttribute('data-t'); }); }; });
    var bytes = null, url = null, extra = [];
    makePdf(doc).then(function (b) { bytes = b; url = URL.createObjectURL(new Blob([b], { type: 'application/pdf' })); var pv = m.querySelector('#dPv'); drawPages(b, pv).catch(function () { pv.innerHTML = '<iframe src="' + url + '#view=FitH" title="Preview"></iframe>'; }); }, function (e) { m.querySelector('#dPv').innerHTML = '<p class="muted" style="padding:1rem">' + esc(e.message) + '</p>'; });
    function need(fn) { return function () { if (!bytes) return H.toast('One moment, the PDF is still being made…'); fn(); }; }
    function drawAtt() { m.querySelector('#dAl').innerHTML = extra.map(function (a, i) { return '<span class="mx2-chip">' + esc(a.name) + ' · ' + Math.max(1, Math.round(a.size / 1024)) + ' KB<button data-ra="' + i + '" aria-label="Remove">×</button></span>'; }).join(''); m.querySelectorAll('[data-ra]').forEach(function (x) { x.onclick = function (e) { e.preventDefault(); extra.splice(+x.getAttribute('data-ra'), 1); drawAtt(); }; }); }
    m.querySelector('#dAt').onchange = function () {
      Array.prototype.forEach.call(this.files, function (f) {
        var total = extra.reduce(function (n, a) { return n + a.size; }, 0) + f.size + (bytes ? bytes.length : 0);
        if (total > 3 * 1024 * 1024) return H.toast(f.name + ' is too big: all files together must be under 3 MB.', 'err');
        var rd = new FileReader(); rd.onload = function () { extra.push({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, data: String(rd.result).split(',')[1] }); drawAtt(); }; rd.readAsDataURL(f);
      }); this.value = '';
    };
    m.querySelector('#dDl').onclick = need(function () { save(bytes, fileName(doc)); });
    m.querySelector('#dEm').onclick = need(function () {
      var to = m.querySelector('#dTo').value.trim(), btn = m.querySelector('#dEm');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return H.toast('Enter the email address to send it to.', 'err');
      btn.disabled = true; btn.querySelector('span').textContent = 'Sending…';
      H.api('/api/hq?route=doc-email', { to: to, kind: doc.type, ref: doc.number, filename: fileName(doc), pdf: b64(bytes), subject: m.querySelector('#dSu').value, title: R ? 'Receipt ' + doc.number : 'Invoice ' + doc.number, message: m.querySelector('#dMs').value, extra: extra.map(function (a) { return { name: a.name, type: a.type, data: a.data }; }) })
        .then(function () { btn.querySelector('span').textContent = 'Sent ✓'; H.toast(label + ' emailed to ' + to, 'ok'); if (opts.onSent) opts.onSent({ via: 'email', to: to }); setTimeout(function () { m.remove(); }, 900); }, function (e) { btn.disabled = false; btn.querySelector('span').textContent = 'Send email'; H.toast(e.message, 'err'); });
    });
    m.querySelector('#dWa').onclick = need(function () {
      var text = m.querySelector('#dWm').value, n = waNum(m.querySelector('#dPh').value), file = new File([bytes], fileName(doc), { type: 'application/pdf' });
      if (share && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], text: text }).then(function () { if (opts.onSent) opts.onSent({ via: 'whatsapp', to: m.querySelector('#dPh').value }); }, function () { }); return; }
      if (!n) return H.toast('Enter the WhatsApp number.', 'err');
      save(bytes, fileName(doc)); window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      if (opts.onSent) opts.onSent({ via: 'whatsapp', to: m.querySelector('#dPh').value });
    });
    return m;
  }

  /* ---------- extras on every order: documents, quick WhatsApp, reminders, reviews ---------- */
  function extras(o, d) {
    if (o.kind === 'invoice') return;
    var c = o.customer || {}, r = o.raw || {}, ph = waNum(c.phone), unpaid = !o.paid && /await|pending|fail|whatsapp_request/.test(o.status), done = /deliver|fulfilled|done|registered/.test(o.status);
    var box = document.createElement('div'); box.className = 'card ox';
    box.innerHTML = '<div class="ox__h"><b>Send &amp; follow up</b></div>' +
      '<div class="ox__row"><button class="b b--sm" data-doc>' + IC.pdf + '<span>Send ' + (o.paid && !/refund/.test(o.status) ? 'receipt' : 'invoice') + '</span></button>' +
      (unpaid && o.kind === 'photobook' ? '<button class="b b--sm" data-rem' + (c.email ? '' : ' disabled title="No email on this order"') + '>' + IC.bell + '<span>Email a payment reminder</span></button>' : '') +
      (done || o.paid ? '<button class="b b--sm" data-rev' + (c.email ? '' : ' disabled title="No email on this order"') + '>' + IC.star + '<span>' + (r.reviewAsk ? 'Ask again for a review' : 'Ask for a review') + '</span></button>' : '') + '</div>' +
      (unpaid && r.remind && (r.remind.pay || r.remind.manual) ? '<p class="ox__n">Payment reminder emailed ' + H.dt(r.remind.manual ? r.remind.manual[r.remind.manual.length - 1] : r.remind.pay) + (r.remind.manual ? ' from here' + (r.remind.manual.length > 1 ? ' (' + r.remind.manual.length + ' so far)' : '') : ' automatically') + '.</p>' : unpaid && o.kind === 'photobook' ? '<p class="ox__n">If it stays unpaid, the customer gets one automatic reminder email about 2 hours after ordering.</p>' : '') +
      (r.reviewAsk ? '<p class="ox__n">Review requested ' + H.dt(r.reviewAsk) + '.</p>' : '') +
      (ph ? '<div class="ox__wa"><span>Quick WhatsApp</span><div class="ox__chips" id="oxWa"><i class="sk" style="width:180px;height:30px;display:block"></i></div></div>' : '<p class="ox__n">No phone number on this order, so WhatsApp replies aren’t available.</p>');
    var at = d.querySelector('.drawer__b'); at.insertBefore(box, at.children[1] || null);
    box.querySelector('[data-doc]').onclick = function () { docPanel(fromOrder(o)); };
    var rem = box.querySelector('[data-rem]'); if (rem) rem.onclick = function () {
      HQAsk.confirm('Email ' + (c.name || 'the customer') + ' a reminder that order ' + o.ref + ' (' + H.money(o.total) + ') is still waiting for payment?', { title: 'Payment reminder', ok: 'Send reminder' }).then(function (ok) {
        if (!ok) return; rem.disabled = true;
        H.api('/api/photobooks?route=pbk-admin-remind', { ref: o.ref }).then(function () { rem.querySelector('span').textContent = 'Reminder sent ✓'; H.toast('Reminder emailed to ' + c.email, 'ok'); }, function (e) { rem.disabled = false; H.toast(e.message, 'err'); });
      });
    };
    var rv = box.querySelector('[data-rev]'); if (rv) rv.onclick = function () {
      HQAsk.confirm('Email ' + (c.name || 'the customer') + ' (' + c.email + ') a short request to review order ' + o.ref + '?', { title: 'Ask for a review', ok: 'Send' }).then(function (ok) {
        if (!ok) return; rv.disabled = true;
        H.api('/api/hq?route=review-ask', { ref: o.ref, email: c.email, name: c.name }).then(function () { rv.querySelector('span').textContent = 'Review request sent ✓'; H.toast('Review request emailed', 'ok'); }, function (e) { rv.disabled = false; H.toast(e.message, 'err'); });
      });
    };
    if (ph) waSet().then(function (W) {
      var el = box.querySelector('#oxWa'); if (!el) return;
      el.innerHTML = W.items.map(function (t, i) { return '<button class="ox__chip" data-wt="' + i + '">' + esc(t.label) + '</button>'; }).join('') + '<a class="ox__chip ox__chip--e" href="#settings" title="Edit these messages">Edit</a>';
      el.querySelectorAll('[data-wt]').forEach(function (bt) { bt.onclick = function () { sendWa(o, W.items[+bt.getAttribute('data-wt')], ph); }; });
    }, function () { var el = box.querySelector('#oxWa'); if (el) el.innerHTML = '<span class="muted">Couldn’t load the messages.</span>'; });
  }
  function sendWa(o, t, ph) {
    var w = window.open('', '_blank'); /* opened now, so the phone doesn't block it */
    var c = o.customer || {}, txt = t.text;
    var need = [biz()];
    need.push(/\{review\}/.test(txt) ? H.api('/api/hq?route=review-link', { ref: o.ref }).then(function (r) { return r.url; }) : Promise.resolve(''));
    need.push(/\{note\}/.test(txt) ? (w && w.close(), w = null, HQAsk.prompt('Anything to add? (for example the rider’s name and number, or where to collect)', '', { title: t.label, ok: 'Continue' })) : Promise.resolve(''));
    Promise.all(need).then(function (x) {
      if (x[2] === null) { if (w) w.close(); return; }
      var B = x[0], first = String(c.name || '').split(' ')[0] || 'there';
      var msg = txt.replace(/\{first\}/g, first).replace(/\{name\}/g, c.name || first).replace(/\{ref\}/g, o.ref).replace(/\{total\}/g, H.money(o.total)).replace(/\{paybill\}/g, B.paybill || '').replace(/\{account\}/g, B.account || o.ref)
        .replace(/\{track\}/g, o.kind === 'photobook' ? SITE + '/photobooks/track?ref=' + encodeURIComponent(o.ref) : SITE).replace(/\{review\}/g, x[1] || '').replace(/\{note\}/g, x[2] || '').replace(/\s{2,}/g, ' ').trim();
      var u = 'https://wa.me/' + ph + '?text=' + encodeURIComponent(msg);
      if (w) w.location = u; else location.href = u;
    }, function (e) { if (w) w.close(); H.toast(e.message, 'err'); });
  }

  /* ---------- invoices ---------- */
  function invToOrder(v) {
    var paid = v.status === 'paid', st = v.status || 'unpaid', overdue = !paid && st !== 'cancelled' && v.due && v.due < H.today();
    return { kind: 'invoice', ref: v.number, id: v.id, at: new Date((v.date || ymd(v.createdAt)) + 'T12:00').getTime(), paid: paid, customer: { name: v.client, email: v.email, phone: String(v.phone || '').replace(/\D/g, '') }, total: v.total || 0, status: paid ? 'paid' : st === 'cancelled' ? 'cancelled' : overdue ? 'overdue' : 'awaiting_payment', label: paid ? 'Paid' : st === 'cancelled' ? 'Cancelled' : overdue ? 'Overdue' : 'Unpaid', summary: (v.items || []).map(function (l) { return l.desc; }).join(', '), raw: Object.assign({ lines: (v.items || []).map(function (l) { return { label: l.desc, qty: l.qty, amount: l.price }; }), paidAt: v.paidAt ? new Date(v.paidAt + 'T12:00').getTime() : null, payment: v.code ? { code: v.code } : null }, v) };
  }
  function invoices() {
    var S = H.S, tab = S.itab2 || 'inv', q = (S.iq || '').toLowerCase(), all = (S.invoices || []).slice();
    var invs = all.filter(function (v) { return v.kind !== 'receipt'; }).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')) || String(b.number).localeCompare(String(a.number)); });
    var o = invs.map(invToOrder), un = o.filter(function (x) { return !x.paid && x.status !== 'cancelled'; }), od = un.filter(function (x) { return x.status === 'overdue'; });
    var m0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    /* every receipt: ones you wrote, paid invoices, and paid website orders */
    var recs = all.filter(function (v) { return v.kind === 'receipt' || v.status === 'paid'; }).map(function (v) { return { src: 'inv', id: v.id, number: v.kind === 'receipt' ? v.number : v.number, what: v.kind === 'receipt' ? 'Receipt' : 'Paid invoice', client: v.client, contact: v.email || v.phone || '', total: v.total, at: new Date((v.paidAt || v.date || ymd(v.createdAt)) + 'T12:00').getTime(), sent: v.sentAt ? (v.sentVia === 'whatsapp' ? 'WhatsApp' : 'email') + ' · ' + H.d2(v.sentAt) : '' }; })
      .concat(S.orders.filter(function (x) { return x.paid && !x.test && x.kind !== 'invoice' && !/refund|cancel/.test(x.status); }).map(function (x) { return { src: 'order', ref: x.ref, number: x.ref, what: H.KIND[x.kind][0] + ' order', client: x.customer.name, contact: x.customer.email || (x.customer.phone ? '+' + x.customer.phone : ''), total: x.total, at: x.at, sent: '' }; }))
      .sort(function (a, b) { return b.at - a.at; });
    var rm = recs.filter(function (r) { return r.at >= m0; });
    var match = function (t) { return !q || t.toLowerCase().indexOf(q) >= 0; };
    var b = H.body('<div class="kpis"><div class="card kpi kpi--o"><i class="kpi__i">' + IC.pdf + '</i><span>Unpaid invoices</span><b>' + H.money(un.reduce(function (n, x) { return n + x.total; }, 0)) + '</b><small>' + un.length + ' invoice' + (un.length === 1 ? '' : 's') + '</small></div>' +
      '<div class="card kpi kpi--y"><i class="kpi__i">' + IC.bell + '</i><span>Overdue</span><b>' + od.length + '</b><small>' + H.money(od.reduce(function (n, x) { return n + x.total; }, 0)) + '</small></div>' +
      '<div class="card kpi kpi--g"><i class="kpi__i">' + H.I.card + '</i><span>Received this month</span><b>' + H.money(rm.reduce(function (n, x) { return n + (x.total || 0); }, 0)) + '</b><small>' + rm.length + ' receipt' + (rm.length === 1 ? '' : 's') + '</small></div>' +
      '<div class="card kpi kpi--b"><i class="kpi__i">' + H.I.orders + '</i><span>Receipts</span><b>' + recs.length + '</b><small>written, invoices paid and website orders</small></div></div>' +
      '<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.5rem"><div class="tabs" id="iTab"><button data-t="inv"' + (tab === 'inv' ? ' class="is-on"' : '') + '>Invoices<i>' + invs.length + '</i></button><button data-t="rec"' + (tab === 'rec' ? ' class="is-on"' : '') + '>Receipts<i>' + recs.length + '</i></button></div>' +
      '<input class="hq-in" id="iq" type="search" placeholder="Search" value="' + esc(S.iq || '') + '" style="max-width:200px;margin-left:auto"><button class="b b--sm" id="rNew">' + H.I.plus + '<span>New receipt</span></button><button class="b b--p b--sm" id="iNew">' + H.I.plus + '<span>New invoice</span></button></div>' +
      (tab === 'inv' ? (invs.length ? '<table class="tbl"><thead><tr><th>Invoice</th><th>Client</th><th>Total</th><th>Status</th></tr></thead><tbody>' + invs.filter(function (v) { return match(v.number + ' ' + v.client + ' ' + (v.email || '')); }).map(function (v) { var x = invToOrder(v); return '<tr data-i="' + esc(v.id) + '"><td><b>' + esc(v.number) + '</b><small>' + H.d2(x.at) + (v.due ? ' · due ' + H.d2(v.due + 'T12:00') : '') + '</small></td><td>' + esc(v.client) + '<small>' + (v.sentAt ? 'Sent by ' + (v.sentVia === 'whatsapp' ? 'WhatsApp' : 'email') + ' · ' + H.d2(v.sentAt) : '<span style="color:var(--y)">Not sent yet</span>') + '</small></td><td><b>' + H.money(v.total) + '</b></td><td><span class="chip chip--' + (x.paid ? 'g' : x.status === 'overdue' ? 'r' : x.status === 'cancelled' ? '' : 'y') + '">' + x.label + '</span></td></tr>'; }).join('') + '</tbody></table>'
          : '<div class="cm-empty"><div class="cm-empty__art">‹</div><h3>Invoices for website work and anything else</h3><p>Write an invoice in a minute, then send it by email with your own message, or on WhatsApp. When they pay, mark it paid and send the receipt. Paid invoices count in Reports.</p><button class="b b--p" id="iNew2">' + H.I.plus + '<span>New invoice</span></button></div>')
        : (recs.length ? '<table class="tbl"><thead><tr><th>Receipt</th><th>Customer</th><th>Amount</th><th class="hide-m">Sent</th></tr></thead><tbody>' + recs.filter(function (r) { return match(r.number + ' ' + (r.client || '') + ' ' + r.contact); }).map(function (r) { return '<tr data-r="' + esc(r.src === 'inv' ? 'i:' + r.id : 'o:' + r.ref) + '"><td><b>' + esc(r.number) + '</b><small>' + esc(r.what) + ' · ' + H.d2(r.at) + '</small></td><td>' + esc(r.client || '—') + '<small>' + esc(r.contact) + '</small></td><td><b>' + H.money(r.total) + '</b></td><td class="hide-m"><small>' + (r.sent ? esc(r.sent) : '—') + '</small></td></tr>'; }).join('') + '</tbody></table>'
          : '<div class="cm-empty"><div class="cm-empty__art">‹</div><h3>No receipts yet</h3><p>Paid website orders appear here automatically. For money received another way (cash, M-Pesa to your till, a bank transfer), write a receipt.</p><button class="b b--p" id="rNew2">' + H.I.plus + '<span>New receipt</span></button></div>')) + '</div>' +
      '<p class="faint" style="font-size:.78rem">Tap any invoice or receipt to open it and send it. Your details on every PDF come from Setup → Business details.</p>');
    b.querySelectorAll('#iTab [data-t]').forEach(function (x) { x.onclick = function () { S.itab2 = x.getAttribute('data-t'); invoices(); }; });
    [b.querySelector('#iNew'), b.querySelector('#iNew2')].forEach(function (x) { if (x) x.onclick = function () { edit(null, 'invoice'); }; });
    [b.querySelector('#rNew'), b.querySelector('#rNew2')].forEach(function (x) { if (x) x.onclick = function () { edit(null, 'receipt'); }; });
    var iq = b.querySelector('#iq'); iq.oninput = function () { S.iq = iq.value; var p = iq.selectionStart; invoices(); var n = document.getElementById('iq'); n.focus(); n.setSelectionRange(p, p); };
    b.querySelectorAll('tr[data-i]').forEach(function (tr) { tr.onclick = function () { edit(S.invoices.filter(function (v) { return v.id === tr.getAttribute('data-i'); })[0]); }; });
    b.querySelectorAll('tr[data-r]').forEach(function (tr) { tr.onclick = function () {
      var k = tr.getAttribute('data-r'), id = k.slice(2);
      if (k[0] === 'i') { var v = S.invoices.filter(function (x) { return x.id === id; })[0]; if (v) { if (v.kind === 'receipt') edit(v); else docPanel(fromInvoice(v, true), { onSent: sentFor(v) }); } }
      else { var o2 = S.orders.filter(function (x) { return x.ref === id; })[0]; if (o2) docPanel(fromOrder(o2)); }
    }; });
  }
  /* remember where an invoice or receipt went */
  function sentFor(v) { return function (x) { v.sentAt = Date.now(); v.sentTo = x.to || ''; v.sentVia = x.via; H.saveItem('invoices', v).then(function () { if ((location.hash || '').indexOf('#invoices') === 0) invoices(); }, function () { }); }; }
  function edit(v, kind) {
    var S = H.S; biz().then(function (B) {
      var due = new Date(Date.now() + (B.dueDays || 7) * 864e5);
      v = v ? JSON.parse(JSON.stringify(v)) : kind === 'receipt' ? { kind: 'receipt', date: H.today(), paidAt: H.today(), status: 'paid', method: 'M-Pesa', items: [{ desc: '', qty: 1, price: 0 }], delivery: 0, discount: 0 } : { kind: 'invoice', date: H.today(), due: ymd(due), status: 'unpaid', items: [{ desc: '', qty: 1, price: 0 }], delivery: 0, discount: 0 };
      var RC = v.kind === 'receipt';
      var people = window.HQCrm && HQCrm.people ? HQCrm.people() : [];
      var copyFrom = v.id ? [] : (S.invoices || []).filter(function (x) { return x.kind !== 'receipt' && (x.projTitle || (x.schedule || []).length || (x.recurring || []).length || x.assumptions); }).slice(-12).reverse();
      v.schedule = v.schedule || []; v.recurring = v.recurring || [];
      var m = H.modal('<div class="inv-m"><div class="row" style="justify-content:space-between"><h2>' + (v.number ? esc(v.number) : RC ? 'New receipt' : 'New invoice') + '</h2><button class="b b--sm b--ghost" data-x>' + H.I.x + '</button></div>' +
        '<datalist id="invP">' + people.map(function (x) { return '<option value="' + esc(x.name || x.email) + '">'; }).join('') + '</datalist>' +
        '<div class="g2"><label class="field"><span>' + (RC ? 'Received from' : 'Client') + '</span><input class="hq-in" id="iC" list="invP" value="' + esc(v.client || '') + '" placeholder="Name or company"></label><label class="field"><span>Email</span><input class="hq-in" id="iE" type="email" value="' + esc(v.email || '') + '"></label></div>' +
        '<div class="g2"><label class="field"><span>Phone (for WhatsApp)</span><input class="hq-in" id="iP" value="' + esc(v.phone || '') + '" placeholder="0712 345 678"></label><label class="field"><span>Address (optional)</span><input class="hq-in" id="iA" value="' + esc(v.address || '') + '"></label></div>' +
        '<div class="g2"><label class="field"><span>Date</span><input class="hq-in" id="iD" type="date" value="' + esc(v.date || H.today()) + '"></label><label class="field"' + (RC ? ' hidden' : '') + '><span>Due</span><input class="hq-in" id="iDu" type="date" value="' + esc(v.due || '') + '"></label></div>' +
        '<div class="inv-l"><div class="inv-lh"><span>What it’s for</span><span>Qty</span><span>Price (KES)</span><span></span></div><div id="iL"></div><button class="b b--sm" id="iAdd">' + H.I.plus + '<span>Add a line</span></button></div>' +
        '<div class="g2"><label class="field"><span>Delivery (KES)</span><input class="hq-in" id="iDel" type="number" min="0" value="' + (v.delivery || '') + '"></label><label class="field"><span>Discount (KES)</span><input class="hq-in" id="iDis" type="number" min="0" value="' + (v.discount || '') + '"></label></div>' +
        '<div class="inv-tot"><span>Total</span><b id="iT"></b></div>' +
        '<label class="field"><span>Notes on the ' + (RC ? 'receipt' : 'invoice') + ' (optional)</span><textarea class="hq-in" id="iN" rows="2" placeholder="e.g. 50% deposit to start, balance on launch">' + esc(v.notes || '') + '</textarea></label>' +
        /* the parts of the Ciel Africa invoice layout: project, payment schedule, page two */
        (RC ? '' : '<div class="inv-x">' +
          (copyFrom.length ? '<label class="field inv-copy"><span>Start from an earlier invoice (copies project, schedule and page two)</span><select class="hq-in" id="iCp"><option value="">Choose…</option>' + copyFrom.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.number + ' · ' + x.client) + '</option>'; }).join('') + '</select></label>' : '') +
          '<details class="inv-d"' + (v.projTitle || v.projDomain || v.projDesc ? ' open' : '') + '><summary><b>Project</b><small>shown under Bill to</small></summary><label class="field"><span>Project name</span><input class="hq-in" id="xPt" value="' + esc(v.projTitle || '') + '" placeholder="e.g. Tangawizi Music – Music Sales & Streaming Platform"></label><label class="field"><span>Domain (optional)</span><input class="hq-in" id="xPd" value="' + esc(v.projDomain || '') + '" placeholder="e.g. tangawizi.ke"></label><label class="field"><span>One-line description (optional)</span><textarea class="hq-in" id="xPx" rows="2">' + esc(v.projDesc || '') + '</textarea></label></details>' +
          '<details class="inv-d"' + ((v.schedule || []).length ? ' open' : '') + '><summary><b>Payment schedule</b><small>deposit and balance</small></summary><div id="xSc"></div><div class="row"><button class="b b--sm" type="button" id="xS50">Split 50 / 50</button><button class="b b--sm" type="button" id="xSAdd">' + H.I.plus + '<span>Add a payment</span></button></div></details>' +
          '<details class="inv-d"' + ((v.recurring || []).length ? ' open' : '') + '><summary><b>Recurring services</b><small>page two · not in the total</small></summary><div id="xRc"></div><div class="row"><button class="b b--sm" type="button" id="xRAdd">' + H.I.plus + '<span>Add a service</span></button><button class="b b--sm b--ghost" type="button" id="xRHost">+ Hosting &amp; domain renewal</button></div></details>' +
          '<details class="inv-d"' + (v.eta || v.assumptions ? ' open' : '') + '><summary><b>Delivery time &amp; assumptions</b><small>page two</small></summary><div class="g2"><label class="field"><span>Estimated delivery</span><input class="hq-in" id="xEt" value="' + esc(v.eta || '') + '" placeholder="e.g. 1–2 weeks"></label><label class="field"><span>Counted from</span><input class="hq-in" id="xEn" value="' + esc(v.etaNote || '') + '" placeholder="from receipt of the deposit and content"></label></div><label class="field"><span>Assumptions &amp; notes, one per line (numbered for you)</span><textarea class="hq-in" id="xAs" rows="5" placeholder="The client supplies final content and images.">' + esc(v.assumptions || '') + '</textarea></label></details>' +
          '<details class="inv-d"><summary><b>Prepared by</b><small>' + esc((v.preparedBy || B.preparer || '') + (v.preparedRole || B.preparerRole ? ' · ' + (v.preparedRole || B.preparerRole) : '')) + '</small></summary><div class="g2"><label class="field"><span>Name</span><input class="hq-in" id="xBy" value="' + esc(v.preparedBy || '') + '" placeholder="' + esc(B.preparer || '') + '"></label><label class="field"><span>Role</span><input class="hq-in" id="xBr" value="' + esc(v.preparedRole || '') + '" placeholder="' + esc(B.preparerRole || '') + '"></label></div><p class="faint" style="font-size:.76rem">Leave empty to use Setup → Business details.</p></details>' +
        '</div>') +
        '<div class="card inv-pay"><label class="field"' + (RC ? ' hidden' : '') + '><span>Status</span><select class="hq-in" id="iS"><option value="unpaid"' + (v.status !== 'paid' && v.status !== 'cancelled' ? ' selected' : '') + '>Not paid yet</option><option value="paid"' + (v.status === 'paid' ? ' selected' : '') + '>Paid</option><option value="cancelled"' + (v.status === 'cancelled' ? ' selected' : '') + '>Cancelled</option></select></label>' +
        '<div class="g2" id="iPaid"><label class="field"><span>Paid on</span><input class="hq-in" id="iPd" type="date" value="' + esc(v.paidAt || H.today()) + '"></label><label class="field"><span>M-Pesa code (optional)</span><input class="hq-in" id="iCo" value="' + esc(v.code || '') + '" placeholder="e.g. SKL3XXXXXX"></label><label class="field"><span>Method</span><select class="hq-in" id="iMe">' + ['M-Pesa', 'Bank transfer', 'Cash', 'Card', 'Other'].map(function (x) { return '<option' + ((v.method || 'M-Pesa') === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label></div></div>' +
        (v.sentAt ? '<p class="ox__n">Last sent by ' + (v.sentVia === 'whatsapp' ? 'WhatsApp' : 'email') + (v.sentTo ? ' to ' + esc(v.sentTo) : '') + ' · ' + H.dt(v.sentAt) + '</p>' : '') +
        '<div class="row inv-acts"><button class="b b--ghost" type="button" id="iPv">' + IC.pdf + '<span>Preview</span></button>' + (RC ? '<button class="b b--p" id="iRec">' + IC.send + '<span>Save &amp; send receipt</span></button><button class="b" id="iSave">Save</button>' : '<button class="b b--p" id="iPdf">' + IC.send + '<span>Save &amp; send invoice</span></button><button class="b" id="iSave">Save</button><button class="b" id="iRec">' + IC.send + '<span>Send receipt</span></button>') + (v.id ? '<button class="b b--ghost" id="iDelB" style="margin-left:auto;color:var(--r)">Delete</button>' : '') + '</div></div>');
      m.querySelector('.modal__p').classList.add('inv-modal');
      var L = m.querySelector('#iL');
      function lines() { L.innerHTML = v.items.map(function (l, i) { return '<div class="inv-li"><input class="hq-in" data-f="desc" data-i="' + i + '" value="' + esc(l.desc) + '" placeholder="e.g. Website design, 5 pages"><input class="hq-in" data-f="qty" data-i="' + i + '" type="number" min="0" step="any" value="' + (l.qty == null ? 1 : l.qty) + '"><input class="hq-in" data-f="price" data-i="' + i + '" type="number" min="0" step="any" value="' + (l.price || '') + '"><button class="b b--sm b--ghost" data-rm="' + i + '" aria-label="Remove line">' + H.I.x + '</button></div>'; }).join(''); bind(); tot(); }
      function bind() { L.querySelectorAll('[data-f]').forEach(function (x) { x.oninput = function () { var l = v.items[+x.getAttribute('data-i')], f = x.getAttribute('data-f'); l[f] = f === 'desc' ? x.value : +x.value || 0; tot(); }; }); L.querySelectorAll('[data-rm]').forEach(function (x) { x.onclick = function () { v.items.splice(+x.getAttribute('data-rm'), 1); if (!v.items.length) v.items.push({ desc: '', qty: 1, price: 0 }); lines(); }; }); }
      function grab() { v.client = m.querySelector('#iC').value.trim(); v.email = m.querySelector('#iE').value.trim(); v.phone = m.querySelector('#iP').value.trim(); v.address = m.querySelector('#iA').value.trim(); v.date = m.querySelector('#iD').value; v.due = m.querySelector('#iDu').value; v.delivery = +m.querySelector('#iDel').value || 0; v.discount = +m.querySelector('#iDis').value || 0; v.notes = m.querySelector('#iN').value; v.status = RC ? 'paid' : m.querySelector('#iS').value; if (v.status === 'paid') { v.paidAt = m.querySelector('#iPd').value || H.today(); v.code = m.querySelector('#iCo').value.trim(); v.method = m.querySelector('#iMe').value; } if (!RC) { v.projTitle = m.querySelector('#xPt').value.trim(); v.projDomain = m.querySelector('#xPd').value.trim(); v.projDesc = m.querySelector('#xPx').value.trim(); v.eta = m.querySelector('#xEt').value.trim(); v.etaNote = m.querySelector('#xEn').value.trim(); v.assumptions = m.querySelector('#xAs').value.trim(); v.preparedBy = m.querySelector('#xBy').value.trim(); v.preparedRole = m.querySelector('#xBr').value.trim(); v.schedule = v.schedule.filter(function (x) { return x.label || x.pct; }); v.recurring = v.recurring.filter(function (x) { return x.service; }); } v.items = v.items.filter(function (l) { return l.desc || l.price; }); if (!v.items.length) v.items = [{ desc: '', qty: 1, price: 0 }]; v.total = Math.max(0, v.items.reduce(function (n, l) { return n + (l.qty || 0) * (l.price || 0); }, 0) + v.delivery - v.discount); return v; }
      function tot() { var t = v.items.reduce(function (n, l) { return n + (l.qty || 0) * (l.price || 0); }, 0) + (+m.querySelector('#iDel').value || 0) - (+m.querySelector('#iDis').value || 0); m.querySelector('#iT').textContent = kes(Math.max(0, t)); }
      function paidVis() { var p = RC || m.querySelector('#iS').value === 'paid'; m.querySelector('#iPaid').style.display = p ? '' : 'none'; if (!RC) m.querySelector('#iRec').style.display = p ? '' : 'none'; }
      m.querySelector('#iS').onchange = paidVis; m.querySelector('#iDel').oninput = m.querySelector('#iDis').oninput = tot;
      m.querySelector('#iC').onchange = function () { var x = people.filter(function (p) { return (p.name || p.email) === m.querySelector('#iC').value; })[0]; if (x) { if (!m.querySelector('#iE').value) m.querySelector('#iE').value = x.email || ''; if (!m.querySelector('#iP').value) m.querySelector('#iP').value = x.phone ? '+' + String(x.phone).replace(/^\+/, '') : ''; } };
      m.querySelector('#iAdd').onclick = function () { v.items.push({ desc: '', qty: 1, price: 0 }); lines(); var ins = L.querySelectorAll('[data-f=desc]'); ins[ins.length - 1].focus(); };
      lines(); paidVis();
      /* payment schedule and recurring services editors */
      function cur() { return v.items.reduce(function (n, l) { return n + (l.qty || 0) * (l.price || 0); }, 0) + (+m.querySelector('#iDel').value || 0) - (+m.querySelector('#iDis').value || 0); }
      function sched() {
        var el = m.querySelector('#xSc'); if (!el) return; var sum = v.schedule.reduce(function (n, x) { return n + (x.pct || 0); }, 0);
        el.innerHTML = v.schedule.map(function (x, i) { return '<div class="inv-sr"><input class="hq-in" data-s="label" data-i="' + i + '" value="' + esc(x.label) + '" placeholder="e.g. 50% commencement deposit"><label class="inv-pct"><input class="hq-in" data-s="pct" data-i="' + i + '" type="number" min="0" max="100" step="any" value="' + (x.pct || '') + '"><span>%</span></label><b class="inv-amt">' + kes(Math.round(cur() * (x.pct || 0)) / 100) + '</b><input class="hq-in inv-note" data-s="note" data-i="' + i + '" value="' + esc(x.note) + '" placeholder="e.g. Payable before development begins."><button class="b b--sm b--ghost" type="button" data-sx="' + i + '" aria-label="Remove">' + H.I.x + '</button></div>'; }).join('') + (v.schedule.length && Math.abs(sum - 100) > 0.01 ? '<p class="inv-warn">The payments add up to ' + sum + '% of the total, not 100%.</p>' : '') + (v.schedule.length ? '' : '<p class="faint" style="font-size:.8rem">No schedule: the invoice shows the due date instead.</p>');
        el.querySelectorAll('[data-s]').forEach(function (x) { x.oninput = function () { var it = v.schedule[+x.getAttribute('data-i')], k = x.getAttribute('data-s'); it[k] = k === 'pct' ? +x.value || 0 : x.value; if (k === 'pct') { var a2 = x.closest('.inv-sr').querySelector('.inv-amt'); a2.textContent = kes(Math.round(cur() * it.pct) / 100); } }; x.onchange = function () { if (x.getAttribute('data-s') === 'pct') sched(); }; });
        el.querySelectorAll('[data-sx]').forEach(function (x) { x.onclick = function () { v.schedule.splice(+x.getAttribute('data-sx'), 1); sched(); }; });
      }
      function recur() {
        var el = m.querySelector('#xRc'); if (!el) return;
        el.innerHTML = v.recurring.map(function (x, i) { return '<div class="inv-rr"><input class="hq-in" data-r="service" data-i="' + i + '" value="' + esc(x.service) + '" placeholder="Service, e.g. Website hosting"><label class="inv-k"><span>Monthly KES</span><input class="hq-in" data-r="monthly" data-i="' + i + '" type="number" min="0" value="' + (x.monthly || '') + '"></label><label class="inv-k"><span>Annual KES</span><input class="hq-in" data-r="annual" data-i="' + i + '" type="number" min="0" value="' + (x.annual || '') + '"></label><input class="hq-in" data-r="billing" data-i="' + i + '" value="' + esc(x.billing) + '" placeholder="Billing, e.g. Monthly or annual billing"><textarea class="hq-in" data-r="about" data-i="' + i + '" rows="2" placeholder="What it covers (shown in a box under the table)">' + esc(x.about) + '</textarea><button class="b b--sm b--ghost" type="button" data-rx="' + i + '" aria-label="Remove">' + H.I.x + '</button></div>'; }).join('');
        el.querySelectorAll('[data-r]').forEach(function (x) { x.oninput = function () { var it = v.recurring[+x.getAttribute('data-i')], k = x.getAttribute('data-r'); it[k] = k === 'monthly' || k === 'annual' ? +x.value || 0 : x.value; }; });
        el.querySelectorAll('[data-rx]').forEach(function (x) { x.onclick = function () { v.recurring.splice(+x.getAttribute('data-rx'), 1); recur(); }; });
      }
      if (!RC) {
        sched(); recur();
        m.querySelector('#xS50').onclick = function () { v.schedule = [{ label: '50% commencement deposit', pct: 50, note: 'Payable before work begins.' }, { label: '50% final balance', pct: 50, note: 'Payable before final handover and launch.' }]; sched(); };
        m.querySelector('#xSAdd').onclick = function () { var left = 100 - v.schedule.reduce(function (n, x) { return n + (x.pct || 0); }, 0); v.schedule.push({ label: '', pct: Math.max(0, left), note: '' }); sched(); };
        m.querySelector('#xRAdd').onclick = function () { v.recurring.push({ service: '', monthly: 0, annual: 0, billing: '', about: '' }); recur(); };
        m.querySelector('#xRHost').onclick = function () { var d = (m.querySelector('#xPd').value || '').trim(); v.recurring.push({ service: 'Website hosting', monthly: 0, annual: 0, billing: 'Monthly or annual billing', about: 'Keeps the website online and accessible.' }, { service: 'Domain renewal' + (d ? ' – ' + d : ''), monthly: 0, annual: 0, billing: 'Annually, after the first year', about: 'Maintains ownership and continued use of ' + (d || 'the domain') + '. Billed annually after the first year.' }); recur(); H.toast('Added: fill in the prices'); };
        var cp = m.querySelector('#iCp'); if (cp) cp.onchange = function () { var src = (S.invoices || []).filter(function (x) { return x.id === cp.value; })[0]; if (!src) return; var c = JSON.parse(JSON.stringify(src)); ['projTitle', 'projDomain', 'projDesc', 'eta', 'etaNote', 'assumptions'].forEach(function (k) { var el = { projTitle: '#xPt', projDomain: '#xPd', projDesc: '#xPx', eta: '#xEt', etaNote: '#xEn', assumptions: '#xAs' }[k]; m.querySelector(el).value = c[k] || ''; }); v.schedule = c.schedule || []; v.recurring = c.recurring || []; sched(); recur(); m.querySelectorAll('.inv-d').forEach(function (d) { d.open = true; }); H.toast('Copied from ' + c.number + ': change what differs'); };
        ['#iDel', '#iDis'].forEach(function (q) { var el = m.querySelector(q), o = el.oninput; el.oninput = function () { if (o) o(); sched(); }; });
        L.addEventListener('input', function () { clearTimeout(L._t); L._t = setTimeout(sched, 250); });
      }
      function store() { grab(); if (!v.client) { H.toast(RC ? 'Add who paid.' : 'Add the client’s name.', 'err'); return Promise.reject(new Error('client')); } if (!v.items.some(function (l) { return l.desc && l.price; })) { H.toast('Add at least one line with a price.', 'err'); return Promise.reject(new Error('lines')); } return H.saveItem('invoices', v).then(function (it) { v = JSON.parse(JSON.stringify(it)); m.querySelector('h2').textContent = it.number; if (!m.querySelector('#iDelB')) { var d = document.createElement('button'); d.className = 'b b--ghost'; d.id = 'iDelB'; d.style.cssText = 'margin-left:auto;color:var(--r)'; d.textContent = 'Delete'; d.onclick = del; m.querySelector('.inv-acts').appendChild(d); } if (H.refreshOrders) H.refreshOrders(); return it; }); }
      function del() { HQAsk.confirm('Delete ' + (RC ? 'receipt ' : 'invoice ') + v.number + '? It also leaves Reports.').then(function (ok) { if (!ok) return; H.delItem('invoices', v.id).then(function () { m.remove(); if (H.refreshOrders) H.refreshOrders(); H.toast('Deleted'); if ((location.hash || '').indexOf('#invoices') === 0) invoices(); }); }); }
      m.querySelector('#iPv').onclick = function () { if (grab() === false) return; previewDoc(fromInvoice(Object.assign({}, v, { number: v.number || (RC ? 'Receipt' : 'Invoice') }), RC || v.kind === 'receipt')); };
      m.querySelector('#iSave').onclick = function () { store().then(function () { H.toast('Saved ' + v.number, 'ok'); m.remove(); if ((location.hash || '').indexOf('#invoices') === 0) invoices(); }, function () { }); };
      var ip = m.querySelector('#iPdf'); if (ip) ip.onclick = function () { store().then(function (it) { m.remove(); docPanel(fromInvoice(it, false), { onSent: sentFor(it) }); }, function () { }); };
      m.querySelector('#iRec').onclick = function () { store().then(function (it) { m.remove(); docPanel(fromInvoice(it, true), { onSent: sentFor(it) }); }, function () { }); };
      var db = m.querySelector('#iDelB'); if (db) db.onclick = del;
    }, function (e) { H.toast(e.message, 'err'); });
  }

  /* ---------- costs ---------- */
  var CATS = ['Printing', 'Delivery', 'Materials', 'Advertising', 'Hosting & software', 'Other'];
  function costModal(x, done) {
    x = x || { date: H.today(), category: 'Printing' };
    var m = H.modal('<h2>' + (x.id ? 'Edit cost' : 'Add a cost') + '</h2><div class="g2"><label class="field"><span>Amount (KES)</span><input class="hq-in" id="xA" type="number" min="0" step="any" inputmode="decimal" value="' + (x.amount || '') + '" placeholder="e.g. 1800"></label><label class="field"><span>Date</span><input class="hq-in" id="xD" type="date" value="' + esc(x.date) + '"></label></div>' +
      '<label class="field"><span>What for</span><select class="hq-in" id="xC">' + CATS.map(function (c) { return '<option' + (x.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>Note (optional)</span><input class="hq-in" id="xN" value="' + esc(x.note || '') + '" placeholder="e.g. Printer invoice, 6 books"></label><label class="field"><span>Order number (optional)</span><input class="hq-in" id="xR" value="' + esc(x.ref || '') + '" placeholder="e.g. PB-AB12CD34"></label>' +
      '<div class="row"><button class="b b--p" id="xS">Save</button><button class="b b--ghost" data-x>Cancel</button>' + (x.id ? '<button class="b b--ghost" id="xDel" style="margin-left:auto;color:var(--r)">Delete</button>' : '') + '</div>');
    m.querySelector('#xS').onclick = function () { x.amount = +m.querySelector('#xA').value || 0; x.date = m.querySelector('#xD').value; x.category = m.querySelector('#xC').value; x.note = m.querySelector('#xN').value; x.ref = m.querySelector('#xR').value.trim(); if (!x.amount) return H.toast('Enter the amount.', 'err'); H.saveItem('expenses', x).then(function () { m.remove(); H.toast('Cost saved', 'ok'); if (done) done(); }, function (e) { H.toast(e.message, 'err'); }); };
    var dl = m.querySelector('#xDel'); if (dl) dl.onclick = function () { HQAsk.confirm('Delete this cost?').then(function (ok) { if (!ok) return; H.delItem('expenses', x.id).then(function () { m.remove(); if (done) done(); }); }); };
    setTimeout(function () { m.querySelector('#xA').focus(); }, 50);
  }

  /* ---------- Setup: business details, quick WhatsApp replies, backup, screen check ---------- */
  function setupCards(b) {
    var wrap = document.createElement('div'); wrap.style.cssText = 'display:grid;gap:1rem';
    wrap.innerHTML = '<div class="card"><div class="card__h"><h2>Business details</h2><span class="muted" style="font-size:.78rem">printed on receipts and invoices</span></div><div class="card__b" id="stBiz"><div class="sk" style="height:60px"></div></div></div>' +
      '<div class="card"><div class="card__h"><h2>Quick WhatsApp replies</h2><span class="muted" style="font-size:.78rem">in every order</span></div><div class="card__b" id="stWa"><div class="sk" style="height:60px"></div></div></div>' +
      '<div class="card"><div class="card__h"><h2>Backup</h2></div><div class="card__b"><p class="muted" style="font-size:.86rem;margin-bottom:.7rem">One file with everything Ciel Admin keeps: orders, customers, messages, subscribers, campaigns, invoices, costs, reviews, tasks, calendar and settings. No passwords, keys or photos. It contains customers’ personal details, so keep it somewhere private.</p><button class="b b--p" id="stBk">' + IC.dl + '<span>Download a full backup</span></button></div></div>';
    b.appendChild(wrap);
    biz().then(function (B) {
      var F = [['name', 'Business name'], ['phone', 'Phone'], ['email', 'Email'], ['web', 'Website'], ['address', 'Address'], ['taxId', 'KRA PIN (optional)'], ['paybill', 'M-Pesa Paybill (on invoices)'], ['account', 'Paybill account number'], ['dueDays', 'Invoices due after (days)'], ['invoiceNote', 'Thank-you line at the bottom'], ['preparer', 'Prepared by (name)'], ['preparerRole', 'Prepared by (role)'], ['tagline', 'Footer line after the business name']];
      var el = wrap.querySelector('#stBiz'); el.innerHTML = '<div class="g2">' + F.map(function (f) { return '<label class="field"><span>' + f[1] + '</span><input class="hq-in" data-bz="' + f[0] + '" value="' + esc(B[f[0]] == null ? '' : B[f[0]]) + '"' + (f[0] === 'dueDays' ? ' type="number" min="0" max="90"' : '') + '></label>'; }).join('') + '</div><button class="b b--p b--sm" id="bzS" style="margin-top:.8rem">Save details</button>';
      el.querySelector('#bzS').onclick = function () { var v = {}; el.querySelectorAll('[data-bz]').forEach(function (x) { v[x.getAttribute('data-bz')] = x.value; }); H.api('/api/hq?route=settings-save', { k: 'business', v: v }).then(function (r) { BIZ = r.value; H.toast('Business details saved', 'ok'); }, function (e) { H.toast(e.message, 'err'); }); };
    }, function () { });
    waSet().then(function (W) {
      var el = wrap.querySelector('#stWa'), items = JSON.parse(JSON.stringify(W.items));
      function draw() {
        el.innerHTML = '<p class="muted" style="font-size:.8rem;margin-bottom:.7rem">Words in braces are filled in for you: {first} first name, {name}, {ref} order number, {total}, {paybill}, {account}, {track} tracking link, {review} review link, {note} asks you what to add.</p>' +
          items.map(function (t, i) { return '<div class="wa-t"><input class="hq-in" data-wl="' + i + '" value="' + esc(t.label) + '" maxlength="40"><textarea class="hq-in" data-wx="' + i + '" rows="2">' + esc(t.text) + '</textarea><button class="b b--sm b--ghost" data-wr="' + i + '" aria-label="Remove">' + H.I.x + '</button></div>'; }).join('') +
          '<div class="row" style="margin-top:.6rem"><button class="b b--sm" id="waA">' + H.I.plus + '<span>Add a message</span></button><button class="b b--p b--sm" id="waS">Save messages</button></div>';
        el.querySelectorAll('[data-wl]').forEach(function (x) { x.oninput = function () { items[+x.getAttribute('data-wl')].label = x.value; }; });
        el.querySelectorAll('[data-wx]').forEach(function (x) { x.oninput = function () { items[+x.getAttribute('data-wx')].text = x.value; }; });
        el.querySelectorAll('[data-wr]').forEach(function (x) { x.onclick = function () { items.splice(+x.getAttribute('data-wr'), 1); draw(); }; });
        el.querySelector('#waA').onclick = function () { items.push({ id: 't' + Date.now().toString(36), label: 'New message', text: 'Hi {first}, ' }); draw(); };
        el.querySelector('#waS').onclick = function () { H.api('/api/hq?route=settings-save', { k: 'wa', v: { items: items } }).then(function (r) { WA = r.value; H.toast('Messages saved', 'ok'); }, function (e) { H.toast(e.message, 'err'); }); };
      }
      draw();
    }, function () { });
    wrap.querySelector('#stBk').onclick = function () {
      var bt = this; bt.disabled = true; bt.querySelector('span').textContent = 'Preparing…';
      H.api('/api/hq?route=backup').then(function (r) {
        var dom = H.S.orders.filter(function (o) { return o.kind === 'domain'; }).map(function (o) { return o.raw; });
        r.domainOrders = dom;
        var name = 'ciel-admin-backup_' + H.today() + '.json', a = document.createElement('a'), u = URL.createObjectURL(new Blob([JSON.stringify(r, null, 1)], { type: 'application/json' }));
        a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
        bt.disabled = false; bt.querySelector('span').textContent = 'Download a full backup'; H.toast('Backup downloaded · ' + (r.count + dom.length) + ' records', 'ok');
      }, function (e) { bt.disabled = false; bt.querySelector('span').textContent = 'Download a full backup'; H.toast(e.message, 'err'); });
    };
    var t = window.__hqTop; if (t) { var li = document.createElement('li'); li.innerHTML = '<span class="st opt">i</span><div><b>Screen check</b><p>' + (t.app ? 'Home-screen app' : 'Browser') + ' · screen ' + esc(t.screen) + ' · window ' + esc(t.win) + ' · status bar ' + t.env + 'px reported, header leaves ' + t.used + 'px. If the top of Ciel Admin is ever hard to reach, send a screenshot of this line with your message.</p></div>'; var ul = b.querySelector('.list.setup'); if (ul) ul.appendChild(li); }
  }

  window.HQMoney = { init: function (h) { H = h; }, makePdf: makePdf, fromInvoice: fromInvoice, previewDoc: previewDoc, invoices: invoices, editInvoice: edit, invToOrder: invToOrder, extras: extras, costModal: costModal, CATS: CATS, setupCards: setupCards, docPanel: docPanel, fromOrder: fromOrder };
})();
