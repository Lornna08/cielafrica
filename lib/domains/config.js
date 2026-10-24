/* CIEL DOMAINS — live configuration = catalogue defaults + admin overrides */
const { DEFAULT_TLDS, DEFAULT_SETTINGS, CATEGORIES, sourceName } = require('./catalog');

const KEY = 'dc:config:v1';
const EDITABLE_TLD = ['register', 'renew', 'periods', 'enabled', 'verifyBeforePayment', 'method', 'truehost', 'note'];
const EDITABLE_SET = ['taxRate', 'taxLabel', 'pricesIncludeTax', 'orderingEnabled', 'paymentMethods', 'supportEmail', 'supportPhone', 'whatsapp'];

let memo = null, memoAt = 0;

function merge(over) {
  over = over || {};
  const to = over.tlds || {};
  const tlds = DEFAULT_TLDS.map(d => {
    const o = to[d.tld] || {};
    const t = Object.assign({}, d);
    EDITABLE_TLD.forEach(k => { if (o[k] !== undefined) t[k] = o[k]; });
    if (t.method === 'rdap' && !t.rdap) t.method = 'dns';
    t.periods = (Array.isArray(t.periods) ? t.periods : [1]).filter(n => Number.isInteger(n) && n >= t.minYears && n <= 10);
    if (!t.periods.length) t.periods = [t.minYears];
    if (t.register == null || t.renew == null) t.verifyBeforePayment = true;
    t.source = t.method === 'rdap' ? sourceName(t.rdap) : (t.method === 'dns' ? 'Public DNS' : 'Manual check');
    return t;
  });
  const settings = Object.assign({}, DEFAULT_SETTINGS);
  EDITABLE_SET.forEach(k => { if ((over.settings || {})[k] !== undefined) settings[k] = over.settings[k]; });
  return { tlds, settings, categories: CATEGORIES, updatedAt: over.updatedAt || null };
}

async function getConfig(store, fresh) {
  if (!fresh && memo && Date.now() - memoAt < 30000) return memo;
  let over = null;
  try { over = await store.get(KEY); } catch (e) { over = null; }
  memo = merge(over); memoAt = Date.now();
  return memo;
}

function cleanNum(v) { if (v === null || v === '') return null; const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n < 10000000 ? n : undefined; }

/** Validate an admin update and save it. Returns the merged config. */
async function saveConfig(store, patch, by) {
  const cur = (await store.get(KEY)) || {};
  const next = { tlds: Object.assign({}, cur.tlds), settings: Object.assign({}, cur.settings) };
  const known = new Set(DEFAULT_TLDS.map(t => t.tld));
  Object.keys((patch && patch.tlds) || {}).forEach(tld => {
    if (!known.has(tld)) return;
    const p = patch.tlds[tld], o = Object.assign({}, next.tlds[tld]);
    if ('register' in p) { const n = cleanNum(p.register); if (n !== undefined) o.register = n; }
    if ('renew' in p) { const n = cleanNum(p.renew); if (n !== undefined) o.renew = n; }
    if ('enabled' in p) o.enabled = !!p.enabled;
    if ('verifyBeforePayment' in p) o.verifyBeforePayment = !!p.verifyBeforePayment;
    if ('method' in p && ['rdap', 'dns', 'manual'].includes(p.method)) o.method = p.method;
    if ('truehost' in p && ['listed', 'confirmed', 'unconfirmed'].includes(p.truehost)) o.truehost = p.truehost;
    if ('periods' in p && Array.isArray(p.periods)) o.periods = p.periods.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 10).slice(0, 6);
    if ('note' in p) o.note = String(p.note || '').slice(0, 160);
    next.tlds[tld] = o;
  });
  const s = (patch && patch.settings) || {};
  if ('taxRate' in s) { const r = Number(s.taxRate); if (r >= 0 && r <= 0.5) next.settings.taxRate = Math.round(r * 10000) / 10000; }
  if ('taxLabel' in s) next.settings.taxLabel = String(s.taxLabel || 'VAT').slice(0, 20);
  if ('pricesIncludeTax' in s) next.settings.pricesIncludeTax = !!s.pricesIncludeTax;
  if ('orderingEnabled' in s) next.settings.orderingEnabled = !!s.orderingEnabled;
  if ('paymentMethods' in s && s.paymentMethods) next.settings.paymentMethods = { mpesa: !!s.paymentMethods.mpesa, card: !!s.paymentMethods.card };
  ['supportEmail', 'supportPhone', 'whatsapp'].forEach(k => { if (k in s) next.settings[k] = String(s[k] || '').slice(0, 80); });
  next.updatedAt = new Date().toISOString(); next.updatedBy = by || 'admin';
  await store.set(KEY, next);
  memo = null;
  return merge(next);
}

/** What the public page is allowed to see. */
function publicConfig(cfg, caps) {
  return {
    currency: cfg.settings.currency,
    tax: { rate: cfg.settings.taxRate, label: cfg.settings.taxLabel, included: cfg.settings.pricesIncludeTax },
    ordering: !!(cfg.settings.orderingEnabled && caps.durable),
    requests: true,
    payments: { mpesa: !!(caps.mpesa && cfg.settings.paymentMethods.mpesa), card: !!(caps.card && cfg.settings.paymentMethods.card) },
    support: { email: cfg.settings.supportEmail, phone: cfg.settings.supportPhone, whatsapp: cfg.settings.whatsapp },
    categories: cfg.categories,
    tlds: cfg.tlds.filter(t => t.enabled).map(t => ({
      tld: t.tld, category: t.category, register: t.register, renew: t.renew, periods: t.periods, minYears: t.minYears,
      verifyBeforePayment: t.verifyBeforePayment, method: t.method, source: t.source, premiumRisk: t.premiumRisk, note: t.note
    }))
  };
}

function findTld(cfg, tld) { return cfg.tlds.find(t => t.tld === tld) || null; }

module.exports = { getConfig, saveConfig, publicConfig, findTld, merge, KEY };
