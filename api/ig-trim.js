/* ============================================================
   CIEL ADMIN — trim a video for Instagram: /api/ig-trim (POST)
   { path | src, start, end } in seconds → a new file in the private Blob store,
   cut exactly for clips up to 90 seconds (re-encoded at high quality), and without
   re-encoding for longer ones (quick; the start lands on the nearest keyframe). Admins only.
   ============================================================ */
const fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');
const { Readable } = require('stream'), { pipeline } = require('stream/promises');
const sec = require('../lib/domains/security');
const IG = require('../lib/hq/instagram');
const MAX = 220 * 1024 * 1024;
const send = (res, code, o) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(o)); };
async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const parts = []; for await (const c of req) parts.push(c); try { return JSON.parse(Buffer.concat(parts).toString() || '{}'); } catch (e) { return {}; }
}
module.exports = async (req, res) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trim-')), inp = path.join(dir, 'in'), out = path.join(dir, 'out.mp4');
  try {
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed.' });
    if (!sec.secret() || !process.env.ADMIN_PASSWORD || !sec.checkSession(req)) return send(res, 401, { ok: false, error: 'Please sign in.' });
    if (!sec.sameOrigin(req)) return send(res, 403, { ok: false, error: 'Blocked.' });
    const b = await readBody(req), start = Math.max(0, +b.start || 0), end = +b.end;
    if (!(end > start + 0.5) || end - start > 900) return send(res, 400, { ok: false, error: 'Pick a part between half a second and 15 minutes long.' });
    const B = require('@vercel/blob');
    if (b.path && IG.okMediaPath(b.path) && /\.(mp4|mov)$/.test(b.path)) {
      const r = await B.get(b.path, { access: 'private', useCache: false });
      if (!r || !r.stream) return send(res, 404, { ok: false, error: 'Video not found.' });
      if (r.blob && r.blob.size > MAX) return send(res, 413, { ok: false, error: 'This video is too big to trim here (over 220 MB). Trim it on the phone first.' });
      await pipeline(typeof r.stream.getReader === 'function' ? Readable.fromWeb(r.stream) : r.stream, fs.createWriteStream(inp));
    } else if (/^\/assets\/ig\/r\/[\w.\-]+\.mp4$/.test(String(b.src || ''))) {
      const r = await fetch('https://cielafrica.com' + b.src); if (!r.ok) return send(res, 404, { ok: false, error: 'Video not found.' });
      await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(inp));
    } else return send(res, 400, { ok: false, error: 'Bad video.' });
    const bin = require('ffmpeg-static');
    /* up to 90 seconds: cut exactly (re-encoded at high quality); longer: cut at keyframes without re-encoding */
    const exact = end - start <= 90;
    const args = ['-v', 'error', '-y', '-ss', String(start), '-i', inp, '-t', String(end - start), '-map', '0:v:0', '-map', '0:a?']
      .concat(exact ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k'] : ['-c', 'copy', '-avoid_negative_ts', 'make_zero'])
      .concat(['-movflags', '+faststart', out]);
    const code = await new Promise(ok => { const p = spawn(bin, args); let e = ''; p.stderr.on('data', d => { e += d; }); p.on('close', c => { if (c) console.error('[ig-trim]', e.slice(0, 400)); ok(c); }); });
    if (code !== 0 || !fs.existsSync(out) || !fs.statSync(out).size) return send(res, 500, { ok: false, error: 'Couldn’t trim this video. Try another part, or trim it on the phone.' });
    const key = IG.mediaKey('video.mp4'), size = fs.statSync(out).size;
    await B.put(key, fs.createReadStream(out), { access: 'private', contentType: 'video/mp4', addRandomSuffix: false, allowOverwrite: false, multipart: size > 20 * 1048576 });
    return send(res, 200, { ok: true, path: key, url: IG.fileUrl(key, 2), seconds: Math.round((end - start) * 10) / 10, size });
  } catch (e) { console.error('[ig-trim]', e); return send(res, 500, { ok: false, error: 'Couldn’t trim this video. Try again.' }); }
  finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { } }
};

