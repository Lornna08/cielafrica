/* ============================================================
   KINTRA — Hiring: dashboard, pipeline (drag between stages),
   candidate records, interviews, hiring into an employee record,
   job openings and the public careers page.
   ============================================================ */
(function () {
  'use strict';
  function placeOf(L) { var a = L.area || ''; return a.indexOf(L.name) === 0 ? a : L.name + (a ? ', ' + a : ''); }
  var ui = KT.ui, store = KT.store, R = KT.rules, app = KT.app, I = ui.icon;

  function stars(n) { var h = '<span class="stars" aria-label="Rating ' + (n || 0) + ' of 5">'; for (var i = 1; i <= 5; i++) h += '<span class="' + (i <= n ? '' : 'off') + '">' + I('star', 12, 0) .replace('fill="none"', 'fill="currentColor"') + '</span>'; return h + '</span>'; }
  function jobLabel(j) { return j ? j.title + ' · ' + store.locName(j.locationId) : 'Unknown job'; }
  function nextIv(c) { var t = store.today(); return c.interviews.filter(function (iv) { return iv.date >= t && !iv.outcome; })[0] || null; }

  /* ---------- stage changes ---------- */
  function moveTo(c, stage, after) {
    if (stage === c.stage) return;
    if (stage === 'hired') { hireDialog(c, after); return; }
    if (stage === 'rejected') {
      ui.modal({ title: 'Reject ' + c.first + ' ' + c.last + '?', sub: jobLabel(store.job(c.jobId)), body: ui.field('Reason (internal)', '<input class="inp" name="reason" placeholder="e.g. Not available for weekend shifts">', { req: true, hint: 'Kept on the candidate record. No message is sent to the candidate in this template.' }), ok: 'Reject', danger: true, onOk: function (a) { var ok = ui.run(function () { return store.moveCandidate(c.id, 'rejected', { reason: a.el.querySelector('[name=reason]').value }); }, c.first + ' moved to Rejected'); if (ok && after) after(); return !!ok; } });
      return;
    }
    var from = c.stage;
    if (ui.run(function () { return store.moveCandidate(c.id, stage); })) {
      ui.toast(c.first + ' moved to ' + store.stage(stage).name, 'ok', { label: 'Undo', fn: function () { ui.run(function () { store.moveCandidate(c.id, from, { reason: c.reason || 'Undo' }); }); } });
      if (after) after();
    }
  }
  function hireDialog(c, after) {
    var j = store.job(c.jobId), S = store.state;
    if (!store.can('employees.edit', j ? j.locationId : null)) { ui.toast('Hiring creates an employee record, which needs HR access. ' + store.why('employees.edit', j ? j.locationId : null), 'err'); return; }
    var role = S.jobRoles.filter(function (r) { return j && r.name.toLowerCase() === j.title.toLowerCase(); })[0];
    var canPay = store.can('employees.sensitive', j && j.locationId);
    var body = '<p class="muted" style="margin-bottom:12px">This creates an employee record for ' + ui.esc(c.first) + ' with status <b>Onboarding</b> and links it to this application. Contact details carry over.</p><form id="hf"><div class="fgrid">' +
      ui.field('Job role', ui.select('jobRoleId', app.roleOptions(false), role ? role.id : ''), { req: true }) +
      ui.field('Location', ui.select('locationId', app.locOptions('employees.edit'), j ? j.locationId : ''), { req: true }) +
      ui.field('Start date', ui.input('start', R.addDays(R.weekStart(store.today(), 1), 14), { type: 'date' }), { req: true }) +
      ui.field('Employment type', ui.select('type', ['Full-time', 'Part-time', 'Casual'], j ? j.type : 'Full-time')) +
      (canPay ? ui.field('Pay type', ui.select('payType', [{ value: 'hourly', label: 'Hourly' }, { value: 'salaried', label: 'Salaried' }], role && !role.rate ? 'salaried' : 'hourly')) + ui.field('Hourly rate / monthly salary (' + S.org.currency + ')', ui.input('pay', role ? role.rate || '' : '', { type: 'number', min: 0 }), { req: true }) : '<div class="f f--full muted small">Pay details are set by someone with access to pay information.</div>') +
      ui.field('Manager', ui.select('managerId', store.employees({ anyLoc: true }).filter(function (e) { return ['jr-locmgr', 'jr-opsmgr', 'jr-headchef', 'jr-sup', 'jr-dispatch', 'jr-hr'].indexOf(e.jobRoleId) >= 0; }).map(function (e) { return { value: e.id, label: store.name(e) + ' · ' + store.role(e.jobRoleId).name }; }), j ? j.managerId : '', { placeholder: 'Choose a manager' }), { full: true }) +
      '</div></form>';
    ui.modal({ title: 'Hire ' + c.first + ' ' + c.last, sub: jobLabel(j), body: body, ok: 'Hire and create record', onOk: function (a) {
      var d = ui.read(a.el.querySelector('#hf'));
      var emp = ui.run(function () { return store.hire(c.id, { jobRoleId: d.jobRoleId, locationId: d.locationId, start: d.start, type: d.type, payType: canPay ? d.payType : undefined, rate: canPay && d.payType === 'hourly' ? d.pay : undefined, salary: canPay && d.payType === 'salaried' ? d.pay : undefined, managerId: d.managerId }); });
      if (!emp) return false;
      ui.toast(c.first + ' hired. Employee record created with an onboarding checklist.', 'ok', { label: 'Open record', fn: function () { app.go('#/employees/' + emp.id); } });
      if (after) after();
      return true;
    } });
  }

  /* ---------- dashboard + pipeline ---------- */
  KT.route('/hiring', function (p, q) {
    if (!store.can('hiring.view')) return { title: 'Hiring', html: app.ph('Hiring') + app.locked('Hiring is for recruiters and HR', 'hiring.view') };
    var S = store.state, today = store.today(), jobId = q.job || '', canEdit = store.can('hiring.edit');
    var jobs = store.jobs(), openJobs = jobs.filter(function (j) { return j.status === 'open'; });
    var cands = S.candidates.filter(function (c) { var j = store.job(c.jobId); return j && store.inScope(j.locationId) && (!jobId || c.jobId === jobId); });
    var active = cands.filter(function (c) { return c.stage !== 'rejected' && c.stage !== 'hired'; });
    var ivs = []; cands.forEach(function (c) { c.interviews.forEach(function (iv) { if (iv.date >= today && !iv.outcome) ivs.push([c, iv]); }); });
    ivs.sort(function (a, b) { return (a[1].date + a[1].time) < (b[1].date + b[1].time) ? -1 : 1; });
    var hired30 = cands.filter(function (c) { return c.stage === 'hired' && store.history('candidate', c.id).some(function (a) { return a.to === 'hired' && a.at.slice(0, 10) >= R.addDays(today, -30); }); });
    var newApps = cands.filter(function (c) { return c.stage === 'applied'; });
    var strip = '<div class="mstrip" style="--n:6"><a class="mstat" href="#/hiring/jobs"><span>Open positions</span><b>' + openJobs.reduce(function (a, j) { return a + j.openings; }, 0) + '</b><em>across ' + ui.plural(openJobs.length, 'job') + '</em></a><div class="mstat"><span>Active candidates</span><b>' + active.length + '</b><em>' + cands.length + ' in total</em></div><a class="mstat' + (newApps.length ? ' mstat--warn' : '') + '" href="#/hiring?stage=applied"><span>New applications</span><b>' + newApps.length + '</b><em>' + cands.filter(function (c) { return c.stage === 'screening'; }).length + ' in screening</em></a><div class="mstat"><span>Interviews scheduled</span><b>' + ivs.length + '</b><em>' + ivs.filter(function (x) { return x[1].date <= R.addDays(today, 7); }).length + ' this week</em></div><a class="mstat" href="#/hiring?stage=offer"><span>Offers in progress</span><b>' + cands.filter(function (c) { return c.stage === 'offer'; }).length + '</b><em>awaiting answer</em></a><div class="mstat"><span>Hired</span><b>' + hired30.length + '</b><em>last 30 days</em></div></div>';
    var stages = S.org.hiring.stages, focus = q.stage || '';
    var board = '<div class="kanban" id="kb">' + stages.map(function (st) {
      var list = cands.filter(function (c) { return c.stage === st.id; }).sort(function (a, b) { return a.appliedAt < b.appliedAt ? 1 : -1; });
      return '<section class="kcol' + (focus === st.id ? ' is-focus' : '') + '" data-stage="' + st.id + '" aria-label="' + ui.esc(st.name) + '"><div class="kcol__h">' + ui.esc(st.name) + '<span>' + list.length + '</span></div><div class="kcol__b">' + list.map(function (c) {
        var j = store.job(c.jobId), iv = nextIv(c), rec = store.user(c.recruiterId);
        return '<button type="button" class="kcard" data-cand="' + c.id + '"' + (canEdit && !(c.stage === 'hired' && c.employeeId) ? ' draggable="true"' : '') + ' aria-label="' + ui.esc(c.first + ' ' + c.last + ', ' + st.name) + '"><span class="kcard__t">' + ui.avatar(c.first + ' ' + c.last, 'sm') + '<span style="min-width:0"><div>' + ui.esc(c.first + ' ' + c.last) + '</div><div class="kcard__s">' + ui.esc(jobLabel(j)) + '</div></span></span>' + (c.summary ? '<span class="kcard__sum">' + ui.esc(c.summary) + '</span>' : '') + (c.skills.length ? '<span class="skills">' + c.skills.slice(0, 3).map(function (s) { return '<span>' + ui.esc(s) + '</span>'; }).join('') + '</span>' : '') + '<span class="kcard__m">' + I('cal', 12) + 'Applied ' + ui.dshort(c.appliedAt.slice(0, 10)) + (iv ? ' · <b style="color:var(--acc-2)">' + ui.esc(iv.type) + ' ' + ui.dshort(iv.date) + ' ' + iv.time + '</b>' : '') + '</span><span class="kcard__m">' + (c.rating ? stars(c.rating) : '') + '<span style="margin-left:auto">' + (rec ? ui.avatar(rec.name, 'xs', true) : '') + '</span>' + (c.stage === 'hired' && c.employeeId ? ui.badge('active', 'Employee record') : '') + (c.stage === 'rejected' && c.reason ? '<span class="small">' + ui.esc(c.reason) + '</span>' : '') + '</span></button>';
      }).join('') + (list.length ? '' : '<div class="muted small" style="padding:8px 4px">No candidates</div>') + '</div></section>';
    }).join('') + '</div>';
    var up = '<div class="card"><div class="card__h"><h2>' + I('cal', 16) + 'Upcoming interviews</h2></div>' + (ivs.length ? ivs.slice(0, 6).map(function (x) { return '<a class="lrow" href="#/hiring/c/' + x[0].id + '"><span class="dchip"><b>' + (+x[1].date.slice(8)) + '</b>' + ui.DAY[R.dow(x[1].date)] + '</span><span class="lrow__m"><div class="lrow__t">' + ui.esc(x[0].first + ' ' + x[0].last) + ' · ' + ui.esc(x[1].type) + '</div><div class="lrow__s">' + x[1].time + ' · with ' + ui.esc(x[1].with) + ' · ' + ui.esc(jobLabel(store.job(x[0].jobId))) + '</div></span></a>'; }).join('') : ui.empty('cal', 'No interviews scheduled', '')) + '</div>';
    var rh = cands.filter(function (c) { return c.stage === 'hired'; });
    var recent = '<div class="card"><div class="card__h"><h2>' + I('award', 16) + 'Recently hired</h2></div>' + (rh.length ? rh.map(function (c) { var e = c.employeeId && store.emp(c.employeeId); return '<a class="lrow" href="' + (e ? '#/employees/' + e.id : '#/hiring/c/' + c.id) + '">' + ui.avatar(c.first + ' ' + c.last, 'sm') + '<span class="lrow__m"><div class="lrow__t">' + ui.esc(c.first + ' ' + c.last) + '</div><div class="lrow__s">' + ui.esc(jobLabel(store.job(c.jobId))) + (e ? ' · starts ' + ui.date(e.start) : '') + '</div></span><span class="lrow__r">' + (e ? ui.badge(e.status) : ui.badge('pending', 'No record yet')) + '</span></a>'; }).join('') : ui.empty('award', 'No hires yet', '')) + '</div>';
    var funnel = '<div class="card"><div class="card__h"><h2>' + I('chart', 16) + 'Pipeline by stage</h2></div><div class="card__b"><div class="funnel">' + stages.filter(function (s) { return s.id !== 'rejected'; }).map(function (s, i, arr) { var reached = cands.filter(function (c) { var idx = stages.map(function (x) { return x.id; }).indexOf(c.stage); return c.stage === 'rejected' ? store.history('candidate', c.id).some(function (a) { return a.from === s.id || a.to === s.id; }) || s.id === 'applied' : idx >= i; }).length; return '<div class="funnel__r"><span>' + ui.esc(s.name) + '</span><span class="b"><i style="width:' + (cands.length ? reached / cands.length * 100 : 0) + '%"></i></span><b class="num">' + reached + '</b></div>'; }).join('') + '</div><p class="muted small" style="margin-top:10px">Candidates who reached each stage, including those later rejected.</p></div></div>';
    return {
      title: 'Hiring', wide: true,
      html: app.ph('Hiring', 'Track applicants from application to their first day.', '<a class="btn btn--sm" href="#/careers">' + I('globe', 14) + 'Careers page</a><a class="btn btn--sm" href="#/hiring/jobs">' + I('briefcase', 14) + 'Job openings</a>' + (store.can('hiring.jobs') ? '<a class="btn btn--p btn--sm" href="#/hiring/jobs/new">' + I('plus', 15) + 'New job</a>' : '')) + strip +
        '<div class="row wrap" style="margin:14px 0 10px;gap:8px">' + ui.select('job', [{ value: '', label: 'All jobs (' + jobs.length + ')' }].concat(jobs.map(function (j) { return { value: j.id, label: jobLabel(j) + (j.status !== 'open' ? ' (' + j.status + ')' : '') }; })), jobId, { cls: 'sel--sm', attr: ' aria-label="Job" style="width:auto;max-width:100%"' }) + '<span class="muted small">' + (canEdit ? 'Drag a card to another stage, or open it to move it with the stage buttons.' : 'You can view the pipeline. Moving candidates needs the Recruiter or HR role.') + '</span></div>' +
        board + '<div class="grid g-3" style="margin-top:14px">' + up + recent + funnel + '</div>',
      mount: function (v) {
        v.querySelector('[name=job]').onchange = function (e) { q.job = e.target.value; app.updateQuery(q); app.refresh(); };
        v.querySelectorAll('[data-cand]').forEach(function (b) { b.addEventListener('click', function () { app.go('#/hiring/c/' + b.getAttribute('data-cand')); }); });
        var kb = v.querySelector('#kb'), drag = null;
        if (focus) { var col = kb.querySelector('[data-stage="' + focus + '"]'); if (col) setTimeout(function () { col.scrollIntoView({ inline: 'center', block: 'nearest' }); }, 50); }
        kb.addEventListener('dragstart', function (e) { var c = e.target.closest('[data-cand][draggable]'); if (!c) return; drag = c.getAttribute('data-cand'); c.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag); } catch (x) { /* */ } });
        kb.addEventListener('dragend', function () { drag = null; kb.querySelectorAll('.is-drag,.is-over').forEach(function (x) { x.classList.remove('is-drag', 'is-over'); }); });
        kb.addEventListener('dragover', function (e) { var c = e.target.closest('[data-stage]'); if (!c || !drag) return; e.preventDefault(); kb.querySelectorAll('.is-over').forEach(function (x) { if (x !== c) x.classList.remove('is-over'); }); c.classList.add('is-over'); });
        kb.addEventListener('drop', function (e) { var c = e.target.closest('[data-stage]'); if (!c || !drag) return; e.preventDefault(); var cand = store.cand(drag); drag = null; c.classList.remove('is-over'); moveTo(cand, c.getAttribute('data-stage')); });
      }
    };
  });

  /* ---------- candidate record ---------- */
  KT.route('/hiring/c/:id', function (p) {
    if (!store.can('hiring.view')) return { title: 'Candidate', html: app.locked('Hiring is for recruiters and HR', 'hiring.view') };
    var c = store.cand(p.id); if (!c) return null;
    var S = store.state, j = store.job(c.jobId), canEdit = store.can('hiring.edit'), stages = S.org.hiring.stages, idx = stages.map(function (s) { return s.id; }).indexOf(c.stage);
    var emp = c.employeeId && store.emp(c.employeeId);
    var bar = '<div class="stagebar" role="group" aria-label="Move to stage">' + stages.map(function (s, i) { return '<button type="button" data-stage="' + s.id + '" class="' + (s.id === c.stage ? 'on' : i < idx && c.stage !== 'rejected' ? 'done' : '') + '"' + (!canEdit || (emp) ? ' disabled' : '') + ' aria-pressed="' + (s.id === c.stage) + '">' + ui.esc(s.name) + '</button>'; }).join('') + '</div>';
    var profile = '<div class="card"><div class="card__h"><h2>' + I('user', 16) + 'Profile</h2>' + (canEdit ? '<button class="btn btn--xs" data-edit>' + I('edit', 13) + 'Edit</button>' : '') + '</div><div class="card__b"><dl class="kv"><dt>Email</dt><dd><a class="link" style="font-size:inherit" href="mailto:' + ui.esc(c.email) + '">' + ui.esc(c.email) + '</a></dd><dt>Phone</dt><dd>' + ui.esc(c.phone) + '</dd><dt>Source</dt><dd>' + ui.esc(c.source) + '</dd><dt>Applied</dt><dd>' + ui.dt(c.appliedAt) + '</dd><dt>Recruiter</dt><dd>' + ui.esc(store.userName(c.recruiterId)) + '</dd><dt>Rating</dt><dd>' + (c.rating ? stars(c.rating) : '<span class="muted">Not rated</span>') + '</dd><dt>Skills</dt><dd>' + (c.skills.length ? '<span class="skills">' + c.skills.map(function (s) { return '<span>' + ui.esc(s) + '</span>'; }).join('') + '</span>' : '—') + '</dd><dt>Summary</dt><dd>' + ui.esc(c.summary || '—') + '</dd>' + (c.stage === 'rejected' ? '<dt>Rejected because</dt><dd>' + ui.esc(c.reason || '—') + '</dd>' : '') + '</dl></div></div>';
    var resume = '<div class="card"><div class="card__h"><h2>' + I('paperclip', 16) + 'CV / resume</h2></div><div class="card__b">' + (c.resume ? '<div class="row"><span class="ico-c">' + I('file', 15) + '</span><span class="lrow__m"><div class="lrow__t">' + ui.esc(c.resume.name) + '</div><div class="lrow__s">' + ui.bytes(c.resume.size) + (c.resume.demo ? ' · demo placeholder, no file stored' : ' · stored in this browser') + '</div></span>' + (c.resume.fileId ? '<button class="btn btn--xs" data-dl>' + I('download', 13) + 'Download</button>' : '') + '</div>' : '<p class="muted">No CV attached.</p>') + (canEdit ? '<label class="btn btn--sm" style="margin-top:10px">' + I('upload', 14) + (c.resume ? 'Replace' : 'Upload') + ' CV<input type="file" accept=".pdf,.doc,.docx,.txt,image/*" data-up hidden></label>' : '') + '</div></div>';
    var ivs = '<div class="card"><div class="card__h"><h2>' + I('cal', 16) + 'Interviews</h2>' + (canEdit ? '<button class="btn btn--xs" data-iv>' + I('plus', 13) + 'Schedule</button>' : '') + '</div>' + (c.interviews.length ? c.interviews.map(function (iv) { return '<div class="lrow"><span class="dchip"><b>' + (+iv.date.slice(8)) + '</b>' + ui.MON[+iv.date.slice(5, 7) - 1] + '</span><span class="lrow__m"><div class="lrow__t">' + ui.esc(iv.type) + ' · ' + iv.time + '</div><div class="lrow__s">With ' + ui.esc(iv.with) + (iv.location ? ' · ' + ui.esc(iv.location) : '') + (iv.notes ? ' · “' + ui.esc(iv.notes) + '”' : '') + '</div></span><span class="lrow__r">' + (iv.outcome ? ui.tag(iv.outcome, iv.outcome === 'Strong' || iv.outcome === 'Pass' ? 'green' : iv.outcome === 'Not a fit' ? 'red' : 'grey') : iv.date < store.today() ? ui.badge('pending', 'Needs outcome') : ui.badge('upcoming', 'Upcoming')) + (canEdit ? '<button class="btn btn--xs" data-ivedit="' + iv.id + '">' + (iv.outcome ? 'Edit' : 'Record') + '</button>' : '') + '</span></div>'; }).join('') : '<div class="card__b muted">No interviews yet.</div>') + '</div>';
    var notes = '<div class="card"><div class="card__h"><h2>' + I('message', 16) + 'Internal comments</h2></div><div class="card__b"><form id="nf" class="row" style="align-items:flex-start"><textarea class="ta" name="text" rows="2" placeholder="Add a comment for the hiring team…" aria-label="Comment"></textarea><button class="btn btn--sm" type="submit">Post</button></form></div>' + c.notes.map(function (n) { return '<div class="lrow" style="align-items:flex-start">' + ui.avatar(store.userName(n.by), 'sm') + '<span class="lrow__m"><div class="lrow__t" style="font-weight:500">' + ui.esc(n.text) + '</div><div class="lrow__s">' + ui.esc(store.userName(n.by)) + ' · ' + ui.dt(n.at) + '</div></span></div>'; }).join('') + '</div>';
    var hist = store.history('candidate', c.id);
    var act = '<div class="card"><div class="card__h"><h2>' + I('history', 16) + 'Activity</h2></div><div class="card__b"><div class="timeline">' + hist.map(function (a) { return '<div class="tl"><span class="tl__i ' + (a.to === 'hired' ? 'green' : a.to === 'rejected' ? 'red' : a.action === 'stage' ? 'acc' : '') + '">' + I(a.action === 'stage' ? 'arrowR' : a.action === 'interview' ? 'cal' : a.action === 'note' ? 'message' : 'history', 11) + '</span><div><div class="tl__t">' + ui.esc(a.text) + '</div><div class="tl__s">' + ui.esc(a.by ? store.userName(a.by) : 'Careers page') + ' · ' + ui.dt(a.at) + (a.reason ? ' · “' + ui.esc(a.reason) + '”' : '') + '</div></div></div>'; }).join('') + '<div class="tl"><span class="tl__i">' + I('userplus', 11) + '</span><div><div class="tl__t">Applied via ' + ui.esc(c.source) + '</div><div class="tl__s">' + ui.dt(c.appliedAt) + '</div></div></div></div></div></div>';
    var empBox = emp ? '<div class="note note--ok" style="margin-bottom:14px">' + I('check', 15) + '<span>Hired. <a class="link" href="#/employees/' + emp.id + '">' + ui.esc(store.name(emp)) + '’s employee record</a> · ' + ui.label(emp.status) + ' · starts ' + ui.date(emp.start) + '</span></div>' : '';
    return {
      title: c.first + ' ' + c.last, crumbs: [['Hiring', '#/hiring']],
      html: '<div class="phead">' + ui.avatar(c.first + ' ' + c.last, 'xl') + '<div class="phead__m"><h1>' + ui.esc(c.first + ' ' + c.last) + '</h1><div class="phead__s">' + ui.esc(jobLabel(j)) + ' · ' + ui.badge(c.stage === 'hired' ? 'active' : c.stage === 'rejected' ? 'declined' : 'pending', store.stage(c.stage).name) + ' ' + ui.demoTag('Demo candidate') + '</div></div>' + (canEdit && !emp && c.stage !== 'rejected' ? '<div class="ph__acts"><button class="btn btn--sm" data-rej>Reject</button>' + (c.stage === 'offer' ? '<button class="btn btn--p btn--sm" data-hire>' + I('award', 14) + 'Hire</button>' : '<button class="btn btn--p btn--sm" data-adv>' + I('arrowR', 14) + 'Move to ' + ui.esc(stages[Math.min(idx + 1, stages.length - 2)].name) + '</button>') + '</div>' : '') + '</div>' + empBox + bar +
        '<div class="grid g-main" style="margin-top:14px"><div class="stack">' + profile + ivs + notes + '</div><div class="stack">' + resume + act + '</div></div>',
      mount: function (v) {
        v.querySelectorAll('.stagebar [data-stage]').forEach(function (b) { b.onclick = function () { moveTo(c, b.getAttribute('data-stage')); }; });
        var rj = v.querySelector('[data-rej]'); if (rj) rj.onclick = function () { moveTo(c, 'rejected'); };
        var hb = v.querySelector('[data-hire]'); if (hb) hb.onclick = function () { hireDialog(c); };
        var ad = v.querySelector('[data-adv]'); if (ad) ad.onclick = function () { moveTo(c, stages[Math.min(idx + 1, stages.length - 2)].id); };
        v.querySelector('#nf').onsubmit = function (e) { e.preventDefault(); var t = e.target.querySelector('textarea').value; if (ui.run(function () { store.addCandNote(c.id, t); }, 'Comment added')) e.target.reset(); };
        var up = v.querySelector('[data-up]'); if (up) up.onchange = function () { var f = up.files[0]; if (!f) return; if (f.size > 8 * 1048576) { ui.toast('Files up to 8 MB', 'err'); return; } store.setResume(c.id, f).then(function () { ui.toast('CV uploaded (stored in this browser)'); }, function (e) { ui.toast(e.message, 'err'); }); };
        var dl = v.querySelector('[data-dl]'); if (dl) dl.onclick = function () { KT.files.get(c.resume.fileId).then(function (b) { if (!b) { ui.toast('That file isn’t in this browser any more', 'err'); return; } var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = c.resume.name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400); }); };
        var ivb = v.querySelector('[data-iv]'); if (ivb) ivb.onclick = function () { ivDialog(c); };
        v.querySelectorAll('[data-ivedit]').forEach(function (b) { b.onclick = function () { ivDialog(c, c.interviews.filter(function (x) { return x.id === b.getAttribute('data-ivedit'); })[0]); }; });
        var ed = v.querySelector('[data-edit]'); if (ed) ed.onclick = function () {
          ui.modal({ title: 'Edit candidate', body: '<form id="cf"><div class="fgrid">' + ui.field('First name', ui.input('first', c.first), { req: true }) + ui.field('Last name', ui.input('last', c.last), { req: true }) + ui.field('Email', ui.input('email', c.email, { type: 'email' })) + ui.field('Phone', ui.input('phone', c.phone)) + ui.field('Source', ui.select('source', ['Careers page', 'Referral', 'Job board', 'Walk-in', 'Agency'], c.source)) + ui.field('Rating', ui.select('rating', [0, 1, 2, 3, 4, 5].map(function (n) { return { value: n, label: n ? n + ' / 5' : 'Not rated' }; }), c.rating)) + ui.field('Recruiter', ui.select('recruiterId', S.users.filter(function (u) { return store.can && KT.policy.has(u, 'hiring.edit'); }).map(function (u) { return { value: u.id, label: u.name }; }), c.recruiterId), { full: true }) + ui.field('Skills (comma separated)', ui.input('skills', c.skills.join(', ')), { full: true }) + ui.field('Summary', '<textarea class="ta" name="summary" rows="3">' + ui.esc(c.summary) + '</textarea>', { full: true }) + '</div></form>', ok: 'Save', onOk: function (a) { return !!ui.run(function () { return store.updateCandidate(c.id, ui.read(a.el.querySelector('#cf'))); }, 'Candidate updated'); } });
        };
      }
    };
  });
  function ivDialog(c, iv) {
    iv = iv || {};
    var body = '<form id="ivf"><div class="fgrid">' + ui.field('Date', ui.input('date', iv.date || R.addDays(store.today(), 2), { type: 'date' }), { req: true }) + ui.field('Time', ui.input('time', iv.time || '10:00', { type: 'time' }), { req: true }) + ui.field('Type', ui.select('type', ['In person', 'Phone screen', 'Video call', 'Trial shift'], iv.type || 'In person')) + ui.field('Where', ui.input('location', iv.location || '', { ph: 'e.g. Westlands office' })) + ui.field('Interviewers', ui.input('with', iv.with || store.me().name), { full: true, req: true }) +
      (iv.id ? ui.field('Outcome', ui.select('outcome', [{ value: '', label: 'Not recorded yet' }, 'Strong', 'Pass', 'Unsure', 'Not a fit'], iv.outcome || '')) + ui.field('Notes', '<textarea class="ta" name="notes" rows="3">' + ui.esc(iv.notes || '') + '</textarea>', { full: true }) : '') + '</div></form><p class="muted small" style="margin-top:10px">Invitations aren’t emailed in this template; the interview is added to the candidate record and the recruiter is notified in the app.</p>';
    ui.modal({ title: iv.id ? 'Interview' : 'Schedule an interview', sub: c.first + ' ' + c.last, body: body, ok: iv.id ? 'Save' : 'Schedule', onOk: function (a) { var d = ui.read(a.el.querySelector('#ivf')); d.ivId = iv.id; return !!ui.run(function () { return store.saveInterview(c.id, d); }, iv.id ? 'Interview updated' : 'Interview scheduled'); } });
  }

  /* ---------- job openings ---------- */
  KT.route('/hiring/jobs', function (p, q) {
    if (!store.can('hiring.view')) return { title: 'Job openings', html: app.locked('Hiring is for recruiters and HR', 'hiring.view') };
    var jobs = store.jobs(), st = q.status || '';
    return {
      title: 'Job openings', crumbs: [['Hiring', '#/hiring']],
      html: app.ph('Job openings', 'Vacancies across your locations. Open jobs appear on the careers page.', '<a class="btn btn--sm" href="#/careers">' + I('globe', 14) + 'View careers page</a>' + (store.can('hiring.jobs') ? '<a class="btn btn--p btn--sm" href="#/hiring/jobs/new">' + I('plus', 15) + 'New job</a>' : '')) +
        app.tabs([['', 'All', '#/hiring/jobs', jobs.length], ['open', 'Open', '#/hiring/jobs?status=open', jobs.filter(function (j) { return j.status === 'open'; }).length], ['draft', 'Drafts', '#/hiring/jobs?status=draft'], ['paused', 'Paused', '#/hiring/jobs?status=paused'], ['closed', 'Closed', '#/hiring/jobs?status=closed']], st) + '<div class="card" id="jt"></div>',
      mount: function (v) {
        ui.table(v.querySelector('#jt'), { rows: jobs.filter(function (j) { return !st || j.status === st; }), onRowClick: function (j) { app.go('#/hiring/jobs/' + j.id); },
          columns: [
            { key: 'title', label: 'Job', render: function (j) { return '<div class="pcell__t">' + ui.esc(j.title) + '</div><div class="pcell__s">' + ui.esc(store.dept(j.deptId).name) + ' · ' + ui.esc(j.type) + '</div>'; } },
            { key: 'loc', label: 'Location', render: function (j) { return ui.esc(store.locName(j.locationId)); }, sort: function (j) { return store.locName(j.locationId); } },
            { key: 'openings', label: 'Openings', align: 'r' },
            { key: 'cands', label: 'Candidates', align: 'r', render: function (j) { var c = store.stageCounts(j.id), n = 0; Object.keys(c).forEach(function (k) { if (k !== 'rejected') n += c[k]; }); return n + (c.applied ? ' <span class="bdg bdg--amber">' + c.applied + ' new</span>' : ''); }, sort: function (j) { var c = store.stageCounts(j.id); return Object.keys(c).reduce(function (a, k) { return a + (k !== 'rejected' ? c[k] : 0); }, 0); } },
            { key: 'hired', label: 'Hired', align: 'r', render: function (j) { return store.stageCounts(j.id).hired || 0; }, sort: function (j) { return store.stageCounts(j.id).hired || 0; } },
            { key: 'recruiterId', label: 'Recruiter', render: function (j) { return ui.esc(store.userName(j.recruiterId)); } },
            { key: 'posted', label: 'Posted', render: function (j) { return j.posted ? ui.date(j.posted) : '<span class="muted">—</span>'; } },
            { key: 'status', label: 'Status', render: function (j) { return ui.badge(j.status === 'open' ? 'published' : j.status, j.status.charAt(0).toUpperCase() + j.status.slice(1)); } }
          ], empty: ui.empty('briefcase', 'No job openings', 'Create one to start collecting applications.') });
      }
    };
  });
  KT.route('/hiring/jobs/:id', function (p) {
    var isNew = p.id === 'new', j = isNew ? null : store.job(p.id), S = store.state;
    if (!isNew && !j) return null;
    var canEdit = store.can('hiring.jobs');
    if (isNew && !canEdit) return { title: 'New job', html: app.locked('Creating jobs needs the Recruiter or HR role', 'hiring.jobs') };
    j = j || { title: '', deptId: '', locationId: store.scopeLoc() || '', type: 'Full-time', status: 'draft', openings: 1, pay: '', summary: '', requirements: [], recruiterId: store.me().id, managerId: '' };
    var ro = canEdit ? '' : ' disabled';
    var form = '<form id="jf" class="card"><div class="card__b"><div class="fgrid">' + ui.field('Job title', ui.input('title', j.title, { req: true, attr: ro, ph: 'e.g. Line Cook' }), { req: true }) + ui.field('Status', ui.select('status', [{ value: 'draft', label: 'Draft (not public)' }, { value: 'open', label: 'Open (on the careers page)' }, { value: 'paused', label: 'Paused' }, { value: 'closed', label: 'Closed' }], j.status, { attr: ro })) +
      ui.field('Location', ui.select('locationId', S.locations.map(function (l) { return { value: l.id, label: l.name }; }), j.locationId, { placeholder: 'Choose', attr: ro }), { req: true }) + ui.field('Department', ui.select('deptId', app.deptOptions(false), j.deptId, { placeholder: 'Choose', attr: ro }), { req: true }) +
      ui.field('Employment type', ui.select('type', ['Full-time', 'Part-time', 'Casual', 'Contract'], j.type, { attr: ro })) + ui.field('Openings', ui.input('openings', j.openings, { type: 'number', min: 1, attr: ro })) +
      ui.field('Pay (shown to applicants)', ui.input('pay', j.pay, { ph: 'e.g. KES 240–280 per hour', attr: ro }), { full: true }) +
      ui.field('Recruiter', ui.select('recruiterId', S.users.filter(function (u) { return KT.policy.has(u, 'hiring.edit'); }).map(function (u) { return { value: u.id, label: u.name }; }), j.recruiterId, { attr: ro })) + ui.field('Hiring manager', ui.select('managerId', store.employees({ anyLoc: true }).filter(function (e) { return ['jr-locmgr', 'jr-opsmgr', 'jr-headchef', 'jr-sup', 'jr-dispatch', 'jr-hr'].indexOf(e.jobRoleId) >= 0; }).map(function (e) { return { value: e.id, label: store.name(e) }; }), j.managerId, { placeholder: 'Choose', attr: ro })) +
      ui.field('About the role', '<textarea class="ta" name="summary" rows="3"' + ro + '>' + ui.esc(j.summary) + '</textarea>', { full: true }) + ui.field('Requirements (one per line)', '<textarea class="ta" name="requirements" rows="4"' + ro + '>' + ui.esc((j.requirements || []).join('\n')) + '</textarea>', { full: true }) +
      '</div></div>' + (canEdit ? '<div class="card__f"><span class="muted small">' + (isNew ? '' : 'Posted ' + (j.posted ? ui.date(j.posted) : '—')) + '</span><div class="row"><a class="btn btn--sm" href="#/hiring/jobs">Cancel</a><button class="btn btn--p btn--sm" type="submit">' + (isNew ? 'Create job' : 'Save changes') + '</button></div></div>' : '') + '</form>';
    var side = '';
    if (!isNew) { var cnt = store.stageCounts(j.id); side = '<div class="card"><div class="card__h"><h2>Candidates</h2><a class="link" href="#/hiring?job=' + j.id + '">Pipeline</a></div><div class="card__b"><div class="funnel">' + S.org.hiring.stages.map(function (s) { return '<div class="funnel__r"><span>' + ui.esc(s.name) + '</span><span class="b"><i style="width:' + ((cnt[s.id] || 0) / Math.max(1, Math.max.apply(null, Object.keys(cnt).map(function (k) { return cnt[k]; }))) * 100) + '%"></i></span><b class="num">' + (cnt[s.id] || 0) + '</b></div>'; }).join('') + '</div></div>' + (j.status === 'open' ? '<div class="card__f"><a class="link" href="#/careers/' + j.id + '">' + I('globe', 13) + 'Public job page</a></div>' : '') + '</div>'; }
    return {
      title: isNew ? 'New job' : j.title + ' · ' + store.locName(j.locationId), crumbs: [['Hiring', '#/hiring'], ['Jobs', '#/hiring/jobs']],
      html: app.ph(isNew ? 'New job opening' : ui.esc(j.title) + ' <span class="muted" style="font-weight:500">· ' + ui.esc(store.locName(j.locationId)) + '</span>', isNew ? 'Save as a draft first, or open it to publish on the careers page.' : '') + '<div class="grid g-main"><div>' + form + '</div><div>' + side + '</div></div>',
      mount: function (v) { var f = v.querySelector('#jf'); f.onsubmit = function (e) { e.preventDefault(); var d = ui.read(f); if (!isNew) d.id = j.id; var r = ui.run(function () { return store.saveJob(d); }, isNew ? 'Job created' : 'Job saved'); if (r && isNew) app.go('#/hiring/jobs/' + r.id); }; }
    };
  });

  /* ---------- public careers page ---------- */
  function careersShell(inner) {
    var S = store.state;
    return '<div class="car"><div class="car__top"><div class="car__in"><div class="car__nav"><a class="car__brand" href="#/careers"><span class="org__m">' + ui.esc(ui.initials(S.org.name)) + '</span>' + ui.esc(S.org.name.replace(' (demo)', '')) + '</a><a class="btn btn--sm" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.3)" href="#/hiring">' + I('arrowL', 14) + 'Back to KINTRA</a></div>' + inner.hero + '</div></div><div class="car__note"><div class="car__in">' + I('info', 14) + '<span>Demo careers page generated by KINTRA for a fictional company. Applications are saved in this browser’s demo workspace only.</span></div></div><div class="car__in car__body">' + inner.body + '</div></div>';
  }
  KT.route('/careers', function () {
    var S = store.state, open = S.jobs.filter(function (j) { return j.status === 'open'; });
    var body = '<h2 style="font-size:18px;font-weight:650;margin-bottom:14px">' + ui.plural(open.length, 'open role') + '</h2>' + (open.length ? open.map(function (j) { return '<a class="jobc" href="#/careers/' + j.id + '"><div><h3>' + ui.esc(j.title) + '</h3><p>' + ui.esc(j.summary) + '</p><div class="jobc__m"><span>' + I('pin', 13) + ui.esc(placeOf(store.loc(j.locationId))) + '</span><span>' + I('briefcase', 13) + ui.esc(j.type) + '</span><span>' + I('wallet', 13) + ui.esc(j.pay) + '</span></div></div><span class="btn btn--p btn--sm">View and apply</span></a>'; }).join('') : ui.empty('briefcase', 'No open roles right now', 'Check back soon.'));
    return { title: 'Careers', public: true, static: true, html: careersShell({ hero: '<div class="car__hero"><h1>Cook, serve and deliver with a team that plans ahead.</h1><p>Fair rotas published in advance, paid time off you can track, and managers who answer requests. See our open roles across Nairobi.</p></div>', body: body }) };
  });
  KT.route('/careers/:id', function (p) {
    var j = store.job(p.id);
    if (!j || j.status !== 'open') return { title: 'Careers', public: true, static: true, html: careersShell({ hero: '<div class="car__hero"><h1>This role isn’t open</h1></div>', body: '<a class="link" href="#/careers">See open roles</a>' }) };
    var l = store.loc(j.locationId);
    var form = '<form class="card" id="apf" novalidate><div class="card__h"><h2>Apply for this role</h2></div><div class="card__b"><div class="fgrid">' + ui.field('First name', ui.input('first', '', { req: true, attr: ' autocomplete="given-name"' }), { req: true }) + ui.field('Last name', ui.input('last', '', { req: true, attr: ' autocomplete="family-name"' }), { req: true }) + ui.field('Email', ui.input('email', '', { type: 'email', req: true, attr: ' autocomplete="email"' }), { req: true, full: true }) + ui.field('Phone', ui.input('phone', '', { type: 'tel', req: true, attr: ' autocomplete="tel"', ph: '+254 7…' }), { req: true, full: true }) + ui.field('Relevant skills', ui.input('skills', '', { ph: 'e.g. Grill, food safety' }), { full: true, hint: 'Separate with commas.' }) + ui.field('Your experience', '<textarea class="ta" name="summary" rows="3" placeholder="A few lines about where you’ve worked"></textarea>', { full: true }) + ui.field('CV (optional)', '<input type="file" name="cv" accept=".pdf,.doc,.docx,.txt,image/*" class="inp" style="padding-top:5px">', { full: true, hint: 'Up to 8 MB.' }) +
      '<div class="f f--full"><label class="cbx" style="align-items:flex-start"><input type="checkbox" class="chk" name="consent" style="margin-top:2px"> <span>I agree that ' + ui.esc(store.state.org.name) + ' may store my details to process this application.</span></label></div></div><div id="aperr" class="ferr" role="alert" style="margin-top:10px"></div></div><div class="card__f"><span class="muted small">Demo form · saved in this browser only</span><button class="btn btn--p" type="submit">Submit application</button></div></form>';
    var body = '<div class="car__job"><div><a class="link" href="#/careers">' + I('arrowL', 13) + 'All roles</a><h2 style="margin-top:10px">' + ui.esc(j.title) + '</h2><div class="jobc__m" style="margin:8px 0 18px"><span>' + I('pin', 13) + ui.esc(l.name + ' · ' + l.type) + '</span><span>' + I('briefcase', 13) + ui.esc(j.type) + '</span><span>' + I('wallet', 13) + ui.esc(j.pay) + '</span></div><h3 style="font-size:14px;font-weight:650">About the role</h3><p style="color:var(--ink-2);margin-top:6px">' + ui.esc(j.summary) + '</p>' + (j.requirements.length ? '<h3 style="font-size:14px;font-weight:650;margin-top:18px">What we’re looking for</h3><ul>' + j.requirements.map(function (r) { return '<li>' + ui.esc(r) + '</li>'; }).join('') + '</ul>' : '') + '</div><div id="apbox">' + form + '</div></div>';
    return {
      title: j.title + ' · Careers', public: true, static: true,
      html: careersShell({ hero: '<div class="car__hero" style="padding:30px 0 34px"><h1>' + ui.esc(j.title) + '</h1><p>' + ui.esc(l.name) + ' · ' + ui.esc(j.type) + '</p></div>', body: body }),
      mount: function (v) {
        var f = v.querySelector('#apf'), btn = f.querySelector('[type=submit]');
        f.onsubmit = function (e) {
          e.preventDefault();
          var d = ui.read(f), file = f.querySelector('[name=cv]').files[0];
          if (file && file.size > 8 * 1048576) { v.querySelector('#aperr').textContent = 'The CV must be 8 MB or smaller.'; return; }
          d.file = file || null;
          btn.disabled = true; btn.textContent = 'Submitting…'; v.querySelector('#aperr').textContent = '';
          var pr; try { pr = store.apply(j.id, d); } catch (x) { v.querySelector('#aperr').textContent = x.message; btn.disabled = false; btn.textContent = 'Submit application'; return; }
          pr.then(function (res) {
            v.querySelector('#apbox').innerHTML = '<div class="card"><div class="card__b" style="text-align:center;padding:28px 20px"><span class="ico-c ico-c--green" style="margin:0 auto 10px;width:44px;height:44px">' + I('check', 22) + '</span><h3 style="font-size:17px;font-weight:650">Application saved</h3><p class="muted" style="margin-top:6px">Thanks, ' + ui.esc(res.cand.first) + '. Your application for ' + ui.esc(j.title) + ' is now in the hiring pipeline' + (res.notified ? ' and the recruiter has been notified in KINTRA' : '') + '.</p><p class="muted small" style="margin-top:10px">This is a demo: the application is stored in this browser and no confirmation email is sent.</p><div class="row" style="justify-content:center;margin-top:14px"><a class="btn btn--sm" href="#/careers">Other roles</a><a class="btn btn--p btn--sm" href="#/hiring/c/' + res.cand.id + '">See it in the pipeline</a></div></div></div>';
          }, function (x) { v.querySelector('#aperr').textContent = x.message || 'The CV couldn’t be stored; the application was saved without it.'; btn.disabled = false; btn.textContent = 'Submit application'; });
        };
      }
    };
  });
})();
