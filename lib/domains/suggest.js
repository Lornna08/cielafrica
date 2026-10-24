/* ============================================================
   CIEL DOMAINS — smart alternatives (rule-based, no AI needed)
   Ideas only: every suggestion is checked independently afterwards.
   ============================================================ */

const WORDS = ('a about ace act ad add africa afri age air all alpha amani amp an and angel app apple apex arc art arts ask at atlas auto axis baby bake bakery bank bar base bay be beach bean bear beauty bee best big bike bio bird bit black blade blank bloom blue boat bold book boost boss box brand brave bread bridge bright brook build builder builders built bush buy cafe cake call camp can cap capital car care cargo cart case cash cat cell center chain chef chic city clean clear clever click cloud club co coast code coffee coin cold color core corner cozy craft crafts create creative crew crown cube cup cut daily dash data dawn day deal deep delta den desk dev dial digital dish doc dog door dot dream drive drop dry duka eagle earth east easy eat eco edge elite end energy era ever every eye fab fair faith farm fast fern field film find fine fire firm first fish fit five fix flash flex flow fly focus folk food forge form fox free fresh friend front fruit fuel fun fund future gain game garden gate gear gem get gift glow go gold good grace grand graph green grid group grow guide hair hand happy harbor hart haus haven hawk health heart help hero hey high hill hive home homes honey hope host hot house hub ideal idea ideas impact in ink inn insight iron island jambo jet joy juice jungle just keen key kid kids kind king kit kitchen kua lab labs lake land lane law leaf lean legal lemon level life lift light like lime line link lion live local loft logic loop love loyal luck lux made mail main maker makers mama mark market mart mass max meet mega mind mint mobile mode moja money moon more motion motor mountain move my nest net new news next nice night nine north nova now nuru oak ocean office one online open orbit order origin pace pack page palm pan paper park part partners pass path pay peak pearl pen people pet pick pilot pine pixel place plan planet plant play plus pod point pole pool pop port post power press prime pro pulse pure quick rain range ray real realty red rent rest rise river road rock roof room root rose round run rush safari safe sage sail salon salt sand save scale school sea seed sell sense serve service set seven shade shape share sharp shelf shift shine ship shop shore side sign silk silver simba simple sit site six sky smart smile snap soft sol solar solid solutions song soul sound source south space spark speed spice spot spring square stack staff stage star start state station stay steel step stock stone store story strong studio studios style sun super sure swift table tail take talent tap taste team tech tee ten terra the think thrive tide time tiny top tour tower town track trade trail travel tree tribe true trust try tube turn twin up urban use valley value van vault venture verse via view villa vision vista vital voice volt wave way wealth web well west wild wind wing wise wood word work works world yard yellow yes you young zen zone zuri').split(' ');
const DICT = new Set(WORDS);

const INDUSTRIES = {
  tech:         { label: 'Technology & software', tlds: ['dev', 'app', 'tech', 'io', 'ai', 'cloud', 'software', 'digital'], words: ['labs', 'tech', 'hq', 'app', 'cloud', 'stack', 'systems', 'digital'], pre: ['get', 'use', 'try'] },
  shop:         { label: 'Online shop', tlds: ['shop', 'store', 'online', 'co.ke', 'africa'], words: ['shop', 'store', 'market', 'mart', 'deals', 'supply', 'goods'], pre: ['shop', 'buy', 'get'] },
  professional: { label: 'Professional services', tlds: ['co.ke', 'consulting', 'solutions', 'agency', 'biz', 'com'], words: ['group', 'partners', 'advisory', 'consulting', 'solutions', 'associates'], pre: ['the', 'ask'] },
  creative:     { label: 'Creative agency', tlds: ['design', 'agency', 'digital', 'studio', 'co'], words: ['studio', 'creative', 'works', 'collective', 'design', 'house'], pre: ['madeby', 'hello'] },
  personal:     { label: 'Personal brand or portfolio', tlds: ['me', 'blog', 'site', 'online', 'co'], words: ['online', 'writes', 'creates', 'studio', 'journal'], pre: ['hey', 'its', 'meet', 'hello'] },
  org:          { label: 'Organisation or community', tlds: ['org', 'africa', 'ke', 'info', 'online'], words: ['foundation', 'network', 'collective', 'trust', 'initiative', 'society'], pre: ['the', 'join'] },
  realestate:   { label: 'Real estate', tlds: ['co.ke', 'africa', 'online', 'site', 'com'], words: ['homes', 'properties', 'realty', 'estates', 'living', 'spaces'], pre: ['find', 'the'] },
  other:        { label: 'Something else', tlds: ['co.ke', 'africa', 'net', 'co', 'online'], words: ['hq', 'hub', 'co', 'works', 'world'], pre: ['get', 'go', 'the'] }
};
const DEFAULT_EXT = ['com', 'co.ke', 'africa', 'ke', 'net', 'co', 'online', 'org', 'site'];
const REGIONAL = ['africa', 'kenya', 'ke'];

