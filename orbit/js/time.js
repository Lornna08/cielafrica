/* ============================================================
   ORBIT SOCIAL — time zone helpers
   Every date is STORED as a UTC ISO string and DISPLAYED in the
   workspace time zone (Settings → Scheduling). Calendar cells,
   week columns and the composer's date/time fields all go through
   these functions, so switching views never moves a post.
   ============================================================ */
window.OS = window.OS || {};
(function () {
  'use strict';
  var T = OS.time = { zone: 'Africa/Nairobi' };
  var cache = {};
  function fmt(zone) {
    if (!cache[zone]) cache[zone] = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' });
    return cache[zone];
  }
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  // parts(dateOrIso) -> {y, m (1-12), d, h, mi, dow (0=Sun)}
  T.parts = function (v, zone) {
    var dt = v instanceof Date ? v : new Date(v), o = {};
    fmt(zone || T.zone).formatToParts(dt).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second, dow: WD[o.weekday] };
  };
  function offset(ts, zone) { var p = T.parts(new Date(ts), zone); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000; }
  // fromParts(y, m, d, h, mi) in the workspace zone -> Date
  T.fromParts = function (y, m, d, h, mi, zone) {
    zone = zone || T.zone;
    var guess = Date.UTC(y, m - 1, d, h || 0, mi || 0), off = offset(guess, zone), ts = guess - off, off2 = offset(ts, zone);
    if (off2 !== off) ts = guess - off2;
    return new Date(ts);
  };
  T.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  // day key "YYYY-MM-DD" in the workspace zone
  T.dayKey = function (v) { var p = T.parts(v); return p.y + '-' + T.pad(p.m) + '-' + T.pad(p.d); };
  T.keyToParts = function (k) { var a = k.split('-'); return { y: +a[0], m: +a[1], d: +a[2] }; };
  T.addDaysKey = function (k, n) { var p = T.keyToParts(k), dt = new Date(Date.UTC(p.y, p.m - 1, p.d + n)); return dt.getUTCFullYear() + '-' + T.pad(dt.getUTCMonth() + 1) + '-' + T.pad(dt.getUTCDate()); };
  T.dowOfKey = function (k) { var p = T.keyToParts(k); return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); };
  T.todayKey = function () { return T.dayKey(new Date()); };
  T.timeOf = function (v) { var p = T.parts(v); return T.pad(p.h) + ':' + T.pad(p.mi); };
  T.at = function (dayKey, hhmm) { var p = T.keyToParts(dayKey), t = (hhmm || '09:00').split(':'); return T.fromParts(p.y, p.m, p.d, +t[0], +t[1]); };
  T.iso = function (dayKey, hhmm) { return T.at(dayKey, hhmm).toISOString(); };

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  T.MON = MON; T.MONL = MONL; T.DOW = DOW; T.DOWL = DOWL;
  T.hm = function (v) { var p = T.parts(v), h = p.h % 12 || 12; return h + ':' + T.pad(p.mi) + (p.h < 12 ? ' am' : ' pm'); };
  T.date = function (v, withYear) { var p = T.parts(v), now = T.parts(new Date()); return p.d + ' ' + MON[p.m - 1] + (withYear || p.y !== now.y ? ' ' + p.y : ''); };
  T.dateTime = function (v) { return T.date(v) + ', ' + T.hm(v); };
  T.dayLabel = function (k) {
    var t = T.todayKey();
    if (k === t) return 'Today';
    if (k === T.addDaysKey(t, 1)) return 'Tomorrow';
    if (k === T.addDaysKey(t, -1)) return 'Yesterday';
    var p = T.keyToParts(k); return DOW[T.dowOfKey(k)] + ' ' + p.d + ' ' + MON[p.m - 1];
  };
  T.rel = function (v) {
    var diff = (Date.now() - new Date(v).getTime()) / 1000;
    if (diff < 0) { var f = -diff; if (f < 3600) return 'in ' + Math.max(1, Math.round(f / 60)) + 'm'; if (f < 86400) return 'in ' + Math.round(f / 3600) + 'h'; return 'in ' + Math.round(f / 86400) + 'd'; }
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
    return T.date(v);
  };
  T.zoneLabel = function (zone) {
    zone = zone || T.zone;
    var off = offset(Date.now(), zone) / 60000, s = off >= 0 ? '+' : '−', a = Math.abs(off);
    return zone.replace(/_/g, ' ').split('/').pop() + ' (UTC' + s + Math.floor(a / 60) + (a % 60 ? ':' + T.pad(a % 60) : '') + ')';
  };
  T.ZONES = ['Africa/Nairobi', 'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Accra', 'Europe/London', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney', 'UTC'];
})();
