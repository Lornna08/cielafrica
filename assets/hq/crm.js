/* ============================================================
   CIEL ADMIN — Leads & projects pipeline, projects, customer profiles.
   Leads are the real website inquiries (contact form + Start a Project),
   moved through a pipeline; a qualified lead becomes a project without
   re-typing anything. Customer profiles join orders, inquiries and projects.
   ============================================================ */
(function () {
  var H;
  var STAGES = [['new', 'New inquiry'], ['reviewing', 'Reviewing'], ['awaiting', 'Awaiting response'], ['discovery', 'Discovery'], ['proposal_prep', 'Preparing proposal'], ['proposal_sent', 'Proposal sent'], ['negotiation', 'Negotiation'], ['approved', 'Approved'], ['in_progress', 'In progress'], ['completed', 'Completed'], ['declined', 'Declined'], ['archived', 'Archived']];
  var SN = {}; STAGES.forEach(function (s) { SN[s[0]] = s[1]; });
  var PST = [['planning', 'Planning'], ['in_progress', 'In progress'], ['review', 'Client review'], ['on_hold', 'On hold'], ['completed', 'Completed']];
  var PRI = [['low', 'Low'], ['normal', 'Normal'], ['high', 'High'], ['urgent', 'Urgent']];
  var esc = function (s) { return H.esc(s); };
  function S() { return H.S; }
  function leads() { return S().inbox.filter(function (m) { return m.kind !== 'whatsapp'; }); }
  function stage(m) { return m.stage || (m.status === 'new' ? 'new' : m.status === 'done' ? 'archived' : 'reviewing'); }
  function field(m, re) { var f = (m.fields || []).filter(function (x) { return re.test(x[0]); })[0]; return f ? f[1] : ''; }
  function who(m) { var c = m.customer || {}; return c.name || c.email || c.phone || 'Visitor'; }
  function upd(m, patch) { return H.api('/api/hq?route=lead-update', Object.assign({ id: m.id }, patch)).then(function (r) { var l = S().inbox; for (var i = 0; i < l.length; i++) if (l[i].id === m.id) l[i] = r.item; H.navs(); return r.item; }); }
  function days(t) { var d = Math.floor((Date.now() - t) / 864e5); return d <= 0 ? 'today' : d === 1 ? '1 day' : d + ' days'; }

  /* ---------- pipeline board ---------- */
  function renderLeads() {
    var showArch = S().leadArch, q = (S().leadQ || '').toLowerCase();
    var L = leads().filter(function (m) { return (showArch || stage(m) !== 'archived') && (!q || (who(m) + ' ' + (m.subject || '') + ' ' + JSON.stringify(m.fields || [])).toLowerCase().indexOf(q) >= 0); });
    var cols = STAGES.filter(function (s) { return showArch || s[0] !== 'archived'; });
    var open = leads().filter(function (m) { return !/completed|declined|archived/.test(stage(m)); });
    var won = leads().filter(function (m) { return /approved|in_progress|completed/.test(stage(m)); }).length, lost = leads().filter(function (m) { return stage(m) === 'declined'; }).length;
    var b = H.body('<div class="kpis"><div class="card kpi"><span>Open leads</span><b>' + open.length + '</b><small>' + leads().filter(function (m) { return stage(m) === 'new'; }).length + ' new</small></div><div class="card kpi"><span>Start a Project briefs</span><b>' + leads().filter(function (m) { return m.kind === 'brief'; }).length + '</b><small>all time</small></div><div class="card kpi"><span>Won</span><b>' + won + '</b><small>' + (won + lost ? Math.round(won / (won + lost) * 100) + '% of decided' : 'nothing decided yet') + '</small></div><div class="card kpi"><span>Follow-ups due</span><b>' + leads().filter(function (m) { return m.followUp && m.followUp <= H.today() && !/completed|declined|archived/.test(stage(m)); }).length + '</b><small>today or overdue</small></div></div>' +
      '<div class="row"><input class="hq-in" id="lq" type="search" placeholder="Search leads" value="' + esc(S().leadQ || '') + '" style="max-width:280px"><label class="check"><input type="checkbox" id="la"' + (showArch ? ' checked' : '') + '> Show archived</label><span class="muted" style="margin-left:auto;font-size:.8rem">Drag a card to move it · tap to open</span></div>' +
      '<div class="pipe">' + cols.map(function (c) {
        var items = L.filter(function (m) { return stage(m) === c[0]; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
        return '<div class="pipe__col" data-st="' + c[0] + '"><div class="pipe__h"><b>' + c[1] + '</b><span>' + items.length + '</span></div>' + items.map(function (m) {
          var budget = field(m, /budget/i), svc = field(m, /service|need|type|project/i), pr = m.priority && m.priority !== 'normal' ? '<span class="chip chip--' + (m.priority === 'urgent' ? 'r' : m.priority === 'high' ? 'y' : '') + '">' + m.priority + '</span>' : '';
          return '<div class="lead" draggable="true" data-id="' + esc(m.id) + '"><div class="lead__t"><b>' + esc(who(m)) + '</b>' + pr + '</div><small>' + esc((svc || m.subject || '').slice(0, 70)) + '</small><div class="lead__f"><span class="chip">' + (m.kind === 'brief' ? 'Brief' : 'Message') + '</span>' + (budget ? '<span>' + esc(budget.slice(0, 24)) + '</span>' : '') + '<span class="faint">' + days(m.createdAt) + '</span>' + (m.followUp ? '<span class="' + (m.followUp <= H.today() ? 'lead__due' : 'faint') + '">↻ ' + esc(m.followUp.slice(5)) + '</span>' : '') + '</div></div>';
        }).join('') + '</div>';
      }).join('') + '</div>' + (leads().length ? '' : '<p class="empty">New Start a Project briefs and contact-form messages land here automatically.</p>'));
    var lq = b.querySelector('#lq'); lq.oninput = function () { S().leadQ = lq.value; var p = lq.selectionStart; renderLeads(); var n = document.getElementById('lq'); n.focus(); n.setSelectionRange(p, p); };
    b.querySelector('#la').onchange = function () { S().leadArch = this.checked; renderLeads(); };
    var drag = null;
    b.querySelectorAll('.lead').forEach(function (c) {
      c.addEventListener('dragstart', function () { drag = c.getAttribute('data-id'); c.classList.add('is-drag'); });
      c.addEventListener('dragend', function () { c.classList.remove('is-drag'); });
      c.onclick = function () { var m = leads().filter(function (x) { return x.id === c.getAttribute('data-id'); })[0]; if (m) leadDrawer(m); };
    });
    b.querySelectorAll('.pipe__col').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('is-over'); });
      col.addEventListener('dragleave', function () { col.classList.remove('is-over'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('is-over'); var m = leads().filter(function (x) { return x.id === drag; })[0]; if (!m) return; var st = col.getAttribute('data-st'); if (stage(m) === st) return; upd(m, { stage: st }).then(function () { renderLeads(); H.toast('Moved to ' + SN[st]); }, function (er) { H.toast(er.message); }); });
    });
  }
  function leadDrawer(m) {
    var c = m.customer || {}, ph = String(c.phone || '').replace(/\D/g, '').replace(/^0/, '254');
    var h = '<div class="row"><span class="chip">' + (m.kind === 'brief' ? 'Start a Project brief' : 'Contact message') + '</span><span class="muted" style="font-size:.8rem">' + H.dt(m.createdAt) + '</span></div>' +
      '<div class="g2"><label class="field"><span>Stage</span><select class="hq-in" id="lSt">' + STAGES.map(function (s) { return '<option value="' + s[0] + '"' + (stage(m) === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label><label class="field"><span>Priority</span><select class="hq-in" id="lPr">' + PRI.map(function (p) { return '<option value="' + p[0] + '"' + ((m.priority || 'normal') === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="field"><span>Follow up on</span><input class="hq-in" type="date" id="lFu" value="' + esc(m.followUp || '') + '"></label>' +
      '<div class="row">' + (c.email ? '<button class="b b--p" id="lMail">Reply by email</button>' : '') + (ph ? '<a class="b" href="tel:+' + esc(ph) + '">Call</a><a class="b" target="_blank" rel="noopener" href="https://wa.me/' + esc(ph) + '">WhatsApp</a>' : '') + '</div>' +
      '<dl class="dl"><dt>Name</dt><dd>' + esc(c.name || '—') + '</dd><dt>Email</dt><dd>' + esc(c.email || '—') + '</dd><dt>Phone</dt><dd>' + esc(c.phone || '—') + '</dd>' + (m.fields || []).filter(function (f) { return !/^(name|email|phone)$/i.test(f[0]); }).map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd style="white-space:pre-wrap">' + esc(f[1]) + '</dd>'; }).join('') + '</dl>' +
      '<b>Internal notes</b><ul class="hist" id="lNotes">' + (m.notes || []).slice().reverse().map(function (n) { return '<li><span class="muted" style="font-size:.76rem">' + H.dt(n.at) + '</span><br>' + esc(n.text).replace(/\n/g, '<br>') + '</li>'; }).join('') + '</ul><textarea class="hq-in" id="lN" rows="2" placeholder="Add a note (only you see this)"></textarea><button class="b b--sm" id="lNs" style="justify-self:start">Add note</button>' +
      '<div class="row" style="border-top:1px solid var(--line);padding-top:12px">' + (m.project ? '<a class="b b--d" href="#projects/' + esc(m.project) + '">Open project</a>' : '<button class="b b--d" id="lProj">Convert to project</button>') + '<button class="b" id="lTask">Create task</button>' + (stage(m) !== 'archived' ? '<button class="b b--ghost" id="lArc">Archive</button>' : '') + '</div>';
    var d = H.drawer(esc(who(m)), h);
    var save = function (patch, msg) { return upd(m, patch).then(function (n) { m = n; if (msg) H.toast(msg); if (H.S.view === 'leads') renderLeads(); }, function (e) { H.toast(e.message); }); };
    d.querySelector('#lSt').onchange = function () { save({ stage: this.value }, 'Stage updated'); };
    d.querySelector('#lPr').onchange = function () { save({ priority: this.value }, 'Priority updated'); };
    d.querySelector('#lFu').onchange = function () {
      var v = this.value; save({ followUp: v || '' }, v ? 'Follow-up set' : 'Follow-up cleared');
      if (v) H.saveItem('events', { title: 'Follow up: ' + who(m), date: v, type: 'meeting', allDay: true, notes: (m.subject || '') + '\n' + (c.email || '') + ' ' + (c.phone || '') }).catch(function () { });
    };
    d.querySelector('#lNs').onclick = function () { var t = d.querySelector('#lN').value.trim(); if (!t) return; save({ note: t }, 'Note added').then(function () { d.remove(); leadDrawer(m); }); };
    var lm = d.querySelector('#lMail'); if (lm) lm.onclick = function () { if (window.HQMail) HQMail.compose({ to: c.email, subject: 'Re: ' + (m.subject || 'your enquiry to Ciel Africa').replace(/^(New (project brief|enquiry) — )/, '') }); else location.href = 'mailto:' + c.email; };
    d.querySelector('#lTask').onclick = function () { H.taskModal({ status: 'todo', title: 'Follow up ' + who(m), tag: 'Lead', notes: (m.subject || '') + '\n' + (c.email || '') + ' ' + (c.phone || '') }); };
    var arc = d.querySelector('#lArc'); if (arc) arc.onclick = function () { save({ stage: 'archived' }, 'Archived').then(function () { d.remove(); }); };
    var cp = d.querySelector('#lProj'); if (cp) cp.onclick = function () {
      projectModal({ name: (field(m, /company|business|brand/i) || c.name || 'New project') + ' · ' + (field(m, /service|project|need|type/i) || 'Website').slice(0, 40), client: c.name || '', email: c.email || '', phone: c.phone || '', budget: field(m, /budget/i), desc: field(m, /details|message|description|about/i) || '', status: 'planning', priority: m.priority || 'normal', lead: m.id }, function (p) { save({ project: p.id, stage: 'approved' }, 'Project created'); d.remove(); location.hash = '#projects/' + p.id; });
    };
  }

  /* ---------- projects ---------- */
  function progress(p) { var t = S().tasks.filter(function (x) { return x.ref === p.id; }); return { n: t.length, done: t.filter(function (x) { return x.status === 'done'; }).length }; }
  function renderProjects(openId) {
    var P = S().projects.slice().sort(function (a, b) { return (a.status === 'completed') - (b.status === 'completed') || (a.deadline || '9').localeCompare(b.deadline || '9'); });
    var b = H.body('<div class="row"><div class="tabs" id="pf">' + [['open', 'Active'], ['all', 'All'], ['completed', 'Completed']].map(function (f) { return '<button data-f="' + f[0] + '"' + ((S().pf || 'open') === f[0] ? ' class="is-on"' : '') + '>' + f[1] + '</button>'; }).join('') + '</div><button class="b b--p" id="pNew" style="margin-left:auto">+ New project</button></div>' +
      '<div class="projs">' + P.filter(function (p) { var f = S().pf || 'open'; return f === 'all' || (f === 'completed' ? p.status === 'completed' : p.status !== 'completed'); }).map(function (p) {
        var g = progress(p), late = p.deadline && p.deadline < H.today() && p.status !== 'completed';
        return '<button class="card proj" data-id="' + esc(p.id) + '"><div class="row" style="justify-content:space-between;width:100%"><span class="chip chip--' + ({ planning: 'b', in_progress: 'o', review: 'p', on_hold: '', completed: 'g' }[p.status] || '') + '">' + esc((PST.filter(function (s) { return s[0] === p.status; })[0] || [0, 'Planning'])[1]) + '</span>' + (p.priority && p.priority !== 'normal' ? '<span class="chip chip--' + (p.priority === 'urgent' ? 'r' : 'y') + '">' + esc(p.priority) + '</span>' : '') + '</div><h3>' + esc(p.name) + '</h3><p class="muted">' + esc(p.client || 'No client yet') + '</p><div class="proj__bar"><i style="width:' + (g.n ? Math.round(g.done / g.n * 100) : 0) + '%"></i></div><div class="row" style="justify-content:space-between;width:100%;font-size:.76rem"><span class="muted">' + g.done + '/' + g.n + ' tasks</span><span class="' + (late ? 'lead__due' : 'muted') + '">' + (p.deadline ? 'Due ' + H.d2(p.deadline + 'T12:00') : 'No deadline') + '</span></div></button>';
      }).join('') + '</div>' + (P.length ? '' : '<p class="empty">No projects yet. Create one, or convert a lead from the Leads board.</p>'));
    b.querySelectorAll('#pf [data-f]').forEach(function (x) { x.onclick = function () { S().pf = x.getAttribute('data-f'); renderProjects(); }; });
    b.querySelector('#pNew').onclick = function () { projectModal({ status: 'planning', priority: 'normal' }, function (p) { location.hash = '#projects/' + p.id; }); };
    b.querySelectorAll('.proj').forEach(function (x) { x.onclick = function () { location.hash = '#projects/' + x.getAttribute('data-id'); }; });
    if (openId) { var p = P.filter(function (x) { return x.id === openId; })[0]; if (p) projectDrawer(p); }
  }
  function projectModal(p, done) {
    var m = H.modal('<h2>' + (p.id ? 'Edit project' : 'New project') + '</h2>' +
      '<label class="field"><span>Project name</span><input class="hq-in" id="pN" value="' + esc(p.name || '') + '" maxlength="120"></label>' +
      '<div class="g2"><label class="field"><span>Client</span><input class="hq-in" id="pC" value="' + esc(p.client || '') + '"></label><label class="field"><span>Budget</span><input class="hq-in" id="pB" value="' + esc(p.budget || '') + '" placeholder="e.g. KES 180,000"></label></div>' +
      '<div class="g2"><label class="field"><span>Client email</span><input class="hq-in" id="pE" value="' + esc(p.email || '') + '"></label><label class="field"><span>Client phone</span><input class="hq-in" id="pP" value="' + esc(p.phone || '') + '"></label></div>' +
      '<div class="g2"><label class="field"><span>Start</span><input class="hq-in" type="date" id="pS" value="' + esc(p.start || '') + '"></label><label class="field"><span>Deadline</span><input class="hq-in" type="date" id="pD" value="' + esc(p.deadline || '') + '"></label></div>' +
      '<div class="g2"><label class="field"><span>Status</span><select class="hq-in" id="pSt">' + PST.map(function (s) { return '<option value="' + s[0] + '"' + ((p.status || 'planning') === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label><label class="field"><span>Priority</span><select class="hq-in" id="pPr">' + PRI.map(function (s) { return '<option value="' + s[0] + '"' + ((p.priority || 'normal') === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="field"><span>Description</span><textarea class="hq-in" id="pDs" rows="3">' + esc(p.desc || '') + '</textarea></label>' +
      '<label class="field"><span>Scope</span><textarea class="hq-in" id="pSc" rows="3" placeholder="What is included">' + esc(p.scope || '') + '</textarea></label>' +
      '<label class="field"><span>Milestones (one per line, start with ✓ when done)</span><textarea class="hq-in" id="pMs" rows="3" placeholder="Design sign-off\nStaging site\nLaunch">' + esc(p.milestones || '') + '</textarea></label>' +
      '<div class="row" style="justify-content:flex-end">' + (p.id ? '<button class="b" data-del style="margin-right:auto;color:var(--r)">Delete</button>' : '') + '<button class="b" data-x>Cancel</button><button class="b b--p" data-save>Save</button></div>');
    var v = function (id) { return m.querySelector(id).value; };
    m.querySelector('[data-save]').onclick = function () {
      var it = { id: p.id, name: v('#pN'), client: v('#pC'), budget: v('#pB'), email: v('#pE'), phone: v('#pP'), start: v('#pS'), deadline: v('#pD'), status: v('#pSt'), priority: v('#pPr'), desc: v('#pDs'), scope: v('#pSc'), milestones: v('#pMs'), lead: p.lead };
      H.saveItem('projects', it).then(function (saved) {
        m.remove(); H.toast('Project saved');
        if (!p.id && it.deadline) H.saveItem('events', { title: 'Deadline: ' + it.name, date: it.deadline, type: 'deadline', allDay: true, ref: saved.id }).catch(function () { });
        if (done) done(saved); else H.route();
      }, function (e) { H.toast(e.message); });
    };
    var del = m.querySelector('[data-del]'); if (del) del.onclick = function () { HQAsk.confirm('Delete this project? Its tasks stay on the task board.').then(function (ok) { if (!ok) return; H.delItem('projects', p.id).then(function () { m.remove(); history.replaceState(null, '', '#projects'); H.route(); }); }); };
  }
  function projectDrawer(p) {
    var T = S().tasks.filter(function (t) { return t.ref === p.id; }), g = progress(p);
    var ms = (p.milestones || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    var lead = p.lead && leads().filter(function (m) { return m.id === p.lead; })[0];
    var h = '<div class="row"><span class="chip chip--b">' + esc((PST.filter(function (s) { return s[0] === p.status; })[0] || [0, ''])[1]) + '</span><span class="muted" style="font-size:.8rem">' + g.done + ' of ' + g.n + ' tasks done</span></div>' +
      '<dl class="dl"><dt>Client</dt><dd>' + esc(p.client || '—') + (p.email ? '<br>' + esc(p.email) : '') + (p.phone ? '<br>' + esc(p.phone) : '') + '</dd><dt>Budget</dt><dd>' + esc(p.budget || '—') + '</dd><dt>Dates</dt><dd>' + (p.start ? H.d2(p.start + 'T12:00') : '—') + ' → ' + (p.deadline ? H.d2(p.deadline + 'T12:00') : '—') + '</dd>' + (p.desc ? '<dt>Description</dt><dd style="white-space:pre-wrap">' + esc(p.desc) + '</dd>' : '') + (p.scope ? '<dt>Scope</dt><dd style="white-space:pre-wrap">' + esc(p.scope) + '</dd>' : '') + (lead ? '<dt>From lead</dt><dd>' + esc(lead.subject || who(lead)) + '</dd>' : '') + '</dl>' +
      (ms.length ? '<b>Milestones</b><ul class="ms">' + ms.map(function (x) { var dn = /^✓/.test(x); return '<li class="' + (dn ? 'is-done' : '') + '">' + esc(x.replace(/^✓\s*/, '')) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="row" style="justify-content:space-between"><b>Tasks</b><button class="b b--sm" id="pT">+ Task</button></div><ul class="list">' + (T.length ? T.map(function (t) { return '<li data-t="' + esc(t.id) + '" style="cursor:pointer"><span class="dot" style="background:' + (t.status === 'done' ? 'var(--g)' : t.status === 'doing' ? 'var(--o)' : 'var(--faint)') + '"></span><div><b style="' + (t.status === 'done' ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(t.title) + '</b><small>' + (t.due ? 'Due ' + H.d2(t.due + 'T12:00') : 'No date') + '</small></div></li>'; }).join('') : '<li class="empty">No tasks yet.</li>') + '</ul>' +
      '<div class="row" style="border-top:1px solid var(--line);padding-top:12px"><button class="b b--d" id="pEd">Edit project</button>' + (p.email && window.HQMail ? '<button class="b" id="pMl">Email client</button>' : '') + '<button class="b" id="pEv">Add to calendar</button></div>';
    var d = H.drawer(esc(p.name), h, function () { if (location.hash.indexOf('#projects/') === 0) history.replaceState(null, '', '#projects'); });
    d.querySelector('#pT').onclick = function () { H.taskModal({ status: 'todo', ref: p.id, tag: 'Project', title: '' }); };
    d.querySelectorAll('[data-t]').forEach(function (li) { li.onclick = function () { var t = S().tasks.filter(function (x) { return x.id === li.getAttribute('data-t'); })[0]; if (t) H.taskModal(t); }; });
    d.querySelector('#pEd').onclick = function () { d.remove(); projectModal(p); };
    var pm = d.querySelector('#pMl'); if (pm) pm.onclick = function () { HQMail.compose({ to: p.email, subject: p.name }); };
    d.querySelector('#pEv').onclick = function () { H.eventModal({ date: p.deadline || H.today(), title: p.name, type: 'meeting', ref: p.id }); };
  }

  /* ---------- customers: one profile per person across orders, inquiries and projects ---------- */
  function key(c) { return (c.email || '').toLowerCase() || String(c.phone || '').replace(/\D/g, '').slice(-9) || ''; }
  function people() {
    var map = {};
    function get(c) { var k = key(c); if (!k) return null; var x = map[k] || (map[k] = { key: k, name: '', email: '', phone: '', orders: [], leads: [], projects: [], spent: 0, last: 0 }); if (!x.name && c.name) x.name = c.name; if (!x.email && c.email) x.email = c.email; if (!x.phone && c.phone) x.phone = c.phone; return x; }
    S().orders.forEach(function (o) { if (o.test) return; var x = get(o.customer || {}); if (!x) return; x.orders.push(o); if (o.paid && !/cancel|refund/.test(o.status)) x.spent += o.total || 0; x.last = Math.max(x.last, o.at || 0); });
    leads().forEach(function (m) { var x = get(m.customer || {}); if (!x) return; x.leads.push(m); x.last = Math.max(x.last, m.createdAt || 0); });
    S().projects.forEach(function (p) { var x = get({ name: p.client, email: p.email, phone: p.phone }); if (!x) return; x.projects.push(p); });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.last - a.last; });
  }
  function renderCustomers() {
    var all = people(), q = (S().cq || '').toLowerCase(), f = S().cf || 'all';
    var list = all.filter(function (x) { return (!q || (x.name + ' ' + x.email + ' ' + x.phone).toLowerCase().indexOf(q) >= 0) && (f === 'all' || (f === 'buyers' ? x.orders.length : f === 'leads' ? x.leads.length && !x.orders.length : f === 'top' ? x.spent > 0 : true)); });
    if (f === 'top') list.sort(function (a, b) { return b.spent - a.spent; });
    var b = H.body('<div class="kpis"><div class="card kpi"><span>People</span><b>' + all.length + '</b><small>customers and enquirers</small></div><div class="card kpi"><span>Paying customers</span><b>' + all.filter(function (x) { return x.spent > 0; }).length + '</b><small>' + all.filter(function (x) { return x.orders.filter(function (o) { return o.paid; }).length > 1; }).length + ' returning</small></div><div class="card kpi"><span>New this month</span><b>' + all.filter(function (x) { var first = Math.min.apply(null, x.orders.map(function (o) { return o.at; }).concat(x.leads.map(function (m) { return m.createdAt; }))); return first >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(); }).length + '</b><small>first contact this month</small></div><div class="card kpi"><span>Lifetime value</span><b>' + H.money(all.reduce(function (n, x) { return n + x.spent; }, 0)) + '</b><small>paid orders, tests excluded</small></div></div>' +
      '<div class="card"><div class="card__h" style="flex-wrap:wrap;gap:.5rem"><div class="tabs" id="cf">' + [['all', 'Everyone'], ['buyers', 'Customers'], ['leads', 'Enquiries only'], ['top', 'Most valuable']].map(function (t) { return '<button data-f="' + t[0] + '"' + (f === t[0] ? ' class="is-on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div><input class="hq-in" id="cq" type="search" placeholder="Search people" value="' + esc(S().cq || '') + '" style="max-width:260px;margin-left:auto"><button class="b b--sm" id="cCsv">Export CSV</button></div>' +
      (list.length ? '<table class="tbl"><thead><tr><th>Name</th><th class="hide-m">Contact</th><th>Activity</th><th>Spent</th></tr></thead><tbody>' + list.map(function (x) { return '<tr data-k="' + esc(x.key) + '"><td><b>' + esc(x.name || x.email || x.phone) + '</b><small>Last ' + H.d2(x.last) + '</small></td><td class="hide-m">' + esc(x.email || '') + '<small>' + esc(x.phone || '') + '</small></td><td><small>' + [x.orders.length ? x.orders.length + ' order' + (x.orders.length === 1 ? '' : 's') : '', x.leads.length ? x.leads.length + ' enquir' + (x.leads.length === 1 ? 'y' : 'ies') : '', x.projects.length ? x.projects.length + ' project' + (x.projects.length === 1 ? '' : 's') : ''].filter(Boolean).join(' · ') + '</small></td><td><b>' + H.money(x.spent) + '</b></td></tr>'; }).join('') + '</tbody></table>' : '<p class="empty">People appear here as orders and enquiries come in.</p>') + '</div>');
    b.querySelectorAll('#cf [data-f]').forEach(function (x) { x.onclick = function () { S().cf = x.getAttribute('data-f'); renderCustomers(); }; });
    var cq = b.querySelector('#cq'); cq.oninput = function () { S().cq = cq.value; var p = cq.selectionStart; renderCustomers(); var n = document.getElementById('cq'); n.focus(); n.setSelectionRange(p, p); };
    b.querySelector('#cCsv').onclick = function () { var rows = [['Name', 'Email', 'Phone', 'Orders', 'Enquiries', 'Projects', 'Spent (KES)', 'Last contact']].concat(list.map(function (x) { return [x.name, x.email, x.phone, x.orders.length, x.leads.length, x.projects.length, x.spent, new Date(x.last).toISOString().slice(0, 10)]; })); var csv = rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'ciel-customers-' + H.today() + '.csv'; a.click(); };
    b.querySelectorAll('tr[data-k]').forEach(function (tr) { tr.onclick = function () { var x = all.filter(function (y) { return y.key === tr.getAttribute('data-k'); })[0]; if (x) person(x); }; });
  }
  function person(x) {
    var note = S().notes.filter(function (n) { return n.key === x.key; })[0] || { key: x.key, text: '' }, ph = String(x.phone || '').replace(/\D/g, '').replace(/^0/, '254');
    var tl = x.orders.map(function (o) { return { at: o.at, h: '<b>' + esc(o.ref) + '</b> · ' + esc(o.label) + ' · ' + H.money(o.total) + '<br><span class="muted">' + esc((o.summary || '').slice(0, 90)) + '</span>', href: '#orders/' + o.ref }; })
      .concat(x.leads.map(function (m) { return { at: m.createdAt, h: '<b>' + (m.kind === 'brief' ? 'Start a Project brief' : 'Message') + '</b> · ' + esc(SN[stage(m)]) + '<br><span class="muted">' + esc((m.subject || '').slice(0, 90)) + '</span>', lead: m.id }; }))
      .concat(x.projects.map(function (p) { return { at: Date.parse(p.start || '') || p.createdAt || 0, h: '<b>Project: ' + esc(p.name) + '</b>', href: '#projects/' + p.id }; }))
      .sort(function (a, b) { return b.at - a.at; });
    var d = H.drawer(esc(x.name || x.email || 'Customer'), '<div class="row">' + (x.email && window.HQMail ? '<button class="b b--p" id="xMail">Email</button>' : x.email ? '<a class="b b--p" href="mailto:' + esc(x.email) + '">Email</a>' : '') + (ph ? '<a class="b" href="tel:+' + esc(ph) + '">Call</a><a class="b" target="_blank" rel="noopener" href="https://wa.me/' + esc(ph) + '">WhatsApp</a>' : '') + '</div>' +
      '<dl class="dl"><dt>Email</dt><dd>' + esc(x.email || '—') + '</dd><dt>Phone</dt><dd>' + esc(x.phone || '—') + '</dd><dt>Spent</dt><dd><b>' + H.money(x.spent) + '</b></dd></dl>' +
      '<label class="field"><span>Notes about this person</span><textarea class="hq-in" id="xn" rows="3" placeholder="Preferences, birthdays, follow-ups…">' + esc(note.text) + '</textarea></label><button class="b b--sm" id="xs" style="justify-self:start">Save notes</button>' +
      '<b>Timeline</b><ul class="hist">' + (tl.length ? tl.map(function (e, i) { return '<li data-i="' + i + '" style="cursor:pointer"><span class="muted" style="font-size:.76rem">' + H.dt(e.at) + '</span><br>' + e.h + '</li>'; }).join('') : '<li>No activity yet.</li>') + '</ul>' +
      '<div class="row"><button class="b" id="xp">New project for this person</button></div>');
    d.querySelector('#xs').onclick = function () { note.text = d.querySelector('#xn').value; H.saveItem('notes', note).then(function () { H.toast('Notes saved'); }); };
    var xm = d.querySelector('#xMail'); if (xm) xm.onclick = function () { HQMail.compose({ to: x.email }); };
    d.querySelector('#xp').onclick = function () { d.remove(); projectModal({ client: x.name, email: x.email, phone: x.phone, status: 'planning', priority: 'normal' }, function (p) { location.hash = '#projects/' + p.id; }); };
    d.querySelectorAll('.hist [data-i]').forEach(function (li) { li.onclick = function () { var e = tl[+li.getAttribute('data-i')]; d.remove(); if (e.href) location.hash = e.href; else if (e.lead) { var m = leads().filter(function (y) { return y.id === e.lead; })[0]; if (m) leadDrawer(m); } }; });
  }

  window.HQCrm = { init: function (h) { H = h; }, leads: renderLeads, projects: renderProjects, customers: renderCustomers, leadDrawer: leadDrawer, people: people };
})();
