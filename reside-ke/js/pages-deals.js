/* ============================================================
   Reside Ke — Deals pipeline board, deal workspace, sales, commissions
   ============================================================ */
(function () {
  'use strict';
  var I = ES.icon, st = ES.store, f = ES.fmt, esc = f.esc, DAY = 864e5;
  var U = ES.ui.deals;
  var BOARD = ['new', 'qualified', 'viewing', 'offer', 'under_offer', 'contract', 'won'];

  function kq(ic, val, label, extra) { return '<div class="kq"><span class="kq__ic">' + I(ic, 16) + '</span><span class="kq__b"><b>' + val + (extra || '') + '</b><em>' + label + '</em></span></div>'; }
  function daysLeft(d) { return Math.round((new Date(d) - Date.now()) / DAY); }
  function winRate() { var c = st.s.deals.filter(function (d) { return (d.stage === 'won' || d.stage === 'lost') && Date.now() - new Date(d.closedAt) < 365 * DAY; }); var w = c.filter(function (d) { return d.stage === 'won'; }).length; return c.length ? Math.round(w / c.length * 100) : 0; }

  /* ======================= BOARD ======================= */
  ES.pages.deals = {
    render: function (v) {
      var open = st.openDeals(), now = new Date();
      var thisMonth = open.filter(function (d) { var e = new Date(d.expectedClose); return e.getMonth() === now.getMonth() && e.getFullYear() === now.getFullYear(); });
      var weighted = open.reduce(function (a, d) { return a + st.weighted(d); }, 0);
      var agents = st.s.team.filter(function (u) { return open.some(function (d) { return d.agentId === u.id; }); });
      var D = st.s.deals.filter(function (d) {
        if (U.agent && d.agentId !== U.agent) return false;
        if (U.kind !== 'all' && d.kind !== U.kind) return false;
        if (d.stage === 'won' && Date.now() - new Date(d.closedAt) > 45 * DAY) return false;
        if (d.stage === 'lost' && (!U.showLost || Date.now() - new Date(d.closedAt) > 90 * DAY)) return false;
        return true;
      });
      var cols = BOARD.concat(U.showLost ? ['lost'] : []);
      v.innerHTML =
        '<header class="ph"><h1>Deals</h1><div class="ph__k">' +
        kq('layers', open.length, 'Open deals') + kq('trend', f.money(weighted, true), 'Weighted commission') +
        kq('cal', thisMonth.length, 'Closing this month', thisMonth.length ? ' <span class="pill pill--amber">' + f.money(thisMonth.reduce(function (a, d) { return a + d.value; }, 0), true).replace('KES ', '') + '</span>' : '') +
        kq('trophy', winRate() + '%', 'Win rate · 12 months') +
        '</div><div class="ph__a"><button class="btn" data-d="new">' + I('plus', 15) + 'New deal</button><button class="btn btn--dark" data-d="offer">' + I('tag', 15) + 'Record offer</button></div></header>' +
        '<div class="tb"><div class="chips"><button class="fchip fchip--txt' + (!U.agent ? ' is-on' : '') + '" data-d="agent" data-v="">Everyone</button>' + agents.map(function (u) { return '<button class="fchip' + (U.agent === u.id ? ' is-on' : '') + '" data-d="agent" data-v="' + u.id + '">' + ES.av(u, 24) + esc(u.name.split(' ')[0]) + '</button>'; }).join('') + '</div><span class="tb__sp"></span>' +
        '<label class="ck"><input type="checkbox" data-d="lost"' + (U.showLost ? ' checked' : '') + '>Show lost</label>' +
        '<span class="seg" role="group" aria-label="Deal type">' + [['all', 'All'], ['sale', 'Sale'], ['rent', 'Rent']].map(function (o) { return '<button data-d="kind" data-v="' + o[0] + '" class="' + (U.kind === o[0] ? 'is-on' : '') + '">' + o[1] + '</button>'; }).join('') + '</span></div>' +
        '<p class="muted" style="font-size:12px;margin:-6px 0 12px">Drag a card to move it, or use the ••• menu on each card. Closed-won shows the last 45 days.</p>' +
        '<div class="bd" id="board">' + cols.map(function (sid) {
          var s = st.stage(sid), ds = D.filter(function (d) { return d.stage === sid; }).sort(function (a, b) { return new Date(a.expectedClose) - new Date(b.expectedClose); });
          var tot = ds.reduce(function (a, d) { return a + d.value; }, 0);
          return '<section class="bd__col' + (sid === 'won' ? ' is-won' : '') + (sid === 'lost' ? ' bd__lost' : '') + '" data-stage="' + sid + '" aria-label="' + s.name + '"><header class="bd__h" style="--c:' + s.c + '"><b>' + s.short + '<i>' + ds.length + '</i></b><span>' + f.money(tot, true) + '</span></header>' + ds.map(card).join('') + (ds.length ? '' : '<p class="muted" style="font-size:12px;text-align:center;padding:16px 6px">Drop a deal here</p>') + '</section>';
        }).join('') + '</div>';
      wire(v);
    }
  };
  function card(d) {
    var p = st.prop(d.propertyId), b = st.contact(d.buyerId), u = st.user(d.agentId), diff = (d.value - p.price) / p.price * 100;
    var closed = d.stage === 'won' || d.stage === 'lost', dl = daysLeft(d.expectedClose);
    return '<article class="dc" draggable="' + (!closed) + '" data-id="' + d.id + '" tabindex="0" aria-label="' + esc(p.title + ', ' + (b ? b.name : '') + ', ' + f.money(d.value, true)) + '">' +
      '<div class="dc__m"><img src="' + p.images[0] + '" alt="" loading="lazy" draggable="false"><span class="dc__k' + (d.kind === 'rent' ? ' dc__k--rent' : '') + '">' + (d.kind === 'rent' ? 'RENT' : 'SALE') + '</span><button class="dc__menu" data-d="menu" data-id="' + d.id + '" aria-label="Deal actions">' + I('more', 15) + '</button>' + (d.stage === 'won' ? '<span class="dc__sold">' + (d.kind === 'rent' ? 'LET' : 'SOLD') + '</span>' : '') + '</div>' +
      '<div class="dc__b"><div class="dc__t">' + esc(p.title) + '</div><div class="dc__w">' + ES.cav(b, 20) + esc(b ? b.name : '—') + '</div>' +
      '<div class="dc__v"><b>' + f.money(d.value, true) + (d.kind === 'rent' ? '<small style="font-size:11px;font-weight:500;color:var(--ink-3)"> /mo</small>' : '') + '</b>' + (Math.abs(diff) < 0.05 ? ES.pill('At ask', 'green') : ES.delta(diff)) + '</div>' +
      '<div class="dc__f"><span' + (!closed && dl < 0 ? ' class="is-late"' : '') + '>' + I('clock', 12) + (closed ? (d.stage === 'won' ? 'Closed ' : 'Lost ') + f.date(d.closedAt) : f.date(d.expectedClose) + ' · ' + (dl < 0 ? Math.abs(dl) + 'd late' : dl + 'd left')) + '</span>' + ES.av(u, 22) + '</div></div></article>';
  }
  function wire(v) {
    var drag = null;
    v.onclick = function (e) {
      var b = e.target.closest('[data-d]');
      if (b) {
        var k = b.dataset.d;
        if (k === 'agent') { U.agent = b.dataset.v; ES.app.refresh(); }
        else if (k === 'kind') { U.kind = b.dataset.v; ES.app.refresh(); }
        else if (k === 'new') newModal({});
        else if (k === 'offer') offerModal(null, null);
        else if (k === 'menu') { e.stopPropagation(); cardMenu(b, st.deal(b.dataset.id)); }
        return;
      }
      var c = e.target.closest('.dc'); if (c) ES.app.go('#/deal/' + c.dataset.id);
    };
    v.onchange = function (e) { if (e.target.dataset.d === 'lost') { U.showLost = e.target.checked; ES.app.refresh(); } };
    v.onkeydown = function (e) { var c = e.target.closest && e.target.closest('.dc'); if (c && e.key === 'Enter') ES.app.go('#/deal/' + c.dataset.id); };
    var board = v.querySelector('#board'); if (!board) return;
    board.addEventListener('dragstart', function (e) { var c = e.target.closest('.dc'); if (!c) return; drag = c.dataset.id; c.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag); } catch (x) { } });
    board.addEventListener('dragend', function (e) { var c = e.target.closest('.dc'); if (c) c.classList.remove('is-drag'); board.querySelectorAll('.is-over').forEach(function (x) { x.classList.remove('is-over'); }); });
    board.addEventListener('dragover', function (e) { var col = e.target.closest('.bd__col'); if (!col || !drag) return; e.preventDefault(); board.querySelectorAll('.is-over').forEach(function (x) { if (x !== col) x.classList.remove('is-over'); }); col.classList.add('is-over'); });
    board.addEventListener('dragleave', function (e) { var col = e.target.closest('.bd__col'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-over'); });
    board.addEventListener('drop', function (e) { var col = e.target.closest('.bd__col'); if (!col || !drag) return; e.preventDefault(); col.classList.remove('is-over'); var id = drag; drag = null; move(id, col.dataset.stage, { x: e.clientX, y: e.clientY }); });
  }
  function cardMenu(anchor, d) {
    var items = [{ label: 'Open deal', icon: 'out', k: 'open' }, { label: 'Record an offer', icon: 'tag', k: 'offer', disabled: d.stage === 'won' || d.stage === 'lost' }, '-'];
    ES.STAGES.forEach(function (s) { items.push({ label: 'Move to ' + s.name, icon: s.id === 'won' ? 'trophy' : s.id === 'lost' ? 'x' : 'right', k: 'move', s: s.id, on: d.stage === s.id, disabled: d.stage === s.id || d.stage === 'won', tone: s.id === 'lost' ? 'red' : '' }); });
    ES.menu(anchor, items, function (it) {
      if (it.k === 'open') ES.app.go('#/deal/' + d.id);
      if (it.k === 'offer') offerModal(d.id);
      if (it.k === 'move') { var r = anchor.getBoundingClientRect(); move(d.id, it.s, { x: r.left, y: r.top }); }
    });
  }
  // shared stage change with confirmations for consequential moves
  function move(id, stage, pos) {
    var d = st.deal(id); if (!d || d.stage === stage) return;
    if (d.stage === 'won') { ES.toast('Closed deals can’t be moved in the demo.', 'err'); return; }
    var p = st.prop(d.propertyId);
    if (stage === 'won') {
      ES.confirm({
        title: 'Close ' + d.ref + ' as won?', icon: 'trophy', tone: 'green', ok: 'Close deal',
        html: esc(p.title) + ' will be marked <b>' + (d.kind === 'rent' ? 'let' : 'sold') + '</b> and the commission recorded as <b>earned</b>.' + (d.kind === 'rent' ? ' A 12-month lease record is created.' : '') + '<br><span class="muted" style="font-size:12px">Demo only — no money is transferred.</span>',
        field: ES.field('Final ' + (d.kind === 'rent' ? 'monthly rent' : 'sale price') + ' (KES)', '<input data-num id="cfVal" inputmode="numeric" value="' + d.value + '">'),
        onOk: function (panel) {
          var val = Number(panel.querySelector('#cfVal').value.replace(/[^0-9]/g, ''));
          if (!(val > 0)) { ES.toast('Enter the final amount', 'err'); return false; }
          if (ES.try(function () { st.moveDeal(id, 'won', { value: val }); })) { float('+' + f.money(st.commission(st.deal(id)), true) + ' commission', pos); ES.toast(d.ref + ' closed — commission recorded'); }
        }
      });
      return;
    }
    if (stage === 'lost') {
      ES.confirm({
        title: 'Mark ' + d.ref + ' as lost?', icon: 'x', tone: 'red', ok: 'Mark as lost',
        text: 'The deal leaves the pipeline. ' + (p.status === 'under_offer' ? 'The listing goes back to active if no other offer is in progress.' : ''),
        field: ES.field('Reason', ES.select('reason', ['Price too high', 'Buyer could not get financing', 'Bought another property', 'Seller withdrew', 'Failed inspection', 'Other'], '', 'id="cfReason"')),
        onOk: function (panel) { ES.try(function () { st.moveDeal(id, 'lost', { reason: panel.querySelector('#cfReason').value }); }, d.ref + ' marked as lost'); }
      });
      return;
    }
    ES.try(function () { st.moveDeal(id, stage); }, 'Moved to ' + st.stage(stage).name);
  }
  function float(text, pos) {
    if (!pos) return;
    var el = document.createElement('div'); el.className = 'float-c'; el.textContent = text;
    el.style.left = Math.max(10, Math.min(innerWidth - 220, pos.x - 60)) + 'px'; el.style.top = Math.max(60, pos.y - 20) + 'px';
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 1700);
  }

  /* ---------------- modals ---------------- */
  function buyerOptions(kind) {
    return st.s.contacts.filter(function (c) { return c.types.indexOf(kind === 'rent' ? 'tenant' : 'buyer') > -1 || c.types.indexOf('buyer') > -1 || c.types.indexOf('tenant') > -1; }).map(function (c) { return { v: c.id, l: c.name + ' · ' + c.types.join('/') }; });
  }
  function newModal(pre) {
    pre = pre || {};
    var props = st.listings().filter(function (p) { return p.status === 'active' || p.status === 'under_offer'; });
    var p0 = st.prop(pre.propertyId) || props[0];
    var panel = ES.open('modal', ES.head('New deal', 'Track a buyer or tenant through to closing') + '<form class="ovl__body" id="ndf" novalidate><div class="g2">' +
      ES.field('Property *', ES.select('propertyId', props.map(function (p) { return { v: p.id, l: p.title + ' — ' + f.money(p.price, true) }; }), p0.id), '', 'span2') +
      ES.field('Buyer / tenant *', ES.select('buyerId', [{ v: '', l: 'Choose a contact…' }, { v: '__new', l: '+ Add a new contact' }].concat(buyerOptions(p0.category)), pre.buyerId || '')) +
      ES.field('New contact name', '<input name="newName" placeholder="Only if adding a new contact">') +
      ES.field('Deal value (KES) *', '<input name="value" data-num inputmode="numeric" value="' + p0.price + '">') +
      ES.field('Stage', ES.select('stage', ES.STAGES.filter(function (s) { return s.id !== 'won' && s.id !== 'lost'; }).map(function (s) { return { v: s.id, l: s.name }; }), 'new')) +
      ES.field('Expected close', '<input type="date" name="expectedClose" value="' + new Date(Date.now() + 45 * DAY).toISOString().slice(0, 10) + '">') +
      ES.field('Agent', ES.select('agentId', st.s.team.map(function (u) { return { v: u.id, l: u.name }; }), p0.agentId)) +
      '</div></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="ndSave">' + I('check', 15) + 'Create deal</button></div>', { label: 'New deal' });
    var fm = panel.querySelector('#ndf');
    fm.propertyId.addEventListener('change', function () { var p = st.prop(fm.propertyId.value); fm.value.value = p.price; fm.agentId.value = p.agentId; });
    panel.querySelector('#ndSave').onclick = function () {
      var d = ES.formData(fm);
      var r = ES.try(function () {
        if (d.buyerId === '__new' || (!d.buyerId && d.newName)) { var p = st.prop(d.propertyId); d.buyerId = st.saveContact({ name: d.newName, types: [p.category === 'rent' ? 'tenant' : 'buyer'], phone: '', email: '', agentId: d.agentId }).id; }
        return st.createDeal({ propertyId: d.propertyId, buyerId: d.buyerId, value: d.value, stage: d.stage, agentId: d.agentId, expectedClose: d.expectedClose ? new Date(d.expectedClose + 'T12:00').toISOString() : null });
      }, 'Deal created');
      if (r) { ES.close(); ES.app.go('#/deal/' + r.id); }
    };
  }
  function offerModal(dealId, propertyId) {
    var d0 = dealId ? st.deal(dealId) : null;
    var deals = st.openDeals().filter(function (d) { return !propertyId || d.propertyId === propertyId; });
    if (!d0 && !deals.length) { ES.toast('Create a deal first — no open deals' + (propertyId ? ' on this property' : ''), 'info'); newModal({ propertyId: propertyId }); return; }
    var panel = ES.open('modal', ES.head('Record an offer', 'Offers are logged against a deal and update its value') + '<form class="ovl__body" id="of" novalidate><div class="g2">' +
      (d0 ? '<div class="spanall mini__i" style="border:1px solid var(--line);border-radius:12px;padding:10px"><img src="' + st.prop(d0.propertyId).images[0] + '" alt="" style="width:56px;height:42px;border-radius:8px;object-fit:cover"><span class="grow"><b>' + esc(st.prop(d0.propertyId).title) + '</b><em>' + d0.ref + ' · ' + esc(st.contact(d0.buyerId).name) + '</em></span></div><input type="hidden" name="dealId" value="' + d0.id + '">' :
        ES.field('Deal *', ES.select('dealId', deals.map(function (d) { return { v: d.id, l: d.ref + ' — ' + st.prop(d.propertyId).title + ' · ' + st.contact(d.buyerId).name }; }), deals[0].id), '', 'span2')) +
      ES.field('Offer amount (KES) *', '<input name="amount" data-num inputmode="numeric" value="' + (d0 ? d0.value : deals[0].value) + '" autofocus>') +
      ES.field('Asking price', '<input disabled id="ofAsk" value="' + f.money(st.prop((d0 || deals[0]).propertyId).price) + '">') +
      ES.field('Note', '<input name="note" placeholder="e.g. Subject to mortgage approval, 30-day completion">', '', 'span2') +
      '</div></form><div class="ovl__foot"><button class="btn" data-close>Cancel</button><button class="btn btn--dark" id="ofSave">' + I('tag', 15) + 'Record offer</button></div>', { label: 'Record an offer' });
    var fm = panel.querySelector('#of');
    if (!d0) fm.dealId.addEventListener('change', function () { var d = st.deal(fm.dealId.value); fm.amount.value = d.value; panel.querySelector('#ofAsk').value = f.money(st.prop(d.propertyId).price); });
    panel.querySelector('#ofSave').onclick = function () { var x = ES.formData(fm); if (ES.try(function () { st.recordOffer(x.dealId, x.amount, x.note); }, 'Offer recorded')) ES.close(); };
  }

  /* ======================= DEAL WORKSPACE ======================= */
  ES.pages.deal = {
    newModal: newModal, offerModal: offerModal, move: move,
    render: function (v, params) {
      var d = st.deal(params[0]);
      if (!d) { v.innerHTML = ES.empty('board', 'Deal not found', '', '<a class="btn" href="#/deals">Back to deals</a>'); return; }
      var p = st.prop(d.propertyId), b = st.contact(d.buyerId), s = st.contact(d.sellerId), u = st.user(d.agentId), stg = st.stage(d.stage);
      var comm = st.commission(d), closed = d.stage === 'won' || d.stage === 'lost';
      var idx = ES.STAGES.map(function (x) { return x.id; }).indexOf(d.stage);
      var A = st.activityFor('deal', d.id).concat([{ at: d.createdAt, kind: 'stage', text: 'Deal ' + d.ref + ' created', by: d.agentId }]);
      var evs = st.s.events.filter(function (e) { return e.propertyId === d.propertyId && (!e.contactId || e.contactId === d.buyerId); }).sort(function (a, b2) { return new Date(b2.start) - new Date(a.start); }).slice(0, 6);
      var docs = st.s.docs.filter(function (x) { return x.dealId === d.id || (x.propertyId === d.propertyId && /offer|sale|lease/.test(x.kind)); });
      v.innerHTML = '<a class="back" href="#/deals">' + I('left', 14) + 'Deals</a>' +
        '<header class="pd-h"><div><h1>' + esc(p.title) + '</h1><div class="pd-h__sub">' + d.ref + ' · ' + (d.kind === 'rent' ? 'Rental' : 'Sale') + ' · ' + ES.pill(stg.name, d.stage === 'won' ? 'green' : d.stage === 'lost' ? 'red' : 'blue') + (d.stage === 'lost' ? ' <span>— ' + esc(d.lostReason) + '</span>' : '') + '</div></div>' +
        '<div class="pd-h__a">' + (closed ? '' : '<button class="btn" data-dd="lost">' + I('x', 15) + 'Mark lost</button><button class="btn" data-dd="offer">' + I('tag', 15) + 'Record offer</button><button class="btn btn--ok" data-dd="won">' + I('trophy', 15) + 'Close as won</button>') + '</div></header>' +
        '<div class="stagebar" role="group" aria-label="Move deal stage">' + ES.STAGES.filter(function (x) { return x.id !== 'lost'; }).map(function (x, i) { var cls = x.id === d.stage ? (x.id === 'won' ? 'is-won' : 'is-cur') : i < idx && d.stage !== 'lost' ? 'is-done' : ''; return '<button class="' + cls + '" data-dd="stage" data-s="' + x.id + '"' + (closed ? ' disabled' : '') + ' aria-pressed="' + (x.id === d.stage) + '">' + x.short + '</button>'; }).join('') + (d.stage === 'lost' ? '<button class="is-lost" disabled>Lost</button>' : '') + '</div>' +
        '<div class="dd-grid"><div class="pd-col">' +
        '<a class="card" href="#/property/' + p.id + '" style="display:flex;gap:14px;align-items:center;padding:12px"><img src="' + p.images[0] + '" alt="" style="width:120px;height:84px;border-radius:12px;object-fit:cover"><span style="flex:1;min-width:0"><b style="font-size:15px">' + esc(p.title) + '</b><span class="t-sub">' + esc(p.address) + ' · ' + p.ref + '</span><span class="lc__s" style="margin-top:8px">' + (p.beds ? '<span>' + I('bed', 14) + p.beds + ' bd</span>' : '') + '<span>' + I('bath', 14) + p.baths + ' ba</span><span>' + I('area', 14) + f.n(p.size) + ' m²</span><span>Asking ' + f.money(p.price, true) + '</span></span></span>' + I('right', 16) + '</a>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('tag', 16) + 'Offer history</span>' + (closed ? '' : '<button class="btn btn--sm" data-dd="offer">' + I('plus', 13) + 'Record offer</button>') + '</header>' +
        (d.offers.length ? '<div class="t-wrap" style="box-shadow:none"><table class="t"><thead><tr><th>Date</th><th class="r">Amount</th><th class="r">vs asking</th><th>Status</th><th></th></tr></thead><tbody>' + d.offers.map(function (o, i) { return '<tr><td style="white-space:nowrap">' + f.date(o.at) + '<span class="t-sub">' + f.time(o.at) + (o.note ? ' · ' + esc(o.note) : '') + '</span></td><td class="r"><b>' + f.money(o.amount) + '</b></td><td class="r">' + ES.delta((o.amount - p.price) / p.price * 100) + '</td><td>' + ES.pill(o.status, o.status === 'accepted' ? 'green' : o.status === 'open' ? 'amber' : o.status === 'declined' ? 'red' : 'grey') + '</td><td class="r">' + (o.status === 'open' && !closed ? '<span style="display:inline-flex;gap:4px"><button class="btn btn--sm btn--ok" data-dd="acc" data-i="' + i + '">Accept</button><button class="btn btn--sm" data-dd="om" data-i="' + i + '" aria-label="More offer actions">' + I('more', 14) + '</button></span>' : '') + '</td></tr>'; }).reverse().join('') + '</tbody></table></div>' : ES.empty('tag', 'No offers yet', 'Record the first offer when the buyer puts a number down.')) + '</article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('clock', 16) + 'Deal timeline</span></header>' + ES.timeline(A) + '</article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('edit', 16) + 'Notes</span></header><form class="note-f" id="dnf"><textarea name="t" placeholder="Add an internal note" aria-label="Note"></textarea><button class="btn btn--dark">Add</button></form>' + (d.notes.length ? d.notes.map(function (n) { return '<div class="note">' + esc(n.text) + '<em>' + esc(st.user(n.by).name) + ' · ' + f.ago(n.at) + '</em></div>'; }).join('') : '<p class="muted" style="font-size:12.5px">No notes yet.</p>') + '</article>' +
        '</div><div class="pd-col">' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('wallet', 16) + 'Commission</span>' + ES.pill(d.commissionStatus, { projected: 'grey', earned: 'blue', approved: 'violet', paid: 'green' }[d.commissionStatus]) + '</header>' +
        '<div class="cbk"><div><span>Deal value</span><b>' + f.money(d.value, true) + '</b></div><div><span>' + (d.kind === 'rent' ? 'Letting fee' : 'Rate') + '</span><b>' + (d.kind === 'rent' ? st.s.settings.rentMonths + ' mo' : (d.rate != null ? d.rate : st.s.settings.saleRate) + '%') + '</b></div><div><span>' + (d.stage === 'won' ? 'Earned' : 'Expected') + '</span><b>' + f.money(comm, true) + '</b></div></div>' +
        (d.stage !== 'won' ? '<p class="muted" style="font-size:12px;margin-top:10px">Weighted at ' + stg.p + '% probability: <b style="color:var(--ink)">' + f.money(st.weighted(d), true) + '</b>. Projected commission is not counted as income until the deal closes.</p>' : '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' + (d.commissionStatus === 'earned' ? '<button class="btn btn--sm" data-dd="cs" data-s="approved">' + I('check', 13) + 'Approve</button>' : '') + (d.commissionStatus !== 'paid' ? '<button class="btn btn--sm" data-dd="cs" data-s="paid">' + I('wallet', 13) + 'Record as paid</button>' : '<span class="muted" style="font-size:12px">Settled</span>') + '</div>') + '</article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('users', 16) + 'Parties</span></header><div class="mini">' +
        (b ? '<a class="mini__i" href="#/contact/' + b.id + '">' + ES.cav(b, 34) + '<span class="grow"><b>' + esc(b.name) + '</b><em>' + (d.kind === 'rent' ? 'Tenant' : 'Buyer') + ' · ' + esc(b.phone) + '</em></span>' + I('right', 14) + '</a>' : '') +
        (s ? '<a class="mini__i" href="#/contact/' + s.id + '">' + ES.cav(s, 34) + '<span class="grow"><b>' + esc(s.name) + '</b><em>' + (d.kind === 'rent' ? 'Landlord' : 'Seller') + ' · ' + esc(s.phone) + '</em></span>' + I('right', 14) + '</a>' : '') +
        '<div class="mini__i">' + ES.av(u, 34) + '<span class="grow"><b>' + esc(u.name) + '</b><em>Agent · ' + esc(u.role) + '</em></span><button class="btn btn--sm" data-dd="agent">Reassign</button></div></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('cal', 16) + 'Key dates</span></header><dl class="kv"><dt>Created</dt><dd>' + f.dateLong(d.createdAt) + '</dd><dt>Expected close</dt><dd>' + f.dateLong(d.expectedClose) + (closed ? '' : ' · <span class="' + (daysLeft(d.expectedClose) < 0 ? 'pill pill--red' : 'muted') + '">' + (daysLeft(d.expectedClose) < 0 ? Math.abs(daysLeft(d.expectedClose)) + ' days late' : daysLeft(d.expectedClose) + ' days left') + '</span>') + '</dd>' + (d.closedAt ? '<dt>Closed</dt><dd>' + f.dateLong(d.closedAt) + '</dd>' : '') + '<dt>Probability</dt><dd>' + stg.p + '%</dd></dl></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('task', 16) + 'Viewings & tasks</span><button class="btn btn--sm" data-dd="ev">' + I('plus', 13) + 'Schedule</button></header>' + (evs.length ? '<div class="agenda">' + evs.map(function (e) { return ES.pages.calendar.agItem(e); }).join('') + '</div>' : '<p class="muted" style="font-size:12.5px">Nothing scheduled.</p>') + '</article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('file', 16) + 'Documents</span><button class="btn btn--sm" data-dd="doc">' + I('upload', 13) + 'Add</button></header>' + (docs.length ? '<div class="mini">' + docs.map(function (x) { return '<button class="mini__i" style="width:100%;text-align:left" data-docid="' + x.id + '"><span class="doc-ic doc-ic--' + x.kind + '">' + I('file', 15) + '</span><span class="grow"><b>' + esc(x.name) + '</b><em>' + ES.DOC_KINDS[x.kind] + ' · ' + x.status + '</em></span></button>'; }).join('') + '</div>' : '<p class="muted" style="font-size:12.5px">No documents yet.</p>') + '</article>' +
        '</div></div>';

      v.onclick = function (e) {
        var x = e.target.closest('[data-dd]'), ev = e.target.closest('[data-ev]'), dc = e.target.closest('[data-docid]');
        if (ev) { ES.pages.calendar.open(ev.dataset.ev); return; }
        if (dc) { ES.pages.documents.open(dc.dataset.docid); return; }
        if (!x) return;
        var k = x.dataset.dd, r = x.getBoundingClientRect(), pos = { x: r.left, y: r.top };
        if (k === 'won') move(d.id, 'won', pos);
        if (k === 'lost') move(d.id, 'lost', pos);
        if (k === 'stage') move(d.id, x.dataset.s, pos);
        if (k === 'offer') offerModal(d.id);
        if (k === 'acc') ES.confirm({ title: 'Accept this offer?', icon: 'check', tone: 'green', ok: 'Accept offer', text: 'The deal moves to Under offer at ' + f.money(d.offers[+x.dataset.i].amount) + ' and the listing is marked under offer.', onOk: function () { ES.try(function () { st.respondOffer(d.id, +x.dataset.i, 'accepted'); }, 'Offer accepted'); } });
        if (k === 'om') { ES.menu(x, [{ label: 'Mark as countered', icon: 'refresh', k: 'ctr' }, { label: 'Decline offer', icon: 'x', k: 'dec', tone: 'red' }], function (it) { var i2 = +x.dataset.i; if (it.k === 'ctr') ES.try(function () { st.respondOffer(d.id, i2, 'countered'); }, 'Marked as countered — record the buyer’s next offer when it comes in'); else ES.try(function () { st.respondOffer(d.id, i2, 'declined'); }, 'Offer declined'); }); }
        if (k === 'dec') ES.try(function () { st.respondOffer(d.id, +x.dataset.i, 'declined'); }, 'Offer declined');
        if (k === 'ctr') { ES.try(function () { st.respondOffer(d.id, +x.dataset.i, 'countered'); }, 'Marked as countered — record the buyer’s next offer when it comes in'); }
        if (k === 'cs') ES.confirm({ title: x.dataset.s === 'paid' ? 'Record commission as paid?' : 'Approve commission?', icon: 'wallet', tone: 'green', ok: x.dataset.s === 'paid' ? 'Record as paid' : 'Approve', text: x.dataset.s === 'paid' ? 'This records that ' + f.money(comm) + ' was settled. In the demo, no payment is made or verified.' : 'Approved commissions are ready for payout to ' + u.name + '.', onOk: function () { ES.try(function () { st.setCommissionStatus(d.id, x.dataset.s); }, 'Commission ' + x.dataset.s); } });
        if (k === 'agent') ES.menu(x, st.s.team.map(function (t) { return { label: t.name, on: t.id === d.agentId, id: t.id }; }), function (it) { d.agentId = it.id; ES.try(function () { st.addDealNote(d.id, 'Reassigned to ' + it.label); }, 'Deal reassigned to ' + it.label); });
        if (k === 'ev') ES.pages.calendar.edit(null, { type: 'viewing', propertyId: d.propertyId, contactId: d.buyerId, agentId: d.agentId });
        if (k === 'doc') ES.pages.documents.upload({ propertyId: d.propertyId, dealId: d.id });
      };
      v.querySelector('#dnf').onsubmit = function (e) { e.preventDefault(); ES.try(function () { st.addDealNote(d.id, e.target.t.value); }, 'Note added'); };
    }
  };

  /* ======================= SALES ======================= */
  var SU = { q: '', stage: '', agent: '' };
  ES.pages.sales = {
    render: function (v) {
      var sales = st.s.deals.filter(function (d) { return d.kind === 'sale' && !st.prop(d.propertyId).archived; });
      var allSales = st.s.deals.filter(function (d) { return d.kind === 'sale'; });
      var open = sales.filter(function (d) { return d.stage !== 'won' && d.stage !== 'lost'; });
      var q = SU.q.toLowerCase(), now = new Date(), qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      var closedQ = allSales.filter(function (d) { return d.stage === 'won' && new Date(d.closedAt) >= qStart; });
      var wonY = allSales.filter(function (d) { return d.stage === 'won' && now - new Date(d.closedAt) < 365 * DAY; });
      var L = sales.filter(function (d) { var p = st.prop(d.propertyId), b = st.contact(d.buyerId); if (SU.stage && d.stage !== SU.stage) return false; if (SU.agent && d.agentId !== SU.agent) return false; if (q && (d.ref + p.title + (b ? b.name : '')).toLowerCase().indexOf(q) < 0) return false; return true; }).sort(function (a, b) { return ES.STAGES.map(function (x) { return x.id; }).indexOf(b.stage) - ES.STAGES.map(function (x) { return x.id; }).indexOf(a.stage); });
      v.innerHTML = '<header class="ph"><h1>Sales</h1><div class="ph__k">' +
        kq('layers', f.money(open.reduce(function (a, d) { return a + d.value; }, 0), true), 'Open sale pipeline') +
        kq('tag', open.filter(function (d) { return d.stage === 'under_offer' || d.stage === 'contract'; }).length, 'Under offer / contract') +
        kq('trophy', f.money(closedQ.reduce(function (a, d) { return a + d.value; }, 0), true), 'Sold this quarter') +
        kq('chart', f.money(wonY.length ? wonY.reduce(function (a, d) { return a + d.value; }, 0) / wonY.length : 0, true), 'Average sale · 12 months') +
        '</div><div class="ph__a"><button class="btn" data-s="csv">' + I('download', 15) + 'Export</button><a class="btn" href="#/deals">' + I('board', 15) + 'Pipeline board</a><button class="btn btn--dark" data-s="new">' + I('plus', 15) + 'New deal</button></div></header>' +
        '<div class="tb"><label class="tb__s">' + I('search', 15) + '<input type="search" data-sf="q" placeholder="Search deal, property or buyer" value="' + esc(SU.q) + '" aria-label="Search sales"></label>' +
        '<select data-sf="stage" aria-label="Stage"><option value="">All stages</option>' + ES.STAGES.map(function (s) { return '<option value="' + s.id + '"' + (SU.stage === s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('') + '</select>' +
        '<select data-sf="agent" aria-label="Agent"><option value="">All agents</option>' + st.s.team.map(function (u) { return '<option value="' + u.id + '"' + (SU.agent === u.id ? ' selected' : '') + '>' + u.name + '</option>'; }).join('') + '</select><span class="tb__sp"></span><span class="tb__n">' + L.length + ' deals</span></div>' +
        (L.length ? '<div class="t-wrap"><table class="t"><thead><tr><th>Deal</th><th>Property</th><th>Buyer</th><th>Seller</th><th>Stage</th><th class="r">Value</th><th class="r">Rate</th><th class="r">Expected comm.</th><th class="r">Actual comm.</th><th class="r">Prob.</th><th>Expected close</th><th>Agent</th></tr></thead><tbody>' +
          L.map(function (d) { var p = st.prop(d.propertyId), b = st.contact(d.buyerId), s = st.contact(d.sellerId), u = st.user(d.agentId), sg = st.stage(d.stage); return '<tr data-href="#/deal/' + d.id + '"><td><b>' + d.ref + '</b></td><td><span class="t-prop"><img src="' + p.images[0] + '" alt="" loading="lazy"><span><b>' + esc(p.title) + '</b><em>' + esc(p.area) + '</em></span></span></td><td>' + esc(b ? b.name : '—') + '</td><td>' + esc(s ? s.name : '—') + '</td><td>' + ES.pill(sg.short, d.stage === 'won' ? 'green' : d.stage === 'lost' ? 'red' : 'blue') + '</td><td class="r"><b>' + f.money(d.value, true) + '</b></td><td class="r">' + (d.rate != null ? d.rate : st.s.settings.saleRate) + '%</td><td class="r">' + (d.stage === 'won' || d.stage === 'lost' ? '<span class="muted">—</span>' : f.money(st.commission(d), true)) + '</td><td class="r">' + (d.stage === 'won' ? '<b>' + f.money(st.commission(d), true) + '</b>' : '<span class="muted">—</span>') + '</td><td class="r">' + sg.p + '%</td><td>' + f.date(d.closedAt || d.expectedClose) + '</td><td><span class="t-who">' + ES.av(u, 22) + esc(u.name.split(' ')[0]) + '</span></td></tr>'; }).join('') + '</tbody></table></div>' : ES.empty('tag', 'No sales match', 'Try another stage or agent.'));
      v.oninput = function (e) { var el = e.target.closest('[data-sf]'); if (!el) return; SU[el.dataset.sf] = el.value; if (el.dataset.sf === 'q') { clearTimeout(v._t); v._t = setTimeout(function () { ES.app.refresh(); var i = v.querySelector('[data-sf=q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 180); } else ES.app.refresh(); };
      v.onclick = function (e) {
        var b = e.target.closest('[data-s]'), r = e.target.closest('tr[data-href]');
        if (b && b.dataset.s === 'new') newModal({});
        else if (b && b.dataset.s === 'csv') ES.csv('reside-ke-sales.csv', [['Ref', 'Property', 'Buyer', 'Seller', 'Agent', 'Stage', 'Value (KES)', 'Rate %', 'Expected commission (KES)', 'Actual commission (KES)', 'Probability %', 'Expected close', 'Closed']].concat(L.map(function (d) { var won = d.stage === 'won'; return [d.ref, st.prop(d.propertyId).title, (st.contact(d.buyerId) || {}).name, (st.contact(d.sellerId) || {}).name, st.user(d.agentId).name, st.stage(d.stage).name, d.value, d.rate != null ? d.rate : st.s.settings.saleRate, won ? '' : st.commission(d), won ? st.commission(d) : '', st.stage(d.stage).p, f.dateLong(d.expectedClose), d.closedAt ? f.dateLong(d.closedAt) : '']; })));
        else if (r) ES.app.go(r.dataset.href);
      };
    }
  };

  /* ======================= COMMISSIONS ======================= */
  var CU = { agent: '', period: 12, status: '' };
  ES.pages.commissions = {
    redrawOnResize: true,
    render: function (v) {
      var now = Date.now(), yr = 365 * DAY;
      var won = st.wonDeals().filter(function (d) { return now - new Date(d.closedAt) < yr && (!CU.agent || d.agentId === CU.agent); });
      var open = st.openDeals().filter(function (d) { return !CU.agent || d.agentId === CU.agent; });
      var sum = function (arr) { return arr.reduce(function (a, d) { return a + st.commission(d); }, 0); };
      var projected = sum(open), earned = sum(won.filter(function (d) { return d.commissionStatus === 'earned'; })), approved = sum(won.filter(function (d) { return d.commissionStatus === 'approved'; })), paid = sum(won.filter(function (d) { return d.commissionStatus === 'paid'; }));
      var series = st.commissionSeries(CU.period, CU.agent || null), target = st.s.settings.monthlyTarget * (CU.agent ? 1 / 5 : 1);
      var thisM = series[series.length - 1].value;
      var byAgent = st.s.team.map(function (u) { return { u: u, v: sum(won.filter(function (d) { return d.agentId === u.id; })) }; }).filter(function (x) { return x.v; }).sort(function (a, b) { return b.v - a.v; });
      var types = {}; won.forEach(function (d) { var t = st.prop(d.propertyId).type; types[t] = (types[t] || 0) + st.commission(d); });
      var palette = ['#2F5BEA', '#1F9D6A', '#F59E0B', '#7C8CF8', '#0F1729', '#38BDF8'];
      var tParts = Object.keys(types).sort(function (a, b) { return types[b] - types[a]; }).map(function (k, i) { return { label: k, value: types[k], color: palette[i % palette.length] }; });
      var rows = won.filter(function (d) { return !CU.status || d.commissionStatus === CU.status; }).sort(function (a, b) { return new Date(b.closedAt) - new Date(a.closedAt); });
      v.innerHTML = '<header class="ph"><h1>Commissions</h1><div class="ph__a"><select class="sel" data-cf="agent" aria-label="Agent"><option value="">Whole team</option>' + st.s.team.map(function (u) { return '<option value="' + u.id + '"' + (CU.agent === u.id ? ' selected' : '') + '>' + u.name + '</option>'; }).join('') + '</select><button class="btn" data-c="csv">' + I('download', 15) + 'Export CSV</button></div></header>' +
        '<div class="kgrid">' +
        statCard('Projected', f.money(projected, true), open.length + ' open deals · not yet income', 'grey') +
        statCard('Earned', f.money(earned, true), 'Closed, awaiting approval', 'blue') +
        statCard('Approved', f.money(approved, true), 'Ready for payout', 'violet') +
        statCard('Paid · 12 months', f.money(paid, true), 'Recorded as settled', 'green') + '</div>' +
        '<div class="two"><article class="card"><header class="card__h"><span class="card__t">' + I('trend', 16) + 'Commission earned over time</span><span class="seg"><button data-c="p" data-p="6" class="' + (CU.period === 6 ? 'is-on' : '') + '">6M</button><button data-c="p" data-p="12" class="' + (CU.period === 12 ? 'is-on' : '') + '">12M</button></span></header><div class="legend" style="margin-bottom:6px"><span><i class="lg-dot" style="background:var(--blue)"></i>Earned</span><span><i class="lg-dash"></i>Target ' + f.money(target, true) + ' /mo</span></div><div id="cmc"></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('trophy', 16) + 'This month vs target</span></header><div class="stat"><b>' + f.money(thisM, true) + '</b><em>of ' + f.money(target, true) + ' target · ' + Math.round(thisM / target * 100) + '%</em></div><div class="prog" style="margin:12px 0 18px"><i style="width:' + Math.min(100, thisM / target * 100) + '%"></i></div>' +
        '<h3 style="font-size:12.5px;color:var(--ink-3);font-weight:600;margin-bottom:10px">By agent · 12 months</h3>' + (byAgent.length ? ES.chart.hbars(byAgent.map(function (x) { return { html: ES.av(x.u, 20) + esc(x.u.name), value: x.v }; }), { vfmt: function (n) { return f.money(n, true); } }) : '<p class="muted">No closed deals.</p>') + '</article></div>' +
        '<div class="two"><article class="card"><header class="card__h"><span class="card__t">' + I('building', 16) + 'By property type</span></header><div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap">' + ES.chart.donut(tParts, { center: f.money(sum(won), true).replace('KES ', ''), sub: 'KES · 12 months' }) + '<div class="legend" style="flex-direction:column;gap:8px">' + tParts.map(function (x) { return '<span><i class="lg-dot" style="background:' + x.color + '"></i>' + esc(x.label) + ' · <b style="color:var(--ink)">' + f.money(x.value, true) + '</b></span>'; }).join('') + '</div></div></article>' +
        '<article class="card"><header class="card__h"><span class="card__t">' + I('layers', 16) + 'Projected from open deals</span></header>' + (open.length ? ES.chart.hbars(open.slice().sort(function (a, b) { return st.commission(b) - st.commission(a); }).slice(0, 6).map(function (d) { return { label: st.prop(d.propertyId).title, value: st.commission(d), sub: st.stage(d.stage).p + '%', color: st.stage(d.stage).c }; }), { vfmt: function (n) { return f.money(n, true); } }) : '<p class="muted">No open deals.</p>') + '</article></div>' +
        '<div class="tb"><h2 style="font-size:16px;font-weight:650">Commission records</h2><span class="tb__sp"></span><span class="seg">' + [['', 'All'], ['earned', 'Earned'], ['approved', 'Approved'], ['paid', 'Paid']].map(function (o) { return '<button data-c="st" data-v="' + o[0] + '" class="' + (CU.status === o[0] ? 'is-on' : '') + '">' + o[1] + '</button>'; }).join('') + '</span></div>' +
        '<div class="t-wrap"><table class="t"><thead><tr><th>Deal</th><th>Property</th><th>Agent</th><th class="r">Deal value</th><th class="r">Rate</th><th class="r">Commission</th><th>Status</th><th>Closed</th><th></th></tr></thead><tbody>' +
        rows.map(function (d) { var p = st.prop(d.propertyId), u = st.user(d.agentId); return '<tr><td><a class="lnk" href="#/deal/' + d.id + '">' + d.ref + '</a></td><td>' + esc(p.title) + '<span class="t-sub">' + (d.kind === 'rent' ? 'Letting' : 'Sale') + ' · ' + esc(p.type) + '</span></td><td><span class="t-who">' + ES.av(u, 22) + esc(u.name) + '</span></td><td class="r">' + f.money(d.value, true) + '</td><td class="r">' + (d.kind === 'rent' ? st.s.settings.rentMonths + ' mo' : (d.rate != null ? d.rate : st.s.settings.saleRate) + '%') + '</td><td class="r"><b>' + f.money(st.commission(d)) + '</b></td><td>' + ES.pill(d.commissionStatus, { earned: 'blue', approved: 'violet', paid: 'green' }[d.commissionStatus] || 'grey') + '</td><td>' + f.date(d.closedAt) + '</td><td class="r">' + (d.commissionStatus === 'earned' ? '<button class="btn btn--sm" data-c="ap" data-id="' + d.id + '">Approve</button>' : d.commissionStatus === 'approved' ? '<button class="btn btn--sm" data-c="pay" data-id="' + d.id + '">Record paid</button>' : '') + '</td></tr>'; }).join('') +
        '</tbody></table></div>';
      ES.chart.line(v.querySelector('#cmc'), { h: 210, labels: series.map(function (x) { return f.mon(x.date); }), tipLabels: series.map(function (x) { return f.mon(x.date) + ' ' + x.date.getFullYear() + ' · ' + x.count + ' closed'; }), series: [{ values: series.map(function (x) { return x.value; }), color: '#2F5BEA', label: 'Earned' }], target: target, vfmt: function (n) { return f.money(n, true); } });
      v.onchange = function (e) { if (e.target.dataset.cf) { CU.agent = e.target.value; ES.app.refresh(); } };
      v.onclick = function (e) {
        var b = e.target.closest('[data-c]'); if (!b) return; var k = b.dataset.c;
        if (k === 'p') { CU.period = +b.dataset.p; ES.app.refresh(); }
        if (k === 'st') { CU.status = b.dataset.v; ES.app.refresh(); }
        if (k === 'ap') ES.try(function () { st.setCommissionStatus(b.dataset.id, 'approved'); }, 'Commission approved');
        if (k === 'pay') ES.confirm({ title: 'Record commission as paid?', icon: 'wallet', tone: 'green', ok: 'Record as paid', text: 'This marks the commission as settled in Reside Ke. In the demo no payment is made or verified.', onOk: function () { ES.try(function () { st.setCommissionStatus(b.dataset.id, 'paid'); }, 'Commission recorded as paid'); } });
        if (k === 'csv') ES.csv('reside-ke-commissions.csv', [['Deal', 'Property', 'Type', 'Agent', 'Deal value (KES)', 'Rate', 'Commission (KES)', 'Status', 'Closed']].concat(rows.map(function (d) { return [d.ref, st.prop(d.propertyId).title, d.kind, st.user(d.agentId).name, d.value, d.kind === 'rent' ? st.s.settings.rentMonths + ' month(s)' : (d.rate != null ? d.rate : st.s.settings.saleRate) + '%', st.commission(d), d.commissionStatus, f.dateLong(d.closedAt)]; })));
      };
    }
  };
  function statCard(l, v, sub, tone) { return '<article class="card stat"><span>' + ES.pill(l, tone) + '</span><b style="margin-top:6px">' + v + '</b><em>' + sub + '</em></article>'; }
  ES.statCard = statCard;
})();
