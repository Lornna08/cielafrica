/* ============================================================
   CIEL DOMAINS — /domains page
   Search → results right under the search bar (only what you can buy)
   → 2-step checkout → M-Pesa STK push → confirmation.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return n == null ? '—' : 'KES ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var API = '/api/domains/';

  var cfg = null, tldMap = {}, results = {}, runId = 0, noTop = false;
  var form = $('#dmForm'), qIn = $('#dmQ'), extSel = $('#dmExt'), go = $('#dmGo'), err = $('#dmErr'), box = $('#results');

  function api(route, body) {
    return fetch(API + route, {
      method: body ? 'POST' : 'GET', credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' } : { 'X-Requested-With': 'ciel' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response.' }; }); })
      .catch(function () { return { ok: false, error: 'You seem to be offline. Check your connection and try again.' }; });
  }
  function split(d) { var i = d.indexOf('.'); return { label: d.slice(0, i), tld: d.slice(i + 1) }; }
  function domHtml(d) { var p = split(d); return esc(p.label) + '<em>.' + esc(p.tld) + '</em>'; }
  var ICON = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/></svg>'
  };

  /* ---------- config ---------- */
  api('config').then(function (c) {
    if (!c.ok) { $('#dmPrices').innerHTML = '<div class="dmpc"><span class="dmpc__r">Prices are unavailable right now. Please refresh in a moment.</span></div>'; return; }
    cfg = c; c.tlds.forEach(function (t) { tldMap[t.tld] = t; });
    extSel.innerHTML = '<option value="">Suffixes</option>' + c.tlds.map(function (t) { return '<option value="' + esc(t.tld) + '">.' + esc(t.tld) + '</option>'; }).join('');
    var pop = ['co.ke', 'com', 'africa', 'ke', 'org', 'dev', 'online'].filter(function (t) { return tldMap[t]; });
    $('#dmChips').innerHTML = pop.map(function (t) { return '<button type="button" data-ext="' + t + '" aria-pressed="false">.' + t + ' <small>' + money(tldMap[t].register) + '</small></button>'; }).join('');
    renderPrices('core'); renderTax();
    var u = new URLSearchParams(location.search);
    if (u.get('ext') && tldMap[u.get('ext')]) { extSel.value = u.get('ext'); syncChips(); }
    if (u.get('q')) { qIn.value = u.get('q').slice(0, 200); run(); }
  });

  function renderPrices(cat) {
    $('#dmTabs').innerHTML = Object.keys(cfg.categories || {}).map(function (k) { return '<button type="button" role="tab" data-cat="' + k + '" aria-selected="' + (k === cat) + '">' + esc(cfg.categories[k]) + '</button>'; }).join('');
    $('#dmPrices').innerHTML = cfg.tlds.filter(function (t) { return t.category === cat; }).map(function (t) {
      return '<div class="dmpc"><span class="dmpc__t">.' + esc(t.tld) + '</span><span class="dmpc__p">' + money(t.register) + ' <small>first year</small></span><span class="dmpc__r">Renews at ' + money(t.renew) + '/yr</span>' + (t.note ? '<span class="dmpc__n">' + esc(t.note) + '</span>' : '') + '</div>';
    }).join('');
  }
  function renderTax() {
    var t = cfg.tax || {};
    $('#dmTax').textContent = 'Prices in Kenyan shillings (KES). ' + (t.rate > 0 ? (t.included ? 'Prices include ' : 'Plus ') + Math.round(t.rate * 100) + '% ' + t.label + '. ' : '') + 'No other fees. Renewals are billed separately at the renewal price.';
  }
  $('#dmTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (b) renderPrices(b.dataset.cat); });

  /* ---------- suffix chips ---------- */
  function syncChips() { $$('#dmChips [data-ext]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ext === extSel.value)); }); }
  $('#dmChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ext]'); if (!b) return;
    extSel.value = extSel.value === b.dataset.ext ? '' : b.dataset.ext; syncChips();
    if (qIn.value.trim()) run(); else qIn.focus();
  });
  extSel.addEventListener('change', function () { syncChips(); if (qIn.value.trim()) run(); });

  /* ---------- search ---------- */
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  function buildQuery() {
    var v = qIn.value.trim(); if (!v) return '';
    var bare = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0];
    return extSel.value && bare.indexOf('.') === -1 ? bare + '.' + extSel.value : v;
  }
  function run() {
    if (!cfg) { err.textContent = 'Still loading — try again in a second.'; return; }
    var q = buildQuery(); err.textContent = '';
    if (!q) { err.textContent = 'Type a name to search.'; qIn.focus(); return; }
    var my = ++runId;
    go.disabled = true; go.querySelector('span').textContent = 'Searching…';
    var params = new URLSearchParams(); params.set('q', qIn.value.trim()); if (extSel.value) params.set('ext', extSel.value);
    try { history.replaceState(null, '', location.pathname + '?' + params.toString()); } catch (e) { /* */ }
    api('search', { q: q }).then(function (r) {
      if (my !== runId) return;
      go.disabled = false; go.querySelector('span').textContent = 'Search';
      if (!r.ok) { err.textContent = r.error || 'Search failed. Try again.'; return; }
      render(r, my);
    });
  }

  function render(r, my) {
    box.hidden = false; results = {};
    var hero = box.closest('.dmh'); if (hero && !hero.classList.contains('dmh--done')) { hero.classList.add('dmh--done'); scrollTo(0, 0); }
    $('#dmNotes').innerHTML = (r.notes || []).map(function (n) { return '<p>' + esc(n) + '</p>'; }).join('');
    var p = r.primary, explicit = r.query.explicitTld;
    noTop = !!explicit;
    results[p.domain] = { r: p, price: p.price };
    $('#dmMain').innerHTML = explicit ? one(p) : '';
    var groups = r.groups.map(function (g) { return { id: g.id, title: g.id === 'ext' ? 'Available extensions' : 'More ideas', items: g.items.slice() }; });
    // merge the two idea groups into one short list
    var ideas = groups.filter(function (g) { return g.id !== 'ext'; }).reduce(function (a, g) { return a.concat(g.items); }, []);
    var ext = (groups.find(function (g) { return g.id === 'ext'; }) || { items: [] }).items;
    if (!explicit && p.state === 'available') ext.unshift({ domain: p.domain, price: p.price });
    var list = [{ id: 'ext', title: explicit ? 'Other extensions' : 'Available extensions', items: ext }, { id: 'ideas', title: 'More ideas', items: ideas }].filter(function (g) { return g.items.length; });
    var toCheck = [];
    var TAG = { com: 'Most popular', 'co.ke': 'Kenyan', ke: 'Kenyan', africa: 'Pan-African', org: 'Organisations', net: 'Classic', online: 'Online', info: 'Info', biz: 'Business', dev: 'Developers', app: 'Apps', ai: 'AI', cloud: 'Cloud', digital: 'Digital', agency: 'Agencies', design: 'Design', consulting: 'Consulting', blog: 'Blogs' };
    $('#dmGroups').innerHTML = list.map(function (g) {
      return '<div class="dmgrp" data-g="' + g.id + '"><h3>' + esc(g.title) + '</h3><ul class="dmcards">' + g.items.map(function (it, n) {
        if (!results[it.domain]) { results[it.domain] = { r: null, price: it.price }; toCheck.push(it.domain); }
        results[it.domain].tag = g.id === 'ext' ? (TAG[split(it.domain).tld] || '') : 'Idea';
        results[it.domain].top = g.id === 'ext' && n === 0 && !explicit;
        return row(it.domain);
      }).join('') + '</ul></div>';
    }).join('');
    var batches = []; for (var i = 0; i < toCheck.length; i += 8) batches.push(toCheck.slice(i, i + 8));
    batches.reduce(function (pr, b) { return pr.then(function () { return my === runId && check(b); }); }, Promise.resolve()).then(function () { if (my === runId) tidy(); });
    if (!toCheck.length) tidy();
  }
  function one(p) {
    var x = results[p.domain], pr = x.price, s = p.state, act = '';
    var status = s === 'available' ? '<span class="pill pill--available">' + ICON.ok + 'Available</span>'
      : s === 'registered' || s === 'reserved' ? '<span class="pill pill--registered">' + ICON.no + 'Taken</span>'
      : '<span class="pill pill--unknown">Couldn’t check — try again</span>';
    if (s === 'available' && pr) act = '<div class="dmone__p">' + money(pr.total) + '<small>' + (pr.years > 1 ? pr.years + ' years · ' : '') + 'renews ' + money(pr.renewal) + '/yr</small></div><button class="btn btn--p" data-buy="' + esc(p.domain) + '">Buy</button>';
    else if (s !== 'registered' && s !== 'reserved') act = '<button class="btn btn--dark" data-retry-main="' + esc(p.domain) + '">Try again</button>';
    return '<div class="dmone" data-state="' + esc(s) + '"><div class="dmdom">' + domHtml(p.domain) + '</div>' + status + act + '</div>';
  }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function row(d) {
    var x = results[d] || {}, r = x.r, p = x.price, sp = split(d);
    var ready = r && r.state === 'available' && p;
    return '<li class="dmc' + (x.top ? ' dmc--top' : '') + (ready ? '' : ' is-wait') + '" data-d="' + esc(d) + '">' +
      '<span class="dmc__tag">' + esc(x.top ? 'Best match' : (x.tag || '')) + '</span>' +
      '<span class="dmc__d"><b>' + esc(sp.label) + '</b><em>.' + esc(sp.tld) + '</em></span>' +
      '<span class="dmc__p">' + (ready ? money(p.total) + '<small>' + (p.years > 1 ? p.years + ' years' : 'first year') + '</small>' : '<span class="dmsk"></span>') + '</span>' +
      '<span class="dmc__r">' + (ready ? 'Renews at ' + money(p.renewal) + '/yr' : '&nbsp;') + '</span>' +
      (ready ? '<button class="dmc__buy" data-buy="' + esc(d) + '">Buy' + ARROW + '</button>' : '<button class="dmc__buy" disabled>Buy' + ARROW + '</button>') + '</li>';
  }
  function check(list, retried) {
    return api('check', { domains: list, fresh: !!retried }).then(function (j) {
      var res = j.ok ? j.results : list.map(function (d) { return { domain: d, state: 'temporarily_unavailable' }; });
      var again = retried ? [] : res.filter(function (r) { return r.state === 'temporarily_unavailable'; }).map(function (r) { return r.domain; });
      res = res.filter(function (r) { return again.indexOf(r.domain) === -1; });
      res.forEach(function (r) {
        if (!results[r.domain]) return; results[r.domain].r = r;
        var li = $('#dmGroups li[data-d="' + CSS.escape(r.domain) + '"]'); if (!li) return;
        if (r.state === 'available') li.outerHTML = row(r.domain);
        else { li.classList.add('is-gone'); setTimeout(function () { li.remove(); tidy(); }, 300); }
      });
      (j.invalid || []).forEach(function (b) { var li = $('#dmGroups li[data-d="' + CSS.escape(b.domain) + '"]'); if (li) li.remove(); });
      if (again.length) return new Promise(function (ok) { setTimeout(ok, 1200); }).then(function () { return check(again, true); });
    });
  }
  function tidy() {
    var eg = $('#dmGroups .dmgrp[data-g="ext"]');
    if (eg && !$('.dmc--top', eg) && !noTop) {
      var first = $('li.dmc', eg);
      if (first && results[first.dataset.d] && results[first.dataset.d].r) { results[first.dataset.d].top = true; first.outerHTML = row(first.dataset.d); }
    }
    $$('#dmGroups .dmgrp').forEach(function (g) { if (!$('li', g)) g.remove(); });
    var none = !$('#dmGroups li') && !$('#dmMain .dmone[data-state="available"]');
    var pending = Object.keys(results).some(function (d) { return !results[d].r; });
    if (none && !pending && !$('#dmGroups .dmempty')) $('#dmGroups').insertAdjacentHTML('beforeend', '<div class="dmempty">Nothing available for this name right now — try a different name or spelling.</div>');
  }

  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-buy]'))) { openCheckout(b.dataset.buy); return; }
    if ((b = e.target.closest('[data-retry-main]'))) { b.disabled = true; api('check', { domains: [b.dataset.retryMain], fresh: true }).then(function (j) { if (j.ok && j.results[0]) { var r = j.results[0]; results[r.domain].r = r; $('#dmMain').innerHTML = one(Object.assign({}, r)); } else b.disabled = false; }); return; }
    if ((b = e.target.closest('[data-close]'))) b.closest('dialog').close();
  });

  /* ---------- checkout: 1) domain & term  2) details & M-Pesa ---------- */
  var co = $('#dmCo'), coB = $('#dmCoB'), coF = $('#dmCoF'), S = null, poll = null;
  function newIdem() { var a = new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function steps(n) { $$('.dmco__steps i', co).forEach(function (i, k) { i.classList.toggle('on', k < n); }); }
  function openCheckout(domain) {
    var t = tldMap[split(domain).tld]; if (!t) return;
    S = { domain: domain, t: t, years: t.periods[0], idem: newIdem(), customer: (S && S.customer) || {}, q: null, order: null };
    $('#dmCoT').textContent = domain;
    co.showModal(); stepOne();
  }
  function totals(q) {
    if (!q) return '';
    var h = '<div class="dmsum__r"><span>First year</span><b>' + money(q.firstYear) + '</b></div>';
    if (q.years > 1) h += '<div class="dmsum__r"><span>' + (q.years - 1) + ' more year' + (q.years > 2 ? 's' : '') + ' × ' + money(q.renewal) + '</span><b>' + money(q.renewal * (q.years - 1)) + '</b></div>';
    if (q.tax_rate > 0) h += '<div class="dmsum__r"><span>' + esc(q.tax_label) + ' ' + Math.round(q.tax_rate * 100) + '%' + (q.tax_included ? ' (included)' : '') + '</span><b>' + money(q.tax) + '</b></div>';
    h += '<div class="dmsum__r dmsum__t"><span>Total</span><b>' + money(q.total) + '</b></div><div class="dmsum__r"><span>Then renews at</span><b>' + money(q.renewal) + ' / year</b></div>';
    return h;
  }
  function stepOne() {
    steps(1);
    coB.innerHTML = '<div class="dmsum"><div class="dmdom">' + domHtml(S.domain) + '</div><div id="coAv"><span class="pill pill--loading">Checking…</span></div><div id="coTot"></div></div>' +
      '<div class="fld" style="margin-top:1.1rem"><label for="coYears">Registration term</label><select id="coYears">' + S.t.periods.map(function (n) { return '<option value="' + n + '"' + (n === S.years ? ' selected' : '') + '>' + n + ' year' + (n > 1 ? 's' : '') + '</option>'; }).join('') + '</select></div><div id="coMsg" style="margin-top:1rem"></div>';
    coF.innerHTML = '<button class="btn btn--ghost" data-close type="button">Cancel</button><button class="btn btn--p" id="coNext" type="button" disabled>Continue</button>';
    var load = function (recheck) {
      return api('quote', { domain: S.domain, years: S.years, recheck: recheck }).then(function (j) {
        if (!j.ok) { $('#coMsg').innerHTML = '<div class="dmmsg">' + esc(j.error) + '</div>'; return; }
        S.q = j.quote; $('#coTot').innerHTML = totals(j.quote);
        if (recheck) {
          var a = j.availability || {}, okay = a.state === 'available';
          $('#coAv').innerHTML = okay ? '<span class="pill pill--available">' + ICON.ok + 'Available</span>' : a.state === 'registered' || a.state === 'reserved' ? '<span class="pill pill--registered">' + ICON.no + 'Taken</span>' : '<span class="pill pill--unknown">Couldn’t check — try again</span>';
          if (!okay) $('#coMsg').innerHTML = '<div class="dmmsg">' + (a.state === 'registered' || a.state === 'reserved' ? 'Sorry — this name was just taken. Pick another option.' : 'We couldn’t check this name just now. Please try again in a moment.') + '</div>';
          S.ok = okay && j.ordering;
          if (okay && !j.ordering) $('#coMsg').innerHTML = '<div class="dmmsg dmmsg--info">Domain sales are paused for a moment. Please WhatsApp us on +254 706 549 703.</div>';
        }
        $('#coNext').disabled = !S.ok;
      });
    };
    load(true);
    $('#coYears').addEventListener('change', function () { S.years = Number(this.value); load(false); });
    $('#coNext').addEventListener('click', stepTwo);
  }
  function stepTwo() {
    steps(2);
    var c = S.customer;
    var f = function (id, label, type, val, extra) { return '<div class="fld"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" value="' + esc(val || '') + '" ' + (extra || '') + '></div>'; };
    coB.innerHTML = '<form id="coForm" novalidate>' +
      '<div class="dmsum"><div class="dmsum__r"><span>' + esc(S.domain) + ' · ' + S.years + ' yr' + (S.years > 1 ? 's' : '') + '</span><b>' + money(S.q.total) + '</b></div></div>' +
      f('coName', 'Full name', 'text', c.name, 'autocomplete="name" maxlength="80" required') +
      f('coOrg', 'Organisation <small>(optional)</small>', 'text', c.organisation, 'autocomplete="organization" maxlength="100"') +
      '<div class="fld2">' + f('coEmail', 'Email', 'email', c.email, 'autocomplete="email" maxlength="120" required') + f('coPhone', 'Phone', 'tel', c.phone, 'autocomplete="tel" inputmode="tel" maxlength="20" placeholder="0712 345 678" required') + '</div>' +
      f('coAddr', 'Postal or street address', 'text', c.address, 'autocomplete="street-address" maxlength="160" placeholder="P.O. Box 12345-00100" required') +
      '<div class="fld2">' + f('coCity', 'Town / city', 'text', c.city, 'autocomplete="address-level2" maxlength="60" required') + f('coCountry', 'Country', 'text', c.country || 'Kenya', 'autocomplete="country-name" maxlength="60" required') + '</div>' +
      '<div class="fld"><label>Payment method</label><div class="pms"><div class="pm pm--on">' + ICON.phone + 'M-Pesa</div><div class="pm pm--off" aria-disabled="true">' + ICON.card + 'Card</div></div></div>' +
      f('coMp', 'M-Pesa number', 'tel', c.mpesa || c.phone, 'inputmode="tel" maxlength="16" placeholder="0712 345 678" required') +
      '<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Website <input id="coWeb" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="chk"><input type="checkbox" id="coAgree"> <span>I agree to the <a href="/domains/terms" target="_blank" rel="noopener" style="text-decoration:underline">domain terms</a>.</span></label>' +
      '<div id="coErr"></div></form>';
    coF.innerHTML = '<button class="btn btn--ghost" type="button" id="coBack">Back</button><button class="btn btn--p" type="button" id="coPay">Pay ' + money(S.q.total) + '</button>';
    $('#coPhone').addEventListener('input', function () { var m = $('#coMp'); if (!m.dataset.touched) m.value = this.value; });
    $('#coMp').addEventListener('input', function () { this.dataset.touched = '1'; });
    $('#coBack').addEventListener('click', function () { save(); stepOne(); });
    $('#coPay').addEventListener('click', pay);
  }
  function save() { if (!$('#coName')) return; S.customer = { name: $('#coName').value.trim(), organisation: $('#coOrg').value.trim(), email: $('#coEmail').value.trim(), phone: $('#coPhone').value.trim(), address: $('#coAddr').value.trim(), city: $('#coCity').value.trim(), country: $('#coCountry').value.trim(), mpesa: $('#coMp').value.trim() }; }
  function bad(id, msg) { $$('#coForm input').forEach(function (i) { i.removeAttribute('aria-invalid'); }); if (id) { $('#' + id).setAttribute('aria-invalid', 'true'); $('#' + id).focus(); } $('#coErr').innerHTML = '<div class="dmmsg">' + msg + '</div>'; }
  function pay() {
    save(); var c = S.customer, btn = $('#coPay');
    if (c.name.length < 2) return bad('coName', 'Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c.email)) return bad('coEmail', 'Enter a valid email address.');
    if (!/^\+?\d{9,15}$/.test(c.phone.replace(/[\s()-]/g, ''))) return bad('coPhone', 'Enter a valid phone number.');
    if (c.address.length < 3) return bad('coAddr', 'Enter a postal or street address.');
    if (c.city.length < 2) return bad('coCity', 'Enter your town or city.');
    if (!/^(\+?254|0)?[17]\d{8}$/.test(c.mpesa.replace(/[\s-]/g, ''))) return bad('coMp', 'Enter a Safaricom number like 0712 345 678.');
    if (!$('#coAgree').checked) return bad(null, 'Please tick the box to accept the domain terms.');
    btn.disabled = true; btn.textContent = 'Starting payment…';
    var place = S.order ? Promise.resolve({ ok: true, reuse: true }) : api('order', { domain: S.domain, years: S.years, customer: c, agree: true, idemKey: S.idem, website: ($('#coWeb') || {}).value || '' });
    place.then(function (j) {
      if (!j.ok) { btn.disabled = false; btn.textContent = 'Pay ' + money(S.q.total); bad(null, esc(j.error || 'Something went wrong. Try again.')); return; }
      if (!j.reuse) S.order = j.token ? { token: j.token, ref: j.ref } : { ref: j.ref, k: new URLSearchParams((j.link || '').split('?')[1] || '').get('k'), link: j.link };
      startStk();
    });
  }
  function startStk() {
    var o = S.order, body = o.token ? { token: o.token, phone: S.customer.mpesa } : { ref: o.ref, k: o.k, method: 'mpesa', phone: S.customer.mpesa };
    waiting();
    api('pay', body).then(function (j) {
      if (!j.ok) { failed(j.error || 'M-Pesa didn’t accept the request.'); return; }
      if (j.paid) { success(); return; }
      if (j.crid) o.crid = j.crid, o.at = j.at;
      var until = Date.now() + 3 * 60000;
      clearInterval(poll);
      poll = setInterval(function () {
        if (Date.now() > until) { clearInterval(poll); failed('We didn’t get a confirmation from M-Pesa yet. If you entered your PIN, you’ll get an email shortly — otherwise try again.'); return; }
        var q = o.token ? api('status', { token: o.token, crid: o.crid, at: o.at }) : api('order?ref=' + encodeURIComponent(o.ref) + '&k=' + encodeURIComponent(o.k));
        q.then(function (r) {
          if (!r.ok) return;
          var st = o.token ? r.status : (r.order.payment.status === 'paid' ? 'paid' : r.order.payment.status === 'failed' && !r.order.payment.pending ? 'failed' : 'pending');
          if (st === 'paid') { clearInterval(poll); success(); }
          else if (st === 'failed') { clearInterval(poll); failed('The payment wasn’t completed.'); }
        });
      }, 4000);
    });
  }
  function waiting() {
    coB.innerHTML = '<div class="dmwait"><div class="dmwait__ph">' + ICON.phone + '</div><h3>Check your phone</h3><p>Enter your M-Pesa PIN to pay <b>' + money(S.q.total) + '</b> for <b>' + esc(S.domain) + '</b>.</p><p style="font-size:.86rem;color:var(--ink-faint)">Waiting for M-Pesa… keep this window open.</p></div>';
    coF.innerHTML = '<span></span><span></span>';
  }
  function failed(msg) {
    coB.innerHTML = '<div class="dmwait"><h3>Payment not completed</h3><p>' + esc(msg) + '</p></div>';
    coF.innerHTML = '<button class="btn btn--ghost" type="button" id="coEdit">Change number</button><button class="btn btn--p" type="button" id="coAgain">Try again</button>';
    $('#coAgain').addEventListener('click', startStk);
    $('#coEdit').addEventListener('click', function () { stepTwo(); $('#coAgree').checked = true; });
  }
  function success() {
    steps(2);
    coB.innerHTML = '<div class="dmwait"><div class="dmwait__ph" style="background:var(--ok)">' + ICON.ok + '</div><h3>Payment received</h3><p><b>' + esc(S.domain) + '</b> is being registered in your name. We’ve emailed your receipt and details to <b>' + esc(S.customer.email) + '</b>.</p><div><p style="font-size:.84rem;margin-bottom:.4rem">Your order reference</p><div class="dmref">' + esc(S.order.ref) + '</div></div>' + (S.order.link ? '<p style="font-size:.92rem"><a href="' + esc(S.order.link) + '" style="text-decoration:underline">View your order</a></p>' : '') + '</div>';
    coF.innerHTML = '<span></span><button class="btn btn--dark" data-close type="button">Done</button>';
    S.done = true;
  }
  co.addEventListener('close', function () { clearInterval(poll); if (S && S.done) { S = null; run(); } });
  co.addEventListener('click', function (e) { if (e.target === co && !(S && S.order && !S.done)) co.close(); });
})();
