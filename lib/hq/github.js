/* ============================================================
   CIEL HQ — publishing to cielafrica.com through GitHub.
   The site is static: Ciel HQ edits the real files in the repository
   and commits them in ONE commit; Vercel then deploys automatically
   (about a minute). Every publish is therefore versioned in Git.
   Needs GITHUB_TOKEN (fine-grained, this repo only, Contents: read & write)
   in Vercel. Optional: GITHUB_REPO (default Lornna08/cielafrica), GITHUB_BRANCH (main).
   ============================================================ */
const REPO = () => process.env.GITHUB_REPO || 'Lornna08/cielafrica';
const BRANCH = () => process.env.GITHUB_BRANCH || 'main';
const on = () => !!process.env.GITHUB_TOKEN;

async function gh(path, opt) {
  opt = opt || {};
  const r = await fetch('https://api.github.com/repos/' + REPO() + path, {
    method: opt.method || 'GET',
    headers: Object.assign({ Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'ciel-hq' }, opt.raw ? { Accept: 'application/vnd.github.raw' } : {}, opt.body ? { 'Content-Type': 'application/json' } : {}),
    body: opt.body ? JSON.stringify(opt.body) : undefined, signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw Object.assign(new Error('GitHub ' + r.status + ': ' + t.slice(0, 160)), { status: r.status === 401 || r.status === 403 ? 503 : 502, code: 'github' }); }
  return opt.raw ? r.text() : r.json();
}
async function head() { const ref = await gh('/git/ref/heads/' + BRANCH()); return ref.object.sha; }
async function rootFiles() { const sha = await head(); const t = await gh('/git/trees/' + sha); return t.tree.filter(x => x.type === 'blob').map(x => x.path); }
async function read(path) { return gh('/contents/' + encodeURI(path) + '?ref=' + BRANCH(), { raw: true }); }
/** files = [{ path, content }] → one commit; returns the commit sha */
async function commit(files, message) {
  if (!files.length) return null;
  const parent = await head(), base = await gh('/git/commits/' + parent);
  /* images and other binary files go up as blobs first */
  const entries = await Promise.all(files.map(async f => f.base64 != null
    ? { path: f.path, mode: '100644', type: 'blob', sha: (await gh('/git/blobs', { method: 'POST', body: { content: f.base64, encoding: 'base64' } })).sha }
    : { path: f.path, mode: '100644', type: 'blob', content: f.content }));
  const tree = await gh('/git/trees', { method: 'POST', body: { base_tree: base.tree.sha, tree: entries } });
  const c = await gh('/git/commits', { method: 'POST', body: { message, tree: tree.sha, parents: [parent] } });
  await gh('/git/refs/heads/' + BRANCH(), { method: 'PATCH', body: { sha: c.sha } });
  return c.sha;
}
async function history(path, n) { const l = await gh('/commits?sha=' + BRANCH() + '&per_page=' + (n || 15) + (path ? '&path=' + encodeURIComponent(path) : '')); return l.map(c => ({ sha: c.sha, message: c.commit.message.split('\n')[0], at: c.commit.author && c.commit.author.date })); }
module.exports = { on, read, commit, rootFiles, history, REPO, BRANCH };
