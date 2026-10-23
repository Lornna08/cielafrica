/* ============================================================
   C-Ledger — template store: persistence, current user, period, events
   The template keeps its sample books in this browser only (localStorage).
   This is NOT production storage — see README for the production design.
   ============================================================ */
(function () {
  'use strict';
  var CL = window.CL, KEY = 'cledger:demo:v1', subs = [];
  var store = CL.store = { S: null, E: null, ui: {} };

  function today() { return CL.iso(new Date()); }
  function actor() {
    var S = store.S, me = S.team.filter(function (u) { return u.id === S.me; })[0] || S.team[0];
    return { id: me.id, name: me.name, role: S.viewAs || me.role, simulated: true, initials: me.initials, tone: me.tone };
  }
  store.me = function () { var S = store.S; return S.team.filter(function (u) { return u.id === S.me; })[0]; };
  store.actor = actor;
  store.today = today;

  function attach() { store.E = CL.Engine(store.S, { today: today, now: function () { return new Date().toISOString(); }, actor: actor }); }
  function fresh() { store.S = CL.seed(today()); store.S.touched = false; store.S.createdAt = Date.now(); attach(); save(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store.S)); } catch (e) { /* private mode or full: keep working in memory */ } }
  store.load = function () {
    var raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { }
    if (raw) {
      try {
        var S = JSON.parse(raw), age = Date.now() - (S.createdAt || 0);
        // untouched templates refresh after 12 hours so dates stay current; edited ones are kept for 30 days
        if (S.v === 1 && S.seededFor && (S.touched ? age < 30 * 864e5 : age < 12 * 3600e3)) { store.S = S; attach(); return; }
      } catch (e) { }
    }
    fresh();
  };
  store.reset = function () { fresh(); store.ui = {}; emit('reset'); };
  store.sub = function (fn) { subs.push(fn); return function () { subs.splice(subs.indexOf(fn), 1); }; };
  function emit(kind) { subs.slice().forEach(function (fn) { try { fn(kind || 'data'); } catch (e) { console.error(e); } }); }
  store.emit = emit;
  /** Run a mutating action. Saves and re-renders on success; errors go to a toast or the form. */
  store.act = function (fn, ok, form) {
    var r = CL.try(fn, ok, form);
    if (r !== false) { store.S.touched = true; save(); emit('data'); }
    return r;
  };
  store.setPref = function (k, v) { store.S.settings[k] = v; store.S.touched = true; save(); emit('prefs'); };

  /* ---------- reporting periods ---------- */
  store.PERIODS = [['month', 'This month'], ['lastMonth', 'Last month'], ['quarter', 'This quarter'], ['fy', 'This financial year'], ['lastFy', 'Last financial year'], ['12m', 'Last 12 months']];
  /** Returns {from, to, label, prev:{from,to,label}} for a period id, relative to today. */
  store.range = function (id) {
    id = id || store.ui.period || store.S.settings.defaultPeriod || 'month';
    var t = today(), d = new Date(t + 'T00:00:00'), y = d.getFullYear(), m = d.getMonth(), E = store.E;
    function r(a, b, label) { return { from: CL.iso(a), to: CL.iso(b), label: label }; }
    var cur, prev;
    if (id === 'month') { cur = r(new Date(y, m, 1), d, CL.fmt.MONTH[m] + ' ' + y + ' to date'); prev = r(new Date(y, m - 1, 1), new Date(y, m - 1, Math.min(d.getDate(), new Date(y, m, 0).getDate())), 'same days last month'); }
    else if (id === 'lastMonth') { cur = r(new Date(y, m - 1, 1), new Date(y, m, 0), CL.fmt.MONTH[(m + 11) % 12] + ' ' + new Date(y, m - 1, 1).getFullYear()); prev = r(new Date(y, m - 2, 1), new Date(y, m - 1, 0), 'the month before'); }
    else if (id === 'quarter') { var q = Math.floor(m / 3) * 3; cur = r(new Date(y, q, 1), d, 'Q' + (q / 3 + 1) + ' ' + y + ' to date'); prev = r(new Date(y, q - 3, 1), new Date(y, q - 3, 1 + Math.floor((d - new Date(y, q, 1)) / 864e5)), 'same point last quarter'); }
    else if (id === 'fy' || id === 'lastFy') {
      var fy = E.fyOf(t); if (id === 'lastFy') fy = E.fyOf(CL.addDays(fy.start, -1));
      var end = id === 'fy' ? t : fy.end; cur = { from: fy.start, to: end, label: fy.label + (id === 'fy' ? ' to date' : '') };
      var pfy = E.fyOf(CL.addDays(fy.start, -1)), span = CL.daysBetween(fy.start, end); prev = { from: pfy.start, to: CL.addDays(pfy.start, span), label: pfy.label + ' (same period)' };
    }
    else { cur = r(new Date(y, m - 11, 1), d, 'Last 12 months'); prev = r(new Date(y, m - 23, 1), new Date(y - 1, m, d.getDate()), 'the 12 months before'); }
    cur.prev = prev; cur.id = id; return cur;
  };
  store.months = function (n, endKey) {
    var t = new Date(today() + 'T00:00:00'), out = [];
    for (var i = n - 1; i >= 0; i--) { var a = new Date(t.getFullYear(), t.getMonth() - i, 1), b = new Date(t.getFullYear(), t.getMonth() - i + 1, 0); out.push({ key: CL.iso(a).slice(0, 7), from: CL.iso(a), to: CL.iso(b) > today() ? today() : CL.iso(b) }); }
    return out;
  };
})();
