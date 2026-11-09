/* ============================================================
   CIEL ADMIN — Email client for lorna@cielafrica.com (with the
   hello@ alias): read, search, reply, forward, compose, archive,
   delete, star, bulk actions. Live from the real mailbox (IMAP/SMTP).
   ============================================================ */
(function () {
  var H, M = { view: 'inbox', folder: 'INBOX', to: '', page: 0, q: '', sel: null, accounts: null, folders: null, list: [], checked: {} };
  var esc = function (s) { return H.esc(s); };
  var IC = {
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 2h6l1-2h5"/>', at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>', send: '<path d="M4 12l16-8-6 16-3-7z"/>', file: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>', box: '<path d="M3 7h18v4H3zM5 11v9h14v-9"/><path d="M10 15h4"/>', alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h0"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    reply: '<path d="M10 8L4 13l6 5"/><path d="M4 13h10a6 6 0 0 1 6 6"/>', all: '<path d="M8 8l-5 5 5 5"/><path d="M13 8l-5 5 5 5"/><path d="M8 13h7a6 6 0 0 1 6 6"/>', fwd: '<path d="M14 8l6 5-6 5"/><path d="M20 13H10a6 6 0 0 0-6 6"/>', star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', back: '<path d="M15 18l-6-6 6-6"/>', ref: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', clip: '<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'
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
    (M.accounts ? Promise.resolve() : H.api('/api/hq?route=mail-accounts').then(function (r) { M.accounts = r.accounts; })).then(function () {
      if (!M.accounts.some(function (a) { return a.configured; })) { el.innerHTML = setupCard(); return; }
      el.innerHTML = '<div class="mx2"><aside class="mx2-nav"><button class="b b--p mx2-new" id="mxNew">' + ic('pen') + '<span>Compose</span></button><div class="mx2-acct"><span>Mailbox</span><b>lorna@cielafrica.com</b><small>includes hello@</small></div><nav id="mxNav"></nav></aside>' +
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
  function nav() {
    var n = document.getElementById('mxNav'); if (!n) return;
    var items = [['inbox', 'Inbox', 'inbox', 'INBOX', ''], ['hello', 'To hello@', 'at', 'INBOX', 'hello']];
    var paint = function (f) {
      if (f) [['sent', 'Sent', 'send'], ['drafts', 'Drafts', 'file'], ['archive', 'Archive', 'box'], ['junk', 'Spam', 'alert'], ['trash', 'Trash', 'trash']].forEach(function (x) { if (f[x[0]]) items.push([x[0], x[1], x[2], f[x[0]], '']); });
      n.innerHTML = items.map(function (x) { return '<button class="mx2-f' + (M.view === x[0] ? ' is-on' : '') + '" data-v="' + x[0] + '" data-f="' + esc(x[3]) + '" data-to="' + x[4] + '">' + ic(x[2]) + '<span>' + x[1] + '</span>' + (x[0] === 'inbox' && M.unseen ? '<i>' + M.unseen + '</i>' : '') + '</button>'; }).join('');
      n.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { M.view = b.getAttribute('data-v'); M.folder = b.getAttribute('data-f'); M.to = b.getAttribute('data-to'); M.page = 0; M.sel = null; M.checked = {}; nav(); load(); M.el.querySelector('.mx2').classList.remove('is-reading'); }; });
    };
    if (M.folders) paint(M.folders);
    else { paint(null); H.api('/api/hq?route=mail-folders&acct=' + box()).then(function (f) { M.folders = f; items = items.slice(0, 2); paint(f); }, function () { }); }
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
      return '<div class="mx2-it' + (m.seen ? '' : ' is-new') + (M.sel && M.sel.uid === m.uid ? ' is-on' : '') + '" data-i="' + i + '"><label class="mx2-chk" data-stop><input type="checkbox" data-c="' + m.uid + '"' + (M.checked[m.uid] ? ' checked' : '') + '></label>' + av(other[0]) +
        '<div class="mx2-m"><div class="mx2-r1"><b>' + esc((sentLike() ? 'To: ' : '') + (who(other) || '(unknown)')) + '</b><time>' + when(m.date) + '</time></div><div class="mx2-r2">' + (m.flagged ? '<span class="mx2-star">★</span>' : '') + esc(m.subject) + (m.attachments ? ' <span class="mx2-clip">' + ic('clip') + '</span>' : '') + '</div><div class="mx2-r3">' + (toHello ? '<span class="mx2-tag">hello@</span>' : '') + esc(m.snippet || '') + '</div></div>' +
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
  function open(s) {
    var el = document.getElementById('mxRead'); M.el.querySelector('.mx2').classList.add('is-reading');
    el.innerHTML = '<div class="mx2-loading"><i class="sk" style="width:60%;height:22px"></i><i class="sk" style="width:40%"></i><i class="sk" style="height:200px"></i></div>';
    H.api('/api/hq?route=mail-read&' + qs({ acct: box(), folder: s.folder, uid: s.uid })).then(function (r) {
      var m = r.message; M.cur = m;
      var toHello = (m.to || []).concat(m.cc || []).some(function (x) { return /^hello@cielafrica\.com$/i.test(x.address); });
      el.innerHTML = '<div class="mx2-bar"><button class="b b--sm b--ghost mx2-back" id="mxBack">' + ic('back') + '<span>Back</span></button><div class="mx2-acts">' +
        [['reply', 'Reply', 'reply'], ['all', 'Reply all', 'all'], ['fwd', 'Forward', 'fwd']].map(function (a) { return '<button class="mx2-ib" data-a="' + a[0] + '" title="' + a[1] + '">' + ic(a[2]) + '<span>' + a[1] + '</span></button>'; }).join('') + '<span class="mx2-sep"></span>' +
        [['archive', 'Archive', 'box'], ['trash', 'Delete', 'trash'], ['unread', 'Mark unread', 'mail'], [m.flagged ? 'unstar' : 'star', m.flagged ? 'Remove star' : 'Star', 'star']].map(function (a) { return '<button class="mx2-ib' + (a[0] === 'unstar' ? ' is-on' : '') + '" data-o="' + a[0] + '" title="' + a[1] + '">' + ic(a[2]) + '</button>'; }).join('') + '</div></div>' +
        '<div class="mx2-doc"><h2 class="mx2-subj">' + esc(m.subject) + (toHello ? ' <span class="mx2-tag">hello@</span>' : '') + '</h2>' +
        '<div class="mx2-from">' + av(m.from[0]) + '<div><b>' + esc(m.from[0] ? (m.from[0].name || m.from[0].address) : '(unknown)') + '</b> <span class="muted">&lt;' + esc(m.from[0] ? m.from[0].address : '') + '&gt;</span><small>to ' + esc(full(m.to)) + (m.cc.length ? ' · cc ' + esc(full(m.cc)) : '') + '</small></div><time>' + new Date(m.date).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</time></div>' +
        (m.attachments.length ? '<div class="mx2-atts">' + m.attachments.map(function (a) { return '<a class="mx2-att" href="/api/hq?route=mail-att&' + qs({ acct: box(), folder: m.folder, uid: m.uid, i: a.i }) + '">' + ic('clip') + '<span><b>' + esc(a.name) + '</b><small>' + (a.size > 1048576 ? (a.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(a.size / 1024)) + ' KB') + '</small></span></a>'; }).join('') + '</div>' : '') +
        '<iframe class="mx2-body" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Email body"></iframe>' +
        '<button class="mx2-quick" id="mxQuick">' + ic('reply') + '<span>Reply to ' + esc(m.from[0] ? (m.from[0].name || m.from[0].address) : 'sender') + '…</span></button></div>';
      var f = el.querySelector('.mx2-body'), dark = document.documentElement.getAttribute('data-theme') === 'dark';
      f.srcdoc = '<!doctype html><meta charset="utf-8"><base target="_blank"><style>html,body{margin:0}body{font:14px/1.6 Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#18181b;background:#fff;padding:4px 2px;word-wrap:break-word;overflow-wrap:anywhere}img{max-width:100%;height:auto}pre{white-space:pre-wrap;font:13px/1.55 ui-monospace,Menlo,monospace}table{max-width:100%}blockquote{border-left:3px solid #ddd;margin:0 0 0 .3em;padding-left:.8em;color:#555}</style>' + (m.html || '<pre>' + esc(m.text) + '</pre>');
      var fit = function () { try { var d = f.contentDocument; if (d && d.body) f.style.height = Math.max(160, d.documentElement.scrollHeight + 8) + 'px'; } catch (e) { f.style.height = '480px'; } };
      f.onload = function () { fit(); setTimeout(fit, 400); setTimeout(fit, 1500); };
      if (dark) f.style.background = '#fff';
      el.querySelector('#mxBack').onclick = function () { M.el.querySelector('.mx2').classList.remove('is-reading'); };
      el.querySelector('#mxQuick').onclick = function () { reply(m, 'reply'); };
      el.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { reply(m, b.getAttribute('data-a')); }; });
      el.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { act([m.uid], b.getAttribute('data-o')).then(function () { if (/star/.test(b.getAttribute('data-o'))) open(m); }); }; });
      poll();
    }, function (e) { el.innerHTML = '<p class="mx-err">' + esc(e.message) + '</p>'; });
  }
  function quote(m) { var d = new Date(m.date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }); return '<br><br><blockquote style="border-left:3px solid #ddd;margin:0;padding-left:12px;color:#555">On ' + esc(d) + ', ' + esc(full(m.from)) + ' wrote:<br>' + (m.html ? m.html.replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, '') : esc(m.text).replace(/\n/g, '<br>')) + '</blockquote>'; }
  function reply(m, kind) {
    var mine = /^(lorna|hello)@cielafrica\.com$/i, re = function (s) { return /^(re|fwd?):/i.test(s) ? s : (kind === 'fwd' ? 'Fwd: ' : 'Re: ') + s; };
    var toHello = (m.to || []).concat(m.cc || []).some(function (x) { return /^hello@/i.test(x.address); });
    var to = kind === 'fwd' ? '' : full(m.replyTo.length ? m.replyTo : m.from);
    var cc = kind === 'all' ? full(m.to.concat(m.cc).filter(function (x) { return !mine.test(x.address); })) : '';
    compose({ acct: toHello ? 'hello' : 'lorna', to: to, cc: cc, subject: re(m.subject), html: quote(m), inReplyTo: kind === 'fwd' ? '' : m.messageId, references: kind === 'fwd' ? [] : (m.references || []).concat(m.messageId ? [m.messageId] : []) });
  }
  function compose(o) {
    var ids = (M.accounts || []).filter(function (a) { return a.configured; }), acct = o.acct || 'lorna', atts = [];
    var sig = function (id) { return ls('ca_sig_' + id) || ''; };
    var d = H.modal('<div class="mx2-comp"><div class="mx2-ch"><b>' + (o.subject ? esc(o.subject) : 'New message') + '</b><button class="b b--sm b--ghost" data-x>✕</button></div>' +
      '<div class="mx2-cf"><span>From</span><select id="cFrom">' + ids.map(function (a) { return '<option value="' + a.id + '"' + (a.id === acct ? ' selected' : '') + '>' + esc(a.email) + '</option>'; }).join('') + '</select></div>' +
      '<div class="mx2-cf"><span>To</span><input id="cTo" value="' + esc(o.to || '') + '" placeholder="name@example.com"><button type="button" class="mx2-ccb" id="cCcB">Cc Bcc</button></div>' +
      '<div class="mx2-cf" id="cCcR"' + (o.cc ? '' : ' hidden') + '><span>Cc</span><input id="cCc" value="' + esc(o.cc || '') + '"></div><div class="mx2-cf" id="cBcR" hidden><span>Bcc</span><input id="cBcc"></div>' +
      '<div class="mx2-cf"><span>Subject</span><input id="cSub" value="' + esc(o.subject || '') + '"></div>' +
      '<div class="mx2-tb">' + [['bold', '<b>B</b>'], ['italic', '<i>I</i>'], ['underline', '<u>U</u>'], ['insertUnorderedList', '• List'], ['createLink', 'Link']].map(function (t) { return '<button type="button" data-c="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="mx2-ed" id="cBody" contenteditable="true"></div><div class="mx2-attl" id="cAttL"></div>' +
      '<div class="mx2-cfoot"><button class="b b--p" id="cSend">' + ic('send') + '<span>Send</span></button><label class="b b--ghost" style="cursor:pointer" title="Attach files">' + ic('clip') + '<input type="file" id="cAtt" multiple hidden></label><button class="b b--ghost" id="cSig">Signature</button><span id="cMsg" class="muted" style="font-size:.8rem;margin-left:auto"></span></div></div>');
    d.classList.add('mx2-modal');
    var body = d.querySelector('#cBody'), from = d.querySelector('#cFrom');
    body.innerHTML = '<div><br></div>' + (sig(acct) ? '<div class="sig">' + sig(acct) + '</div>' : '') + (o.html || '');
    setTimeout(function () { (o.to ? body : d.querySelector('#cTo')).focus(); }, 60);
    d.querySelector('#cCcB').onclick = function () { d.querySelector('#cCcR').hidden = false; d.querySelector('#cBcR').hidden = false; this.remove(); };
    from.onchange = function () { var s1 = sig(acct), s2 = sig(from.value), el = body.querySelector('.sig'); if (el) el.innerHTML = s2; else if (s2) body.insertAdjacentHTML('afterbegin', '<div><br></div><div class="sig">' + s2 + '</div>'); acct = from.value; };
    d.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { var c = b.getAttribute('data-c'); body.focus(); if (c === 'createLink') { var sel = window.getSelection(), rg = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null; HQAsk.prompt('Link address (https://…)', 'https://').then(function (u) { body.focus(); if (rg) { sel.removeAllRanges(); sel.addRange(rg); } if (u && /^https?:\/\/./.test(u)) document.execCommand(c, false, u); }); } else document.execCommand(c, false, null); }; });
    var paintAtt = function () { d.querySelector('#cAttL').innerHTML = atts.map(function (a, i) { return '<span class="mx2-chip">' + ic('clip') + esc(a.name) + '<button type="button" data-ra="' + i + '">✕</button></span>'; }).join(''); d.querySelectorAll('[data-ra]').forEach(function (b) { b.onclick = function () { atts.splice(+b.getAttribute('data-ra'), 1); paintAtt(); }; }); };
    d.querySelector('#cAtt').onchange = function () { Array.prototype.forEach.call(this.files, function (f) { if (f.size > 3 * 1024 * 1024) { H.toast(f.name + ' is over 3 MB'); return; } var r = new FileReader(); r.onload = function () { atts.push({ name: f.name, type: f.type, data: String(r.result).split(',')[1] }); paintAtt(); }; r.readAsDataURL(f); }); this.value = ''; };
    d.querySelector('#cSig').onclick = function () { HQAsk.prompt('Signature for ' + from.selectedOptions[0].text + ' (saved on this device):', (sig(from.value) || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, '')).then(function (s) { if (s == null) return; ls('ca_sig_' + from.value, esc(s).replace(/\n/g, '<br>')); var el = body.querySelector('.sig'); if (el) el.innerHTML = sig(from.value); else body.insertAdjacentHTML('afterbegin', '<div><br></div><div class="sig">' + sig(from.value) + '</div>'); H.toast('Signature saved'); }); };
    d.querySelector('#cSend').onclick = function () {
      var bt = this, msg = d.querySelector('#cMsg'); if (!d.querySelector('#cTo').value.trim()) { msg.textContent = 'Add a recipient.'; return; }
      bt.disabled = true; msg.textContent = 'Sending…';
      H.api('/api/hq?route=mail-send', { acct: from.value, to: d.querySelector('#cTo').value, cc: d.querySelector('#cCc').value, bcc: d.querySelector('#cBcc').value, subject: d.querySelector('#cSub').value, html: '<div style="font:14px/1.6 Arial,sans-serif;color:#18181b">' + body.innerHTML + '</div>', text: body.innerText, inReplyTo: o.inReplyTo || '', references: o.references || [], attachments: atts })
        .then(function (r) { d.remove(); H.toast('Sent from ' + from.selectedOptions[0].text + (r.savedToSent ? '' : ' (no copy in Sent)')); if (M.el && document.body.contains(M.el) && sentLike()) load(); }, function (e) { bt.disabled = false; msg.textContent = e.message; });
    };
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
  window.HQMail = { init: function (h) { H = h; }, render: render, poll: poll, compose: function (o) { if (!M.accounts) H.api('/api/hq?route=mail-accounts').then(function (r) { M.accounts = r.accounts; compose(o || {}); }); else compose(o || {}); }, unseen: function () { return M.unseen || 0; } };
})();