// Well-known marks: we do not generate look-alikes for names other people own.
// STRONG: matched anywhere in the name. WORD: common words that are also marks — matched only as the
// whole name or with a brand-ish tail (equitybank, boltapp), so "boltworks" style originals still work.
const STRONG = ['google', 'gmail', 'youtube', 'facebook', 'instagram', 'whatsapp', 'iphone', 'microsoft', 'amazon', 'netflix', 'tiktok', 'paypal', 'mastercard', 'safaricom', 'mpesa', 'airtel', 'jumia', 'kilimall', 'cocacola', 'pepsi', 'samsung', 'tesla', 'openai', 'chatgpt', 'anthropic', 'spotify', 'shopify', 'truehost', 'kenic', 'icann', 'linkedin', 'dstv', 'showmax', 'naivas', 'carrefour', 'quickmart', 'toyota', 'kenyaairways', 'standardchartered', 'barclays', 'stanbic', 'vodacom', 'binance', 'adidas'];
const WORDMARK = ['apple', 'meta', 'visa', 'equity', 'kcb', 'ncba', 'uber', 'bolt', 'glovo', 'nike', 'disney', 'claude', 'coop', 'mtn', 'orange', 'absa', 'windows', 'telkom', 'twitter', 'bitcoin'];
const MARK_TAIL = /^(bank|pay|ke|kenya|africa|app|store|shop|online|official|support|login|money|mobile|wallet|group)?$/;

function segment(s) {
  // best split of s into dictionary words (max coverage, fewest pieces)
  const n = s.length, best = new Array(n + 1).fill(null);
  best[0] = { cost: 0, parts: [] };
  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - 14); j < i; j++) {
      if (!best[j]) continue;
      const w = s.slice(j, i), known = DICT.has(w) && w.length > 1 || w === 'a';
      const cost = best[j].cost + (known ? 1 : 2.5 * w.length);
      if (!best[i] || cost < best[i].cost) best[i] = { cost, parts: best[j].parts.concat([w]) };
    }
  }
  // merge unknown single letters back
  const parts = [];
  best[n].parts.forEach(p => { if (parts.length && !DICT.has(p) && !DICT.has(parts[parts.length - 1])) parts[parts.length - 1] += p; else parts.push(p); });
  return parts;
}

function isMark(name) {
  return STRONG.some(m => name.includes(m)) ||
    WORDMARK.some(m => (name.startsWith(m) && MARK_TAIL.test(name.slice(m.length))) || (name.endsWith(m) && /^(my|get|the|go)$/.test(name.slice(0, -m.length))));
}

function plural(w) { if (/(s|x|z|sh|ch)$/.test(w)) return null; if (/[^aeiou]y$/.test(w)) return null; return w + 's'; }

function okLabel(l, original) {
  return l && l !== original && l.length >= 3 && l.length <= 20 && /^[a-z]+$/.test(l) && !/(.)\1\1/.test(l);
}

/**
 * suggest({ name, words, tld, industry, enabledTlds }) →
 *   { blocked, groups:[{ id, title, items:[{ domain, label, tld, why }] }] }
 */
