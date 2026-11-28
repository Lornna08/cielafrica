/* ============================================================
   CIEL ADMIN — sales pitches sent through the website forms.
   People selling SEO, followers, "AI visibility", redesigns… use the
   contact form too. They are not leads: they are kept aside in
   Leads → Filtered (no alert, no task, no reminder, no email).
   check(): returns why a message looks like a pitch, or '' if it looks real.
   Senders marked "Not a lead" are remembered (hq/pitch-block.json).
   ============================================================ */
const BS = require('../photobooks/blobstore');
const BLOCK = 'hq/pitch-block.json';

/* [pattern, weight, reason]  — 2 = sure on its own, 1 = needs a second sign */
const SIGNS = [
  [/\bunsubscribe\b|\bopt[ -]?out\b|reply\s+["']?(stop|no|remove)\b|won'?t contact you again/i, 2, 'unsubscribe link'],
  [/^\s*(hello|hi|hey|dear)[\s,]+(https?:\/\/|www\.)?[a-z0-9-]+\.(com|co\.ke|africa|net|org)\b/i, 2, 'greets the website, not a person'],
  [/\b(i|we)\s+(just\s+)?(took|had|have\s+taken)\s+a\s+(quick\s+|brief\s+)?look\s+at\s+(your|cielafrica)/i, 2, 'cold outreach'],
  [/\b(i|we)\s+(just\s+|recently\s+)?(visited|came\s+across|checked\s+out|found|reviewed|audited)\s+(your\s+(site|website|page)|cielafrica)/i, 1, 'cold outreach'],
  [/\b(seo|search\s+engine|backlinks?|guest\s+posts?|domain\s+authority|first\s+page\s+of\s+google|google\s+(ranking|first\s+page|top)|organic\s+traffic|keywords?\s+ranking)\b/i, 1, 'selling SEO'],
  [/\b(not\s+ranking|rank(ing)?\s+(higher|better|on\s+google)|online\s+visibility|visibility\s+(is|on|in)|more\s+visibility)\b/i, 1, 'selling SEO'],
  [/\b(followers|likes|engagement)\b[\s\S]{0,80}\b(grow|growth|boost|real|targeted|organic)\b|\b(grow|boost)\b[\s\S]{0,60}\b(instagram|tiktok|followers)\b/i, 2, 'selling followers'],
  [/\b(ai\s+(tools?|search|assistants?|overviews?)|chatgpt|perplexity|gemini)\b[\s\S]{0,80}\b(find|recommend|visib|show\s+up|mention)/i, 1, 'selling "AI visibility"'],
  [/\b(lead\s+generation|more\s+(leads|clients|customers|sales)|qualified\s+leads|book(ed)?\s+(more\s+)?appointments)\b/i, 1, 'selling growth'],
  [/\bfree\s+(audit|report|analysis|trial|consultation|mock-?up|redesign|quote|video)\b/i, 1, 'free offer'],
  [/\b(would\s+you\s+be\s+(interested|open)|wondered\s+if\s+you('ve|\s+have)?\s+(ever\s+)?considered|are\s+you\s+(open|interested)\s+to|interested\s+in\s+(improving|growing|boosting))\b/i, 1, 'sales pitch'],
  [/\b(our\s+(team|agency|company|experts?)\s+(helps|can|will|specialis|specializ)|we\s+(help|specialise|specialize)\s+(businesses|companies|brands)|i\s+can\s+(fix|get\s+you|improve|boost|help\s+you\s+rank))\b/i, 1, 'agency pitch'],
  [/\b(explainer|promo(tional)?)\s+video\b|\bwhite[\s-]?label\b|\boutsourc(e|ing)\b|\bvirtual\s+assistant\b/i, 1, 'selling services'],
  [/\b(crypto|bitcoin|forex\s+signals|loan\s+offer|casino)\b/i, 2, 'spam']
];

function host(u) { try { return new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } }
function linksIn(t) { return (String(t).match(/\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi) || []).map(host).filter(h => h && !/cielafrica\.com$/.test(h)); }

/* name, email and every form field → '' (looks real) or a short reason */
function check(it, block) {
  const c = it.customer || {}, fields = it.fields || [];
  const text = fields.map(f => String(f[1] || '')).join('\n');
  const email = String(c.email || '').toLowerCase(), dom = email.split('@')[1] || '';
  const links = linksIn(text);
  block = block || {};
  if (email && (block.emails || []).includes(email)) return 'sender marked as not a lead';
  if (dom && !/^(gmail|yahoo|outlook|hotmail|icloud|live|aol|proton(mail)?|ymail)\./.test(dom) && (block.domains || []).includes(dom)) return 'sender marked as not a lead';
  if (links.some(h => (block.domains || []).includes(h))) return 'links to a site marked as not a lead';
  let score = 0; const why = [];
  SIGNS.forEach(([re, w, r]) => { if (re.test(text)) { score += w; if (!why.includes(r)) why.push(r); } });
  /* a real client rarely writes our own address back to us, or links to someone else's site */
  if (/cielafrica\.com/i.test(text)) score += 1;
  if (links.length) { score += 1; if (!why.length) why.push('links to another site'); }
  /* someone asking for something for their own business is a real enquiry */
  if (/\b(i|we)\s+(need|want|would\s+like|am\s+looking|are\s+looking|'?d\s+like)\b|\bcan\s+you\s+(build|make|create|design|do|help\s+me)\b|\bhow\s+much\b|\b(my|our)\s+(own\s+)?(business|shop|store|company|brand|school|church|boutique|bakery|restaurant|salon|clinic|hotel|ngo|event|wedding)\b|\bbudget\b|\b(send|get)\s+(me\s+)?a\s+(quote|quotation)\b|\bphoto\s*books?\b/i.test(text)) score -= 2;
  /* "Daisy Daisy"-style made-up names */
  const nm = String(c.name || '').trim().split(/\s+/); if (nm.length === 2 && nm[0].toLowerCase() === nm[1].toLowerCase()) score += 1;
  /* a project brief takes effort to fill in: it needs stronger signs */
  const need = it.kind === 'brief' ? 3 : 2;
  return score >= need ? (why[0] || 'sales pitch') : '';
}

async function blocklist() { return (await BS.getJSON(BLOCK).catch(() => null)) || { emails: [], domains: [] }; }
/* "Not a lead": remember the sender (and the site they link to) so the next one is filtered */
async function remember(it, off) {
  const b = await blocklist(), c = it.customer || {}, email = String(c.email || '').toLowerCase(), dom = email.split('@')[1] || '';
  const free = /^(gmail|yahoo|outlook|hotmail|icloud|live|aol|proton(mail)?|ymail)\./.test(dom);
  const links = linksIn((it.fields || []).map(f => f[1]).join('\n'));
  const E = new Set(b.emails || []), D = new Set(b.domains || []);
  if (off) { E.delete(email); if (!free) D.delete(dom); links.forEach(h => D.delete(h)); }
  else { if (email) E.add(email); if (dom && !free) D.add(dom); links.forEach(h => D.add(h)); }
  const o = { emails: [...E].slice(-500), domains: [...D].slice(-500) };
  await BS.putJSON(BLOCK, o); return o;
}

/* close the tasks a filtered message put on the board, so nothing nudges about it */
async function closeTasks(ids) {
  if (!ids.length) return 0;
  const d = await BS.getJSON('hq/tasks.json').catch(() => null); if (!d) return 0;
  let n = 0;
  d.items.forEach(t => { if (t.status !== 'done' && ids.some(id => t.link === '/admin#leads/' + id || t.key === 'lead:lead-' + id)) { t.status = 'done'; t.updatedAt = Date.now(); t.doneWhy = 'not a lead'; n++; } });
  if (n) { d.v = (d.v || 0) + 1; await BS.putJSON('hq/tasks.json', d); }
  return n;
}

module.exports = { check, blocklist, remember, closeTasks };
