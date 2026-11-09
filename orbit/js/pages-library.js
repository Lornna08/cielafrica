/* ============================================================
   ORBIT SOCIAL — Content Library
   Media, caption drafts & snippets, published posts, campaigns.
   ============================================================ */
(function () {
  'use strict';
  var ui = OS.ui, store = OS.store, T = OS.time, PL = OS.platforms, app = OS.app, pc = OS.pc;

  OS.route('/library', function (params, q) {
    var tab = q.tab || 'media', S = store.state;
    var canAny = store.brands().some(function (b) { return store.can('content.edit', b.id); });
    var assets = S.assets.filter(function (a) { return store.inScope(a.brandId); });
    var drafts = S.posts.filter(function (p) { return store.inScope(p.brandId) && p.status === 'draft'; });
    var pub = S.posts.filter(function (p) { return store.inScope(p.brandId) && p.status === 'published'; });
    var camps = S.campaigns.filter(function (c) { return store.inScope(c.brandId); });
    var snippets = S.snippets.filter(function (s) { return store.inScope(s.brandId); });
    var h = app.ph('Content Library', 'Media, reusable captions, published posts and campaigns' + (store.scopeBrand() ? ' for ' + ui.esc(store.scopeBrand().name) : ' across your brands') + '.', canAny && tab === 'media' ? '<button class="btn btn--p" data-up>' + ui.icon('upload', 15) + 'Upload</button>' : tab === 'snippets' && canAny ? '<button class="btn btn--p" data-newsnip>' + ui.icon('plus', 15) + 'New snippet</button>' : tab === 'campaigns' && store.brands().some(function (b) { return store.can('content.schedule', b.id); }) ? '<button class="btn btn--p" data-newcamp>' + ui.icon('plus', 15) + 'New campaign</button>' : '');
    h += app.tabs([['media', 'Media', '#/library?tab=media', assets.length], ['snippets', 'Captions & snippets', '#/library?tab=snippets', drafts.length + snippets.length], ['published', 'Published posts', '#/library?tab=published', pub.length], ['campaigns', 'Campaigns', '#/library?tab=campaigns', camps.length]], tab);

    if (tab === 'media') {
      var f = { q: q.q || '', type: q.type || '', camp: q.camp || '', sort: q.sort || 'new', view: store.prefs.libView || 'grid' };
      h += '<div class="card card--flush"><div class="tbar"><div class="search-inp">' + ui.icon('search', 15) + '<input class="inp" data-lq placeholder="Search name, tag or description" value="' + ui.esc(f.q) + '" aria-label="Search media"></div>' +
        '<div class="seg" role="group" aria-label="Type">' + [['', 'All'], ['image', 'Images'], ['video', 'Video']].map(function (t) { return '<button data-ltype="' + t[0] + '" class="' + (f.type === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        ui.select('camp', [{ value: '', label: 'All campaigns' }].concat(camps.map(function (c) { return { value: c.id, label: c.name }; })), f.camp, { cls: 'sel--sm sel--pill', attr: ' data-lcamp aria-label="Campaign"' }) +
        ui.select('sort', [{ value: 'new', label: 'Newest first' }, { value: 'old', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }, { value: 'size', label: 'Largest first' }, { value: 'used', label: 'Most used' }], f.sort, { cls: 'sel--sm sel--pill', attr: ' data-lsort aria-label="Sort"' }) +
        '<span class="tbar__sp"></span><div class="seg" role="group" aria-label="Layout"><button data-lview="grid" class="' + (f.view === 'grid' ? 'on' : '') + '" aria-label="Grid">' + ui.icon('tiles', 14) + '</button><button data-lview="list" class="' + (f.view === 'list' ? 'on' : '') + '" aria-label="List">' + ui.icon('list', 14) + '</button></div></div>' +
        '<div data-assets></div><div class="libdrop" data-drop hidden><span>' + ui.icon('upload', 22) + 'Drop to upload to ' + ui.esc((store.scopeBrand() || store.brands()[0] || { name: '' }).name) + '</span></div></div>' +
        '<input type="file" id="libfile" multiple accept="' + pc.TYPES.join(',') + '" hidden><div data-ups></div><p class="hint" style="margin-top:10px">' + ui.icon('info', 12) + ' Files you upload are stored in this browser only (IndexedDB). In production they go to object storage. Sample photos: Unsplash, credits in each file’s details.</p>';
    } else if (tab === 'snippets') {
      h += '<div class="grid g-2"><div class="card"><div class="card__h"><h3>' + ui.icon('note', 16) + 'Caption drafts</h3><span class="sub">Drafts without a published date</span></div><div class="card__b card__b--flush" data-rows>' + (drafts.length ? drafts.map(function (p) { return pc.row(p, { sub: (p.scheduledAt ? 'Planned ' + T.date(p.scheduledAt) : 'No date') + ' · by ' + app.userName(p.authorId) }); }).join('') : ui.empty('note', 'No drafts', 'Drafts you save in Compose appear here.')) + '</div></div>' +
        '<div class="card"><div class="card__h"><h3>' + ui.icon('hash', 16) + 'Reusable snippets</h3><span class="sub">Insert from Compose → Hashtags & snippets</span></div><div class="card__b card__b--flush">' + (snippets.length ? snippets.map(function (s) { var b = store.brand(s.brandId); return '<div class="lrow"><span class="ico-c">' + ui.icon(s.kind === 'hashtags' ? 'hash' : 'note', 15) + '</span><span class="lrow__m"><span class="lrow__t">' + ui.esc(s.name) + '</span><span class="lrow__s">' + ui.brandDot(b) + ui.esc(b.name) + ' · ' + ui.esc(s.body) + '</span></span><span class="row"><button class="btn btn--xs" data-copy="' + s.id + '">' + ui.icon('copy', 13) + 'Copy</button>' + (store.can('content.edit', s.brandId) ? '<button class="btn btn--xs btn--ghost" data-esnip="' + s.id + '" aria-label="Edit">' + ui.icon('edit', 13) + '</button>' : '') + '</span></div>'; }).join('') : ui.empty('hash', 'No snippets yet', 'Save hashtag sets and sign-offs you use often.')) + '</div></div></div>';
    } else if (tab === 'published') {
      h += '<div class="card card--flush"><div data-pubtable></div></div>';
    } else {
      h += '<div class="grid g-3">' + (camps.length ? camps.map(function (c) {
        var b = store.brand(c.brandId), ps = S.posts.filter(function (p) { return p.campaignId === c.id; }), as = S.assets.filter(function (a) { return a.campaignId === c.id; });
        var cnt = function (st) { return ps.filter(function (p) { return p.status === st; }).length; };
        var today = T.todayKey(), live = c.start <= today && c.end >= today, upcoming = c.start > today;
        return '<div class="card camp"><div class="camp__bar" style="background:' + c.color + '"></div><div class="card__b"><div class="row row--between"><span class="pill ' + (live ? 'pill--green' : upcoming ? 'pill--blue' : 'pill--grey') + '">' + (live ? 'Running' : upcoming ? 'Upcoming' : 'Ended') + '</span>' + (store.can('content.schedule', c.brandId) ? '<button class="btn btn--xs btn--ghost" data-ecamp="' + c.id + '">' + ui.icon('edit', 13) + 'Edit</button>' : '') + '</div><h3 class="camp__t">' + ui.esc(c.name) + '</h3><p class="camp__s">' + ui.brandDot(b) + ui.esc(b.name) + ' · ' + T.date(T.iso(c.start, '12:00')) + ' – ' + T.date(T.iso(c.end, '12:00')) + '</p><p class="camp__g">' + ui.esc(c.goal || '') + '</p>' +
          '<div class="camp__stats"><div><b>' + cnt('published') + '</b><span>Published</span></div><div><b>' + cnt('scheduled') + '</b><span>Scheduled</span></div><div><b>' + (cnt('draft') + cnt('in_review') + cnt('changes_requested') + cnt('approved')) + '</b><span>In progress</span></div><div><b>' + as.length + '</b><span>Files</span></div></div>' +
          '<div class="camp__media">' + as.slice(0, 4).map(function (a) { return ui.media(a, { cls: 'mthumb--40' }); }).join('') + '</div><div class="row" style="margin-top:12px"><a class="btn btn--sm" href="#/calendar?view=list&campaign=' + c.id + '&past=1">' + ui.icon('cal', 14) + 'Posts</a><a class="btn btn--sm btn--ghost" href="#/library?tab=media&camp=' + c.id + '">' + ui.icon('folder', 14) + 'Files</a></div></div></div>';
      }).join('') : '<div class="card">' + ui.empty('flag', 'No campaigns', 'Group posts and files around a launch or season.') + '</div>') + '</div>';
    }

    return {
      title: 'Content Library', html: h,
      mount: function (root) {
        var ups = [];
        function brandForUpload() { var b = store.scopeBrand(); if (b && store.can('content.edit', b.id)) return b.id; var e = store.brands().filter(function (x) { return store.can('content.edit', x.id); })[0]; return e && e.id; }
        function paintUps() { var el = root.querySelector('[data-ups]'); if (!el) return; el.innerHTML = ups.length ? '<div class="card uplist">' + ups.map(function (u) { return '<div class="uplist__i' + (u.err ? ' err' : '') + '">' + ui.icon(u.err ? 'alert' : 'upload', 15) + '<b>' + ui.esc(u.name) + '</b>' + (u.err ? '<em>' + ui.esc(u.err) + '</em>' : '<i><span style="width:' + u.pct + '%"></span></i><em>' + u.pct + '%</em>') + '</div>'; }).join('') + '</div>' : ''; }
        function uploadFiles(files) {
          var bid = brandForUpload(); if (!bid) { ui.toast('Your role can’t upload files.', 'err'); return; }
          [].slice.call(files).forEach(function (fl) {
            var u = { name: fl.name, pct: 0, err: null }; ups.push(u); paintUps();
            pc.ingest(fl, bid, function (p) { u.pct = p; paintUps(); }).then(function (a) { ups = ups.filter(function (x) { return x !== u; }); paintUps(); ui.toast('Uploaded ' + a.name + (a._persisted ? '' : ' (kept in memory only)')); }).catch(function (e) { u.err = e.message; paintUps(); setTimeout(function () { ups = ups.filter(function (x) { return x !== u; }); paintUps(); }, 6000); });
          });
        }
        var upb = root.querySelector('[data-up]'), fin = root.querySelector('#libfile');
        if (upb) upb.onclick = function () { fin.click(); };
        if (fin) fin.onchange = function () { uploadFiles(fin.files); fin.value = ''; };
        if (q.upload && fin) setTimeout(function () { fin.click(); }, 250);

        if (tab === 'media') {
          var f = { q: q.q || '', type: q.type || '', camp: q.camp || '', sort: q.sort || 'new' };
          var host = root.querySelector('[data-assets]');
          var draw = function () {
            var view = store.prefs.libView || 'grid';
            var list = store.state.assets.filter(function (a) { return store.inScope(a.brandId) && (!f.type || a.type === f.type) && (!f.camp || a.campaignId === f.camp) && (!f.q || (a.name + ' ' + a.tags.join(' ') + ' ' + (a.alt || '')).toLowerCase().indexOf(f.q.toLowerCase()) >= 0); });
            var used = {}; store.state.posts.forEach(function (p) { (p.mediaIds || []).forEach(function (m) { used[m] = (used[m] || 0) + 1; }); });
            list.sort(function (a, b) { if (f.sort === 'name') return a.name.localeCompare(b.name); if (f.sort === 'size') return b.size - a.size; if (f.sort === 'old') return a.uploadedAt < b.uploadedAt ? -1 : 1; if (f.sort === 'used') return (used[b.id] || 0) - (used[a.id] || 0); return a.uploadedAt < b.uploadedAt ? 1 : -1; });
            if (!list.length) { host.innerHTML = ui.empty('folder', f.q || f.type || f.camp ? 'No files match these filters' : 'No files yet', f.q || f.type || f.camp ? 'Try a different search or clear the filters.' : 'Upload images and video to reuse them in posts.'); return; }
            if (view === 'grid') host.innerHTML = '<div class="agrid">' + list.map(function (a) { var b = store.brand(a.brandId), c = a.campaignId && store.campaign(a.campaignId); return '<button type="button" class="acard" data-asset="' + a.id + '">' + ui.media(a, { cls: 'mthumb--card' }) + '<span class="acard__b"><span class="acard__n">' + ui.esc(a.name) + '</span><span class="acard__s">' + ui.brandDot(b) + ui.esc(b.name) + (c ? ' · ' + ui.esc(c.name) : '') + '</span><span class="acard__f">' + (a.type === 'video' ? 'Video' : 'Image') + ' · ' + ui.bytes(a.size) + (used[a.id] ? ' · used ' + used[a.id] + '×' : '') + (a.local ? ' · <em>this browser</em>' : '') + '</span></span></button>'; }).join('') + '</div>';
            else {
              host.innerHTML = '<div data-t></div>';
              ui.table(host.querySelector('[data-t]'), { rows: list, pageSize: 20, onRowClick: function (r) { details(r.id); }, columns: [
                { key: 'name', label: 'File', render: function (a) { return '<div class="pcell">' + ui.media(a, { cls: 'mthumb--36' }) + '<div><div class="pcell__t">' + ui.esc(a.name) + '</div><div class="pcell__s">' + ui.esc((a.tags || []).join(', ')) + '</div></div></div>'; } },
                { key: 'type', label: 'Type', render: function (a) { return a.type === 'video' ? 'Video' + (a.duration ? ' · ' + Math.round(a.duration) + 's' : '') : 'Image'; } },
                { key: 'brand', label: 'Brand', sort: function (a) { return store.brand(a.brandId).name; }, render: function (a) { var b = store.brand(a.brandId); return ui.brandDot(b) + ' ' + ui.esc(b.name); } },
                { key: 'camp', label: 'Campaign', sort: function (a) { var c = a.campaignId && store.campaign(a.campaignId); return c ? c.name : ''; }, render: function (a) { var c = a.campaignId && store.campaign(a.campaignId); return c ? ui.esc(c.name) : '<span class="muted">—</span>'; } },
                { key: 'dims', label: 'Size', sort: function (a) { return a.size; }, render: function (a) { return (a.w ? a.w + '×' + a.h + ' · ' : '') + ui.bytes(a.size); } },
                { key: 'uploadedAt', label: 'Uploaded', render: function (a) { return T.date(a.uploadedAt) + ' · ' + ui.esc(app.userName(a.uploadedBy).split(' ')[0]); } },
                { key: 'used', label: 'Used', align: 'r', sort: function (a) { return used[a.id] || 0; }, render: function (a) { return used[a.id] || '<span class="muted">0</span>'; } }
              ] });
            }
          };
          draw();
          var qi = root.querySelector('[data-lq]'); qi.addEventListener('input', ui.debounce(function () { f.q = qi.value.trim(); app.updateQuery({ tab: 'media', q: f.q, type: f.type, camp: f.camp, sort: f.sort }); draw(); }, 150));
          root.querySelectorAll('[data-ltype]').forEach(function (b) { b.onclick = function () { f.type = b.getAttribute('data-ltype'); root.querySelectorAll('[data-ltype]').forEach(function (x) { x.classList.toggle('on', x === b); }); app.updateQuery({ tab: 'media', q: f.q, type: f.type, camp: f.camp, sort: f.sort }); draw(); }; });
          root.querySelector('[data-lcamp]').onchange = function (e) { f.camp = e.target.value; app.updateQuery({ tab: 'media', q: f.q, type: f.type, camp: f.camp, sort: f.sort }); draw(); };
          root.querySelector('[data-lsort]').onchange = function (e) { f.sort = e.target.value; draw(); };
          root.querySelectorAll('[data-lview]').forEach(function (b) { b.onclick = function () { store.setPref('libView', b.getAttribute('data-lview')); root.querySelectorAll('[data-lview]').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }; });
          host.addEventListener('click', function (e) { var c = e.target.closest('[data-asset]'); if (c) details(c.getAttribute('data-asset')); });
          // page-level drop to upload
          var dz = root.querySelector('[data-drop]'), card = dz.parentNode, depth = 0;
          card.addEventListener('dragenter', function (e) { if (e.dataTransfer.types.indexOf('Files') < 0) return; depth++; dz.hidden = false; });
          card.addEventListener('dragleave', function () { depth = Math.max(0, depth - 1); if (!depth) dz.hidden = true; });
          card.addEventListener('dragover', function (e) { if (e.dataTransfer.types.indexOf('Files') >= 0) e.preventDefault(); });
          card.addEventListener('drop', function (e) { if (!e.dataTransfer.files.length) return; e.preventDefault(); depth = 0; dz.hidden = true; uploadFiles(e.dataTransfer.files); });
          OS.app._libDraw = draw;
          if (q.open) details(q.open);
        }
        if (tab === 'published') {
          var rows = pub.slice().sort(function (a, b) { return a.publishedAt < b.publishedAt ? 1 : -1; });
          var tot = function (p, k) { return p.metrics ? Object.keys(p.metrics).reduce(function (t, a) { return t + (p.metrics[a][k] || 0); }, 0) : null; };
          ui.table(root.querySelector('[data-pubtable]'), { rows: rows, pageSize: 15, showCount: true, onRowClick: function (r) { pc.drawer(r.id); }, empty: ui.empty('send', 'Nothing published yet', ''), columns: [
            { key: 'title', label: 'Post', sort: function (p) { return store.title(p); }, render: function (p) { return '<div class="pcell">' + pc.thumb(p, 'mthumb--36') + '<div><div class="pcell__t">' + ui.esc(store.title(p)) + '</div><div class="pcell__s">' + ui.esc(store.brand(p.brandId).name) + '</div></div></div>'; } },
            { key: 'plats', label: 'Networks', sort: false, render: function (p) { return pc.accIcons(p, 18); } },
            { key: 'publishedAt', label: 'Published', render: function (p) { return T.dateTime(p.publishedAt) + (p.simulated ? ' ' + ui.sim() : ''); } },
            { key: 'reach', label: 'Reach', align: 'r', sort: function (p) { return tot(p, 'reach') || 0; }, render: function (p) { var v = tot(p, 'reach'); return v == null ? '<span class="muted">—</span>' : ui.num(v); } },
            { key: 'eng', label: 'Engagement', align: 'r', sort: function (p) { return (tot(p, 'likes') || 0) + (tot(p, 'comments') || 0) + (tot(p, 'shares') || 0) + (tot(p, 'saves') || 0); }, render: function (p) { if (!p.metrics) return '<span class="muted">—</span>'; return ui.num(tot(p, 'likes') + tot(p, 'comments') + tot(p, 'shares') + tot(p, 'saves')); } },
            { key: 'act', label: '', sort: false, align: 'r', render: function (p) { return store.can('content.edit', p.brandId) ? '<button class="btn btn--xs" data-reuse="' + p.id + '">' + ui.icon('copy', 13) + 'Reuse</button>' : ''; } }
          ] });
          root.addEventListener('click', function (e) { var b = e.target.closest('[data-reuse]'); if (b) { e.stopPropagation(); var np = ui.run(function () { return store.duplicate(b.getAttribute('data-reuse')); }); if (np) app.go('#/compose/' + np.id); } }, true);
        }
        if (tab === 'snippets') {
          pc.bindRows(root.querySelector('[data-rows]'));
          root.addEventListener('click', function (e) {
            var c = e.target.closest('[data-copy]');
            if (c) { var s = store.state.snippets.filter(function (x) { return x.id === c.getAttribute('data-copy'); })[0]; if (navigator.clipboard) navigator.clipboard.writeText(s.body).then(function () { ui.toast('Copied “' + s.name + '”'); }, function () { ui.toast('Copy isn’t allowed in this browser. Select the text instead.', 'info'); }); }
            var ed = e.target.closest('[data-esnip]'); if (ed) snippetDialog(ed.getAttribute('data-esnip'));
          });
          var ns = root.querySelector('[data-newsnip]'); if (ns) ns.onclick = function () { snippetDialog(null); };
        }
        if (tab === 'campaigns') {
          root.addEventListener('click', function (e) { var c = e.target.closest('[data-ecamp]'); if (c) campaignDialog(c.getAttribute('data-ecamp')); });
          var nc = root.querySelector('[data-newcamp]'); if (nc) nc.onclick = function () { campaignDialog(null); };
        }
      }
    };
  });

  function details(id) {
    var a = store.asset(id); if (!a) { ui.toast('That file no longer exists.', 'err'); return; }
    var can = store.can('content.edit', a.brandId), usage = store.assetUsage(id);
    var camps = store.state.campaigns.filter(function (c) { return c.brandId === a.brandId; });
    var big = a.type === 'video' ? '<video controls playsinline preload="metadata" poster="' + ui.esc(a.thumb) + '"' + (a.local ? ' data-local="' + a.id + '"' : '') + '>' + (a.local ? '' : (a.srcAlt ? '<source src="' + ui.esc(a.srcAlt) + '" type="video/webm">' : '') + '<source src="' + ui.esc(a.src) + '" type="video/mp4">') + '</video>' : '<img src="' + ui.esc(ui.mediaSrc(a, true)) + '" alt="' + ui.esc(a.alt || a.name) + '"' + (a.local ? ' data-local="' + a.id + '"' : '') + '>';
    var m = ui.modal({ title: a.name, drawer: true,
      body: '<div class="adet__media">' + big + '</div>' +
        '<div class="row wrap" style="margin:12px 0">' + (can ? '<a class="btn btn--p btn--sm" href="#/compose?asset=' + a.id + '" data-close>' + ui.icon('pen', 14) + 'Use in a post</a>' : '') + (a.local ? '' : '<a class="btn btn--sm" href="' + ui.esc(a.src) + '" download>' + ui.icon('download', 14) + 'Download</a>') + (can ? '<button class="btn btn--sm" data-dupa>' + ui.icon('copy', 14) + 'Duplicate</button><button class="btn btn--sm btn--ghost btn--danger" data-dela>' + ui.icon('trash', 14) + 'Delete</button>' : '') + '</div>' +
        '<form data-meta><div class="fgrid">' + ui.field('File name', ui.input('name', a.name, { attr: can ? '' : ' disabled' }), { full: true }) + ui.field('Alt text', '<textarea class="ta" name="alt" rows="2"' + (can ? '' : ' disabled') + ' placeholder="Describe the image for people using screen readers">' + ui.esc(a.alt || '') + '</textarea>', { full: true, hint: 'Used as alt text where the network supports it.' }) +
        ui.field('Tags', ui.input('tags', (a.tags || []).join(', '), { attr: can ? '' : ' disabled' }), { hint: 'Comma separated' }) + ui.field('Campaign', ui.select('campaignId', [{ value: '', label: 'No campaign' }].concat(camps.map(function (c) { return { value: c.id, label: c.name }; })), a.campaignId || '', { attr: can ? '' : ' disabled' })) + '</div>' + (can ? '<div class="row" style="margin-top:12px"><button class="btn btn--sm" type="submit">Save details</button></div>' : '') + '</form>' +
        '<dl class="kv" style="margin-top:16px"><dt>Brand</dt><dd>' + ui.esc(store.brand(a.brandId).name) + '</dd><dt>Type</dt><dd>' + (a.type === 'video' ? 'Video' + (a.duration ? ', ' + Math.round(a.duration) + ' seconds' : '') : 'Image') + '</dd><dt>Dimensions</dt><dd>' + (a.w ? a.w + ' × ' + a.h + ' px' : '—') + '</dd><dt>File size</dt><dd>' + ui.bytes(a.size) + '</dd><dt>Uploaded</dt><dd>' + T.dateTime(a.uploadedAt) + ' by ' + ui.esc(app.userName(a.uploadedBy)) + '</dd><dt>Stored</dt><dd>' + (a.local ? 'In this browser (IndexedDB)' : 'Template asset') + '</dd>' + (a.credit ? '<dt>Photo</dt><dd><a class="link" href="https://unsplash.com/@' + ui.esc(a.credit[1]) + '?utm_source=orbit_template&utm_medium=referral" target="_blank" rel="noopener">' + ui.esc(a.credit[0]) + '</a> on <a class="link" href="https://unsplash.com/?utm_source=orbit_template&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a></dd>' : '') + '</dl>' +
        '<h4 class="dr-h">Used in ' + usage.length + ' post' + (usage.length === 1 ? '' : 's') + '</h4><div class="card card--flush" data-use>' + (usage.length ? usage.map(function (p) { return pc.row(p); }).join('') : '<p class="muted" style="padding:12px 14px">Not used yet.</p>') + '</div>',
      foot: false });
    ui.hydrate(m.el);
    m.el.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) m.close();
      var r = e.target.closest('[data-post]'); if (r) { m.close(); pc.drawer(r.getAttribute('data-post')); }
      if (e.target.closest('[data-dupa]')) {
        var bs = store.brands().filter(function (b) { return store.can('content.edit', b.id); });
        ui.modal({ title: 'Duplicate file', ok: 'Duplicate', body: '<p class="muted" style="margin-bottom:10px">Creates a copy you can tag and rename separately, for example for another brand.</p>' + ui.field('Brand', ui.select('brand', bs.map(function (b) { return { value: b.id, label: b.name }; }), a.brandId)),
          onOk: function (api) { var v = ui.read(api.el); var x = ui.run(function () { return store.duplicateAsset(a.id, v.brand); }, 'File duplicated'); if (!x) return false; m.close(); } });
      }
      if (e.target.closest('[data-dela]')) ui.confirm({ title: 'Delete this file?', body: 'It will be removed from the library. Published posts keep their record.', ok: 'Delete file', danger: true }).then(function (ok) { if (ok && ui.run(function () { return store.deleteAsset(a.id); }, 'File deleted')) m.close(); });
    });
    m.el.addEventListener('submit', function (e) {
      if (!e.target.matches('[data-meta]')) return; e.preventDefault();
      var v = ui.read(e.target);
      ui.run(function () { return store.updateAsset(a.id, { name: v.name.trim(), alt: v.alt.trim(), tags: v.tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean), campaignId: v.campaignId || null }); }, 'Details saved');
    });
  }

  function snippetDialog(id) {
    var s = id ? store.state.snippets.filter(function (x) { return x.id === id; })[0] : null;
    var bs = store.brands().filter(function (b) { return store.can('content.edit', b.id); });
    ui.modal({ title: s ? 'Edit snippet' : 'New snippet', ok: 'Save',
      body: '<div class="fgrid">' + ui.field('Name', ui.input('name', s ? s.name : '', { ph: 'e.g. Launch hashtags' })) + ui.field('Brand', ui.select('brandId', bs.map(function (b) { return { value: b.id, label: b.name }; }), s ? s.brandId : (store.scopeBrand() || bs[0] || {}).id)) + ui.field('Type', ui.select('kind', [{ value: 'hashtags', label: 'Hashtag set' }, { value: 'caption', label: 'Caption text' }], s ? s.kind : 'hashtags')) + ui.field('Text', '<textarea class="ta" name="body" rows="3">' + ui.esc(s ? s.body : '') + '</textarea>', { full: true }) + '</div>' + (s ? '<button class="btn btn--sm btn--ghost btn--danger" data-dels style="margin-top:12px">' + ui.icon('trash', 13) + 'Delete snippet</button>' : ''),
      onOpen: function (el, api) { var d = el.querySelector('[data-dels]'); if (d) d.onclick = function () { ui.run(function () { store.deleteSnippet(s.id); }, 'Snippet deleted'); api.close(); }; },
      onOk: function (api) { var v = ui.read(api.el); v.id = s && s.id; if (!ui.run(function () { return store.saveSnippet(v); }, 'Snippet saved')) return false; } });
  }

  function campaignDialog(id) {
    var c = id ? store.campaign(id) : null;
    var bs = store.brands().filter(function (b) { return store.can('content.schedule', b.id); });
    var today = T.todayKey();
    ui.modal({ title: c ? 'Edit campaign' : 'New campaign', ok: 'Save',
      body: '<div class="fgrid">' + ui.field('Name', ui.input('name', c ? c.name : '', { ph: 'e.g. December Escapes' }), { full: true }) + ui.field('Brand', ui.select('brandId', bs.map(function (b) { return { value: b.id, label: b.name }; }), c ? c.brandId : (store.scopeBrand() || bs[0] || {}).id)) + ui.field('Colour', '<input class="inp" type="color" name="color" value="' + (c ? c.color : '#0E7C6E') + '">') + ui.field('Starts', '<input class="inp" type="date" name="start" value="' + (c ? c.start : today) + '">') + ui.field('Ends', '<input class="inp" type="date" name="end" value="' + (c ? c.end : T.addDaysKey(today, 30)) + '">') + ui.field('Goal', '<textarea class="ta" name="goal" rows="2">' + ui.esc(c ? c.goal : '') + '</textarea>', { full: true }) + '</div>',
      onOk: function (api) { var v = ui.read(api.el); v.id = c && c.id; if (!ui.run(function () { return store.saveCampaign(v); }, 'Campaign saved')) return false; } });
  }
})();