function suggest(input) {
  const name = input.name;
  const enabled = new Set(input.enabledTlds || []);
  const ind = INDUSTRIES[input.industry] || null;
  const baseTld = input.tld && enabled.has(input.tld) ? input.tld : 'com';
  if (isMark(name)) {
    return { blocked: true, note: 'This looks like a well-known brand, so we don’t suggest look-alike names for it. If it’s your own trademark, contact us and we’ll help directly.', groups: [] };
  }
  const flat = name.replace(/-/g, '');
  const words = (input.words && input.words.length > 1 ? input.words : segment(flat)).filter(Boolean);
  const first = words[0], last = words[words.length - 1];
  const seen = new Set([name + '.' + baseTld]);
  const add = (arr, label, tld, why) => {
    if (!enabled.has(tld)) return;
    const d = label + '.' + tld;
    if (seen.has(d)) return;
    seen.add(d); arr.push({ domain: d, label, tld, why });
  };

  // 1) same name, other extensions
  const ext = [];
  const extOrder = (ind ? ind.tlds : []).concat(DEFAULT_EXT);
  extOrder.forEach(t => { if (ext.length < 6 && t !== input.tld) add(ext, name, t, t === 'co.ke' || t === 'ke' ? 'Kenyan address' : t === 'africa' ? 'Pan-African' : 'Same name'); });

  // 2) creative twists
  const cands = [];
  const C = (label, why, w) => { if (okLabel(label, flat)) cands.push({ label, why, w }); };
  if (flat !== name && okLabel(flat, name)) cands.push({ label: flat, why: 'Easier without the hyphen', w: 4 });
  const pre = ind ? ind.pre : ['get', 'go', 'try'];
  pre.forEach((p, i) => C(p + flat, 'Action prefix', 3 - i * 0.4));
  C(flat + 'hq', 'Short suffix', 2.6);
  const pl = DICT.has(last) && plural(last) ? words.slice(0, -1).join('') + plural(last) : null;
  if (pl) C(pl, 'Plural', 2.4);
  if (words.length === 2) C(words[1] + words[0], 'Word order flipped', 1.6);
  if (words.length >= 2 && first.length >= 3) {
    C('madeby' + first, 'Shortened brand', 2.2);
    C(first + 'works', 'Shortened brand', 2.0);
    if (ind) ind.words.slice(0, 2).forEach(w => C(first + w, 'Shortened + industry', 2.1));
  } else if (flat.length <= 9) {
    C(flat + 'works', 'Compound', 1.8);
    C('madeby' + flat, 'Made by', 1.5);
  }
  REGIONAL.forEach((r, i) => C(flat + r, 'Regional', 1.9 - i * 0.3));
  cands.sort((a, b) => (b.w - a.w) || (a.label.length - b.label.length));
  const creative = [];
  cands.forEach((c, i) => { if (creative.length < 6) add(creative, c.label, i % 3 === 2 && enabled.has('co.ke') ? 'co.ke' : baseTld, c.why); });

  // 3) industry-aware
  const industry = [];
  if (ind) {
    ind.words.forEach((w, i) => {
      if (industry.length >= 4) return;
      const l = (words.length >= 2 ? first : flat) + w;
      if (okLabel(l, flat) && !(last === w)) add(industry, l, i % 2 ? (ind.tlds.find(t => enabled.has(t)) || baseTld) : baseTld, ind.label);
    });
  }
  const groups = [
    { id: 'ext', title: 'Same name, other extensions', items: ext },
    { id: 'creative', title: 'Creative twists', items: creative },
    { id: 'industry', title: ind ? 'Made for ' + ind.label.toLowerCase() : 'Made for your industry', items: industry }
  ].filter(g => g.items.length);
  // keep the total useful, not overwhelming
  let total = 0; groups.forEach(g => { g.items = g.items.slice(0, Math.max(0, 15 - total)); total += g.items.length; });
  return { blocked: false, words, groups: groups.filter(g => g.items.length) };
}

module.exports = { suggest, segment, isMark, INDUSTRIES };
