/* ============================================================
   CIEL PHOTO BOOKS — private order storage (Vercel Blob, access: private)
   orders/<ref>/order.json                order record
   orders/<ref>/<projectId>/print/NNN.jpg print pages at 300 dpi with 3 mm bleed
   orders/<ref>/<projectId>/view/NNN.jpg  small copies for the book preview
   orders/<ref>/<projectId>/book.json     page list and specs sent with the files
   Nothing here is public: files are read through the admin API only.
   ============================================================ */
function on() { return !!process.env.BLOB_READ_WRITE_TOKEN; }
let sdk = null;
function blob() { if (!sdk) sdk = require('@vercel/blob'); return sdk; }
const OPT = { access: 'private', addRandomSuffix: false, allowOverwrite: true };

async function putJSON(path, obj) { return blob().put(path, JSON.stringify(obj), Object.assign({ contentType: 'application/json', cacheControlMaxAge: 60 }, OPT)); }
async function readStream(stream) { const chunks = []; for await (const c of stream) chunks.push(Buffer.from(c)); return Buffer.concat(chunks); }
async function getBuf(path) {
  try { const r = await blob().get(path, { access: 'private', useCache: false }); if (!r || !r.stream) return null; return { buf: await readStream(r.stream), type: (r.blob && r.blob.contentType) || (r.headers && r.headers.get && r.headers.get('content-type')) || 'application/octet-stream' }; }
  catch (e) { if (e && /not ?found/i.test(e.name + ' ' + e.message)) return null; throw e; }
}
async function getJSON(path) { const r = await getBuf(path); return r ? JSON.parse(r.buf.toString('utf8')) : null; }
const orderPath = ref => 'orders/' + ref + '/order.json';
async function saveOrder(o) { o.updatedAt = Date.now(); await putJSON(orderPath(o.ref), o); return o; }
async function getOrder(ref) { return /^PB-[0-9A-Z]{8}$/.test(ref) ? getJSON(orderPath(ref)) : null; }
async function listOrders(limit) {
  const refs = []; let cursor;
  do { const r = await blob().list({ prefix: 'orders/', mode: 'folded', cursor, limit: 1000 }); (r.folders || []).forEach(f => { const m = f.match(/^orders\/(PB-[0-9A-Z]{8})\/$/); if (m) refs.push(m[1]); }); cursor = r.hasMore ? r.cursor : null; } while (cursor && refs.length < 2000);
  const list = (await Promise.all(refs.map(r => getOrder(r).catch(() => null)))).filter(Boolean);
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, limit || 500);
}
async function listFiles(prefix) {
  const out = []; let cursor;
  do { const r = await blob().list({ prefix, cursor, limit: 1000 }); (r.blobs || []).forEach(b => out.push({ path: b.pathname, size: b.size, at: b.uploadedAt })); cursor = r.hasMore ? r.cursor : null; } while (cursor);
  return out;
}
async function putFile(path, buf, type) { return blob().put(path, buf, Object.assign({ contentType: type || 'image/jpeg', cacheControlMaxAge: 3600 }, OPT)); }
async function del(paths) { if (paths.length) await blob().del(paths); }
module.exports = { on, saveOrder, getOrder, listOrders, listFiles, putFile, getBuf, putJSON, getJSON, del };
