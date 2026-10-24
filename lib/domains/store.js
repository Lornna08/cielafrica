/* ============================================================
   CIEL DOMAINS — storage
   Upstash Redis over its REST API (no extra packages). Add it from
   Vercel → Storage → Upstash Redis (free tier); Vercel then sets
   KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*).
   Without it, a memory store is used: fine for searching and tests,
   but orders are NOT accepted (they would be lost between requests).
   ============================================================ */

function redisEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

const enc = v => JSON.stringify(v);
const dec = v => { if (v == null) return null; try { return JSON.parse(v); } catch (e) { return v; } };

class RedisStore {
  constructor(cfg, fetchImpl) { this.cfg = cfg; this.fetch = fetchImpl || fetch; this.durable = true; }
  async cmd(args) {
    const r = await this.fetch(this.cfg.url, {
      method: 'POST', headers: { Authorization: 'Bearer ' + this.cfg.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(args), signal: AbortSignal.timeout(5000)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error('store: ' + (j.error || r.status));
    return j.result;
  }
  async multi(cmds) { // atomic MULTI/EXEC
    const r = await this.fetch(this.cfg.url + '/multi-exec', {
      method: 'POST', headers: { Authorization: 'Bearer ' + this.cfg.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds), signal: AbortSignal.timeout(5000)
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(j)) throw new Error('store multi: ' + r.status);
    return j.map(x => { if (x.error) throw new Error('store: ' + x.error); return x.result; });
  }
  async get(k) { return dec(await this.cmd(['GET', k])); }
  async set(k, v, o) {
    const a = ['SET', k, enc(v)];
    if (o && o.ex) a.push('EX', String(o.ex));
    if (o && o.nx) a.push('NX');
    return (await this.cmd(a)) === 'OK';
  }
  async del(k) { return this.cmd(['DEL', k]); }
  async incr(k, ex) { const r = await this.multi([['SET', k, '0', 'EX', String(ex || 60), 'NX'], ['INCR', k]]); return r[1]; }
  async zadd(k, score, m) { return this.cmd(['ZADD', k, String(score), m]); }
  async zrevrange(k, a, b) { return (await this.cmd(['ZREVRANGE', k, String(a), String(b)])) || []; }
  async zrem(k, m) { return this.cmd(['ZREM', k, m]); }
  async lpush(k, v, max) { await this.multi([['LPUSH', k, enc(v)], ['LTRIM', k, '0', String((max || 500) - 1)]]); }
  async lrange(k, a, b) { return ((await this.cmd(['LRANGE', k, String(a), String(b)])) || []).map(dec); }
  async mget(keys) { if (!keys.length) return []; return ((await this.cmd(['MGET'].concat(keys))) || []).map(dec); }
}

class MemoryStore {
  constructor() { this.m = new Map(); this.z = new Map(); this.l = new Map(); this.durable = false; }
  _live(k) { const e = this.m.get(k); if (!e) return null; if (e.x && e.x < Date.now()) { this.m.delete(k); return null; } return e; }
  async get(k) { const e = this._live(k); return e ? dec(e.v) : null; }
  async set(k, v, o) {
    if (o && o.nx && this._live(k)) return false;
    this.m.set(k, { v: enc(v), x: o && o.ex ? Date.now() + o.ex * 1000 : 0 }); return true;
  }
  async del(k) { this.m.delete(k); return 1; }
  async incr(k, ex) {
    const e = this._live(k); const n = (e ? Number(dec(e.v)) : 0) + 1;
    this.m.set(k, { v: String(n), x: e && e.x ? e.x : Date.now() + (ex || 60) * 1000 }); return n;
  }
  async zadd(k, s, m) { const z = this.z.get(k) || new Map(); z.set(m, s); this.z.set(k, z); return 1; }
  async zrevrange(k, a, b) {
    const z = [...(this.z.get(k) || new Map()).entries()].sort((x, y) => y[1] - x[1]).map(x => x[0]);
    return z.slice(a, b < 0 ? undefined : b + 1);
  }
  async zrem(k, m) { const z = this.z.get(k); if (z) z.delete(m); return 1; }
  async lpush(k, v, max) { const l = this.l.get(k) || []; l.unshift(enc(v)); this.l.set(k, l.slice(0, max || 500)); }
  async lrange(k, a, b) { return (this.l.get(k) || []).slice(a, b < 0 ? undefined : b + 1).map(dec); }
  async mget(keys) { return Promise.all(keys.map(k => this.get(k))); }
}

let shared = null;
function getStore() {
  if (shared) return shared;
  const cfg = redisEnv();
  shared = cfg ? new RedisStore(cfg) : new MemoryStore();
  return shared;
}
function setStore(s) { shared = s; } // tests

module.exports = { getStore, setStore, MemoryStore, RedisStore, redisEnv };
