/* ============================================================
   CIEL ADMIN — Policies: Terms and Conditions, Privacy, Refunds,
   Delivery and Cookies. Each page is edited as a title, a short intro
   and sections (heading + text), previewed exactly as the website will
   show it, and published to cielafrica.com (live in about a minute).
   ============================================================ */
(function () {
  'use strict';
  var H, P = window.Policies, L = { id: null, model: null, live: null, dirty: false };
  var esc = function (s) { return H.esc(s); };
  var IC = {
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M8 13h8M8 17h6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>'
  };
  function txt(url) { return fetch(url + '?hq=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }); }
  function draftKey(id) { return 'hq_policy_' + id; }
  function saveDraft() { try { localStorage.setItem(draftKey(L.id), JSON.stringify(L.model)); } catch (e) { } }
  function readDraft(id) { try { return JSON.parse(localStorage.getItem(draftKey(id)) || 'null'); } catch (e) { return null; } }
  function dropDraft(id) { try { localStorage.removeItem(draftKey(id)); } catch (e) { } }

  /* ---------- the list ---------- */
  function list() {
    var b = H.body('<div class="lg-wrap"><p class="muted lg-lead">The policies linked in the footer of every page. Open one to change its wording; publishing updates the live page in about a minute.</p><div class="lg-list" id="lgList">' +
      P.LIST.map(function (p) { return '<a class="card lg-item" href="#policies/' + p.id + '"><i class="lg-ic">' + IC.doc + '</i><span><b>' + esc(p.name) + '</b><small id="lgU-' + p.id + '">cielafrica.com' + p.url + '</small></span>' + (readDraft(p.id) ? '<em class="chip chip--o">Unpublished changes</em>' : '') + '</a>'; }).join('') +
      '</div><p class="faint lg-note">Domain terms are versioned with each domain order, so they are changed in the code rather than here.</p></div>');
    P.LIST.forEach(function (p) { txt(p.url).then(function (h) { var m = P.parse(h), el = b.querySelector('#lgU-' + p.id); if (m && el) el.textContent = 'Last updated ' + P.longDate(m.updated) + ' · ' + m.sections.length + ' sections'; }).catch(function () { }); });
  }

  /* ---------- one policy ---------- */
  function open(id) {
    var p = P.LIST.filter(function (x) { return x.id === id; })[0]; if (!p) return list();
    var b = H.body('<p class="muted">Loading ' + esc(p.name) + '…</p>');
    txt(p.url).then(function (h) {
      var live = P.parse(h); if (!live) throw new Error('This page has no editable content yet.');
      var dr = readDraft(id);
      L = { id: id, p: p, live: live, model: dr || JSON.parse(JSON.stringify(live)), dirty: !!dr };
      edit(b);
    }).catch(function (e) { b.innerHTML = '<div class="card"><div class="card__b"><p>Couldn’t load the page: ' + esc(e.message) + '</p><a class="b" href="#policies">Back</a></div></div>'; });
  }
  function edit(b) {
    var m = L.model, p = L.p;
    b.innerHTML = '<div class="lg-ed">' +
      '<div class="lg-top"><a class="b b--sm" href="#policies">‹ All policies</a><span class="lg-state" id="lgState"></span><span class="lg-sp"></span><a class="b b--sm" href="' + p.url + '" target="_blank" rel="noopener">' + IC.ext + '<span>Live page</span></a><button class="b b--sm" id="lgDiscard"' + (L.dirty ? '' : ' disabled') + '>Discard changes</button><button class="b b--p b--sm" id="lgPub">Publish</button></div>' +
      '<div class="lg-cols"><div class="lg-form">' +
      '<div class="card"><div class="card__b"><label class="field"><span>Title</span><input class="hq-in" id="lgT" maxlength="120" value="' + esc(m.title) + '"></label>' +
      '<label class="field"><span>Short introduction</span><textarea class="hq-in" id="lgI" rows="2" maxlength="600">' + esc(m.intro) + '</textarea></label>' +
      '<p class="faint lg-help">Writing tips: leave a blank line for a new paragraph · start a line with <b>-</b> for a bullet · <b>**bold**</b> · <b>[words](/refunds)</b> for a link. “Last updated” is set to today when you publish.</p></div></div>' +
      '<div id="lgSecs"></div><button class="b lg-add" id="lgAdd">+ Add a section</button></div>' +
      '<div class="lg-prev"><div class="lg-prevh"><b>Preview</b><span class="faint">as it will look on the website</span></div><div class="lg-paper" id="lgPrev"></div></div></div></div>';
    drawSecs(b); preview(b); state(b);
    b.querySelector('#lgT').oninput = function () { m.title = this.value; changed(b); };
    b.querySelector('#lgI').oninput = function () { m.intro = this.value; changed(b); };
    b.querySelector('#lgAdd').onclick = function () { m.sections.push({ h: 'New section', body: '' }); drawSecs(b); changed(b); var t = b.querySelectorAll('.lg-sec'); var last = t[t.length - 1]; if (last) { last.scrollIntoView({ behavior: 'smooth', block: 'center' }); last.querySelector('input').select(); } };
    b.querySelector('#lgDiscard').onclick = function () { HQAsk.confirm('Discard your changes to ' + p.name + ' and go back to the live wording?').then(function (ok) { if (!ok) return; dropDraft(L.id); L.model = JSON.parse(JSON.stringify(L.live)); L.dirty = false; edit(b); }); };
    b.querySelector('#lgPub').onclick = function () { publish(b); };
  }
  function drawSecs(b) {
    var m = L.model, box = b.querySelector('#lgSecs');
    box.innerHTML = m.sections.map(function (x, i) {
      return '<div class="card lg-sec" data-i="' + i + '"><div class="lg-sech"><span class="lg-n">' + (i + 1) + '</span><input class="hq-in lg-h" maxlength="140" value="' + esc(x.h) + '" placeholder="Section heading">' +
        '<button class="b b--sm b--ghost" data-mv="-1" title="Move up" aria-label="Move up"' + (i ? '' : ' disabled') + '>' + IC.up + '</button><button class="b b--sm b--ghost" data-mv="1" title="Move down" aria-label="Move down"' + (i < m.sections.length - 1 ? '' : ' disabled') + '>' + IC.down + '</button><button class="b b--sm b--ghost" data-rm title="Remove section" aria-label="Remove section">' + IC.del + '</button></div>' +
        '<textarea class="hq-in lg-b" rows="' + Math.min(14, Math.max(3, x.body.split('\n').length + 1)) + '" maxlength="8000" placeholder="Text for this section">' + esc(x.body) + '</textarea></div>';
    }).join('');
    box.querySelectorAll('.lg-sec').forEach(function (el) {
      var i = +el.getAttribute('data-i');
      el.querySelector('.lg-h').oninput = function () { m.sections[i].h = this.value; changed(b); };
      el.querySelector('.lg-b').oninput = function () { m.sections[i].body = this.value; this.rows = Math.min(14, Math.max(3, this.value.split('\n').length + 1)); changed(b); };
      el.querySelectorAll('[data-mv]').forEach(function (bt) { bt.onclick = function () { var j = i + +bt.getAttribute('data-mv'); if (j < 0 || j >= m.sections.length) return; var t = m.sections[i]; m.sections[i] = m.sections[j]; m.sections[j] = t; drawSecs(b); changed(b); }; });
      el.querySelector('[data-rm]').onclick = function () { HQAsk.confirm('Remove the section “' + (m.sections[i].h || 'untitled') + '”?').then(function (ok) { if (!ok) return; m.sections.splice(i, 1); drawSecs(b); changed(b); }); };
    });
  }
  var pt;
  function changed(b) { L.dirty = true; saveDraft(); state(b); clearTimeout(pt); pt = setTimeout(function () { preview(b); }, 180); }
  function state(b) {
    var el = b.querySelector('#lgState'); if (el) el.innerHTML = L.dirty ? '<span class="chip chip--o">Unpublished changes</span>' : '<span class="chip chip--g">Matches the live page</span> <span class="faint">Last updated ' + esc(P.longDate(L.live.updated)) + '</span>';
    var d = b.querySelector('#lgDiscard'); if (d) d.disabled = !L.dirty;
  }
  function preview(b) {
    var el = b.querySelector('#lgPrev'); if (!el) return;
    var m = Object.assign({}, L.model, { id: L.id, updated: L.dirty ? new Date().toISOString().slice(0, 10) : L.live.updated });
    el.innerHTML = P.render(m);
    el.querySelectorAll('a').forEach(function (a) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener'); });
  }
  function publish(b) {
    var m = L.model;
    if (!String(m.title || '').trim()) return H.toast('Add a title first.');
    if (!m.sections.some(function (x) { return (x.h || '').trim() || (x.body || '').trim(); })) return H.toast('Add at least one section.');
    if (!L.dirty) return H.toast('Nothing has changed.');
    HQAsk.confirm('Publish the new ' + L.p.name + ' to cielafrica.com? It goes live in about a minute.', { ok: 'Publish', primary: true }).then(function (ok) {
      if (!ok) return;
      var bt = b.querySelector('#lgPub'); bt.disabled = true; bt.textContent = 'Publishing…';
      H.api('/api/hq?route=policy-publish', { id: L.id, model: m }).then(function (r) {
        dropDraft(L.id); L.live = Object.assign(JSON.parse(JSON.stringify(m)), { updated: r.updated || L.live.updated }); L.dirty = false;
        bt.disabled = false; bt.textContent = 'Publish'; state(b); preview(b);
        H.toast(r.sha ? L.p.name + ' published. It’s live in about a minute.' : 'Nothing changed.');
      }, function (e) { bt.disabled = false; bt.textContent = 'Publish'; H.toast(e.message || 'Couldn’t publish.'); });
    });
  }
  function render(id) { if (!P) { H.body('<p class="empty">Policies didn’t load. Refresh the page.</p>'); return; } if (id) open(id); else list(); }
  window.addEventListener('beforeunload', function (e) { if (L.dirty && (location.hash || '').indexOf('#policies/') === 0) { e.preventDefault(); e.returnValue = ''; } });
  window.HQLegal = { init: function (h) { H = h; }, render: render };
})();
