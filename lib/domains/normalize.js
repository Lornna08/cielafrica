/* CIEL DOMAINS — input parsing & validation (server + browser safe) */

const LEGAL = new Set(['ltd', 'limited', 'llc', 'inc', 'plc', 'llp', 'corp', 'company', 'enterprises', 'enterprise']);
const MAX_INPUT = 200;

function err(code, message, extra) { return Object.assign({ ok: false, code, message }, extra || {}); }

/**
 * parseQuery("Bright Studio") → { ok, name:'brightstudio', words:['bright','studio'], tld:null }
 * parseQuery("https://www.BrightStudio.co.ke/about") → { ok, name:'brightstudio', tld:'co.ke' }
 * tlds: list of supported tld strings (e.g. ['com','co.ke','ke', ...])
 */
function parseQuery(input, tlds) {
  if (typeof input !== 'string') return err('empty', 'Type a name or a domain to search.');
  let s = input.trim();
  if (!s) return err('empty', 'Type a name or a domain to search.');
  if (s.length > MAX_INPUT) return err('too_long', 'That’s too long — try a shorter name.');
  s = s.toLowerCase();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');      // scheme
  s = s.replace(/^[^@\s/]+@/, '');                  // email-ish "hello@brand.com" → brand.com
  s = s.split(/[/?#]/)[0];                          // path, query
  s = s.replace(/:\d+$/, '');                       // port
  s = s.replace(/^www\./, '');
  s = s.replace(/\.+$/, '');                        // trailing dot
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x7f]/.test(s)) return err('idn', 'Names with accents or non-Latin letters aren’t supported yet. Try the plain-letter spelling.');

  let tld = null, unsupportedTld = null, rest = s;
  if (s.includes('.')) {
    const sorted = (tlds || []).slice().sort((a, b) => b.length - a.length);
    const hit = sorted.find(t => s === t || s.endsWith('.' + t));
    if (hit) { tld = hit; rest = s === hit ? '' : s.slice(0, -(hit.length + 1)); }
    else {
      const parts = s.split('.');
      unsupportedTld = parts.slice(1).join('.');
      rest = parts[0];
    }
    if (rest.includes('.')) rest = rest.split('.').pop(); // sub.brand.com → brand
  }
  if (!rest) return err('empty', 'Add a name before the extension, like brightstudio.com.');

  // words: split on spaces / underscores / hyphens typed by the user
  let words = rest.split(/[\s_]+/).filter(Boolean);
  const hadSpaces = words.length > 1;
  words = words.map(w => w.replace(/[^a-z0-9-]/g, '')).filter(Boolean);
  if (hadSpaces && words.length > 1 && LEGAL.has(words[words.length - 1])) words.pop();
  let name = words.join(''); // characters like & ! ' are dropped
  name = name.replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
  const v = validateLabel(name);
  if (!v.ok) return v;
  const wordHints = rest.split(/[\s_-]+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
  if (wordHints.length > 1 && LEGAL.has(wordHints[wordHints.length - 1])) wordHints.pop();
  return { ok: true, name, words: wordHints.length > 1 ? wordHints : null, tld, unsupportedTld };
}

function validateLabel(label) {
  if (!label) return err('empty', 'Type a name or a domain to search.');
  if (label.length > 63) return err('label_long', 'Domain names can be at most 63 characters before the extension.');
  if (!/^[a-z0-9-]+$/.test(label)) return err('chars', 'Use only letters, numbers and hyphens.');
  if (label.startsWith('-') || label.endsWith('-')) return err('hyphen_edge', 'A domain can’t start or end with a hyphen.');
  if (label.length >= 4 && label.slice(2, 4) === '--') return err('hyphen_34', 'Hyphens in the 3rd and 4th positions aren’t allowed.');
  return { ok: true };
}

/** Full domain check: "brightstudio.co.ke" with tld known to the catalogue. */
function validateDomain(domain, tlds) {
  if (typeof domain !== 'string') return err('invalid', 'Invalid domain.');
  const d = domain.trim().toLowerCase().replace(/\.$/, '');
  if (d.length > 253) return err('too_long', 'Domain is too long.');
  const sorted = (tlds || []).slice().sort((a, b) => b.length - a.length);
  const tld = sorted.find(t => d.endsWith('.' + t));
  if (!tld) return err('tld', 'We don’t offer that extension yet.');
  const label = d.slice(0, -(tld.length + 1));
  if (label.includes('.')) return err('invalid', 'Enter one name, like brightstudio.com.');
  const v = validateLabel(label);
  if (!v.ok) return v;
  return { ok: true, domain: label + '.' + tld, label, tld };
}

module.exports = { parseQuery, validateLabel, validateDomain };
