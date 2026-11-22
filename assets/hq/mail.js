/* ============================================================
   CIEL ADMIN — Email client for lorna@cielafrica.com (with the
   hello@ alias): read, search, reply, forward, compose, archive,
   delete, star, bulk actions. Live from the real mailbox (IMAP/SMTP).
   ============================================================ */
(function () {
  /* emails Ciel's own website sends for a new contact-form or project-brief lead */
  function isLead(m) { var f = (m.from || [])[0]; return !!f && /^hello@cielafrica\.com$/i.test(f.address || '') && /^New (lead: )?(project brief|enquiry) —/i.test(m.subject || ''); }
  function leadFor(m) { var e = ((m.replyTo || [])[0] || {}).address, l = (H.S && H.S.inbox || []).filter(function (x) { return x.kind !== 'whatsapp' && x.customer && e && String(x.customer.email).toLowerCase() === String(e).toLowerCase(); }).sort(function (a, b) { return b.createdAt - a.createdAt; })[0]; return l; }
  var H, M = { view: 'inbox', folder: 'INBOX', to: '', page: 0, q: '', sel: null, accounts: null, folders: null, list: [], checked: {} };
  var esc = function (s) { return H.esc(s); };
  var IC = {
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>', at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>', send: '<path d="M4 12l16-8-6 16-3-7z"/>', file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>', box: '<path d="M3 7h18v4H3zM5 11v9h14v-9"/><path d="M10 15h4"/>', alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h0"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', x2: '<path d="M6 6l12 12M18 6 6 18"/>', desk: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>', phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>', dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    reply: '<path d="M10 8L4 13l6 5"/><path d="M4 13h10a6 6 0 0 1 6 6"/>', all: '<path d="M8 8l-5 5 5 5"/><path d="M13 8l-5 5 5 5"/><path d="M8 13h7a6 6 0 0 1 6 6"/>', fwd: '<path d="M14 8l6 5-6 5"/><path d="M20 13H10a6 6 0 0 0-6 6"/>', star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', back: '<path d="M15 18l-6-6 6-6"/>', ref: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>', clip: '<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'
  };
  var ic = function (n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; };
  var COLORS = ['#ff5a1f', '#2563eb', '#16a34a', '#9333ea', '#db2777', '#0891b2', '#ca8a04', '#4f46e5'];
  function av(a) { var n = (a && (a.name || a.address)) || '?', h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; var ini = n.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(function (x) { return x[0]; }).slice(0, 2).join('').toUpperCase() || '?'; return '<span class="mx-av" style="background:' + COLORS[h % COLORS.length] + '">' + ini + '</span>'; }
  var who = function (l) { return (l || []).map(function (x) { return x.name || x.address; }).join(', '); };
  var full = function (l) { return (l || []).map(function (x) { return x.name ? x.name + ' <' + x.address + '>' : x.address; }).join(', '); };
  function when(t) { var d = new Date(t), n = new Date(); return d.toDateString() === n.toDateString() ? d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : d.getFullYear() === n.getFullYear() ? d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' }); }
  function qs(o) { return Object.keys(o).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&'); }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function box() { var a = (M.accounts || []).filter(function (x) { return x.configured && !x.alias; })[0]; return a ? a.id : 'lorna'; }
  function sentLike() { return M.folders && M.folder === M.folders.sent; }

  function setupCard() {
    return '<div class="card card__b mx-setup"><h2 style="font-size:1rem">Connect lorna@cielafrica.com</h2><p class="muted" style="margin:.4rem 0 .8rem">Add <code>MAIL_LORNA_PASSWORD</code> (the password of lorna@cielafrica.com) in Vercel → Settings → Environment Variables, then redeploy. The servers are already set (workplace.truehost.cloud). hello@ arrives in the same mailbox and can be chosen as the sender.</p></div>';
  }

  function render(el) {
    M.el = el;
    (M.accounts ? Promise.resolve() : H.api('/api/hq?route=mail-accounts').then(function (r) { M.accounts = r.accounts; M.mail = r.mail || null; })).then(function () {
      if (!M.accounts.some(function (a) { return a.configured; })) { el.innerHTML = setupCard(); return; }
      el.innerHTML = '<div class="mx2"><aside class="mx2-nav"><button class="b b--p mx2-new" id="mxNew">' + ic('pen') + '<span>Compose</span></button><div class="mx2-acct"><span>Mailbox</span><b>lorna@cielafrica.com</b><small>' + (addrs().length ? 'also gets ' + addrs().map(function (a) { return esc(addrLabel(a)) + '@'; }).join(', ') : '') + '</small></div><nav id="mxNav"></nav></aside>' +
        '<section class="mx2-list"><div class="mx2-lh"><label class="mx2-chk" title="Select all"><input type="checkbox" id="mxAll"></label><div class="mx2-bulk" id="mxBulk" hidden><button class="b b--sm" data-bulk="archive">Archive</button><button class="b b--sm" data-bulk="read">Mark read</button><button class="b b--sm" data-bulk="unread">Unread</button><button class="b b--sm" data-bulk="trash">Delete</button></div><label class="mx2-q" id="mxQw">' + ic('search') + '<input id="mxQ" type="search" placeholder="Search mail" value="' + esc(M.q) + '"></label><button class="b b--sm b--ghost mx2-icon" id="mxRf" title="Refresh">' + ic('ref') + '</button></div><div id="mxItems" class="mx2-items"></div></section>' +
        '<section class="mx2-read" id="mxRead"><div class="mx2-empty">' + ic('mail') + '<p>Select an email to read it</p></div></section></div>';
      el.querySelector('#mxNew').onclick = function () { compose({}); };
      el.querySelector('#mxRf').onclick = function () { load(); };
      var qi = el.querySelector('#mxQ'), qt; qi.oninput = function () { clearTimeout(qt); qt = setTimeout(function () { M.q = qi.value.trim(); M.page = 0; load(); }, 450); };
      el.querySelector('#mxAll').onchange = function () { var on = this.checked; M.checked = {}; if (on) M.list.forEach(function (m) { M.checked[m.uid] = 1; }); paintList(); };
      el.querySelectorAll('[data-bulk]').forEach(function (b) { b.onclick = function () { bulk(b.getAttribute('data-bulk')); }; });
      nav(); load();
    }, function (e) { el.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
  }
  /* addresses that land in this mailbox (hello@ and any added under Addresses): categories and senders */
  function addrs() { return (M.accounts || []).filter(function (a) { return a.alias && a.configured !== false; }); }
  function addrColor(a) { return a.color || (a.id === 'hello' ? '#2F5BEA' : '#6D55D9'); }
  function addrLabel(a) { return a.label || a.email.split('@')[0]; }
  function tagFor(m) {
    var to = (m.to || []).concat(m.cc || []).map(function (t) { return String(t.address || '').toLowerCase(); });
    var a = addrs().filter(function (x) { return to.indexOf(x.email) >= 0; })[0];
    return a ? '<span class="mx2-tag" style="--tc:' + addrColor(a) + '">' + esc(addrLabel(a)) + '@</span>' : '';
  }
  function nav() {
    var n = document.getElementById('mxNav'); if (!n) return;
    var top = [['inbox', 'Inbox', 'inbox', 'INBOX', '']];
    var cats = addrs().map(function (a) { return ['to:' + a.id, addrLabel(a) + '@', 'at', 'INBOX', a.id, addrColor(a)]; });
    var paint = function (f) {
      var fl = []; if (f) [['sent', 'Sent', 'send'], ['drafts', 'Drafts', 'file'], ['archive', 'Archive', 'box'], ['junk', 'Spam', 'alert'], ['trash', 'Trash', 'trash']].forEach(function (x) { if (f[x[0]]) fl.push([x[0], x[1], x[2], f[x[0]], '']); });
      var btn = function (x) { return '<button class="mx2-f' + (M.view === x[0] ? ' is-on' : '') + '" data-v="' + esc(x[0]) + '" data-f="' + esc(x[3]) + '" data-to="' + esc(x[4]) + '">' + (x[5] ? '<span class="mx2-dot" style="background:' + x[5] + '"></span>' : ic(x[2])) + '<span>' + esc(x[1]) + '</span>' + (x[0] === 'inbox' && M.unseen ? '<i>' + M.unseen + '</i>' : '') + '</button>'; };
      n.innerHTML = top.map(btn).join('') + '<p class="mx2-nh">Addresses</p>' + cats.map(btn).join('') + '<button class="mx2-f mx2-add" id="mxAdd">' + ic('plus') + '<span>Add an address</span></button>' + (fl.length ? '<p class="mx2-nh">Folders</p>' + fl.map(btn).join('') : '');
      n.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { M.view = b.getAttribute('data-v'); M.folder = b.getAttribute('data-f'); M.to = b.getAttribute('data-to'); M.page = 0; M.sel = null; M.checked = {}; nav(); load(); M.el.querySelector('.mx2').classList.remove('is-reading'); }; });
      n.querySelector('#mxAdd').onclick = addrModal;
    };
    if (M.folders) paint(M.folders);
    else { paint(null); H.api('/api/hq?route=mail-folders&acct=' + box()).then(function (f) { M.folders = f; paint(f); }, function () { }); }
  }
  function saveMail(v) { return H.api('/api/hq?route=mail-settings', { v: v }).then(function (r) { M.mail = r.value; return H.api('/api/hq?route=mail-accounts').then(function (x) { M.accounts = x.accounts; M.mail = x.mail || M.mail; return r.value; }); }); }
  /* Addresses: other emails that arrive in this mailbox (e.g. sales@ forwarded here by Truehost) */
  function addrModal() {
    var st = JSON.parse(JSON.stringify(M.mail || { aliases: [], signatures: {}, design: {} })), SW = ['#2F5BEA', '#6D55D9', '#1F9D6A', '#F08A24', '#DC3B30', '#0EA5A4', '#D6336C', '#64748B'];
    var m = H.modal('<div class="mxa"><div class="row" style="justify-content:space-between"><h2>Email addresses</h2><button class="b b--sm b--ghost" data-x>' + H.I.x + '</button></div>' +
      '<p class="muted" style="font-size:.84rem">Addresses that deliver into lorna@cielafrica.com. Each becomes a category in the inbox and a “From” you can send as. Create the address (or alias/forward) in your email host first, pointing to lorna@.</p><div id="mxaL"></div>' +
      '<div class="mxa-new"><b>Add an address</b><div class="g2"><label class="field"><span>Email address</span><input class="hq-in" id="aE" type="email" placeholder="sales@cielafrica.com"></label><label class="field"><span>Category name</span><input class="hq-in" id="aL" maxlength="30" placeholder="Sales"></label>' +
      '<label class="field"><span>Name people see when you send</span><input class="hq-in" id="aN" maxlength="60" placeholder="Ciel Africa Sales"></label><div class="field"><span>Colour</span><div class="mxa-sw" id="aC">' + SW.map(function (c, i) { return '<button type="button" data-c="' + c + '" style="background:' + c + '"' + (i === 1 ? ' class="is-on"' : '') + '></button>'; }).join('') + '</div></div></div>' +
      '<button class="b b--p" id="aS">' + H.I.plus + '<span>Add address</span></button></div></div>');
    m.querySelector('.modal__p').classList.add('mxa-modal');
    var col = SW[1];
    m.querySelectorAll('#aC [data-c]').forEach(function (b) { b.onclick = function () { col = b.getAttribute('data-c'); m.querySelectorAll('#aC [data-c]').forEach(function (x) { x.classList.toggle('is-on', x === b); }); }; });
    var paint = function () {
      var L = m.querySelector('#mxaL'), built = (M.accounts || []).filter(function (a) { return !a.extra; });
      L.innerHTML = '<div class="mxa-l">' + built.map(function (a) { return '<div class="mxa-i"><span class="mx2-dot" style="background:' + addrColor(a) + '"></span><span><b>' + esc(a.email) + '</b><small>' + (a.alias ? 'Category “' + esc(addrLabel(a)) + '@” · built in' : 'Main mailbox') + '</small></span></div>'; }).join('') +
        st.aliases.map(function (a, i) { return '<div class="mxa-i"><span class="mx2-dot" style="background:' + (a.color || '#6D55D9') + '"></span><span><b>' + esc(a.email) + '</b><small>Category “' + esc(a.label || a.email.split('@')[0]) + '@”' + (a.name ? ' · sends as ' + esc(a.name) : '') + '</small></span><button class="b b--sm b--ghost" data-rm="' + i + '" title="Remove">' + H.I.x + '</button></div>'; }).join('') + '</div>';
      L.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { st.aliases.splice(+b.getAttribute('data-rm'), 1); saveMail(st).then(function () { paint(); nav(); H.toast('Removed', 'ok'); }, function (e) { H.toast(e.message, 'err'); }); }; });
    };
    paint();
    m.querySelector('#aS').onclick = function () {
      var e = m.querySelector('#aE').value.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) { H.toast('Enter a full email address', 'err'); return; }
      if ((M.accounts || []).some(function (a) { return a.email === e; }) || st.aliases.some(function (a) { return a.email === e; })) { H.toast('That address is already here', 'err'); return; }
      st.aliases.push({ email: e, label: m.querySelector('#aL').value.trim() || e.split('@')[0], name: m.querySelector('#aN').value.trim() || 'Ciel Africa', color: col });
      this.disabled = true; var bt = this;
      saveMail(st).then(function () { bt.disabled = false; ['#aE', '#aL', '#aN'].forEach(function (s) { m.querySelector(s).value = ''; }); paint(); nav(); H.toast('Address added', 'ok'); }, function (er) { bt.disabled = false; st.aliases.pop(); H.toast(er.message, 'err'); });
    };
  }
  function load() {
    var bx = document.getElementById('mxItems'); if (!bx) return;
    bx.innerHTML = Array(7).join('<div class="mx2-it is-sk"><span class="mx-av sk"></span><div><i class="sk" style="width:40%"></i><i class="sk" style="width:80%"></i><i class="sk" style="width:65%"></i></div></div>');
    H.api('/api/hq?route=mail-list&' + qs({ acct: box(), folder: M.folder, page: M.page, q: M.q, to: M.to })).then(function (r) {
      M.list = r.items; M.total = r.total; if (M.view === 'inbox' && !M.q) { M.unseen = r.unseen || M.list.filter(function (m) { return !m.seen; }).length; }
      paintList();
    }, function (e) { bx.innerHTML = '<p class="mx-err">' + esc(e.message) + '</p>'; });
  }
  function paintList() {
    var bx = document.getElementById('mxItems'); if (!bx) return;
    var nChk = Object.keys(M.checked).length;
    document.getElementById('mxBulk').hidden = !nChk; document.getElementById('mxQw').hidden = !!nChk;
    bx.innerHTML = (M.list.length ? M.list.map(function (m, i) {
      var other = sentLike() ? m.to : m.from, toHello = !sentLike() && (m.to || []).some(function (x) { return /^hello@cielafrica\.com$/i.test(x.address); });
      return '<div class="mx2-it' + (m.seen ? '' : ' is-new') + (isLead(m) ? ' is-lead' : '') + (M.sel && M.sel.uid === m.uid ? ' is-on' : '') + '" data-i="' + i + '"><label class="mx2-chk" data-stop><input type="checkbox" data-c="' + m.uid + '"' + (M.checked[m.uid] ? ' checked' : '') + '></label>' + av(other[0]) +
        '<div class="mx2-m"><div class="mx2-r1"><b>' + esc((sentLike() ? 'To: ' : '') + (who(other) || '(unknown)')) + '</b><time>' + when(m.date) + '</time></div><div class="mx2-r2">' + (m.flagged ? '<span class="mx2-star">★</span>' : '') + esc(m.subject) + (m.attachments ? ' <span class="mx2-clip">' + ic('clip') + '</span>' : '') + '</div><div class="mx2-r3">' + (isLead(m) ? '<span class="mx2-tag mx2-tag--lead">Lead · high priority</span>' : '') + (sentLike() ? '' : tagFor(m)) + esc(m.snippet || '') + '</div></div>' +
        '<div class="mx2-hover" data-stop><button title="Archive" data-q="archive">' + ic('box') + '</button><button title="Delete" data-q="trash">' + ic('trash') + '</button><button title="' + (m.seen ? 'Mark unread' : 'Mark read') + '" data-q="' + (m.seen ? 'unread' : 'read') + '">' + ic('mail') + '</button></div></div>';
    }).join('') : '<div class="mx2-empty" style="padding:3rem 1rem">' + ic('inbox') + '<p>' + (M.q ? 'No emails match “' + esc(M.q) + '”.' : 'Nothing here.') + '</p></div>') +
      (M.total > (M.page + 1) * 30 || M.page ? '<div class="mx2-pg"><button class="b b--sm" id="mxPrev"' + (M.page ? '' : ' disabled') + '>Newer</button><span>' + (M.page * 30 + 1) + '–' + Math.min(M.total, (M.page + 1) * 30) + ' of ' + M.total + '</span><button class="b b--sm" id="mxNext"' + (M.total > (M.page + 1) * 30 ? '' : ' disabled') + '>Older</button></div>' : '');
    bx.querySelectorAll('.mx2-it[data-i]').forEach(function (row) {
      row.onclick = function (e) { if (e.target.closest('[data-stop]')) return; var m = M.list[+row.getAttribute('data-i')]; M.sel = m; m.seen = true; paintList(); open(m); };
      row.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { var m = M.list[+row.getAttribute('data-i')]; act([m.uid], b.getAttribute('data-q')); }; });
    });
    bx.querySelectorAll('[data-c]').forEach(function (c) { c.onchange = function () { if (c.checked) M.checked[c.getAttribute('data-c')] = 1; else delete M.checked[c.getAttribute('data-c')]; paintList(); }; });
    var pv = bx.querySelector('#mxPrev'), nx = bx.querySelector('#mxNext');
    if (pv) pv.onclick = function () { M.page--; load(); }; if (nx) nx.onclick = function () { M.page++; load(); };
  }
  function act(uids, op) {
    (op === 'trash' ? HQAsk.confirm(uids.length > 1 ? 'Delete ' + uids.length + ' emails?' : 'Delete this email?') : Promise.resolve(true)).then(function (ok) { if (!ok) return; return H.api('/api/hq?route=mail-act', { acct: box(), folder: M.folder, uids: uids, op: op }).then(function () {
      H.toast({ archive: 'Archived', trash: 'Deleted', unread: 'Marked unread', read: 'Marked read', star: 'Starred', unstar: 'Star removed', spam: 'Moved to spam' }[op]);
      if (/archive|trash|spam/.test(op)) { M.list = M.list.filter(function (m) { return uids.indexOf(m.uid) < 0; }); if (M.sel && uids.indexOf(M.sel.uid) >= 0) { M.sel = null; document.getElementById('mxRead').innerHTML = '<div class="mx2-empty">' + ic('mail') + '<p>Select an email to read it</p></div>'; M.el.querySelector('.mx2').classList.remove('is-reading'); } }
      else M.list.forEach(function (m) { if (uids.indexOf(m.uid) >= 0) { if (op === 'read') m.seen = true; if (op === 'unread') m.seen = false; if (op === 'star') m.flagged = true; if (op === 'unstar') m.flagged = false; } });
      M.checked = {}; paintList(); poll();
    }, function (e) { H.toast(e.message); }); });
}
  function bulk(op) { var u = Object.keys(M.checked).map(Number); if (u.length) act(u, op); }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function ago(t) { var s = (Date.now() - t) / 1000; return s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : s < 7 * 86400 ? Math.round(s / 86400) + ' day' + (s < 172800 ? '' : 's') + ' ago' : ''; }
  function fileIc(a) { var n = String(a.name || '').toLowerCase(), t = String(a.type || ''); return /pdf/.test(t + n) ? ['PDF', '#DC3B30'] : /image|\.(png|jpe?g|gif|webp)$/.test(t + n) ? ['IMG', '#1F9D6A'] : /word|\.docx?$/.test(t + n) ? ['DOC', '#2F5BEA'] : /sheet|excel|\.xlsx?$|\.csv$/.test(t + n) ? ['XLS', '#1F9D6A'] : /zip|rar/.test(t + n) ? ['ZIP', '#C46A0E'] : ['FILE', '#64748B']; }
  /* one email, laid out like a real mail app: subject, who and when, files, then the message on its own page */
  function open(s) {
    var el = document.getElementById('mxRead'); M.el.querySelector('.mx2').classList.add('is-reading');
    el.innerHTML = '<div class="mx2-loading"><i class="sk" style="width:60%;height:22px"></i><i class="sk" style="width:40%"></i><i class="sk" style="height:200px"></i></div>';
    H.api('/api/hq?route=mail-read&' + qs({ acct: box(), folder: s.folder, uid: s.uid })).then(function (r) {
      var m = r.message; M.cur = m; var f0 = m.from[0] || { address: '' }, d = new Date(m.date);
      var url = function (a) { return '/api/hq?route=mail-att&' + qs({ acct: box(), folder: m.folder, uid: m.uid, i: a.i }); };
      el.innerHTML = '<div class="rd"><div class="rd-bar"><button class="rd-ib rd-back" id="mxBack" title="Back">' + ic('back') + '</button>' +
        [['reply', 'Reply', 'reply'], ['all', 'Reply all', 'all'], ['fwd', 'Forward', 'fwd']].map(function (a) { return '<button class="rd-ib rd-ib--t" data-a="' + a[0] + '" title="' + a[1] + '">' + ic(a[2]) + '<span>' + a[1] + '</span></button>'; }).join('') + '<span class="rd-sp"></span>' +
        [['archive', 'Archive', 'box'], ['trash', 'Delete', 'trash'], ['unread', 'Mark unread', 'mail'], [m.flagged ? 'unstar' : 'star', m.flagged ? 'Remove star' : 'Star', 'star']].map(function (a) { return '<button class="rd-ib' + (a[0] === 'unstar' ? ' is-on' : '') + '" data-o="' + a[0] + '" title="' + a[1] + '">' + ic(a[2]) + '</button>'; }).join('') + '</div>' +
        '<div class="rd-sc">' + (isLead(m) ? (function () { var l = leadFor(m); return '<div class="mx2-lead"><span><b>New website lead · high priority.</b> ' + (l ? 'It’s in Leads, where you can set its stage, follow-up date and notes.' : 'It’s in Leads.') + '</span><a class="b b--p b--sm" href="#leads' + (l ? '/' + esc(l.id) : '') + '">Open in Leads</a></div>'; })() : '') +
        '<div class="rd-h"><h2>' + esc(m.subject) + '</h2>' + tagFor(m) + (m.flagged ? '<span class="rd-star">★</span>' : '') + '</div>' +
        '<div class="rd-from">' + av(f0).replace('mx-av', 'mx-av rd-av') + '<div class="rd-who"><b>' + esc(f0.name || f0.address || '(unknown)') + '</b>' + (f0.name ? '<span>' + esc(f0.address) + '</span>' : '') + '<small>to ' + esc(who(m.to)) + (m.cc.length ? ' · cc ' + esc(who(m.cc)) : '') + (m.replyTo && m.replyTo.length && m.replyTo[0].address !== f0.address ? ' · replies go to ' + esc(m.replyTo[0].address) : '') + '</small></div>' +
        '<div class="rd-when"><b>' + d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) + '</b>' + (ago(m.date) ? '<small>' + ago(m.date) + '</small>' : '') + '</div></div>' +
        (m.attachments.length ? '<div class="rd-files"><p>' + m.attachments.length + ' attachment' + (m.attachments.length > 1 ? 's' : '') + '</p><div class="rd-fg">' + m.attachments.map(function (a) { var t = fileIc(a); return '<a class="rd-file" href="' + url(a) + '" title="Download ' + esc(a.name) + '"><span class="rd-ft" style="--fc:' + t[1] + '">' + t[0] + '</span><span class="rd-fm"><b>' + esc(a.name) + '</b><small>' + size(a.size) + '</small></span>' + ic('dl') + '</a>'; }).join('') + '</div></div>' : '') +
        '<div class="rd-paper"><iframe class="mx2-body" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Email message"></iframe></div>' +
        '<div class="rd-rep"><button class="b" data-a="reply">' + ic('reply') + '<span>Reply</span></button>' + ((m.to.length + m.cc.length) > 1 ? '<button class="b" data-a="all">' + ic('all') + '<span>Reply all</span></button>' : '') + '<button class="b" data-a="fwd">' + ic('fwd') + '<span>Forward</span></button></div></div></div>';
      var f = el.querySelector('.mx2-body');
      var plain = !m.html;
      f.srcdoc = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;background:#fff}body{font:15px/1.65 Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#1F2430;padding:' + (plain ? '22px 24px' : '0') + ';word-wrap:break-word;overflow-wrap:anywhere;-webkit-text-size-adjust:100%}' + (plain ? '' : 'body>*:first-child:not(table):not(center){margin-top:20px}body>div:not([style*=width]),body>p{padding:0 22px}') + 'img{max-width:100%!important;height:auto!important}pre{white-space:pre-wrap;font:13px/1.6 ui-monospace,Menlo,monospace;margin:0}a{color:#2F5BEA}table{max-width:100%}blockquote{border-left:3px solid #E4E7EF;margin:12px 0 0;padding-left:14px;color:#5B6478}p{margin:0 0 12px}</style>' + (m.html || '<pre style="font:15px/1.65 Inter,system-ui,Arial,sans-serif">' + esc(m.text) + '</pre>');
      /* fit: wide newsletters are scaled to the reading width instead of being cut off */
      var fit = function () { try { var dd = f.contentDocument; if (!dd || !dd.body) return; dd.body.style.zoom = ''; var w = f.clientWidth, sw = dd.documentElement.scrollWidth; if (sw > w + 4) dd.body.style.zoom = String(Math.max(.45, w / sw)); f.style.height = Math.max(180, Math.ceil(dd.documentElement.scrollHeight * (+dd.body.style.zoom || 1)) + 6) + 'px'; } catch (e) { f.style.height = '520px'; } };
      f.onload = function () { fit(); setTimeout(fit, 400); setTimeout(fit, 1500); };
      window.addEventListener('resize', fit);
      el.querySelector('#mxBack').onclick = function () { M.el.querySelector('.mx2').classList.remove('is-reading'); };
      el.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { reply(m, b.getAttribute('data-a')); }; });
      el.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { act([m.uid], b.getAttribute('data-o')).then(function () { if (/star/.test(b.getAttribute('data-o'))) open(m); }); }; });
      poll();
    }, function (e) { el.innerHTML = '<p class="mx-err">' + esc(e.message) + '</p>'; });
  }
  /* ---------- emails that look like Ciel Africa: designs, colour, logo, signature ---------- */
  var LOGO_D = 'https://cielafrica.com/assets/img/logo-dark.png?v=20261021i', LOGO_L = 'https://cielafrica.com/assets/img/logo-light.png?v=20261108';
  var LOOKS = [['letter', 'Letter', 'Logo on top, white card'], ['announce', 'Announcement', 'Bold colour banner'], ['minimal', 'Minimal', 'Clean, with an accent'], ['plain', 'Plain', 'Like a normal email']];
  var ACCENTS = ['#2F5BEA', '#0F1729', '#FF5A1F', '#1F9D6A', '#6D55D9', '#D6336C', '#0EA5A4', '#C46A0E'];
  var FONT = 'Arial,Helvetica,sans-serif';
  function ea(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sigFor(id) {
    var acc = (M.accounts || []).filter(function (a) { return a.id === id; })[0] || {}, me = (H.me && H.me()) || {}, g = ((M.mail || {}).signatures || {})[id];
    var nm = acc.alias ? (acc.name || 'Ciel Africa') : (me.name || 'Lorna');
    return g || { on: true, name: nm, title: acc.alias ? '' : 'Lead Developer & Creative Director', company: /ciel africa/i.test(nm) ? '' : 'Ciel Africa', phone: '+254117959105', email: acc.email || '', web: 'cielafrica.com', tagline: '', logo: true, accent: '' };
  }
  function sigHtml(g, A) {
    if (!g || g.on === false) return '';
    A = g.accent || A || '#2F5BEA';
    var links = [g.phone ? '<a href="tel:' + ea(g.phone.replace(/[^\d+]/g, '')) + '" style="color:' + A + ';text-decoration:none">' + ea(g.phone) + '</a>' : '', g.email ? '<a href="mailto:' + ea(g.email) + '" style="color:' + A + ';text-decoration:none">' + ea(g.email) + '</a>' : '', g.web ? '<a href="https://' + ea(g.web.replace(/^https?:\/\//, '')) + '" style="color:' + A + ';text-decoration:none">' + ea(g.web.replace(/^https?:\/\//, '')) + '</a>' : ''].filter(Boolean).join('<span style="color:#C3C8D4">&nbsp;&nbsp;|&nbsp;&nbsp;</span>');
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>' +
      (g.logo !== false ? '<td style="padding:2px 16px 2px 0;border-right:2px solid ' + A + ';vertical-align:middle"><img src="' + LOGO_D + '" alt="Ciel Africa" width="92" style="display:block;width:92px;height:auto;border:0"></td>' : '') +
      '<td style="padding:2px 0 2px ' + (g.logo !== false ? '16px' : '0') + ';vertical-align:middle;font-family:' + FONT + '">' +
      (g.name ? '<div style="font-size:15px;line-height:1.3;font-weight:bold;color:#0F1729">' + ea(g.name) + '</div>' : '') +
      (g.title || g.company ? '<div style="font-size:13px;line-height:1.4;color:#5B6478">' + ea([g.title, g.company].filter(Boolean).join(' · ')) + '</div>' : '') +
      (links ? '<div style="font-size:13px;line-height:1.6;margin-top:6px">' + links + '</div>' : '') +
      (g.tagline ? '<div style="font-size:12px;line-height:1.5;color:#8A93A8;font-style:italic;margin-top:4px">' + ea(g.tagline) + '</div>' : '') + '</td></tr></table>';
  }
  /* full width on phones (no side margins, no squeezed column), a 640px card on computers */
  function emailHtml(o) {
    var A = o.accent || '#2F5BEA', look = o.look || 'letter', head = o.heading ? ea(o.heading) : '';
    var btn = o.btnLabel && /^https?:\/\/./.test(o.btnUrl || '') ? '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 4px"><tr><td style="border-radius:10px;background:' + A + '"><a href="' + ea(o.btnUrl) + '" style="display:inline-block;padding:14px 26px;font:bold 15px ' + FONT + ';color:#ffffff;text-decoration:none;border-radius:10px">' + ea(o.btnLabel) + '</a></td></tr></table>' : '';
    var text = '<div style="font:15px/1.65 ' + FONT + ';color:#1F2430">' + (o.body || '') + '</div>' + btn;
    var sig = o.sig ? '<div style="margin-top:28px;padding-top:20px;border-top:1px solid #E7E9F0">' + o.sig + '</div>' : '';
    var css = '<style>body{margin:0;padding:0}img{border:0;max-width:100%}a{color:' + A + '}p{margin:0 0 14px}@media only screen and (max-width:620px){.outer{padding:0!important}.card{border-radius:0!important;width:100%!important;max-width:100%!important;border-left:0!important;border-right:0!important}.pad{padding-left:20px!important;padding-right:20px!important}.h1{font-size:24px!important}}</style>';
    var doc = function (bg, inner) { return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only">' + css + '</head><body style="margin:0;padding:0;background:' + bg + ';-webkit-text-size-adjust:100%">' + (o.pre ? '<div style="display:none;max-height:0;overflow:hidden">' + ea(o.pre) + '</div>' : '') + inner + '</body></html>'; };
    if (look === 'plain') return doc('#ffffff', '<div style="padding:4px 2px;font:15px/1.65 ' + FONT + ';color:#1F2430">' + text + (o.sig ? '<div style="margin-top:22px">' + o.sig + '</div>' : '') + (o.quote || '') + '</div>');
    var top = look === 'announce'
      ? '<tr><td class="pad" style="background:' + A + ';padding:28px 40px 36px"><img src="' + LOGO_L + '" alt="Ciel Africa" height="30" style="display:block;height:30px;width:auto;border:0">' + (head ? '<div class="h1" style="font:bold 30px/1.2 ' + FONT + ';color:#ffffff;margin-top:28px">' + head + '</div>' : '') + '</td></tr>'
      : look === 'letter'
        ? '<tr><td style="height:5px;line-height:5px;font-size:0;background:' + A + '">&nbsp;</td></tr><tr><td class="pad" style="padding:28px 40px 6px"><img src="' + LOGO_D + '" alt="Ciel Africa" height="30" style="display:block;height:30px;width:auto;border:0"></td></tr>' + (head ? '<tr><td class="pad h1" style="padding:18px 40px 0;font:bold 26px/1.25 ' + FONT + ';color:#0F1729">' + head + '</td></tr>' : '')
        : (head ? '<tr><td class="pad" style="padding:34px 40px 0"><div class="h1" style="border-left:4px solid ' + A + ';padding-left:14px;font:bold 24px/1.3 ' + FONT + ';color:#0F1729">' + head + '</div></td></tr>' : '');
    var foot = look === 'minimal' ? '' : '<tr><td class="pad" style="padding:18px 40px;background:#F7F8FB;border-top:1px solid #EEF0F5;font:12px/1.6 ' + FONT + ';color:#8A93A8">Ciel Africa &nbsp;·&nbsp; <a href="https://cielafrica.com" style="color:#8A93A8;text-decoration:none">cielafrica.com</a> &nbsp;·&nbsp; +254117959105</td></tr>';
    var bg = look === 'minimal' ? '#ffffff' : '#F1F3F8';
    return doc(bg, '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + bg + '"><tr><td class="outer" align="center" style="padding:32px 16px">' +
      '<table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;' + (look === 'minimal' ? '' : 'border:1px solid #E7E9F0') + '">' + top +
      '<tr><td class="pad" style="padding:' + (head || look === 'announce' ? '22px' : '30px') + ' 40px 34px">' + text + sig + (o.quote || '') + '</td></tr>' + foot + '</table></td></tr></table>');
  }
  function quote(m) { var d = new Date(m.date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }); return '<div style="margin-top:26px;font:13px/1.6 ' + FONT + ';color:#8A93A8">On ' + esc(d) + ', ' + esc(full(m.from)) + ' wrote:</div><blockquote style="border-left:3px solid #E4E7EF;margin:8px 0 0;padding-left:14px;color:#5B6478">' + (m.html ? m.html.replace(/<(script|style|head|title)[\s\S]*?<\/\1>/gi, '').replace(/<\/?(html|body|meta|link)[^>]*>/gi, '') : esc(m.text).replace(/\n/g, '<br>')) + '</blockquote>'; }
  function reply(m, kind) {
    var mine = (M.accounts || []).map(function (a) { return a.email; }), re = function (s) { return /^(re|fwd?):/i.test(s) ? s : (kind === 'fwd' ? 'Fwd: ' : 'Re: ') + s; };
    var got = (m.to || []).concat(m.cc || []).map(function (x) { return String(x.address).toLowerCase(); }), via = (M.accounts || []).filter(function (a) { return a.alias && got.indexOf(a.email) >= 0; })[0];
    var to = kind === 'fwd' ? '' : full(m.replyTo.length ? m.replyTo : m.from);
    var cc = kind === 'all' ? full(m.to.concat(m.cc).filter(function (x) { return mine.indexOf(String(x.address).toLowerCase()) < 0; })) : '';
    compose({ acct: via ? via.id : 'lorna', to: to, cc: cc, subject: re(m.subject), quote: quote(m), look: 'plain', inReplyTo: kind === 'fwd' ? '' : m.messageId, references: kind === 'fwd' ? [] : (m.references || []).concat(m.messageId ? [m.messageId] : []) });
  }
  function compose(o) {
    var ids = (M.accounts || []).filter(function (a) { return a.configured; }), acct = o.acct || 'lorna', atts = [];
    var DZ = (M.mail && M.mail.design) || {}, st = { look: o.look || DZ.look || 'letter', accent: DZ.accent || '#2F5BEA', heading: '', btnLabel: '', btnUrl: '', sig: true, dev: 'desktop' };
    var d = H.modal('<div class="cx"><div class="cx-h"><b>' + (o.subject ? esc(o.subject) : 'New email') + '</b><div class="tabs cx-mode" id="cxM"><button type="button" class="is-on" data-m="w">' + ic('pen') + '<span>Write</span></button><button type="button" data-m="p">' + ic('eye') + '<span>Preview</span></button></div><button class="b b--sm b--ghost" data-x>✕</button></div>' +
      '<div class="cx-g"><div class="cx-w">' +
      '<div class="cx-fs"><label class="cx-f"><span>From</span><select id="cFrom">' + ids.map(function (a) { return '<option value="' + a.id + '"' + (a.id === acct ? ' selected' : '') + '>' + esc((a.name && a.alias ? a.name + ' · ' : '') + a.email) + '</option>'; }).join('') + '</select></label>' +
      '<label class="cx-f"><span>To</span><input id="cTo" value="' + esc(o.to || '') + '" placeholder="name@example.com" autocomplete="email"><button type="button" class="cx-ccb" id="cCcB">Cc / Bcc</button></label>' +
      '<label class="cx-f" id="cCcR"' + (o.cc ? '' : ' hidden') + '><span>Cc</span><input id="cCc" value="' + esc(o.cc || '') + '"></label><label class="cx-f" id="cBcR" hidden><span>Bcc</span><input id="cBcc"></label>' +
      '<label class="cx-f"><span>Subject</span><input id="cSub" value="' + esc(o.subject || '') + '" placeholder="What’s it about?"></label></div>' +
      '<div class="cx-dz"><div class="cx-looks" id="cLooks">' + LOOKS.map(function (l) { return '<button type="button" class="cx-look cx-look--' + l[0] + (st.look === l[0] ? ' is-on' : '') + '" data-l="' + l[0] + '"><i><em></em><u></u><u></u><u></u></i><b>' + l[1] + '</b><small>' + l[2] + '</small></button>'; }).join('') + '</div>' +
      '<div class="cx-acc"><span>Colour</span><div id="cAcc">' + ACCENTS.map(function (c) { return '<button type="button" data-a="' + c + '" style="background:' + c + '"' + (c.toLowerCase() === st.accent.toLowerCase() ? ' class="is-on"' : '') + ' aria-label="Colour ' + c + '"></button>'; }).join('') + '</div></div></div>' +
      '<label class="cx-f cx-f--hd" id="cHdR"><span>Heading</span><input id="cHd" maxlength="120" placeholder="Optional big title, e.g. Your website proposal"></label>' +
      '<div class="cx-tb">' + [['bold', '<b>B</b>', 'Bold'], ['italic', '<i>I</i>', 'Italic'], ['underline', '<u>U</u>', 'Underline'], ['formatBlock', 'H', 'Sub-heading'], ['insertUnorderedList', '•', 'Bullet list'], ['insertOrderedList', '1.', 'Numbered list'], ['createLink', ic('link'), 'Link'], ['removeFormat', ic('x2'), 'Clear formatting']].map(function (t) { return '<button type="button" data-c="' + t[0] + '" title="' + t[2] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="cx-ed" id="cBody" contenteditable="true" data-ph="Write your message…"></div>' +
      '<div class="cx-btn" id="cBtnR" hidden><input id="cBl" maxlength="40" placeholder="Button text, e.g. View proposal"><input id="cBu" type="url" placeholder="https://…"><button type="button" class="b b--sm b--ghost" id="cBx">✕</button></div>' +
      '<div class="cx-opts"><button type="button" class="b b--sm" id="cBtnA">' + ic('plus') + '<span>Button</span></button><label class="b b--sm" style="cursor:pointer">' + ic('clip') + '<span>Attach</span><input type="file" id="cAtt" multiple hidden></label><label class="cx-sw"><input type="checkbox" id="cSigOn"' + (sigFor(acct).on !== false ? ' checked' : '') + '><i></i><span>Signature</span></label><button type="button" class="b b--sm b--ghost" id="cSig">' + ic('pen') + '<span>Edit signature</span></button></div>' +
      '<div class="cx-attl" id="cAttL"></div>' + (o.quote ? '<p class="cx-qn">' + ic('reply') + 'Their email is quoted under your reply (see Preview).</p>' : '') + '</div>' +
      '<div class="cx-p"><div class="cx-ph"><b>Preview</b><div class="tabs" id="cDev"><button type="button" class="is-on" data-d="desktop">' + ic('desk') + '<span>Computer</span></button><button type="button" data-d="phone">' + ic('phone') + '<span>Phone</span></button></div></div><div class="cx-stage" id="cStage"><div class="cx-frame"><iframe id="cPv" title="Email preview"></iframe></div></div></div></div>' +
      '<div class="cx-foot"><button class="b b--p" id="cSend">' + ic('send') + '<span>Send</span></button><span id="cMsg" class="muted"></span><span class="cx-note">Looks right on phones too: full width, nothing squeezed.</span></div></div>');
    d.classList.add('mx2-modal', 'cx-modal');
    var body = d.querySelector('#cBody'), from = d.querySelector('#cFrom'), pv = d.querySelector('#cPv'), t = null;
    if (o.html) body.innerHTML = o.html; else body.innerHTML = '<p><br></p>';
    var build = function (forSend) {
      var g = sigFor(from.value);
      var bodyHtml = body.innerHTML.replace(/<p><br><\/p>$/, '').replace(/<div>/g, '<p style="margin:0 0 14px">').replace(/<\/div>/g, '</p>').replace(/<h3>/g, '<h3 style="font:bold 18px/1.35 ' + FONT + ';color:#0F1729;margin:20px 0 8px">').replace(/<ul>/g, '<ul style="margin:0 0 14px;padding-left:22px">').replace(/<ol>/g, '<ol style="margin:0 0 14px;padding-left:22px">').replace(/<a /g, '<a style="color:' + st.accent + '" ');
      return emailHtml({ look: st.look, accent: st.accent, heading: st.look === 'plain' ? '' : d.querySelector('#cHd').value.trim(), body: bodyHtml, btnLabel: d.querySelector('#cBl').value.trim(), btnUrl: d.querySelector('#cBu').value.trim(), sig: d.querySelector('#cSigOn').checked ? sigHtml(g, st.accent) : '', quote: o.quote || '', pre: body.innerText.trim().slice(0, 110) });
    };
    var paint = function () { clearTimeout(t); t = setTimeout(function () { pv.srcdoc = build(); }, 180); };
    var fitPv = function () { var stg = d.querySelector('#cStage'); stg.classList.toggle('is-phone', st.dev === 'phone'); };
    var lookUi = function () { d.querySelectorAll('#cLooks [data-l]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-l') === st.look); }); d.querySelector('#cHdR').hidden = st.look === 'plain'; d.querySelector('.cx-dz').style.setProperty('--ac', st.accent); };
    lookUi(); paint();
    setTimeout(function () { (o.to ? body : d.querySelector('#cTo')).focus(); }, 60);
    d.querySelector('#cCcB').onclick = function () { d.querySelector('#cCcR').hidden = false; d.querySelector('#cBcR').hidden = false; this.remove(); };
    d.querySelectorAll('#cLooks [data-l]').forEach(function (b) { b.onclick = function () { st.look = b.getAttribute('data-l'); lookUi(); paint(); }; });
    d.querySelectorAll('#cAcc [data-a]').forEach(function (b) { b.onclick = function () { st.accent = b.getAttribute('data-a'); d.querySelectorAll('#cAcc [data-a]').forEach(function (x) { x.classList.toggle('is-on', x === b); }); lookUi(); paint(); }; });
    d.querySelectorAll('#cDev [data-d]').forEach(function (b) { b.onclick = function () { st.dev = b.getAttribute('data-d'); d.querySelectorAll('#cDev [data-d]').forEach(function (x) { x.classList.toggle('is-on', x === b); }); fitPv(); }; });
    d.querySelectorAll('#cxM [data-m]').forEach(function (b) { b.onclick = function () { var p = b.getAttribute('data-m') === 'p'; d.querySelector('.cx').classList.toggle('is-pv', p); d.querySelectorAll('#cxM [data-m]').forEach(function (x) { x.classList.toggle('is-on', x === b); }); if (p) { st.dev = 'phone'; d.querySelectorAll('#cDev [data-d]').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-d') === 'phone'); }); fitPv(); pv.srcdoc = build(); } }; });
    ['input', 'keyup'].forEach(function (ev) { body.addEventListener(ev, paint); });
    ['#cHd', '#cBl', '#cBu', '#cSigOn'].forEach(function (s) { d.querySelector(s).addEventListener('input', paint); d.querySelector(s).addEventListener('change', paint); });
    from.onchange = function () { acct = from.value; d.querySelector('#cSigOn').checked = sigFor(acct).on !== false; paint(); };
    d.querySelector('#cBtnA').onclick = function () { d.querySelector('#cBtnR').hidden = false; d.querySelector('#cBl').focus(); };
    d.querySelector('#cBx').onclick = function () { d.querySelector('#cBtnR').hidden = true; d.querySelector('#cBl').value = ''; d.querySelector('#cBu').value = ''; paint(); };
    d.querySelectorAll('.cx-tb [data-c]').forEach(function (b) { b.onmousedown = function (e) { e.preventDefault(); }; b.onclick = function () { var c = b.getAttribute('data-c'); body.focus(); if (c === 'createLink') { var sel = window.getSelection(), rg = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null; HQAsk.prompt('Link address (https://…)', 'https://').then(function (u) { body.focus(); if (rg) { sel.removeAllRanges(); sel.addRange(rg); } if (u && /^https?:\/\/./.test(u)) document.execCommand(c, false, u); paint(); }); } else if (c === 'formatBlock') document.execCommand(c, false, 'h3'); else document.execCommand(c, false, null); paint(); }; });
    var paintAtt = function () { d.querySelector('#cAttL').innerHTML = atts.map(function (a, i) { return '<span class="mx2-chip">' + ic('clip') + esc(a.name) + '<button type="button" data-ra="' + i + '">✕</button></span>'; }).join(''); d.querySelectorAll('[data-ra]').forEach(function (b) { b.onclick = function () { atts.splice(+b.getAttribute('data-ra'), 1); paintAtt(); }; }); };
    d.querySelector('#cAtt').onchange = function () { Array.prototype.forEach.call(this.files, function (f) { if (f.size > 3 * 1024 * 1024) { H.toast(f.name + ' is over 3 MB'); return; } var r = new FileReader(); r.onload = function () { atts.push({ name: f.name, type: f.type, data: String(r.result).split(',')[1] }); paintAtt(); }; r.readAsDataURL(f); }); this.value = ''; };
    d.querySelector('#cSig').onclick = function () { sigModal(from.value, function () { paint(); }); };
    d.querySelector('#cSend').onclick = function () {
      var bt = this, msg = d.querySelector('#cMsg'); if (!d.querySelector('#cTo').value.trim()) { msg.textContent = 'Add who it’s for.'; d.querySelector('#cTo').focus(); return; }
      bt.disabled = true; msg.textContent = 'Sending…';
      var text = (d.querySelector('#cHd').value.trim() ? d.querySelector('#cHd').value.trim() + '\n\n' : '') + body.innerText.trim();
      H.api('/api/hq?route=mail-send', { acct: from.value, to: d.querySelector('#cTo').value, cc: d.querySelector('#cCc').value, bcc: d.querySelector('#cBcc').value, subject: d.querySelector('#cSub').value, html: build(true), text: text, inReplyTo: o.inReplyTo || '', references: o.references || [], attachments: atts })
        .then(function (r) { d.remove(); H.toast('Sent from ' + from.selectedOptions[0].text + (r.savedToSent ? '' : ' (no copy in Sent)'), 'ok'); if (M.el && document.body.contains(M.el) && sentLike()) load();
          if (!o.inReplyTo && (st.look !== DZ.look || st.accent !== DZ.accent) && M.mail) { var v = JSON.parse(JSON.stringify(M.mail)); v.design = { look: st.look, accent: st.accent }; saveMail(v).catch(function () { }); } },
          function (e) { bt.disabled = false; msg.textContent = e.message; });
    };
  }
  /* the signature: name, role, phone, email, website and the logo, with a live preview */
  function sigModal(id, done) {
    var g = JSON.parse(JSON.stringify(sigFor(id))), acc = (M.accounts || []).filter(function (a) { return a.id === id; })[0] || {};
    var F = [['name', 'Name'], ['title', 'Role'], ['company', 'Company'], ['phone', 'Phone'], ['email', 'Email'], ['web', 'Website'], ['tagline', 'Short line under it (optional)']];
    var m = H.modal('<div class="sgm"><div class="row" style="justify-content:space-between"><h2>Signature · ' + esc(acc.email || '') + '</h2><button class="b b--sm b--ghost" data-x>✕</button></div>' +
      '<div class="sgm-pv" id="sgPv"></div><div class="g2">' + F.map(function (f) { return '<label class="field"><span>' + f[1] + '</span><input class="hq-in" data-g="' + f[0] + '" value="' + esc(g[f[0]] || '') + '" maxlength="120"></label>'; }).join('') + '</div>' +
      '<div class="row" style="gap:1rem;flex-wrap:wrap"><label class="check"><input type="checkbox" id="sgL"' + (g.logo !== false ? ' checked' : '') + '> Show the Ciel Africa logo</label><label class="check"><input type="checkbox" id="sgO"' + (g.on !== false ? ' checked' : '') + '> Add it to new emails</label></div>' +
      '<div class="row"><button class="b b--p" id="sgS">Save signature</button></div></div>');
    m.querySelector('.modal__p').classList.add('sgm-modal');
    var pv = function () { m.querySelector('#sgPv').innerHTML = sigHtml(Object.assign({}, g, { on: true }), (M.mail && M.mail.design && M.mail.design.accent) || '#2F5BEA'); };
    m.querySelectorAll('[data-g]').forEach(function (x) { x.oninput = function () { g[x.getAttribute('data-g')] = x.value; pv(); }; });
    m.querySelector('#sgL').onchange = function () { g.logo = this.checked; pv(); };
    m.querySelector('#sgO').onchange = function () { g.on = this.checked; };
    pv();
    m.querySelector('#sgS').onclick = function () { var v = JSON.parse(JSON.stringify(M.mail || { aliases: [], signatures: {}, design: {} })); v.signatures = v.signatures || {}; v.signatures[id] = g; var bt = this; bt.disabled = true; saveMail(v).then(function () { m.remove(); H.toast('Signature saved', 'ok'); if (done) done(); }, function (e) { bt.disabled = false; H.toast(e.message, 'err'); }); };
  }
  var last = null;
  function poll(cb) {
    H.api('/api/hq?route=mail-unread').then(function (r) {
      var n = 0; Object.keys(r.boxes).forEach(function (k) { n += r.boxes[k].unseen || 0; });
      if (last !== null && n > last) H.toast('New email (' + (n - last) + ')');
      last = n; M.unseen = n; var nv = document.querySelector('#mxNav [data-v="inbox"]'); if (nv) { var i = nv.querySelector('i'); if (n) { if (!i) nv.insertAdjacentHTML('beforeend', '<i>' + n + '</i>'); else i.textContent = n; } else if (i) i.remove(); }
      if (cb) cb(n); if (H.navs) try { H.navs(); } catch (e) { }
    }, function () { });
  }
  window.HQMail = { init: function (h) { H = h; }, render: render, poll: poll, compose: function (o) { if (!M.accounts) H.api('/api/hq?route=mail-accounts').then(function (r) { M.accounts = r.accounts; M.mail = r.mail || null; compose(o || {}); }); else compose(o || {}); }, unseen: function () { return M.unseen || 0; } };
})();
