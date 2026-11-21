#!/usr/bin/env node
/* Pre-renders the parts of Templates, Products, Work, Insights and About that the
   browser builds from data/*.js, and saves them into the HTML, so search engines and
   link previews see the full page straight away. The page scripts still redraw the same
   containers in the browser, so visitors always see the current data.
   Run after changing data/templates.js, data/products.js, data/work.js or data/team.js:
       node tools/prerender.js
   Needs Playwright (npm i -g playwright, or set PLAYWRIGHT=/path/to/playwright). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let pw; try { pw = require(process.env.PLAYWRIGHT || 'playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
const PAGES = { templates: ['tfilters', 'tcount', 'tgrid'], products: ['pfilters', 'pcount', 'pgrid'], work: ['workTpl', 'wrows'], insights: ['posts'], about: ['team'] };
const TYPES = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' };
(async () => {
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/*', rt => {
    const u = new URL(rt.request().url());
    if (u.hostname !== 'cielafrica.com' || u.pathname.startsWith('/api/') || u.pathname.startsWith('/_vercel')) return rt.fulfill({ status: 204, body: '' });
    let f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) return rt.fulfill({ status: 404, body: '' });
    rt.fulfill({ contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const [pg, ids] of Object.entries(PAGES)) {
    const file = path.join(ROOT, pg + '.html');
    await p.goto('https://cielafrica.com/' + pg, { waitUntil: 'load' }); await p.waitForTimeout(800);
    const got = await p.evaluate(ids => ids.map(id => { const el = document.getElementById(id); return el ? el.innerHTML.trim() : null; }), ids);
    let s = fs.readFileSync(file, 'utf8');
    ids.forEach((id, i) => {
      if (!got[i]) throw new Error(pg + ': #' + id + ' rendered nothing');
      /* the container: empty, or holding an earlier pre-render (which ends with its marker) */
      const open = '<(div|section|ul|p|span)([^>]*\\bid="' + id + '"[^>]*)>';
      let re = new RegExp(open + '[\\s\\S]*?<!--/pre:' + id + '--></\\1>');
      if (!re.test(s)) re = new RegExp(open + '\\s*</\\1>');
      if (!re.test(s)) throw new Error(pg + ': empty #' + id + ' not found in ' + pg + '.html');
      s = s.replace(re, (all, tag, attrs) => '<' + tag + attrs.replace(/\s*data-pre="1"/, '') + ' data-pre="1">' + got[i] + '<!--/pre:' + id + '--></' + tag + '>');
    });
    fs.writeFileSync(file, s);
    console.log(pg + ': ' + ids.map((id, i) => '#' + id + ' ' + got[i].length + ' chars').join(', '));
  }
  if (errs.length) console.warn('page errors:', errs.slice(0, 3));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
