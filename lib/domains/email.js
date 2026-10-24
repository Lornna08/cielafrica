/* CIEL DOMAINS — email notifications via Resend (existing RESEND_API_KEY / MAIL_FROM / MAIL_TO) */
const { fmt } = require('./pricing');

const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const FROM = () => process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>';
const TEAM = () => (process.env.MAIL_TO || 'hello@cielafrica.com').split(',').map(s => s.trim()).filter(Boolean);

function layout(title, intro, rows, next, link) {
  const tr = rows.map(([k, v]) => `<tr><td style="padding:8px 12px;background:#F6F5F1;font-weight:600;border:1px solid #ECEBE4;width:38%">${esc(k)}</td><td style="padding:8px 12px;border:1px solid #ECEBE4">${esc(v)}</td></tr>`).join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#141414;max-width:560px;margin:0 auto">
  <p style="font-size:13px;color:#8C8C86;margin:0 0 18px">Ciel Domains · Ciel Africa</p>
  <h1 style="font-size:22px;margin:0 0 10px;letter-spacing:-.02em">${esc(title)}</h1>
  <p style="font-size:15px;line-height:1.55;color:#50504B;margin:0 0 18px">${intro}</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 18px">${tr}</table>
  ${next ? `<p style="font-size:15px;line-height:1.55;margin:0 0 18px"><b>Next:</b> ${next}</p>` : ''}
  ${link ? `<p style="margin:0 0 22px"><a href="${esc(link)}" style="display:inline-block;background:#FF5A1F;color:#fff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:3px">View your order</a></p>` : ''}
  <p style="font-size:13px;color:#8C8C86;line-height:1.5;margin:0">Quote your order reference when you contact us: hello@cielafrica.com · +254 706 549 703 (WhatsApp).<br>Search results are preliminary and do not reserve a domain. A domain is only yours once we confirm it is registered.</p>
</div>`;
}

const base = o => [['Order reference', o.ref], ['Domain', o.domain], ['Term', o.years + (o.years === 1 ? ' year' : ' years')]];
const money = o => o.amount != null ? fmt(o.amount, o.currency) : 'To be confirmed';

const TEMPLATES = {
  received_verify: o => ({
    subject: `We’ve got your request for ${o.domain} · ${o.ref}`,
    title: 'Request received — we’re checking it',
    intro: `Thanks, ${esc(o.customer.name)}. Before we take any payment, we’ll confirm with the registry that <b>${esc(o.domain)}</b> can be registered and what it costs.`,
    rows: base(o).concat([['Indicative price', money(o)], ['Payment', 'Not charged yet']]),
    next: 'You’ll get an email with a payment link once it’s confirmed — usually within one working day. If the price differs, you choose whether to go ahead.'
  }),
  received_pay: o => ({
    subject: `Your order for ${o.domain} · ${o.ref}`,
    title: 'Order received — complete payment',
    intro: `Thanks, ${esc(o.customer.name)}. Your order for <b>${esc(o.domain)}</b> is saved. It isn’t registered or reserved until payment is confirmed and we complete the registration.`,
    rows: base(o).concat([['Total', money(o)], ['Payment', 'Awaiting payment']]),
    next: 'Pay from your order page. If you’ve already paid, you can ignore this.'
  }),
  verified: o => ({
    subject: `${o.domain} is confirmed — ready to pay · ${o.ref}`,
    title: 'Good news — it’s ready to pay',
    intro: `We confirmed <b>${esc(o.domain)}</b> can be registered at the price below. Availability can still change until it’s registered, so we register it as soon as payment arrives.`,
    rows: base(o).concat([['Total', money(o)]]),
    next: 'Open your order page and pay with M-Pesa' + (o.cardEnabled ? ' or card.' : '.')
  }),
  price_change: o => ({
    subject: `Price update for ${o.domain} — your approval needed · ${o.ref}`,
    title: 'The registry price is different',
    intro: `The registry lists <b>${esc(o.domain)}</b> at a different price than our search showed. Nothing has been charged. You decide whether to continue.`,
    rows: base(o).concat([['Previous total', fmt(o.priceChange && o.priceChange.from, o.currency)], ['New total', fmt(o.priceChange && o.priceChange.to, o.currency)]]),
    next: 'Accept or decline the new price on your order page.'
  }),
  payment_confirmed: o => ({
    subject: `Payment confirmed for ${o.domain} · ${o.ref}`,
    title: 'Payment confirmed',
    intro: `We’ve received your payment for <b>${esc(o.domain)}</b>. We’ll now register it manually with the registry. It is <b>not registered yet</b> — we’ll email you as soon as it is.`,
    rows: base(o).concat([['Amount paid', money(o)], ['Payment reference', (o.payment && o.payment.receipt) || '—'], ['Status', 'Paid · pending registration']]),
    next: 'We aim to register within one working day. If it can’t be registered, you get a full refund or can choose an alternative at the same price.'
  }),
  in_progress: o => ({
    subject: `We’re registering ${o.domain} · ${o.ref}`,
    title: 'Registration in progress',
    intro: `We’ve started registering <b>${esc(o.domain)}</b>. Some registries (including .ke) can take a little time to confirm.`,
    rows: base(o).concat([['Status', 'Registration in progress']]),
    next: 'We’ll email you as soon as the registry confirms it.'
  }),
  registered: o => ({
    subject: `${o.domain} is registered · ${o.ref}`,
    title: `${o.domain} is yours`,
    intro: `The registry has confirmed <b>${esc(o.domain)}</b> is registered.`,
    rows: base(o).concat([['Registered', o.registration && o.registration.registeredAt ? o.registration.registeredAt.slice(0, 10) : '—'], ['Expires', (o.registration && o.registration.expiresAt) || '—'], ['Nameservers', ((o.registration && o.registration.nameservers) || []).join(', ') || 'Default']]),
    next: 'Renewal is separate and billed before expiry. Want a website, email or hosting on it? Just reply.'
  }),
  unavailable: o => ({
    subject: `We couldn’t register ${o.domain} · ${o.ref}`,
    title: 'This domain couldn’t be registered',
    intro: `Sorry — <b>${esc(o.domain)}</b> could not be registered${o.registration && o.registration.failureReason ? ': ' + esc(o.registration.failureReason) : '.'}`,
    rows: base(o).concat([['Amount paid', o.payment && o.payment.status === 'paid' ? money(o) : 'Nothing charged']]),
    next: o.payment && o.payment.status === 'paid'
      ? 'You’re eligible for a full refund of the amount paid for this domain. If you’d rather pick an alternative at the same price, reply and tell us — we only switch with your agreement.'
      : 'Nothing was charged. Try another name on cielafrica.com/domains.'
  }),
  alternative: o => ({
    subject: `An alternative for ${o.domain} — your choice · ${o.ref}`,
    title: 'Would this work instead?',
    intro: `We can register <b>${esc(o.proposal && o.proposal.domain)}</b> at the same price you paid. We’ll only switch if you agree; otherwise you get a full refund.`,
    rows: base(o).concat([['Suggested domain', o.proposal && o.proposal.domain]]),
    next: 'Accept or decline on your order page.'
  }),
  refund_initiated: o => ({
    subject: `Refund started for ${o.ref}`,
    title: 'Your refund has been started',
    intro: `We’ve started a refund of <b>${esc(fmt(o.refund && o.refund.amount, o.currency))}</b> for <b>${esc(o.domain)}</b>.`,
    rows: base(o).concat([['Refund method', (o.refund && o.refund.method) === 'card' ? 'Back to your card / Paystack' : 'M-Pesa'], ['Status', 'Processing']]),
    next: 'Processing time depends on the payment provider. We’ll email you again when it’s completed.'
  }),
  refund_completed: o => ({
    subject: `Refund completed for ${o.ref}`,
    title: 'Refund completed',
    intro: `Your refund of <b>${esc(fmt(o.refund && o.refund.amount, o.currency))}</b> for <b>${esc(o.domain)}</b> has been completed.`,
    rows: base(o).concat([['Refund reference', (o.refund && o.refund.providerRef) || '—']]),
    next: 'If you don’t see it within a few days, reply with your order reference.'
  })
};

async function send(to, subject, html, fetchImpl) {
  if (!process.env.RESEND_API_KEY) { console.log('[domains] email not configured:', subject); return { ok: false, skipped: true }; }
  try {
    const r = await (fetchImpl || fetch)('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM(), to: Array.isArray(to) ? to : [to], subject, html, reply_to: 'hello@cielafrica.com' }), signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) { console.error('[domains] email failed', r.status); return { ok: false }; }
    return { ok: true };
  } catch (e) { console.error('[domains] email error', e && e.message); return { ok: false }; }
}

/** customer email for an order event */
async function notifyCustomer(kind, order, link, opts) {
  const t = TEMPLATES[kind]; if (!t) return { ok: false };
  const m = t(Object.assign({}, order, opts || {}));
  return send(order.customer.email, m.subject, layout(m.title, m.intro, m.rows, m.next, link), opts && opts.fetch);
}

/** internal notification to the team */
async function notifyTeam(subject, order, extra, adminLink, fetchImpl) {
  const rows = [['Order', order.ref], ['Domain', order.domain], ['Term', order.years + ' yr'], ['Amount', money(order)], ['Status', order.status], ['Payment', order.payment.status + (order.payment.method ? ' · ' + order.payment.method : '')], ['Customer', order.customer.name + ' · ' + order.customer.email + ' · ' + (order.customer.phone || '')]].concat(extra || []);
  return send(TEAM(), '[Ciel Domains] ' + subject, layout(subject, 'Open the admin dashboard to act on this order.', rows, null, adminLink), fetchImpl);
}

module.exports = { notifyCustomer, notifyTeam, TEMPLATES, layout };
