/* ============================================================
   CIEL AFRICA — /api/save  (Vercel Serverless Function)
   One-click publish: commits a data/*.js file straight to the
   GitHub repo, which triggers a Vercel deploy.

   Secrets live in Vercel Environment Variables (never in the page):
     GITHUB_TOKEN    fine-grained token, repo Contents: read & write
     ADMIN_PASSWORD  the password the admin must send
   Optional overrides (defaults shown):
     GITHUB_REPO     "Lornna08/cielafrica"
     GITHUB_BRANCH   "main"
   ============================================================ */

const REPO   = process.env.GITHUB_REPO   || 'Lornna08/cielafrica';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

// only these files may ever be written, and only under data/
const ALLOWED = {
  'products.js':  'data/products.js',
  'templates.js': 'data/templates.js',
  'work.js':      'data/work.js',
  'team.js':      'data/team.js'
};

module.exports = async function handler(req, res) {
  // CORS not needed (same origin), but keep JSON responses clean
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!token || !adminPass) {
    res.status(500).json({ ok: false, error: 'Server not configured. Set GITHUB_TOKEN and ADMIN_PASSWORD in Vercel.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // auth
  if (body.password !== adminPass) {
    res.status(401).json({ ok: false, error: 'Wrong password.' });
    return;
  }

  // validate target file
  const target = ALLOWED[body.file];
  if (!target) {
    res.status(400).json({ ok: false, error: 'Unknown file.' });
    return;
  }
  if (typeof body.content !== 'string' || body.content.length > 4 * 1024 * 1024) {
    res.status(400).json({ ok: false, error: 'Invalid or oversized content.' });
    return;
  }

  const api = 'https://api.github.com/repos/' + REPO + '/contents/' + target;
  const headers = {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ciel-admin',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  try {
    // get current file SHA (needed to update an existing file)
    let sha = undefined;
    const getRes = await fetch(api + '?ref=' + encodeURIComponent(BRANCH), { headers });
    if (getRes.status === 200) {
      const cur = await getRes.json();
      sha = cur.sha;
    } else if (getRes.status !== 404) {
      const t = await getRes.text();
      res.status(502).json({ ok: false, error: 'GitHub read failed (' + getRes.status + '). ' + t.slice(0, 200) });
      return;
    }

    const contentB64 = Buffer.from(body.content, 'utf8').toString('base64');
    const putBody = {
      message: 'Content update: ' + target + ' via admin',
      content: contentB64,
      branch: BRANCH
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(putBody) });
    if (putRes.status === 200 || putRes.status === 201) {
      const out = await putRes.json();
      res.status(200).json({ ok: true, commit: out.commit && out.commit.sha, file: target });
    } else {
      const t = await putRes.text();
      res.status(502).json({ ok: false, error: 'GitHub write failed (' + putRes.status + '). ' + t.slice(0, 300) });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Unexpected error: ' + (e && e.message) });
  }
};
