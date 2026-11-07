/* Ciel notifications: small cards that slide in at the top right (top, full width on phones),
   stay a few seconds and can be closed. CielNote(message, {kind:'ok'|'err'|'info'|'tip', ms}) */
(function () {
  if (window.CielNote) return;
  var box;
  var ICON = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>'
  };
  function guess(m) {
    m = String(m || '').toLowerCase();
    if (/could ?n[o’']?t|can[’']?t|failed|error|not saved|wrong|invalid|missing|too (big|large)|please|unlock|isn[’']?t|first/.test(m)) return 'err';
    if (/saved|done|added|copied|sent|deleted|published|on its way|up to date|removed|ready|confirmed/.test(m)) return 'ok';
    return 'info';
  }
  function note(msg, o) {
    o = o || {};
    if (!msg) return;
    if (!box || !box.isConnected) { box = document.createElement('div'); box.className = 'cnote-box'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var kind = o.kind || guess(msg), text = String(msg);
    /* the same message again: refresh it rather than stacking copies */
    var same = [].filter.call(box.children, function (c) { return c._t === text; })[0];
    if (same) { clearTimeout(same._h); same._h = setTimeout(function () { close(same); }, o.ms || 4200); return same; }
    var n = document.createElement('div'); n.className = 'cnote cnote--' + kind; n.setAttribute('role', kind === 'err' ? 'alert' : 'status'); n._t = text;
    n.innerHTML = '<span class="cnote__i">' + (ICON[kind] || ICON.info) + '</span><p></p><button type="button" class="cnote__x" aria-label="Close">×</button>';
    n.querySelector('p').textContent = text;
    n.querySelector('.cnote__x').onclick = function () { close(n); };
    box.insertBefore(n, box.firstChild);
    while (box.children.length > (innerWidth < 700 ? 1 : 3)) close(box.lastChild, true);
    requestAnimationFrame(function () { n.classList.add('is-on'); });
    n._h = setTimeout(function () { close(n); }, o.ms || (kind === 'err' ? 6000 : kind === 'tip' ? 6500 : 4200));
    return n;
  }
  function close(n, now) { if (!n) return; if (now) { clearTimeout(n._h); n.remove(); return; } if (n._gone) return; n._gone = 1; clearTimeout(n._h); n.classList.remove('is-on'); setTimeout(function () { n.remove(); }, 260); }
  window.CielNote = note;
})();
