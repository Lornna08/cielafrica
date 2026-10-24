/* ============================================================
   CIEL DOMAINS — availability checks

   States (never invent one):
     available               registry RDAP has no record of the name (preliminary —
                             final availability is confirmed when we register it)
     registered              registry RDAP has a record, or the name has live nameservers
     premium                 only from a provider that returns premium pricing (none yet)
     reserved                the registry says reserved / restricted
     unknown                 no source can tell (e.g. .co / .io / .me without nameservers)
     temporarily_unavailable the source timed out or errored — try again

   Providers are pluggable: a registrar API can later be added as a
   provider with { name, supports(tld), check(domain, tld) }.
   ============================================================ */
const dns = require('dns');

const STATES = ['available', 'registered', 'premium', 'reserved', 'unknown', 'temporarily_unavailable'];
const TTL = { available: 600, registered: 6 * 3600, reserved: 3600, unknown: 1800, premium: 1800, temporarily_unavailable: 0 };
const RDAP_TIMEOUT = 4500, DNS_TIMEOUT = 2500, PER_HOST = 4;

/* ---------- small helpers ---------- */
const hostQueues = new Map();
async function limitHost(host, fn) {
  let q = hostQueues.get(host);
  if (!q) { q = { n: 0, waiting: [] }; hostQueues.set(host, q); }
  if (q.n >= PER_HOST) await new Promise(r => q.waiting.push(r));
  q.n++;
  try { return await fn(); } finally { q.n--; const nx = q.waiting.shift(); if (nx) nx(); }
}
const memCache = new Map();
function memGet(k) { const e = memCache.get(k); if (!e) return null; if (e.x < Date.now()) { memCache.delete(k); return null; } return e.v; }
function memSet(k, v, ttl) { if (!ttl) return; if (memCache.size > 2000) memCache.clear(); memCache.set(k, { v, x: Date.now() + ttl * 1000 }); }

/* ---------- providers ---------- */
function rdapProvider(fetchImpl) {
  return {
    name: 'rdap',
    async check(domain, t) {
      const url = t.rdap + 'domain/' + encodeURIComponent(domain);
      const host = new URL(t.rdap).host;
      return limitHost(host, async () => {
        let r;
        try {
          r = await (fetchImpl || fetch)(url, {
            headers: { Accept: 'application/rdap+json, application/json', 'User-Agent': 'CielDomains/1.0 (+https://cielafrica.com/domains)' },
            redirect: 'follow', signal: AbortSignal.timeout(RDAP_TIMEOUT)
          });
        } catch (e) {
          return { state: 'temporarily_unavailable', detail: e && e.name === 'TimeoutError' ? 'registry timed out' : 'registry unreachable' };
        }
        if (r.status === 404) return { state: 'available', detail: 'no registration record' };
        if (r.status === 200) {
          let j = null; try { j = await r.json(); } catch (e) { j = null; }
          const st = ((j && j.status) || []).map(s => String(s).toLowerCase());
          if (st.some(s => s.includes('reserved'))) return { state: 'reserved', detail: 'reserved by the registry' };
          if (j && (j.objectClassName === 'domain' || j.ldhName || j.handle)) {
            const exp = ((j.events || []).find(e => e.eventAction === 'expiration') || {}).eventDate || null;
            return { state: 'registered', detail: 'registration record found', expires: exp };
          }
          return { state: 'unknown', detail: 'unexpected registry reply' };
        }
        if (r.status === 429) return { state: 'temporarily_unavailable', detail: 'registry rate limit' };
        if (r.status === 400 || r.status === 422) return { state: 'unknown', detail: 'registry did not accept the query' };
        if (r.status === 403) return { state: 'temporarily_unavailable', detail: 'registry refused the query' };
        return { state: 'temporarily_unavailable', detail: 'registry error ' + r.status };
      });
    }
  };
}

function dnsProvider(resolverImpl) {
  return {
    name: 'dns',
    async check(domain) {
      const res = resolverImpl || (() => {
        const r = new dns.promises.Resolver({ timeout: DNS_TIMEOUT, tries: 1 });
        try { r.setServers(['1.1.1.1', '8.8.8.8']); } catch (e) { /* default servers */ }
        return r;
      })();
      try {
        const ns = await Promise.race([res.resolveNs(domain), new Promise((_, j) => setTimeout(() => j(Object.assign(new Error('t'), { code: 'ETIMEOUT' })), DNS_TIMEOUT + 300))]);
        if (ns && ns.length) return { state: 'registered', detail: 'has live nameservers' };
        return { state: 'unknown', detail: 'no nameservers' };
      } catch (e) {
        const c = e && e.code;
        if (c === 'ENOTFOUND' || c === 'ENODATA' || c === 'NXDOMAIN') return { state: 'unknown', detail: 'no nameservers' };
        return { state: 'temporarily_unavailable', detail: 'dns ' + (c || 'error') };
      }
    }
  };
}

/* ---------- orchestration ---------- */
function makeChecker(opts) {
  opts = opts || {};
  const rdap = opts.rdap || rdapProvider(opts.fetch);
  const dnsP = opts.dns || dnsProvider(opts.resolver);
  const store = opts.store || null;
  const now = opts.now || (() => Date.now());

  async function checkOne(domain, t, o) {
    o = o || {};
    const key = 'dc:avail:' + domain;
    if (!o.fresh) {
      const hit = memGet(key) || (store ? await store.get(key).catch(() => null) : null);
      if (hit) return Object.assign({}, hit, { cached: true });
    }
    let out;
    if (t.method === 'manual') {
      out = { state: 'unknown', detail: 'checked by hand', source: 'manual' };
    } else if (t.method === 'rdap' && t.rdap) {
      const [a, b] = await Promise.all([rdap.check(domain, t), dnsP.check(domain).catch(() => ({ state: 'temporarily_unavailable' }))]);
      if (a.state === 'available' && b.state === 'registered') out = { state: 'registered', detail: 'has live nameservers', source: 'dns' };
      else if (a.state === 'temporarily_unavailable' && b.state === 'registered') out = { state: 'registered', detail: 'has live nameservers (registry did not answer)', source: 'dns' };
      else out = Object.assign({ source: 'rdap' }, a);
    } else {
      const b = await dnsP.check(domain);
      out = Object.assign({ source: 'dns' }, b);
    }
    const res = {
      domain, tld: t.tld, state: out.state, detail: out.detail || '', expires: out.expires || null,
      source: out.source, sourceName: out.source === 'rdap' ? t.source : out.source === 'dns' ? 'Public DNS' : 'Manual check',
      preliminary: out.state === 'available',
      needsConfirmation: out.state === 'unknown' || (out.state === 'available' && !!t.verifyBeforePayment),
      checkedAt: new Date(now()).toISOString()
    };
    const ttl = TTL[res.state] || 0;
    memSet(key, res, Math.min(ttl, 120));
    if (store && ttl) store.set(key, res, { ex: ttl }).catch(() => {});
    return res;
  }

  /** check many with a global concurrency cap */
  async function checkMany(items, o) {
    const out = new Array(items.length); let i = 0;
    const lanes = Math.min(8, items.length);
    await Promise.all(Array.from({ length: lanes }, async () => {
      while (i < items.length) { const k = i++; out[k] = await checkOne(items[k].domain, items[k].t, o).catch(() => ({ domain: items[k].domain, tld: items[k].t.tld, state: 'temporarily_unavailable', detail: 'check failed', preliminary: false, needsConfirmation: false })); }
    }));
    return out;
  }
  return { checkOne, checkMany };
}

module.exports = { makeChecker, rdapProvider, dnsProvider, STATES, _memCache: memCache };
