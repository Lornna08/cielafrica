/* ============================================================
   CIEL AFRICA PHOTO BOOKS — the printing partner's page (/photobooks/printer?t=…).
   Shows only what Ciel Africa chose to share for this job (never prices or
   payment details), makes the files, and lets the printer confirm.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('pj'), t = new URLSearchParams(location.search).get('t') || '';
  var head = root.querySelector('.pj__top').outerHTML;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(route, body) { return fetch('/api/photobooks?route=' + route, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { if (!r.ok || j.ok === false) throw new Error(j.error || 'Something went wrong.'); return j; }); }); }
  function file(pid, k, i) { return fetch('/api/photobooks?route=pbk-printer-file&t=' + encodeURIComponent(t) + '&p=' + encodeURIComponent(pid) + '&k=' + k + '&i=' + i).then(function (r) { if (!r.ok) { if (k === 'spine') return null; throw new Error('Couldn’t download page ' + i + '. Try again.'); } return r.blob(); }); }
  function when(x) { return new Date(x).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }); }
  if (!t) { root.innerHTML = head + '<div class="pj__card pj__err">This link is incomplete. Open the full link Ciel Africa sent you.</div>'; return; }
  api('pbk-printer-view', { t: t }).then(draw, function (e) { root.innerHTML = head + '<div class="pj__card pj__err">' + esc(e.message) + '</div>'; });
  function draw(r) {
    var j = r.job, d = j.delivery;
    var ack = r.ack ? '<p class="pj__ok">✓ ' + (r.ack.status === 'received' ? 'You confirmed you have the files' : r.ack.status === 'printed' ? 'You marked this job printed' : 'You reported a problem') + ' · ' + when(r.ack.at) + '</p>' : '';
    root.innerHTML = head + (r.newer ? '<div class="pj__warn"><b>There is a newer version of this job.</b> Use the latest link Ciel Africa sent you.</div>' : '') +
      '<div class="pj__card"><h1>Print job ' + esc(j.ref) + (j.test ? ' <span class="pj__test">TEST · DO NOT PRINT</span>' : '') + '</h1><p class="pj__msg">Shared ' + when(j.sharedAt) + ' by Ciel Africa</p><dl style="margin-top:.8rem">' +
      (j.customer.name ? '<dt>Customer</dt><dd>' + esc(j.customer.name) + '</dd>' : '') +
      (d.by === 'printer' ? '<dt>Delivery</dt><dd><b>Please deliver to the customer</b>' + (d.method ? '<br>' + esc(d.method) : '') + '</dd>' + (d.address ? '<dt>Address</dt><dd>' + esc(d.address) + (d.notes ? '<br><i>' + esc(d.notes) + '</i>' : '') + '</dd>' : '') + (d.gift ? '<dt>Gift for</dt><dd>' + esc(d.gift.to || '') + (d.gift.phone ? ', ' + esc(d.gift.phone) : '') + '</dd>' : '') : '<dt>Delivery</dt><dd>Ciel Africa collects the finished books</dd>') +
      (j.customer.phone ? '<dt>Phone</dt><dd><a href="tel:' + esc(j.customer.phone) + '">' + esc(j.customer.phone) + '</a></dd>' : '') +
      (j.notes ? '<dt>Notes</dt><dd>' + esc(j.notes) + '</dd>' : '') + '</dl></div>' +
      '<div class="pj__card"><h2>Books</h2>' + j.books.map(function (b, i) {
        return '<div class="pj__b" data-i="' + i + '"><b>' + esc(b.name) + '</b><ul><li>' + b.qty + ' × hardcover, ' + b.pages + ' pages, A4 portrait (210 × 297 mm)</li><li>Front cover and back cover: A4 PDF each</li><li>' + (b.spine ? 'Spine: PNG' + (b.book && b.book.spineMm ? ' (designed for about ' + b.book.spineMm + ' mm; resize to your spine)' : '') : 'No printed spine: ' + b.pages + ' pages is too thin') + '</li><li>Inside pages: one A4 PDF, page 1 first, print back to back</li></ul>' +
          '<div class="pj__acts"><button class="btn btn--p" data-dl>Download files (.zip)</button></div><p class="pj__msg" data-m>' + (b.files < b.pages + 2 ? 'Some files are missing (' + b.files + ' of ' + (b.pages + 2) + '). Contact Ciel Africa.' : 'All pages at 300 dpi, so it’s a large download. Keep this page open while it prepares.') + '</p></div>';
      }).join('') + '</div>' +
      '<div class="pj__card"><h2>Let Ciel Africa know</h2>' + ack + '<div class="pj__acts"><button class="btn btn--dark" data-a="received">I have the files</button><button class="btn btn--ghost" data-a="printed">Printed</button><button class="btn btn--ghost" data-a="problem">Report a problem</button></div><textarea id="an" rows="2" maxlength="400" placeholder="Note (optional, required for a problem)"></textarea><p class="pj__msg" id="am"></p></div>';
    root.querySelectorAll('[data-dl]').forEach(function (btn) {
      btn.onclick = function () {
        var el = btn.closest('[data-i]'), b = j.books[+el.getAttribute('data-i')], m = el.querySelector('[data-m]');
        btn.disabled = true;
        PBKPack.build({ ref: j.ref, text: r.text, progress: function (s) { if (s) m.textContent = s; }, books: [{ name: b.name, pages: b.pages, qty: b.qty, spine: b.spine, files: b.files, info: b.book, print: function (i) { return file(b.pid, 'print', i); }, spineFile: function () { return file(b.pid, 'spine', 0); } }] })
          .then(function (z) { PBKPack.save(z.blob, j.books.length > 1 ? j.ref + '-' + (+el.getAttribute('data-i') + 1) + '-print-files.zip' : z.name); m.textContent = 'Downloaded ✓'; }, function (e) { m.textContent = e.message || 'Couldn’t prepare the files.'; })
          .then(function () { btn.disabled = false; });
      };
    });
    root.querySelectorAll('[data-a]').forEach(function (b) {
      b.onclick = function () {
        var st = b.getAttribute('data-a'), note = document.getElementById('an').value.trim(), am = document.getElementById('am');
        if (st === 'problem' && note.length < 3) { am.textContent = 'Please describe the problem in the note.'; return; }
        api('pbk-printer-ack', { t: t, status: st, note: note }).then(function (x) { r.ack = x.ack; draw(r); }, function (e) { am.textContent = e.message; });
      };
    });
  }
})();
