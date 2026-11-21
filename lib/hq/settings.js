/* ============================================================
   CIEL ADMIN — small settings kept in private storage (hq/settings/<key>.json)
   business  : the details printed on receipts and invoices
   wa        : quick WhatsApp replies for orders
   welcome   : the email new subscribers get after confirming
   reviews   : asking customers for a review after delivery
   ============================================================ */
const BS = require('../photobooks/blobstore');

const DEFAULTS = {
  business: { name: 'Ciel Africa', email: 'hello@cielafrica.com', phone: '+254 117 959 105', web: 'cielafrica.com', address: 'Nairobi, Kenya', taxId: '', paybill: '400200', account: '613260', invoiceNote: 'Thank you for your business.', dueDays: 7, preparer: 'Lorna', preparerRole: 'Lead Developer & Creative Director', tagline: 'Software engineering & digital products' },
  wa: { items: [
    { id: 'received', label: 'Order received', text: 'Hi {first}, thank you for your order {ref} with Ciel Africa. We’ve received it and will keep you posted here.' },
    { id: 'pay', label: 'Payment reminder', text: 'Hi {first}, your order {ref} ({total}) is still waiting for payment. You can finish it on the website, or pay to M-Pesa Paybill {paybill}, account {account}, and send us the M-Pesa message here. Any questions, just reply.' },
    { id: 'paid', label: 'Payment confirmed', text: 'Hi {first}, we’ve received your payment of {total} for order {ref}. Thank you! We’ll let you know as soon as it’s on its way.' },
    { id: 'printing', label: 'Printing', text: 'Hi {first}, good news: your photo book ({ref}) is printing now. We’ll message you when it’s ready.' },
    { id: 'ready', label: 'Ready to collect', text: 'Hi {first}, your order {ref} is ready to collect. {note}' },
    { id: 'dispatched', label: 'Dispatched', text: 'Hi {first}, your order {ref} is on its way! {note} Track it here: {track}' },
    { id: 'delivered', label: 'Delivered + review', text: 'Hi {first}, we hope you love your order {ref}! If you have a minute, we’d really appreciate a short review: {review}' }
  ] },
  welcome: { on: false, subject: 'Welcome to the Ciel letter', kicker: 'Welcome', title: 'Welcome{, first}.', body: 'Thanks for confirming. You’ll hear from us now and then about new photo book covers, website work and offers.\n\nMeanwhile, the easiest way to start is a photo book of your favourite trip or year.', image: '', btnLabel: 'Make a photo book', btnUrl: 'https://cielafrica.com/photobooks' },
  reviews: { auto: true, days: 3 },
  /* email: extra addresses (categories), signatures per sending address, the default email design */
  mail: { aliases: [], signatures: {}, design: { look: 'letter', accent: '#2F5BEA' } }
};
const KEYS = Object.keys(DEFAULTS);
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').slice(0, n || 300);
const one = (s, n) => clean(s, n).replace(/\n/g, ' ').trim();
const err = (status, code, message) => Object.assign(new Error(message), { status, code });

function shape(k, v) {
  v = v && typeof v === 'object' ? v : {};
  const d = DEFAULTS[k];
  if (k === 'business') { const o = {}; Object.keys(d).forEach(x => { o[x] = x === 'dueDays' ? Math.max(0, Math.min(90, Math.round(+v[x] || 0))) : one(v[x] != null ? v[x] : d[x], x === 'invoiceNote' ? 300 : 140); }); return o; }
  if (k === 'wa') return { items: (Array.isArray(v.items) ? v.items : []).slice(0, 20).map((t, i) => ({ id: one(t.id, 30).replace(/[^a-z0-9-]/gi, '') || 't' + i, label: one(t.label, 40) || 'Message', text: clean(t.text, 1000).trim() })).filter(t => t.text) };
  if (k === 'welcome') { const o = { on: !!v.on }; ['subject', 'kicker', 'title', 'btnLabel'].forEach(x => { o[x] = one(v[x] != null ? v[x] : d[x], 140); }); o.body = clean(v.body != null ? v.body : d.body, 6000); ['image', 'btnUrl'].forEach(x => { const u = one(v[x], 500); o[x] = /^https?:\/\/[^\s"'<>]+$/.test(u) ? u : ''; }); return o; }
  if (k === 'mail') {
    const okEmail = e => /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(e), col = c => /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : '';
    const aliases = (Array.isArray(v.aliases) ? v.aliases : []).slice(0, 12).map(a => ({ email: one(a.email, 120).toLowerCase(), label: one(a.label, 30), name: one(a.name, 60), color: col(a.color) })).filter(a => okEmail(a.email));
    const signatures = {}; Object.keys(v.signatures || {}).slice(0, 20).forEach(id => { const g = v.signatures[id] || {}; signatures[one(id, 30).replace(/[^a-z0-9_]/gi, '')] = { on: g.on !== false, name: one(g.name, 60), title: one(g.title, 80), company: one(g.company, 60), phone: one(g.phone, 30), email: one(g.email, 120), web: one(g.web, 80), tagline: one(g.tagline, 120), logo: g.logo !== false, accent: col(g.accent) }; });
    const dz = v.design || {}; return { aliases, signatures, design: { look: ['plain', 'letter', 'announce', 'minimal'].indexOf(dz.look) >= 0 ? dz.look : 'letter', accent: col(dz.accent) || '#2F5BEA' } };
  }
  if (k === 'reviews') return { auto: v.auto !== false, days: Math.max(1, Math.min(30, Math.round(+v.days || 3))) };
  throw err(400, 'key', 'Unknown setting.');
}
async function get(k) {
  if (!KEYS.includes(k)) throw err(400, 'key', 'Unknown setting.');
  const v = BS.on() ? await BS.getJSON('hq/settings/' + k + '.json').catch(() => null) : null;
  return v ? Object.assign({}, DEFAULTS[k], v) : JSON.parse(JSON.stringify(DEFAULTS[k]));
}
async function save(k, v) { if (!KEYS.includes(k)) throw err(400, 'key', 'Unknown setting.'); const o = shape(k, v); await BS.putJSON('hq/settings/' + k + '.json', o); return o; }
module.exports = { get, save, KEYS, DEFAULTS };
