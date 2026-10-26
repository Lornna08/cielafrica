'use strict';
/**
 * Payment record storage.
 *
 * A store must implement:
 *   async get(id)                          -> record | null
 *   async findByOrder(orderId)             -> record[]  (to stop double payment of one order)
 *   async create(record)                   -> record   (throws if id exists)
 *   async transition(id, fromStatus, patch)-> record | null
 *        Applies `patch` ONLY if the record's current status equals `fromStatus`,
 *        atomically. Returns null when the status had already changed. This is what
 *        makes duplicate callbacks and concurrent status checks safe.
 *   async patch(id, patch)                 -> record | null   (non-status fields, e.g. a late receipt)
 *
 * MemoryStore and JsonFileStore are for one Node.js process. If you run several
 * instances or serverless functions, implement the same five methods on your
 * database (for example an UPDATE ... WHERE id = ? AND status = ? in SQL).
 */
const fs = require('fs');
const path = require('path');

function copy(o) { return o ? JSON.parse(JSON.stringify(o)) : o; }

class MemoryStore {
  constructor() { this.rows = new Map(); }
  async get(id) { return copy(this.rows.get(id) || null); }
  async create(rec) {
    if (this.rows.has(rec.id)) throw new Error('Payment ' + rec.id + ' already exists');
    this.rows.set(rec.id, copy(rec));
    return copy(rec);
  }
  async transition(id, from, patch) {
    const r = this.rows.get(id);
    if (!r || r.status !== from) return null;
    Object.assign(r, copy(patch), { updatedAt: new Date().toISOString() });
    return copy(r);
  }
  async patch(id, patch) {
    const r = this.rows.get(id);
    if (!r) return null;
    const p = copy(patch); delete p.status;
    Object.assign(r, p, { updatedAt: new Date().toISOString() });
    return copy(r);
  }
  async findByOrder(orderId) { return [...this.rows.values()].filter((r) => r.orderId === orderId).map(copy); }
  async all() { return [...this.rows.values()].map(copy); }
}

/** Keeps records in a JSON file (written atomically). Good for small single-server sites. */
class JsonFileStore extends MemoryStore {
  constructor(file) {
    super();
    this.file = path.resolve(file);
    try {
      const data = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      for (const r of data.payments || []) this.rows.set(r.id, r);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    this._queue = Promise.resolve();
  }
  _save() {
    const data = JSON.stringify({ payments: [...this.rows.values()] }, null, 1);
    this._queue = this._queue.then(() => {
      const tmp = this.file + '.' + process.pid + '.tmp';
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(tmp, data, { mode: 0o600 });
      fs.renameSync(tmp, this.file);
    });
    return this._queue;
  }
  async create(rec) { const r = await super.create(rec); await this._save(); return r; }
  async transition(id, from, patch) { const r = await super.transition(id, from, patch); if (r) await this._save(); return r; }
  async patch(id, patch) { const r = await super.patch(id, patch); if (r) await this._save(); return r; }
}

module.exports = { MemoryStore, JsonFileStore };
