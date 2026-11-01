/* ============================================================
   CIEL ADMIN — Analytics. Every number comes from real records:
   orders and payments (server-confirmed M-Pesa), leads, projects,
   and website traffic from Vercel Web Analytics. Each card says
   where its numbers come from. Nothing is estimated or invented.
   ============================================================ */
(function () {
  var H, A = { per: '30', cmp: true };
  var esc = function (s) { return H.esc(s); };
  var KN = { photobook: ['Photo Books', '#ff5a1f'], shop: ['Shop', '#2563eb'], domain: ['Domains', '#7c3aed'], whatsapp: ['WhatsApp', '#16a34a'] };
  function range() {
    var now = Date.now(), d = new Date();
    if (A.per === 'year') { var s = new Date(d.getFullYear(), 0, 1).getTime(); return { from: s, to: now, pfrom: new Date(d.getFullYear() - 1, 0, 1).getTime(), pto: new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()).getTime(), unit: 'month', days: Math.ceil((now - s) / 864e5) }; }
    var n = +A.per, len = n * 864e5; return { from: now - len, to: now, pfrom: now - 2 * len, pto: now - len, unit: n > 90 ? 'month' : n > 31 ? 'week' : 'day', days: n };
  }
  var real = function (o) { return !o.test; };
  var isPaid = function (o) { return o.paid && !/cancel|refund/.test(o.status); };
  function inR(t, a, b) { return t >= a && t < b; }
  function pct(a, b) { if (!b) return a ? '<em class="up">new</em>' : '<em>—</em>'; var p = Math.round((a - b) / b * 100); return '<em class="' + (p >= 0 ? 'up' : 'down') + '">' + (p >= 0 ? '↑ ' : '↓ ') + Math.abs(p) + '%</em>'; }
  function bucket(t, unit) { var d = new Date(t); if (unit === 'month') return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); if (unit === 'week') { var x = new Date(d); x.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); } return d.toISOString().slice(0, 10); }
  function buckets(r) { var out = [], t = r.from, seen = {}; while (t <= r.to) { var k = bucket(t, r.unit); if (!seen[k]) { seen[k] = 1; out.push(k); } t += r.unit === 'month' ? 15 * 864e5 : 864e5; } var k2 = bucket(r.to, r.unit); if (!seen[k2]) out.push(k2); return out; }
  function lab(k, unit) { var d = new Date(k.length === 7 ? k + '-01T12:00' : k + 'T12:00'); return unit === 'month' ? d.toLocaleDateString('en-KE', { month: 'short' }) : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }); }
  /* bar chart (current) with an outline of the previous period */
  function barChart(keys, cur, prev, unit, fmt) {
    var W = 640, Hh = 190, n = keys.length, mx = Math.max(1, Math.max.apply(null, cur.concat(prev || []))), bw = W / n;
    var bars = keys.map(function (k, i) { var h = cur[i] / mx * (Hh - 24), ph = prev ? prev[i] / mx * (Hh - 24) : 0; return (prev ? '<rect x="' + (i * bw + bw * .14) + '" y="' + (Hh - 18 - ph) + '" width="' + bw * .72 + '" height="' + Math.max(0, ph) + '" rx="3" fill="none" stroke="var(--faint)" stroke-dasharray="2 2" opacity=".6"/>' : '') + '<rect x="' + (i * bw + bw * .2) + '" y="' + (Hh - 18 - h) + '" width="' + bw * .6 + '" height="' + Math.max(cur[i] ? 2 : 0, h) + '" rx="3" fill="var(--o)"><title>' + lab(k, unit) + ': ' + fmt(cur[i]) + (prev ? ' (before: ' + fmt(prev[i]) + ')' : '') + '</title></rect>'; }).join('');
    var step = Math.ceil(n / 6), ticks = keys.map(function (k, i) { return i % step ? '' : '<span style="left:' + ((i + .5) / n * 100) + '%">' + lab(k, unit) + '</span>'; }).join('');
    return '<div class="an-cw"><svg class="an-chart" viewBox="0 0 ' + W + ' ' + Hh + '" preserveAspectRatio="none"><line x1="0" x2="' + W + '" y1="' + (Hh - 18) + '" y2="' + (Hh - 18) + '" stroke="var(--line)" vector-effect="non-scaling-stroke"/>' + bars + '</svg><div class="an-ticks">' + ticks + '</div></div>';
  }
  function hbars(rows, fmt, color) {
    var mx = Math.max.apply(null, [1].concat(rows.map(function (r) { return r[1]; })));
    return rows.length ? '<div class="an-hb">' + rows.map(function (r) { return '<div><div class="an-hb__l"><span>' + esc(r[0]) + '</span><b>' + fmt(r[1]) + '</b></div><div class="an-hb__t"><i style="width:' + Math.max(2, r[1] / mx * 100) + '%;background:' + (r[2] || color || 'var(--o)') + '"></i></div></div>'; }).join('') + '</div>' : '<p class="muted an-none">No data in this period.</p>';
  }
  function funnel(steps) { var top = steps[0][1] || 0; return '<div class="an-fn">' + steps.map(function (s, i) { var p = top ? Math.round(s[1] / top * 100) : 0; return '<div class="an-fn__s"><div class="an-fn__b" style="width:' + Math.max(4, top ? s[1] / top * 100 : 0) + '%"></div><span>' + esc(s[0]) + '</span><b>' + s[1] + (i ? ' <small>' + p + '%</small>' : '') + '</b></div>'; }).join('') + '</div>'; }
  function card(title, src, body, extra) { return '<div class="card an-card' + (extra || '') + '"><div class="card__h"><h2>' + title + '</h2><span class="an-src">' + src + '</span></div><div class="card__b">' + body + '</div></div>'; }
  function num(n) { return Math.round(n).toLocaleString('en-KE'); }

  function render() {
    var S = H.S, r = range(), O = S.orders.filter(real);
    var cur = O.filter(function (o) { return inR(o.at, r.from, r.to); }), prv = O.filter(function (o) { return inR(o.at, r.pfrom, r.pto); });
    var paid = cur.filter(isPaid), ppaid = prv.filter(isPaid), sum = function (l) { return l.reduce(function (n, o) { return n + (o.total || 0); }, 0); };
    var rev = sum(paid), prev = sum(ppaid), aov = paid.length ? rev / paid.length : 0, paov = ppaid.length ? prev / ppaid.length : 0;
    /* customers: first paid order */
    var first = {}; O.filter(isPaid).forEach(function (o) { var k = (o.customer.email || '').toLowerCase() || String(o.customer.phone || '').replace(/\D/g, '').slice(-9); if (!k) return; if (!first[k] || o.at < first[k].t) first[k] = { t: o.at }; first[k].n = (first[k].n || 0) + 1; });
    var newC = Object.keys(first).filter(function (k) { return inR(first[k].t, r.from, r.to); }).length, pnewC = Object.keys(first).filter(function (k) { return inR(first[k].t, r.pfrom, r.pto); }).length;
    var buyers = Object.keys(first).length, repeat = Object.keys(first).filter(function (k) { return first[k].n > 1; }).length;
    var keys = buckets(r), curB = keys.map(function () { return 0; }), prvB = keys.map(function () { return 0; }), shift = r.to - r.pto;
    paid.forEach(function (o) { var i = keys.indexOf(bucket(o.at, r.unit)); if (i >= 0) curB[i] += o.total || 0; });
    ppaid.forEach(function (o) { var i = keys.indexOf(bucket(o.at + shift, r.unit)); if (i >= 0) prvB[i] += o.total || 0; });
    var byKind = {}; paid.forEach(function (o) { byKind[o.kind] = (byKind[o.kind] || 0) + (o.total || 0); });
    var items = {}; paid.forEach(function (o) { (o.raw.lines || [{ label: o.summary, amount: o.total, qty: 1 }]).forEach(function (l) { var k = String(l.label || o.summary || '').split(' · ')[0].slice(0, 60) || KN[o.kind][0]; items[k] = (items[k] || 0) + (l.amount || 0) * (l.qty || 1); }); });
    /* funnels */
    var shop = cur.filter(function (o) { return o.kind === 'shop'; }), pb = cur.filter(function (o) { return o.kind === 'photobook'; }), dm = cur.filter(function (o) { return o.kind === 'domain'; });
    /* leads */
    var L = S.inbox.filter(function (m) { return m.kind !== 'whatsapp'; }), lc = L.filter(function (m) { return inR(m.createdAt, r.from, r.to); }), lp = L.filter(function (m) { return inR(m.createdAt, r.pfrom, r.pto); });
    var lKeys = keys, lB = lKeys.map(function () { return 0; }); lc.forEach(function (m) { var i = lKeys.indexOf(bucket(m.createdAt, r.unit)); if (i >= 0) lB[i]++; });
    var svc = {}; lc.forEach(function (m) { var f = (m.fields || []).filter(function (x) { return /service|need|type|project/i.test(x[0]); })[0]; var k = f ? String(f[1]).slice(0, 40) : (m.kind === 'brief' ? 'Brief (no service given)' : 'General message'); svc[k] = (svc[k] || 0) + 1; });
    var won = lc.filter(function (m) { return m.project || /approved|in_progress|completed/.test(m.stage || ''); }).length;
    var resp = lc.map(function (m) { var h = (m.history || []).filter(function (x) { return x.at > m.createdAt; })[0] || ((m.notes || [])[0]); return h ? h.at - m.createdAt : null; }).filter(function (x) { return x != null; });
    var avgResp = resp.length ? resp.reduce(function (a, b) { return a + b; }, 0) / resp.length : null;
    var fmtDur = function (ms) { if (ms == null) return '—'; var h = ms / 36e5; return h < 1 ? Math.round(ms / 6e4) + ' min' : h < 48 ? Math.round(h) + ' h' : Math.round(h / 24) + ' days'; };

    var b = H.body('<div class="row an-top"><div class="tabs" id="anP">' + [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['365', '12 months'], ['year', 'This year']].map(function (p) { return '<button data-p="' + p[0] + '"' + (A.per === p[0] ? ' class="is-on"' : '') + '>' + p[1] + '</button>'; }).join('') + '</div><label class="check"><input type="checkbox" id="anC"' + (A.cmp ? ' checked' : '') + '> Compare with the period before</label><button class="b b--sm" id="anCsv" style="margin-left:auto">Export CSV</button></div>' +
      '<div class="kpis an-kpis"><div class="card kpi"><span>Revenue</span><b>' + H.money(rev) + '</b><small>' + (A.cmp ? pct(rev, prev) + ' vs ' + H.money(prev) : paid.length + ' paid orders') + '</small></div><div class="card kpi"><span>Paid orders</span><b>' + paid.length + '</b><small>' + (A.cmp ? pct(paid.length, ppaid.length) + ' vs ' + ppaid.length : cur.length + ' started') + '</small></div><div class="card kpi"><span>Average order</span><b>' + H.money(aov) + '</b><small>' + (A.cmp ? pct(aov, paov) + ' vs ' + H.money(paov) : '') + '</small></div><div class="card kpi"><span>New customers</span><b>' + newC + '</b><small>' + (A.cmp ? pct(newC, pnewC) + ' · ' : '') + (buyers ? Math.round(repeat / buyers * 100) + '% buy again' : 'no buyers yet') + '</small></div></div>' +
      '<div class="ov an-ov"><div class="ov__main">' +
      card('Revenue', 'Paid orders · tests excluded · KES', barChart(keys, curB, A.cmp ? prvB : null, r.unit, H.money) + (A.cmp ? '<p class="an-leg"><i></i>This period <i class="o"></i>Period before</p>' : '')) +
      '<div class="an-2">' + card('Revenue by product', 'Paid orders', hbars(Object.keys(byKind).sort(function (a, c) { return byKind[c] - byKind[a]; }).map(function (k) { return [KN[k][0], byKind[k], KN[k][1]]; }), H.money)) + card('Top sellers', 'Paid order lines', hbars(Object.keys(items).sort(function (a, c) { return items[c] - items[a]; }).slice(0, 6).map(function (k) { return [k, items[k]]; }), H.money)) + '</div>' +
      '<div class="an-2">' + card('Shop checkout', 'M-Pesa prompts sent → paid', shop.length ? funnel([['M-Pesa prompt sent', shop.length], ['Paid', shop.filter(isPaid).length]]) : '<p class="muted an-none">No shop checkouts in this period.</p>') +
      card('Photo Books', 'Orders → printed → delivered', pb.length ? funnel([['Checkout started', pb.length], ['Paid', pb.filter(isPaid).length], ['Pages received', pb.filter(function (o) { return /ready|printing|ready_collection|dispatched|delivered/.test(o.status); }).length], ['Delivered', pb.filter(function (o) { return o.status === 'delivered'; }).length]]) : '<p class="muted an-none">No Photo Book orders in this period.</p>') + '</div>' +
      (dm.length ? card('Domains', 'Orders → paid → registered', funnel([['Ordered', dm.length], ['Paid', dm.filter(isPaid).length], ['Registered', dm.filter(function (o) { return o.status === 'registered'; }).length]])) : '') +
      '<div id="anWeb"></div></div>' +
      '<div class="ov__rail">' + card('Leads', 'Website forms', '<div class="an-mini"><div><b>' + lc.length + '</b><span>received ' + (A.cmp ? pct(lc.length, lp.length) : '') + '</span></div><div><b>' + lc.filter(function (m) { return m.kind === 'brief'; }).length + '</b><span>Start a Project</span></div><div><b>' + (lc.length ? Math.round(won / lc.length * 100) : 0) + '%</b><span>became projects</span></div><div><b>' + fmtDur(avgResp) + '</b><span>avg. time to first follow-up</span></div></div>' + barChart(lKeys, lB, null, r.unit, function (v) { return v + ' leads'; })) +
      card('Leads by service', 'What people asked for', hbars(Object.keys(svc).sort(function (a, c) { return svc[c] - svc[a]; }).slice(0, 7).map(function (k) { return [k, svc[k]]; }), num, 'var(--b)')) +
      card('Projects', 'Ciel Admin projects', '<div class="an-mini"><div><b>' + S.projects.filter(function (p) { return !/completed|cancel/.test(p.status || ''); }).length + '</b><span>active</span></div><div><b>' + S.projects.filter(function (p) { return p.status === 'completed'; }).length + '</b><span>completed</span></div><div><b>' + S.projects.filter(function (p) { return p.deadline && p.deadline < H.today() && p.status !== 'completed'; }).length + '</b><span>past deadline</span></div></div>') +
      '</div></div>');
    b.querySelectorAll('#anP [data-p]').forEach(function (x) { x.onclick = function () { A.per = x.getAttribute('data-p'); render(); }; });
    b.querySelector('#anC').onchange = function () { A.cmp = this.checked; render(); };
    b.querySelector('#anCsv').onclick = function () {
      var rows = [['Period', 'Revenue (KES)', 'Leads']].concat(keys.map(function (k, i) { return [k, curB[i], lB[i]]; }));
      var csv = rows.map(function (x) { return x.join(','); }).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'ciel-analytics-' + A.per + '-' + H.today() + '.csv'; a.click();
    };
    web(r);
  }
  function web(r) {
    var el = document.getElementById('anWeb'); if (!el) return;
    el.innerHTML = card('Website traffic', 'Vercel Web Analytics', '<p class="muted an-none">Loading…</p>');
    H.api('/api/hq?route=web-analytics&days=' + Math.min(365, r.days)).then(function (w) {
      if (!el.isConnected) return;
      if (!w.configured) { el.innerHTML = card('Website traffic', 'Vercel Web Analytics', '<p class="muted" style="font-size:.86rem">Visitor numbers come from Vercel Web Analytics, so nothing is guessed. Two steps to switch it on:</p><ol class="an-steps"><li>In Vercel open <b>cielafrica → Analytics</b> and click <b>Enable</b> (the free plan is enough). The site already has the tracking script.</li><li>Create a read token in Vercel (<b>Account Settings → Tokens</b>), add it to the project as <code>VERCEL_TOKEN</code> (Sensitive), then redeploy.</li></ol>'); return; }
      var rows = function (j) { var l = (j && (j.data || j.rows || j.groups || j.items)) || (Array.isArray(j) ? j : []); return l.map(function (x) { var keys = Object.keys(x), label = '', v = 0, vis = 0; keys.forEach(function (k) { var val = x[k]; if (typeof val === 'string' && !label) label = val; if (typeof val === 'number') { if (/visitor/i.test(k)) vis = val; else if (/view|total|count|value/i.test(k) || !v) v = val; } }); return { label: label, views: v, visitors: vis }; }); };
      var day = rows(w.day).filter(function (x) { return x.label; }).sort(function (a, c) { return a.label.localeCompare(c.label); });
      var tv = day.reduce(function (n, x) { return n + x.views; }, 0), tu = day.reduce(function (n, x) { return n + x.visitors; }, 0);
      var line = day.length ? barChart(day.map(function (x) { return x.label.slice(0, 10); }), day.map(function (x) { return x.views; }), null, 'day', num) : '<p class="muted an-none">No visits recorded yet. Data appears a few minutes after people visit.</p>';
      var list = function (j, f) { return hbars(rows(j).filter(function (x) { return x.label; }).slice(0, 8).map(function (x) { return [f ? f(x.label) : x.label, x.views]; }), num, 'var(--b)'); };
      el.innerHTML = card('Website traffic', 'Vercel Web Analytics · last ' + w.days + ' days', '<div class="an-mini"><div><b>' + num(tv) + '</b><span>page views</span></div>' + (tu ? '<div><b>' + num(tu) + '</b><span>visitors</span></div>' : '') + '</div>' + line) +
        '<div class="an-2">' + card('Top pages', 'Vercel Web Analytics', list(w.pages)) + card('Where visitors come from', 'Referrers', list(w.refs, function (l) { return l || 'Direct'; })) + '</div><div class="an-2">' + card('Countries', 'Vercel Web Analytics', list(w.countries)) + card('Devices', 'Vercel Web Analytics', list(w.devices)) + '</div>';
    }, function (e) { if (el.isConnected) el.innerHTML = card('Website traffic', 'Vercel Web Analytics', '<p class="muted" style="font-size:.86rem">' + esc(e.message) + '</p>'); });
  }
  window.HQAnalytics = { init: function (h) { H = h; }, render: render };
})();
