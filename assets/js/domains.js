/* ============================================================
   CIEL DOMAINS — /domains page
   Search → primary result → grouped alternatives (each checked
   independently, in batches) → compare → checkout.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return n == null ? 'On request' : 'KES ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var API = '/api/domains/';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cfg = null, tldMap = {}, industry = null, lastQ = '', results = {}, compare = [];
  var form = $('#dmForm'), qIn = $('#dmQ'), extSel = $('#dmExt'), go = $('#dmGo'), err = $('#dmErr');

  function api(route, body, method) {
    return fetch(API + route, {
      method: method || (body ? 'POST' : 'GET'),
      headers: body ? { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' } : { 'X-Requested-With': 'ciel' },
      body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin'
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Unexpected response.' }; }).then(function (j) { j.__status = r.status; return j; });
    }).catch(function () { return { ok: false, __status: 0, error: 'You seem to be offline. Check your connection and try again.' }; });
  }
  function splitDomain(d) { var i = d.indexOf('.'); return { label: d.slice(0, i), tld: d.slice(i + 1) }; }
  function domHtml(d) { var p = splitDomain(d); return esc(p.label) + '<em>.' + esc(p.tld) + '</em>'; }
  function brandOf(label) {
    var words = (lastWords && lastWords.length > 1 && lastWords.join('') === label.replace(/-/g, '')) ? lastWords : label.split('-');
    return words.map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
  }
  var lastWords = null;

  /* ---------- status vocabulary (never shows unknown as available) ---------- */
  var ICON = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    no: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    q: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.1 2.2-2.1 3.7M12 17.5h.01"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>'
  };
  function pill(r) {
    if (!r) return '<span class="pill pill--loading" aria-label="Checking">Checking…</span>';
    switch (r.state) {
      case 'available': return r.needsConfirmation
        ? '<span class="pill pill--available">' + ICON.ok + 'Available</span><span class="pill pill--soft">We confirm before you pay</span>'
        : '<span class="pill pill--available">' + ICON.ok + 'Available</span>';
      case 'registered': return '<span class="pill pill--registered">' + ICON.no + 'Taken</span>';
      case 'reserved': return '<span class="pill pill--reserved">' + ICON.no + 'Reserved / restricted</span>';
      case 'premium': return '<span class="pill pill--confirm">Premium domain</span>';
      case 'unknown': return '<span class="pill pill--unknown">' + ICON.q + 'Availability needs confirmation</span>';
      default: return '<span class="pill pill--temporarily_unavailable">' + ICON.warn + 'Couldn’t check right now</span>';
    }
  }
  function pillShort(r) { // compact for list rows
    if (!r) return pill(null);
    if (r.state === 'available') return '<span class="pill pill--available">' + ICON.ok + 'Available</span>';
    if (r.state === 'unknown') return '<span class="pill pill--unknown">' + ICON.q + 'Needs confirmation</span>';
    if (r.state === 'temporarily_unavailable') return '<span class="pill pill--temporarily_unavailable">' + ICON.warn + 'Not checked</span>';
    return pill(r);
  }
  function sourceLine(r, t) {
    if (!r) return '';
    var when = 'Checked just now';
    if (r.cached && r.checkedAt) { var m = Math.round((Date.now() - Date.parse(r.checkedAt)) / 60000); if (m >= 1) when = 'Checked ' + m + ' min ago'; }
    var src = r.sourceName ? ' with ' + esc(r.sourceName) : '';
    var s = {
      available: 'No registration found. This is preliminary — it doesn’t reserve the name, and final availability is confirmed when we register it.',
      registered: 'Someone already owns this name' + (r.expires ? ' (registered until ' + esc(r.expires.slice(0, 10)) + ')' : '') + '. Try one of the alternatives below.',
      reserved: 'The registry has reserved or restricted this name.',
      unknown: t && t.method === 'dns' ? 'This extension has no public registry lookup. It has no live nameservers, but that doesn’t prove it’s free — we confirm it with the registry before you pay.' : 'We couldn’t confirm this one automatically — we’ll check it with the registry before you pay.',
      temporarily_unavailable: 'The registry didn’t answer in time. Nothing is wrong with the name — try again in a moment.'
    }[r.state] || '';
    if (r.state === 'available' && t && t.premiumRisk) s += ' Some names in this extension are premium-priced by the registry; we confirm the price before registering.';
    return when + src + '. ' + s;
  }
  function canOrder(r) { return r && (r.state === 'available' || r.state === 'unknown'); }
  function orderLabel(r, price) {
    var verify = !cfg.ordering || (r && r.state !== 'available') || (price && price.verifyBeforePayment);
    return verify ? 'Request this domain' : 'Register this domain';
  }

  /* ---------- config ---------- */
  api('config').then(function (c) {
    if (!c.ok) { $('#dmPrices').innerHTML = '<div class="dmpc"><span class="dmpc__r">Prices are unavailable right now. Please refresh in a moment.</span></div>'; return; }
    cfg = c; c.tlds.forEach(function (t) { tldMap[t.tld] = t; });
    // extension select
    extSel.innerHTML = '<option value="">Any ext.</option>' + c.tlds.map(function (t) { return '<option value="' + esc(t.tld) + '">.' + esc(t.tld) + '</option>'; }).join('');
    // popular chips
    var pop = ['co.ke', 'com', 'africa', 'ke', 'org', 'dev', 'online'].filter(function (t) { return tldMap[t]; });
    $('#dmChips').innerHTML = pop.map(function (t) { return '<button type="button" data-ext="' + t + '" aria-pressed="false">.' + t + ' <small>' + (tldMap[t].register != null ? money(tldMap[t].register) : 'on request') + '</small></button>'; }).join('');
    // industries
    var ind = $('#dmInd');
    Object.keys(c.industries || {}).forEach(function (k) { var b = document.createElement('button'); b.type = 'button'; b.dataset.ind = k; b.textContent = c.industries[k]; b.setAttribute('aria-pressed', 'false'); ind.appendChild(b); });
    renderPrices('core');
    renderTax();
    // deep link ?q=
    var u = new URLSearchParams(location.search);
    if (u.get('ext') && tldMap[u.get('ext')]) { extSel.value = u.get('ext'); syncChips(); }
    if (u.get('for') && c.industries[u.get('for')]) industry = u.get('for');
    if (u.get('q')) { qIn.value = u.get('q').slice(0, 200); run(); }
  });

  /* ---------- pricing table ---------- */
  function renderPrices(cat) {
    var cats = cfg.categories || {};
    $('#dmTabs').innerHTML = Object.keys(cats).map(function (k) { return '<button type="button" role="tab" data-cat="' + k + '" aria-selected="' + (k === cat) + '">' + esc(cats[k]) + '</button>'; }).join('');
    $('#dmPrices').innerHTML = cfg.tlds.filter(function (t) { return t.category === cat; }).map(function (t) {
      var how = t.method === 'rdap' ? ICON.ok + 'Live registry check' : ICON.q + 'Checked by our team';
      return '<div class="dmpc"><span class="dmpc__t">.' + esc(t.tld) + '</span>' +
        '<span class="dmpc__p">' + (t.register != null ? money(t.register) + ' <small>first year</small>' : 'Price on request') + '</span>' +
        '<span class="dmpc__r">' + (t.renew != null ? 'Renews at ' + money(t.renew) + '/yr' : 'We confirm the price before you pay') + '</span>' +
        (t.note ? '<span class="dmpc__n">' + esc(t.note) + '</span>' : '') +
        '<span class="dmpc__m">' + how + (t.verifyBeforePayment ? ' · confirmed before you pay' : '') + '</span></div>';
    }).join('');
  }
  function renderTax() {
    var t = cfg.tax || {};
    $('#dmTax').textContent = 'Prices in Kenyan shillings (KES). ' + (t.rate > 0 ? (t.included ? 'Prices include ' : 'Plus ') + Math.round(t.rate * 100) + '% ' + t.label + '. ' : '') + 'No other fees at checkout. Renewals are billed separately at the renewal price.';
  }
  $('#dmTabs').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (b) renderPrices(b.dataset.cat); });

  /* ---------- try-on preview ---------- */
  var tryEl = $('#dmTry'), demo = ['zurihomes.co.ke', 'kilele.africa', 'brightstudio.com', 'mamamboga.shop'], demoI = 0, demoT = null, userTyped = false;
  function paint(domain, brand) {
    $$('[data-t="domain"]', tryEl).forEach(function (e) { e.textContent = domain; });
    $$('[data-t="brand"]', tryEl).forEach(function (e) { e.textContent = brand; });
    $$('[data-t="initial"]', tryEl).forEach(function (e) { e.textContent = brand.charAt(0) || 'C'; });
  }
  function tryOn(domain, brand, animate) {
    if (!animate || RM) { paint(domain, brand); return; }
    tryEl.classList.add('is-swap');
    setTimeout(function () { paint(domain, brand); tryEl.classList.remove('is-swap'); }, 300);
  }
  function demoTick() {
    if (userTyped) return;
    demoI = (demoI + 1) % demo.length; var d = demo[demoI], p = splitDomain(d);
    var brand = { zurihomes: 'Zuri Homes', kilele: 'Kilele', brightstudio: 'Bright Studio', mamamboga: 'Mama Mboga' }[p.label] || p.label;
    tryOn(d, brand, true);
  }
  if (!RM) demoT = setInterval(demoTick, 3800);
  qIn.addEventListener('input', function () {
    var v = qIn.value.trim().toLowerCase();
    if (!v) { userTyped = false; return; }
    userTyped = true; if (demoT) { clearInterval(demoT); demoT = null; }
    var raw = v.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
    var hasDot = raw.indexOf('.') > 0;
    var label = (hasDot ? raw.split('.')[0] : raw).replace(/[^a-z0-9\s-]/g, '');
    var words = label.split(/[\s-]+/).filter(Boolean);
    var flat = words.join('');
    if (!flat) return;
    var tld = hasDot ? raw.slice(raw.indexOf('.') + 1) : (extSel.value || 'co.ke');
    lastWords = words.length > 1 ? words : null;
    paint(flat.slice(0, 40) + '.' + tld, words.map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ').slice(0, 40));
  });

  /* ---------- extension chips ---------- */
  function syncChips() { $$('#dmChips [data-ext]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ext === extSel.value)); }); }
  $('#dmChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ext]'); if (!b) return;
    extSel.value = extSel.value === b.dataset.ext ? '' : b.dataset.ext; syncChips();
    qIn.dispatchEvent(new Event('input'));
    if (qIn.value.trim()) run(); else qIn.focus();
  });
  extSel.addEventListener('change', function () { syncChips(); qIn.dispatchEvent(new Event('input')); });

  /* ---------- search ---------- */
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  function buildQuery() {
    var v = qIn.value.trim();
    if (!v) return '';
    var ext = extSel.value;
    var bare = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0];
    if (ext && bare.indexOf('.') === -1) return bare + '.' + ext;
    return v;
  }
  function run() {
    if (!cfg) { err.textContent = 'Still loading — try again in a second.'; return; }
    var q = buildQuery();
    err.textContent = '';
    if (!q) { err.textContent = 'Type a name or a domain to search.'; qIn.focus(); return; }
    lastQ = q;
    go.disabled = true; go.querySelector('span').textContent = 'Searching…';
    var params = new URLSearchParams(); params.set('q', qIn.value.trim()); if (extSel.value) params.set('ext', extSel.value); if (industry) params.set('for', industry);
    try { history.replaceState(null, '', location.pathname + '?' + params.toString()); } catch (e) { /* ignore */ }
    api('search', { q: q, industry: industry }).then(function (r) {
      go.disabled = false; go.querySelector('span').textContent = 'Search';
      if (!r.ok) { err.textContent = r.error || 'Search failed. Try again.'; return; }
      lastWords = r.query.words;
      renderResults(r);
    });
  }

  function renderResults(r) {
    var sec = $('#results'); sec.hidden = false;
    results = {}; results[r.primary.domain] = { r: r.primary, price: r.primary.price };
    $('#dmRTitle').innerHTML = 'Results for <span style="color:var(--orange)">' + esc(r.query.name) + '</span>';
    $('#dmRMeta').textContent = industry ? 'Tuned for ' + (cfg.industries[industry] || '').toLowerCase() : '';
    $('#dmNotes').innerHTML = (r.notes || []).map(function (n) { return '<p>' + esc(n) + '</p>'; }).join('');
    renderMain(r.primary);
    $$('#dmInd [data-ind]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ind === industry)); });
    $('#dmInd').style.display = r.blocked ? 'none' : '';
    var all = [];
    $('#dmGroups').innerHTML = r.groups.map(function (g) {
      return '<div class="dmgrp" data-g="' + esc(g.id) + '"><h3><span class="brk">‹</span>' + esc(g.title) + '</h3><ul class="dml">' + g.items.map(function (it) {
        all.push(it.domain); results[it.domain] = { r: null, price: it.price, why: it.why };
        return row(it.domain);
      }).join('') + '</ul></div>';
    }).join('');
    tryOn(r.primary.domain, brandOf(splitDomain(r.primary.domain).label), true);
    var top = sec.getBoundingClientRect().top + scrollY - 90;
    if (Math.abs(scrollY - top) > 40) scrollTo({ top: top, behavior: RM ? 'auto' : 'smooth' });
    // check alternatives independently, in batches
    var batches = []; for (var i = 0; i < all.length; i += 8) batches.push(all.slice(i, i + 8));
    batches.reduce(function (p, b) { return p.then(function () { return checkBatch(b); }); }, Promise.resolve()).then(sortGroups);
  }

  function renderMain(r) {
    var t = tldMap[r.tld], price = (results[r.domain] || {}).price;
    var years = price ? price.years : 1;
    var act = '';
    if (canOrder(r)) act = '<button class="btn btn--p" data-buy="' + esc(r.domain) + '">' + orderLabel(r, price) + '</button>';
    if (r.state === 'temporarily_unavailable') act = '<button class="btn btn--dark" data-retry-main="' + esc(r.domain) + '">Check again</button>';
    if (r.state === 'registered' || r.state === 'reserved') act = '<a class="btn btn--dark" href="#dmGroups" data-jump>See alternatives</a>';
    act += '<button class="btn btn--ghost" data-cmp-main="' + esc(r.domain) + '"' + (canOrder(r) ? '' : ' disabled') + '>Compare</button>';
    $('#dmMain').innerHTML = '<div class="dmmain" data-state="' + esc(r.state) + '">' +
      '<div><div class="dmdom">' + domHtml(r.domain) + '</div><div class="dmmain__st">' + pill(r) + '</div><p class="dmsrc">' + sourceLine(r, t) + '</p></div>' +
      '<div class="dmmain__buy">' + (price && (r.state === 'available' || r.state === 'unknown') ? '<div class="dmprice">' + money(price.firstYear) + (years > 1 ? ' <small>first year · ' + years + '-year minimum</small>' : ' <small>first year</small>') + '<small>' + (price.renewal != null ? 'Renews at ' + money(price.renewal) + '/yr' : 'Price confirmed before you pay') + '</small></div>' : '') +
      '<div class="dmmain__act">' + act + '</div></div></div>';
  }

  function row(d) {
    var x = results[d] || {}, r = x.r, p = x.price;
    var taken = r && (r.state === 'registered' || r.state === 'reserved');
    var a = '';
    if (!r) a = '<button class="btn btn--ghost" disabled>…</button>';
    else if (canOrder(r)) a = '<button class="btn btn--dark" data-buy="' + esc(d) + '">' + (orderLabel(r, p) === 'Register this domain' ? 'Register' : 'Request') + '</button>';
    else if (r.state === 'temporarily_unavailable') a = '<button class="dmretry" data-retry="' + esc(d) + '">Try again</button>';
    var inCmp = compare.indexOf(d) > -1;
    var cmp = '<button class="dmcmp" data-cmp="' + esc(d) + '" aria-pressed="' + inCmp + '" aria-label="Compare ' + esc(d) + '"' + (r && canOrder(r) ? '' : ' disabled') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/></svg></button>';
    return '<li data-d="' + esc(d) + '"' + (taken ? ' class="is-taken"' : '') + '>' +
      '<span class="dml__d">' + domHtml(d) + '</span>' +
      '<span class="dml__why">' + esc(x.why || '') + '</span>' +
      '<span class="dml__s">' + pillShort(r) + '</span>' +
      '<span class="dml__p">' + (taken ? '' : (p ? money(p.firstYear) + '<small>' + (p.renewal != null ? 'renews ' + money(p.renewal) : 'confirmed before payment') + '</small>' : '')) + '</span>' +
      '<span class="dml__a">' + (taken ? '' : cmp) + a + '</span></li>';
  }
  function updateRow(d) { var li = $('#dmGroups li[data-d="' + CSS.escape(d) + '"]'); if (li) li.outerHTML = row(d); }

  function checkBatch(list, fresh) {
    return api('check', { domains: list, fresh: !!fresh }).then(function (j) {
      if (!j.ok) { list.forEach(function (d) { results[d].r = { domain: d, state: 'temporarily_unavailable' }; updateRow(d); }); return; }
      j.results.forEach(function (r) { if (results[r.domain]) { results[r.domain].r = r; updateRow(r.domain); } });
      (j.invalid || []).forEach(function (b) { var li = $('#dmGroups li[data-d="' + CSS.escape(b.domain) + '"]'); if (li) li.remove(); });
    });
  }
  function sortGroups() { // verified-available first, then needs-confirmation, then taken
    var rank = { available: 0, unknown: 1, temporarily_unavailable: 2, premium: 1, reserved: 3, registered: 3 };
    $$('#dmGroups .dml').forEach(function (ul) {
      var lis = $$('li', ul);
      lis.sort(function (a, b) { var ra = (results[a.dataset.d] || {}).r, rb = (results[b.dataset.d] || {}).r; return (rank[ra && ra.state] || 2) - (rank[rb && rb.state] || 2); });
      lis.forEach(function (li) { ul.appendChild(li); });
    });
  }

  /* ---------- result actions ---------- */
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-buy]'))) { openCheckout(b.dataset.buy); return; }
    if ((b = e.target.closest('[data-retry]'))) { var d = b.dataset.retry; results[d].r = null; updateRow(d); checkBatch([d], true); return; }
    if ((b = e.target.closest('[data-retry-main]'))) { b.disabled = true; api('check', { domains: [b.dataset.retryMain], fresh: true }).then(function (j) { if (j.ok && j.results[0]) { results[j.results[0].domain].r = j.results[0]; renderMain(j.results[0]); } else b.disabled = false; }); return; }
    if ((b = e.target.closest('[data-cmp]'))) { toggleCompare(b.dataset.cmp); return; }
    if ((b = e.target.closest('[data-cmp-main]'))) { toggleCompare(b.dataset.cmpMain); return; }
    if ((b = e.target.closest('[data-jump]'))) { e.preventDefault(); var g = $('#dmGroups'); scrollTo({ top: g.getBoundingClientRect().top + scrollY - 100, behavior: RM ? 'auto' : 'smooth' }); return; }
    if ((b = e.target.closest('#dmInd [data-ind]'))) { industry = industry === b.dataset.ind ? null : b.dataset.ind; run(); return; }
    if ((b = e.target.closest('[data-close]'))) { b.closest('dialog').close(); }
  });

  /* ---------- compare ---------- */
  var tray = $('#dmTray');
  function toggleCompare(d) {
    var i = compare.indexOf(d);
    if (i > -1) compare.splice(i, 1);
    else { if (compare.length >= 3) compare.shift(); compare.push(d); }
    $$('[data-cmp]').forEach(function (b) { b.setAttribute('aria-pressed', String(compare.indexOf(b.dataset.cmp) > -1)); });
    var m = $('[data-cmp-main]'); if (m) m.textContent = compare.indexOf(m.dataset.cmpMain) > -1 ? 'Added to compare' : 'Compare';
    $('#dmTrayL').innerHTML = compare.length ? '<b>' + compare.length + '</b> to compare · ' + compare.map(esc).join(', ') : '';
    tray.classList.toggle('on', compare.length > 0);
  }
  $('#dmTrayX').addEventListener('click', function () { compare.slice().forEach(toggleCompare); });
  $('#dmTrayGo').addEventListener('click', function () {
    var kind = function (t) { return t === 'co.ke' || t === 'ke' ? 'Kenyan' : t === 'africa' ? 'Pan-African' : ['dev', 'app', 'tech', 'io', 'ai', 'cloud', 'software', 'digital'].indexOf(t) > -1 ? 'Tech' : 'Global'; };
    $('#dmCmpB').style.gridTemplateColumns = 'repeat(' + compare.length + ',minmax(0,1fr))';
    $('#dmCmpB').innerHTML = compare.map(function (d) {
      var x = results[d] || {}, p = x.price || {}, t = tldMap[splitDomain(d).tld] || {}, lab = splitDomain(d).label;
      var three = p.firstYear != null && p.renewal != null ? p.firstYear + p.renewal * 2 : null;
      var say = lab.indexOf('-') > -1 ? 'Has a hyphen — harder to say aloud' : /\d/.test(lab) ? 'Has numbers — spell it out when sharing' : lab.length > 15 ? 'Long — fine in writing, slower to say' : 'Short and easy to say';
      return '<div class="dmcmpt__col"><div class="dmdom">' + domHtml(d) + '</div><div>' + pillShort(x.r) + '</div><dl>' +
        '<div><dt>First year</dt><dd>' + money(p.firstYear) + '</dd></div>' +
        '<div><dt>Renews at</dt><dd>' + (p.renewal != null ? money(p.renewal) + ' / yr' : 'Confirmed before you pay') + '</dd></div>' +
        '<div><dt>3 years in total</dt><dd>' + (three != null ? money(three) : '—') + '</dd></div>' +
        '<div><dt>Length</dt><dd>' + lab.length + ' characters</dd></div>' +
        '<div><dt>Say it out loud</dt><dd>' + say + '</dd></div>' +
        '<div><dt>Signals</dt><dd>' + kind(t.tld) + ' extension</dd></div>' +
        '<div><dt>Checked by</dt><dd>' + esc((x.r && x.r.sourceName) || t.source || '—') + '</dd></div></dl>' +
        (canOrder(x.r) ? '<button class="btn btn--p" data-buy="' + esc(d) + '">' + orderLabel(x.r, p) + '</button>' : '') + '</div>';
    }).join('');
    $('#dmCmp').showModal();
  });

  /* ---------- checkout ---------- */
  var co = $('#dmCo'), coB = $('#dmCoB'), coF = $('#dmCoF'), coState = null;
  function newIdem() { var a = new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function steps(n) { $$('.dmco__steps i', co).forEach(function (i, k) { i.classList.toggle('on', k < n); }); }
  function openCheckout(domain) {
    if ($('#dmCmp').open) $('#dmCmp').close();
    var t = tldMap[splitDomain(domain).tld];
    if (!t) return;
    coState = { domain: domain, t: t, years: t.periods[0], idem: newIdem(), customer: coState && coState.customer || {}, fresh: null, q: null };
    $('#dmCoT').textContent = 'Register ' + domain;
    co.showModal(); stepOne();
  }
  function totalsHtml(q) {
    if (!q) return '';
    var rows = '<div class="dmsum__r"><span>First year</span><b>' + money(q.firstYear) + '</b></div>';
    if (q.years > 1) rows += '<div class="dmsum__r"><span>' + (q.years - 1) + ' more year' + (q.years > 2 ? 's' : '') + ' × ' + money(q.renewal) + '</span><b>' + money(q.renewal == null ? null : q.renewal * (q.years - 1)) + '</b></div>';
    if (q.tax_rate > 0) rows += '<div class="dmsum__r"><span>' + esc(q.tax_label) + ' ' + Math.round(q.tax_rate * 100) + '%' + (q.tax_included ? ' (included)' : '') + '</span><b>' + money(q.tax) + '</b></div>';
    rows += '<div class="dmsum__r dmsum__t"><span>Total today' + (q.priced ? '' : ' (to be confirmed)') + '</span><b>' + money(q.total) + '</b></div>';
    rows += '<div class="dmsum__r"><span>Then renews at</span><b>' + (q.renewal != null ? money(q.renewal) + ' / year' : 'Confirmed later') + '</b></div>';
    return rows;
  }
  function modeNote() {
    var s = coState, verify = !cfg.ordering || (s.q && s.q.verifyBeforePayment) || (s.fresh && s.fresh.state !== 'available');
    s.verify = verify;
    if (!cfg.ordering) return '<div class="dmmsg dmmsg--info">We’re opening online payments soon. Send your request now — we’ll confirm the name and price with the registry, then contact you to pay. Nothing is charged today.</div>';
    if (verify) return '<div class="dmmsg dmmsg--info">We confirm this name and its price with the registry <b>before you pay</b>. You’ll get a payment link by email — nothing is charged today.</div>';
    return '<div class="dmmsg dmmsg--ok">You’ll pay on the next screen with ' + (cfg.payments.card ? 'M-Pesa or card' : 'M-Pesa') + '. We register it as soon as payment is confirmed.</div>';
  }
  function stepOne() {
    steps(1);
    var s = coState, t = s.t;
    coB.innerHTML = '<div class="dmsum"><div class="dmdom">' + domHtml(s.domain) + '</div><div id="coAvail"><span class="pill pill--loading">Checking…</span></div><div id="coTot"></div></div>' +
      '<div class="fld" style="margin-top:1.1rem"><label for="coYears">Registration term</label><select id="coYears">' + t.periods.map(function (n) { return '<option value="' + n + '"' + (n === s.years ? ' selected' : '') + '>' + n + ' year' + (n > 1 ? 's' : '') + '</option>'; }).join('') + '</select></div>' +
      '<div id="coMode" style="margin-top:1.1rem"></div>';
    coF.innerHTML = '<button class="btn btn--ghost" data-close type="button">Cancel</button><button class="btn btn--p" id="coNext1" type="button" disabled>Continue</button>';
    var load = function (recheck) {
      return api('quote', { domain: s.domain, years: s.years, recheck: recheck }).then(function (j) {
        if (!j.ok) { $('#coTot').innerHTML = '<div class="dmmsg">' + esc(j.error) + '</div>'; return; }
        s.q = j.quote; if (j.availability) s.fresh = j.availability;
        cfg.ordering = j.ordering; cfg.payments = j.payments;
        $('#coTot').innerHTML = totalsHtml(j.quote);
        if (s.fresh) $('#coAvail').innerHTML = pill(s.fresh) + '<p class="dmsrc">' + sourceLine(s.fresh, t) + '</p>';
        var blocked = s.fresh && (s.fresh.state === 'registered' || s.fresh.state === 'reserved');
        $('#coMode').innerHTML = blocked ? '<div class="dmmsg">We just checked again and this name is no longer available. Pick one of the alternatives.</div>' : modeNote();
        var nx = $('#coNext1'); nx.disabled = !!blocked || (s.fresh && s.fresh.state === 'temporarily_unavailable' && false);
        if (s.fresh && s.fresh.state === 'temporarily_unavailable') $('#coMode').insertAdjacentHTML('afterbegin', '<div class="dmmsg" style="margin-bottom:.6rem">The registry didn’t answer just now, so this will be sent as a request and confirmed by our team before payment.</div>');
        if (results[s.domain] && s.fresh) { results[s.domain].r = s.fresh; updateRow(s.domain); }
      });
    };
    load(true);
    $('#coYears').addEventListener('change', function () { s.years = Number(this.value); load(false); });
    $('#coNext1').addEventListener('click', stepTwo);
  }
  function stepTwo() {
    steps(2);
    var c = coState.customer;
    var f = function (id, label, type, val, extra) { return '<div class="fld"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" value="' + esc(val || '') + '" ' + (extra || '') + '></div>'; };
    coB.innerHTML = '<form id="coForm" novalidate><p style="font-size:.92rem">The domain is registered in these details — use the person or organisation that should own it.</p>' +
      f('coName', 'Registrant full name', 'text', c.name, 'autocomplete="name" maxlength="80" required') +
      f('coOrg', 'Organisation <small>(optional)</small>', 'text', c.organisation, 'autocomplete="organization" maxlength="100"') +
      '<div class="fld2">' + f('coEmail', 'Email', 'email', c.email, 'autocomplete="email" maxlength="120" required') + f('coPhone', 'Phone', 'tel', c.phone, 'autocomplete="tel" inputmode="tel" maxlength="20" placeholder="0712 345 678" required') + '</div>' +
      f('coAddr', 'Postal or street address', 'text', c.address, 'autocomplete="street-address" maxlength="160" placeholder="P.O. Box 12345-00100 or street" required') +
      '<div class="fld2">' + f('coCity', 'Town / city', 'text', c.city, 'autocomplete="address-level2" maxlength="60" required') + f('coCountry', 'Country', 'text', c.country || 'Kenya', 'autocomplete="country-name" maxlength="60" required') + '</div>' +
      '<div class="fld"><label for="coNotes">Anything we should know? <small>(optional)</small></label><textarea id="coNotes" rows="2" maxlength="400">' + esc(c.notes || '') + '</textarea></div>' +
      '<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Website <input id="coWeb" tabindex="-1" autocomplete="off"></label></div>' +
      '<div id="coErr2"></div></form>';
    coF.innerHTML = '<button class="btn btn--ghost" type="button" id="coBack2">Back</button><button class="btn btn--p" type="button" id="coNext2">Review</button>';
    $('#coBack2').addEventListener('click', function () { save(); stepOne(); });
    var save = function () { coState.customer = { name: $('#coName').value.trim(), organisation: $('#coOrg').value.trim(), email: $('#coEmail').value.trim(), phone: $('#coPhone').value.trim(), address: $('#coAddr').value.trim(), city: $('#coCity').value.trim(), country: $('#coCountry').value.trim(), notes: $('#coNotes').value.trim() }; };
    $('#coNext2').addEventListener('click', function () {
      save(); var c2 = coState.customer, bad = null;
      $$('#coForm input').forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (c2.name.length < 2) bad = ['coName', 'Enter the registrant’s full name.'];
      else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c2.email)) bad = ['coEmail', 'Enter a valid email address.'];
      else if (!/^\+?\d{9,15}$/.test(c2.phone.replace(/[\s()-]/g, ''))) bad = ['coPhone', 'Enter a valid phone number.'];
      else if (c2.address.length < 3) bad = ['coAddr', 'The registry needs a postal or street address.'];
      else if (c2.city.length < 2) bad = ['coCity', 'Enter your town or city.'];
      if (bad) { $('#' + bad[0]).setAttribute('aria-invalid', 'true'); $('#' + bad[0]).focus(); $('#coErr2').innerHTML = '<div class="dmmsg">' + bad[1] + '</div>'; return; }
      stepThree();
    });
  }
  function stepThree() {
    steps(3);
    var s = coState, c = s.customer;
    coB.innerHTML = '<div class="dmsum"><div class="dmdom">' + domHtml(s.domain) + '</div><div class="dmsum__r"><span>Term</span><b>' + s.years + ' year' + (s.years > 1 ? 's' : '') + '</b></div>' + totalsHtml(s.q) +
      '<div class="dmsum__r"><span>Registrant</span><b>' + esc(c.name) + (c.organisation ? ' · ' + esc(c.organisation) : '') + '</b></div><div class="dmsum__r"><span>Contact</span><b>' + esc(c.email) + '<br>' + esc(c.phone) + '</b></div></div>' +
      '<div style="margin-top:1rem">' + modeNote() + '</div>' +
      '<div class="terms-box" style="margin-top:1rem"><b style="color:var(--ink)">Before you ' + (s.verify ? 'send this' : 'pay') + '</b><ul>' +
      '<li>Search results are preliminary and don’t reserve the domain.</li><li>' + (s.verify ? 'We confirm availability and price with the registry, then send you a payment link.' : 'Payment is collected before we register the domain by hand.') + '</li>' +
      '<li>If it can’t be registered, you’re eligible for a full refund of what you paid for it — or an alternative at the same price, only if you agree.</li>' +
      '<li>Refund times depend on the payment provider. Renewals are separate.</li></ul>' +
      '<label class="chk"><input type="checkbox" id="coAgree"> <span>I agree to the <a href="/domains/terms" target="_blank" rel="noopener" style="text-decoration:underline">registration and refund terms</a>.</span></label></div><div id="coErr3" style="margin-top:.8rem"></div>';
    coF.innerHTML = '<button class="btn btn--ghost" type="button" id="coBack3">Back</button><button class="btn btn--p" type="button" id="coPlace">' + (s.verify ? 'Send request' : 'Continue to payment') + '</button>';
    $('#coBack3').addEventListener('click', stepTwo);
    $('#coPlace').addEventListener('click', place);
  }
  function place() {
    var s = coState, btn = $('#coPlace');
    if (!$('#coAgree').checked) { $('#coErr3').innerHTML = '<div class="dmmsg">Please tick the box to accept the terms.</div>'; return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    api('order', { domain: s.domain, years: s.years, customer: s.customer, agree: true, idemKey: s.idem, website: ($('#coWeb') || {}).value || '' }).then(function (j) {
      if (!j.ok) { btn.disabled = false; btn.textContent = s.verify ? 'Send request' : 'Continue to payment'; $('#coErr3').innerHTML = '<div class="dmmsg">' + esc(j.error || 'Something went wrong. Try again.') + '</div>'; if (j.code === 'taken' && results[s.domain]) { results[s.domain].r = { domain: s.domain, state: 'registered' }; updateRow(s.domain); } return; }
      if (j.status === 'pending_payment' && j.link) { location.href = j.link; return; }
      done(j);
    });
  }
  function done(j) {
    var s = coState;
    coB.innerHTML = '<div class="dmdone"><h3>' + (j.requestOnly ? 'Request sent.' : 'Request received.') + '</h3><p>We’ll confirm <b>' + esc(s.domain) + '</b> with the registry and email <b>' + esc(s.customer.email) + '</b> with ' + (j.requestOnly ? 'the next steps' : 'a payment link') + ' — usually within one working day. Nothing has been charged.</p>' +
      '<div><p style="font-size:.84rem;margin-bottom:.4rem">Your reference — quote it when you contact us</p><div class="dmref">' + esc(j.ref) + '</div></div>' +
      (j.link ? '<p style="font-size:.92rem">Your order page (also in your email): <a href="' + esc(j.link) + '" style="text-decoration:underline">track this order</a>.</p>' : '') + '</div>';
    coF.innerHTML = '<span></span><button class="btn btn--dark" data-close type="button">Done</button>';
    steps(3);
  }
  co.addEventListener('close', function () { /* keep details for convenience */ });
  [co, $('#dmCmp')].forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); });
})();
