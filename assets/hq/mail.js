/* ============================================================
   CIEL ADMIN — Email: hello@ and lorna@cielafrica.com, live from the
   mailboxes (read, reply, forward, compose, archive, delete, star).
   ============================================================ */
(function () {
  var H, M = { acct: 'all', folder: 'INBOX', page: 0, q: '', sel: null, accounts: null, folders: {}, list: null };
  var esc = function (s) { return H.esc(s); };
  var who = function (l) { return (l || []).map(function (x) { return x.name || x.address; }).join(', '); };
  var full = function (l) { return (l || []).map(function (x) { return x.name ? x.name + ' <' + x.address + '>' : x.address; }).join(', '); };
  function when(t) { var d = new Date(t), n = new Date(); return d.toDateString() === n.toDateString() ? d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }); }
  function q(o) { return Object.keys(o).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&'); }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  function setupCard() {
    return '<div class="card card__b mx-setup"><h2 style="font-size:1rem">Connect hello@ and lorna@cielafrica.com</h2><p class="muted" style="margin:.4rem 0 .8rem">Ciel Admin reads and sends from the real mailboxes at Truehost App Suite. Add these in Vercel → cielafrica → Settings → Environment Variables, then redeploy:</p>' +
      '<table class="tbl"><tbody>' + [['MAIL_IMAP_HOST', 'Incoming (IMAP) server, from App Suite → Settings → Mail → Accounts, or Truehost support'], ['MAIL_IMAP_PORT', '993 (usual)'], ['MAIL_SMTP_HOST', 'Outgoing (SMTP) server'], ['MAIL_SMTP_PORT', '465 (usual)'], ['MAIL_HELLO_PASSWORD', 'Password of hello@cielafrica.com'], ['MAIL_LORNA_PASSWORD', 'Password of lorna@cielafrica.com']].map(function (r) { return '<tr><td><code>' + r[0] + '</code></td><td><small style="color:var(--soft)">' + r[1] + '</small></td></tr>'; }).join('') + '</tbody></table>' +
      '<p class="faint" style="font-size:.78rem;margin-top:.7rem">Passwords stay on the server and are never shown in Ciel Admin.</p></div>';
  }

  function render(el) {
    M.el = el;
    (M.accounts ? Promise.resolve() : H.api('/api/hq?route=mail-accounts').then(function (r) { M.accounts = r.accounts; })).then(function () {
      var on = M.accounts.filter(function (a) { return a.configured; });
      if (!on.length) { el.innerHTML = setupCard(); return; }
      if (M.acct !== 'all' && !on.some(function (a) { return a.id === M.acct; })) M.acct = 'all';
      el.innerHTML = '<div class="mx"><aside class="mx-side"><button class="b b--p mx-new" id="mxNew">Compose</button>' +
        '<div class="mx-h">Mailboxes</div>' + [{ id: 'all', email: 'All inboxes' }].concat(on).map(function (a) { return '<button class="mx-acct' + (M.acct === a.id ? ' is-on' : '') + '" data-acct="' + a.id + '">' + esc(a.email) + '</button>'; }).join('') +
        (M.acct !== 'all' ? '<div class="mx-h">Folders</div><div id="mxFolders"><small class="faint" style="padding:.4rem .6rem;display:block">Loading…</small></div>' : '') +
        (M.accounts.some(function (a) { return !a.configured; }) ? '<p class="faint" style="font-size:.74rem;padding:.6rem">' + M.accounts.filter(function (a) { return !a.configured; }).map(function (a) { return esc(a.email); }).join(', ') + ' not connected yet (Setup).</p>' : '') + '</aside>' +
        '<section class="mx-list"><div class="mx-lh"><input class="hq-in" id="mxQ" type="search" placeholder="Search mail" value="' + esc(M.q) + '"><button class="b b--sm" id="mxRf" title="Refresh">↻</button></div><div id="mxItems"><p class="empty">Loading mail…</p></div></section>' +
        '<section class="mx-read" id="mxRead"><div class="mx-blank">Select an email to read it</div></section></div>';
      el.querySelector('#mxNew').onclick = function () { compose({}); };
      el.querySelectorAll('[data-acct]').forEach(function (b) { b.onclick = function () { M.acct = b.getAttribute('data-acct'); M.folder = 'INBOX'; M.page = 0; M.sel = null; render(el); }; });
      el.querySelector('#mxRf').onclick = function () { load(); };
      var qi = el.querySelector('#mxQ'), qt; qi.oninput = function () { clearTimeout(qt); qt = setTimeout(function () { M.q = qi.value.trim(); M.page = 0; load(); }, 500); };
      if (M.acct !== 'all') loadFolders();
      load();
    }, function (e) { el.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
  }
  var FNAME = { '\\Sent': 'Sent', '\\Drafts': 'Drafts', '\\Trash': 'Trash', '\\Junk': 'Spam', '\\Archive': 'Archive' };
  function loadFolders() {
    var box = document.getElementById('mxFolders');
    (M.folders[M.acct] ? Promise.resolve(M.folders[M.acct]) : H.api('/api/hq?route=mail-folders&acct=' + M.acct).then(function (r) { M.folders[M.acct] = r; return r; })).then(function (f) {
      if (!box) return;
      var order = function (x) { return x.path === 'INBOX' ? 0 : ({ '\\Drafts': 1, '\\Sent': 2, '\\Archive': 3, '\\Junk': 4, '\\Trash': 5 }[x.use] || 9); };
      box.innerHTML = f.all.slice().sort(function (a, b) { return order(a) - order(b) || a.path.localeCompare(b.path); }).map(function (x) { return '<button class="mx-fold' + (M.folder === x.path ? ' is-on' : '') + '" data-f="' + esc(x.path) + '">' + esc(x.path === 'INBOX' ? 'Inbox' : FNAME[x.use] || x.name) + '</button>'; }).join('');
      box.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { M.folder = b.getAttribute('data-f'); M.page = 0; M.sel = null; box.querySelectorAll('.mx-fold').forEach(function (x) { x.classList.toggle('is-on', x === b); }); load(); }; });
    }, function (e) { if (box) box.innerHTML = '<small class="faint">' + esc(e.message) + '</small>'; });
  }
  function load() {
    var box = document.getElementById('mxItems'); if (!box) return;
    box.innerHTML = '<p class="empty">Loading mail…</p>';
    H.api('/api/hq?route=mail-list&' + q({ acct: M.acct, folder: M.folder, page: M.page, q: M.q })).then(function (r) {
      M.list = r.items;
      box.innerHTML = (r.errors && r.errors.length ? '<p class="mx-err">' + r.errors.map(esc).join('<br>') + '</p>' : '') + (r.items.length ? r.items.map(function (m, i) {
        return '<button class="mx-it' + (m.seen ? '' : ' is-new') + (M.sel && M.sel.uid === m.uid && M.sel.acct === m.acct ? ' is-on' : '') + '" data-i="' + i + '"><span class="mx-from">' + esc(M.folder !== 'INBOX' && /sent/i.test(M.folder) ? 'To: ' + who(m.to) : who(m.from) || '(unknown)') + '</span><span class="mx-date">' + when(m.date) + '</span><span class="mx-sub">' + (m.flagged ? '★ ' : '') + esc(m.subject) + (m.attachments ? ' 📎' : '') + '</span>' + (M.acct === 'all' ? '<span class="mx-tag">' + esc(m.acct) + '@</span>' : '') + '</button>';
      }).join('') : '<p class="empty">' + (M.q ? 'No emails match “' + esc(M.q) + '”.' : 'No emails here.') + '</p>') +
        (r.total > (M.page + 1) * 30 ? '<div class="row" style="justify-content:center;padding:.6rem"><button class="b b--sm" id="mxMore">Older</button></div>' : '') + (M.page ? '<div class="row" style="justify-content:center;padding:.2rem"><button class="b b--sm b--ghost" id="mxNewer">Newer</button></div>' : '');
      box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { var m = M.list[+b.getAttribute('data-i')]; M.sel = m; box.querySelectorAll('.mx-it').forEach(function (x) { x.classList.toggle('is-on', x === b); }); b.classList.remove('is-new'); open(m); }; });
      var mo = box.querySelector('#mxMore'); if (mo) mo.onclick = function () { M.page++; load(); };
      var ne = box.querySelector('#mxNewer'); if (ne) ne.onclick = function () { M.page--; load(); };
    }, function (e) { box.innerHTML = '<p class="mx-err">' + esc(e.message) + '</p>'; });
  }
  function open(s) {
    var el = document.getElementById('mxRead'); M.el.querySelector('.mx').classList.add('is-reading');
    el.innerHTML = '<p class="empty">Opening…</p>';
    H.api('/api/hq?route=mail-read&' + q({ acct: s.acct, folder: s.folder, uid: s.uid })).then(function (r) {
      var m = r.message; M.cur = m;
      el.innerHTML = '<div class="mx-rh"><button class="b b--sm mx-back" id="mxBack">← Back</button><div class="mx-acts">' +
        [['reply', 'Reply'], ['all', 'Reply all'], ['fwd', 'Forward']].map(function (a) { return '<button class="b b--sm" data-a="' + a[0] + '">' + a[1] + '</button>'; }).join('') +
        [['archive', 'Archive'], ['trash', 'Delete'], ['unread', 'Mark unread'], [m.flagged ? 'unstar' : 'star', m.flagged ? 'Unstar' : 'Star']].map(function (a) { return '<button class="b b--sm b--ghost" data-o="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div></div>' +
        '<h2 class="mx-subj">' + esc(m.subject) + '</h2><div class="mx-meta"><b>' + esc(full(m.from)) + '</b><span>to ' + esc(full(m.to)) + (m.cc.length ? ', cc ' + esc(full(m.cc)) : '') + '</span><span>' + new Date(m.date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }) + ' · ' + esc(m.acct) + '@cielafrica.com</span></div>' +
        (m.attachments.length ? '<div class="mx-atts">' + m.attachments.map(function (a) { return '<a class="b b--sm" href="/api/hq?route=mail-att&' + q({ acct: m.acct, folder: m.folder, uid: m.uid, i: a.i }) + '">📎 ' + esc(a.name) + ' <small class="faint">' + Math.max(1, Math.round(a.size / 1024)) + ' KB</small></a>'; }).join('') + '</div>' : '') +
        '<iframe class="mx-body" sandbox="allow-popups allow-popups-to-escape-sandbox" title="Email"></iframe>';
      var f = el.querySelector('.mx-body');
      f.srcdoc = '<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{font:14px/1.55 Inter,system-ui,sans-serif;color:#18181b;margin:0;padding:16px;word-wrap:break-word}img{max-width:100%;height:auto}pre{white-space:pre-wrap}</style>' + (m.html || '<pre>' + esc(m.text) + '</pre>');
      f.onload = function () { try { f.style.height = Math.max(300, f.contentDocument.body.scrollHeight + 40) + 'px'; } catch (e) { } };
      el.querySelector('#mxBack').onclick = function () { M.el.querySelector('.mx').classList.remove('is-reading'); };
      el.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { reply(m, b.getAttribute('data-a')); }; });
      el.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () {
        var op = b.getAttribute('data-o'); if (op === 'trash' && !confirm('Delete this email?')) return;
        H.api('/api/hq?route=mail-act', { acct: m.acct, folder: m.folder, uids: [m.uid], op: op }).then(function () { H.toast({ archive: 'Archived', trash: 'Deleted', unread: 'Marked unread', star: 'Starred', unstar: 'Unstarred' }[op]); if (/archive|trash/.test(op)) { el.innerHTML = '<div class="mx-blank">Select an email to read it</div>'; M.el.querySelector('.mx').classList.remove('is-reading'); } load(); }, function (e) { H.toast(e.message); });
      }; });
    }, function (e) { el.innerHTML = '<p class="mx-err">' + esc(e.message) + '</p>'; });
  }
  function quote(m) { var d = new Date(m.date).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' }); return '<br><br><div style="border-left:3px solid #ddd;padding-left:12px;color:#555">On ' + esc(d) + ', ' + esc(full(m.from)) + ' wrote:<br>' + (m.html ? m.html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '') : esc(m.text).replace(/\n/g, '<br>')) + '</div>'; }
  function reply(m, kind) {
    var me = m.acct + '@cielafrica.com', re = function (s) { return /^(re|fwd?):/i.test(s) ? s : (kind === 'fwd' ? 'Fwd: ' : 'Re: ') + s; };
    var to = kind === 'fwd' ? '' : full(m.replyTo.length ? m.replyTo : m.from);
    var cc = kind === 'all' ? full(m.to.concat(m.cc).filter(function (x) { return x.address.toLowerCase() !== me; })) : '';
    compose({ acct: m.acct, to: to, cc: cc, subject: re(m.subject), html: quote(m), inReplyTo: kind === 'fwd' ? '' : m.messageId, references: kind === 'fwd' ? [] : (m.references || []).concat(m.messageId ? [m.messageId] : []) });
  }
  function compose(o) {
    var on = M.accounts.filter(function (a) { return a.configured; }), acct = o.acct || (M.acct !== 'all' ? M.acct : on[0].id);
    var sig = function (id) { return ls('ca_sig_' + id) || ''; }, atts = [];
    var d = H.modal('<div class="mx-comp"><div class="row" style="justify-content:space-between"><h2 style="font-size:1rem">' + (o.subject ? esc(o.subject) : 'New email') + '</h2><button class="b b--sm b--ghost" data-x>✕</button></div>' +
      '<label class="mx-f"><span>From</span><select class="hq-in" id="cFrom">' + on.map(function (a) { return '<option value="' + a.id + '"' + (a.id === acct ? ' selected' : '') + '>' + esc(a.email) + '</option>'; }).join('') + '</select></label>' +
      '<label class="mx-f"><span>To</span><input class="hq-in" id="cTo" value="' + esc(o.to || '') + '" placeholder="name@example.com, …"></label>' +
      '<label class="mx-f"><span>Cc</span><input class="hq-in" id="cCc" value="' + esc(o.cc || '') + '"></label><label class="mx-f"><span>Bcc</span><input class="hq-in" id="cBcc"></label>' +
      '<label class="mx-f"><span>Subject</span><input class="hq-in" id="cSub" value="' + esc(o.subject || '') + '"></label>' +
      '<div class="mx-tb">' + [['bold', 'B'], ['italic', 'I'], ['underline', 'U'], ['insertUnorderedList', '• List'], ['createLink', 'Link']].map(function (t) { return '<button type="button" class="b b--sm b--ghost" data-c="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="mx-ed" id="cBody" contenteditable="true"></div>' +
      '<div class="row"><label class="b b--sm" style="cursor:pointer">📎 Attach<input type="file" id="cAtt" multiple hidden></label><span id="cAttL" class="muted" style="font-size:.8rem"></span><span style="flex:1"></span><button class="b b--sm b--ghost" id="cSig">Signature…</button><button class="b b--p" id="cSend">Send</button></div><p id="cMsg" class="muted" style="font-size:.82rem"></p></div>');
    d.classList.add('mx-modal');
    var body = d.querySelector('#cBody'), from = d.querySelector('#cFrom');
    body.innerHTML = (sig(acct) ? '<br><br>' + sig(acct) : '<br>') + (o.html || '');
    from.onchange = function () { /* swap signature */ var s1 = sig(acct), s2 = sig(from.value); if (s1 && body.innerHTML.indexOf(s1) >= 0) body.innerHTML = body.innerHTML.replace(s1, s2); acct = from.value; };
    d.querySelectorAll('[data-c]').forEach(function (b) { b.onclick = function () { var c = b.getAttribute('data-c'); body.focus(); if (c === 'createLink') { var u = prompt('Link address (https://…)'); if (u && /^https?:\/\//.test(u)) document.execCommand(c, false, u); } else document.execCommand(c, false, null); }; });
    d.querySelector('#cAtt').onchange = function () {
      Array.prototype.forEach.call(this.files, function (f) { if (f.size > 3 * 1024 * 1024) { H.toast(f.name + ' is over 3 MB'); return; } var r = new FileReader(); r.onload = function () { atts.push({ name: f.name, type: f.type, data: String(r.result).split(',')[1] }); d.querySelector('#cAttL').textContent = atts.map(function (a) { return a.name; }).join(', '); }; r.readAsDataURL(f); });
    };
    d.querySelector('#cSig').onclick = function () { var s = prompt('Signature for ' + from.value + '@cielafrica.com (plain text, saved on this device):', (sig(from.value) || '').replace(/<br>/g, '\n').replace(/<[^>]+>/g, '')); if (s == null) return; ls('ca_sig_' + from.value, esc(s).replace(/\n/g, '<br>')); H.toast('Signature saved'); };
    d.querySelector('#cSend').onclick = function () {
      var bt = this, msg = d.querySelector('#cMsg'); bt.disabled = true; msg.textContent = 'Sending…';
      var html = body.innerHTML, text = body.innerText;
      H.api('/api/hq?route=mail-send', { acct: from.value, to: d.querySelector('#cTo').value, cc: d.querySelector('#cCc').value, bcc: d.querySelector('#cBcc').value, subject: d.querySelector('#cSub').value, html: '<div style="font:14px/1.55 Arial,sans-serif">' + html + '</div>', text: text, inReplyTo: o.inReplyTo || '', references: o.references || [], attachments: atts })
        .then(function (r) { d.remove(); H.toast('Sent' + (r.savedToSent ? '' : ' (no copy saved in Sent)')); if (M.el && document.body.contains(M.el)) load(); }, function (e) { bt.disabled = false; msg.textContent = e.message; });
    };
  }
  /* unread counts for the badge, checked every 2 minutes while Ciel Admin is open */
  var last = null;
  function poll(cb) {
    H.api('/api/hq?route=mail-unread').then(function (r) {
      var n = 0; Object.keys(r.boxes).forEach(function (k) { n += r.boxes[k].unseen || 0; });
      if (last !== null && n > last) H.toast('New email (' + (n - last) + ')');
      last = n; M.unseen = n; if (cb) cb(n);
    }, function () { });
  }
  window.HQMail = { init: function (h) { H = h; }, render: render, poll: poll, compose: function (o) { compose(o || {}); }, unseen: function () { return M.unseen || 0; } };
})();
