/* ============================================================
   CIEL AFRICA PHOTO BOOKS — branded emails (HTML with inline styles,
   tables for layout so Gmail, Outlook and phone mail apps agree).
   ============================================================ */
const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const money = (n, c) => (c || 'KES') + ' ' + Number(n || 0).toLocaleString('en-KE');
const SITE = () => (process.env.PHOTOBOOKS_BASE_URL || 'https://cielafrica.com').replace(/\/$/, '');

/* the steps a printed book goes through, for the progress strip */
const STEPS = [['paid', 'Paid'], ['ready', 'Pages received'], ['printing', 'Printing'], ['out', 'On its way'], ['delivered', 'Delivered']];
function stepIndex(status) {
  return { awaiting_payment: -1, awaiting_confirmation: -1, paid: 0, preparing: 0, ready: 1, printing: 2, ready_collection: 3, dispatched: 3, delivered: 4 }[status] ?? -1;
}

/**
 * o = { preheader, eyebrow, title, intro (html), ref, status, product, lines:[{label,amount,qty}], total, currency,
 *       details:[[k,v]], button:{label,url}, note (html), test }
 */
function render(o) {
  const site = SITE();
  const lines = (o.lines || []).map(l => `<tr class="em-t em-ln"><td style="padding:10px 0;border-bottom:1px solid #efe8dc;font-size:14px;color:#1b1714">${esc(l.label)}${l.qty > 1 ? ' <span style="color:#8a8076">× ' + l.qty + '</span>' : ''}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #efe8dc;font-size:14px;color:#1b1714;white-space:nowrap">${money((l.amount || 0) * (l.qty || 1), o.currency)}</td></tr>`).join('');
  const details = (o.details || []).filter(d => d && d[1]).map(([k, v]) => `<tr><td class="em-m" style="padding:7px 12px 7px 0;font-size:13px;color:#8a8076;vertical-align:top;width:34%">${esc(k)}</td><td class="em-t" style="padding:7px 0;font-size:14px;color:#1b1714;vertical-align:top">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('');
  const si = o.product === 'print' && o.status ? stepIndex(o.status) : -2;
  const steps = si > -2 ? `<tr><td style="padding:0 32px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${STEPS.map((s, i) => `<td align="center" valign="top" style="padding:0 2px;width:20%;vertical-align:top"><div${i <= si ? '' : ' class="em-off"'} style="height:6px;border-radius:6px;background:${i <= si ? '#ff5a1f' : '#eadfce'}"></div><div class="em-t" style="font-size:11px;line-height:1.3;margin-top:6px;color:${i <= si ? '#1b1714' : '#a59a8d'};font-weight:${i === si ? '700' : '500'}">${s[1]}</div></td>`).join('')}</tr></table></td></tr>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(o.title)}</title>
<style>:root{color-scheme:light dark;supported-color-schemes:light dark}
@media (prefers-color-scheme:dark){.em-bg{background:#14110f!important}.em-hd{background:#2b2520!important;background-image:none!important}.em-hd .em-ey{color:#ffb48f!important}.em-off{background:#4a4038!important}.em-ref{background:#f4ede4!important;color:#14110f!important}.em-card{background:#211c18!important}.em-t,.em-t td,.em-t a{color:#f4ede4!important}.em-m,.em-m td,.em-m a{color:#b9ad9f!important}.em-box{background:#2b2520!important}.em-ln td{border-color:#3a322b!important}.em-ft{border-color:#3a322b!important}.em-pill{background:#f4ede4!important;color:#14110f!important}}
[data-ogsc] .em-t,[data-ogsc] .em-t td{color:#f4ede4!important}[data-ogsb] .em-card{background:#211c18!important}[data-ogsb] .em-hd{background:#2b2520!important}
/* Gmail apps in dark mode recolour text; these two layers keep white words white on the orange buttons and badges */
u + .body .gm-s{background:#000;mix-blend-mode:screen;display:inline-block}u + .body .gm-d{background:#000;mix-blend-mode:difference;display:inline-block}</style></head>
<body class="em-bg body" style="margin:0;padding:0;background:#f6f1e8;font-family:Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader || o.title)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="em-bg" style="background:#f6f1e8"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">
  <tr><td style="padding:0 6px 18px"><table role="presentation" width="100%"><tr>
    <td><a href="${site}/photobooks" style="display:inline-block;text-decoration:none;background:#ffffff;background-image:linear-gradient(#ffffff,#ffffff);border-radius:12px;padding:8px 12px"><img src="${site}/assets/img/logo-dark.png" alt="Ciel Africa" height="24" style="display:block;height:24px;width:auto;border:0"></a></td>
    <td align="right" class="em-m" style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a8076">Photo Books</td></tr></table></td></tr>
  <tr><td class="em-card" style="background:#ffffff;border-radius:22px;overflow:hidden">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td class="em-hd" style="background:#fff3ea;padding:26px 32px 22px;border-radius:22px 22px 0 0;border-bottom:3px solid #ff5a1f">
        ${o.test ? '<div style="display:inline-block;background:#ff5a1f;font-size:11px;font-weight:700;letter-spacing:.08em;border-radius:6px;padding:3px 8px;margin-bottom:10px"><span class="gm-s"><span class="gm-d" style="color:#ffffff">TEST ORDER · NOT PRINTED</span></span></div>' : ''}
        <div class="em-ey" style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c2410c;margin-bottom:8px;font-weight:700">${esc(o.eyebrow || 'Your photo book')}</div>
        <div class="em-t" style="font-size:26px;line-height:1.2;font-weight:800;color:#1b1714">${esc(o.title)}</div>
        ${o.ref ? `<div class="em-m" style="margin-top:14px;font-size:13px;color:#6b635b">Order <span class="em-ref" style="display:inline-block;background:#ffffff;color:#1b1714;border:1px solid #e9dccd;font-weight:700;border-radius:999px;padding:4px 12px;margin-left:4px;letter-spacing:.04em">${esc(o.ref)}</span></div>` : ''}
      </td></tr>
      ${o.coverCid ? `<tr><td align="center" style="padding:26px 32px 0"><img src="cid:${o.coverCid}" alt="Your book’s cover" width="220" style="display:block;width:220px;max-width:70%;height:auto;border-radius:6px;border:0;box-shadow:0 10px 26px rgba(0,0,0,.18)"></td></tr>` : ''}
      <tr><td class="em-t" style="padding:26px 32px 10px;font-size:15px;line-height:1.6;color:#3d3833">${o.intro || ''}</td></tr>
      ${steps}
      ${lines ? `<tr><td style="padding:14px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lines}<tr class="em-t"><td style="padding:14px 0 4px;font-size:15px;font-weight:700;color:#1b1714">${o.unpaid ? 'Total' : 'Total paid'}</td><td align="right" style="padding:14px 0 4px;font-size:18px;font-weight:800;color:#1b1714">${money(o.total, o.currency)}</td></tr></table></td></tr>` : ''}
      ${details ? `<tr><td style="padding:18px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="em-box" style="background:#faf6ef;border-radius:14px"><tr><td style="padding:12px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${details}</table></td></tr></table></td></tr>` : ''}
      ${o.button ? `<tr><td align="left" style="padding:24px 32px 6px"><a href="${esc(o.button.url)}" style="display:inline-block;background:#ff5a1f;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:999px"><span class="gm-s"><span class="gm-d" style="color:#ffffff">${esc(o.button.label)} &rarr;</span></span></a></td></tr>` : ''}
      ${o.note ? `<tr><td class="em-m" style="padding:14px 32px 0;font-size:13px;line-height:1.6;color:#6b635b">${o.note}</td></tr>` : ''}
      <tr><td class="em-m" style="padding:24px 32px 28px"><div class="em-ft" style="border-top:1px solid #efe8dc;padding-top:16px;font-size:13px;line-height:1.6;color:#8a8076">Questions? Reply to this email, write to <a href="mailto:hello@cielafrica.com" style="color:#1b1714">hello@cielafrica.com</a> or WhatsApp <a href="https://wa.me/254117959105" style="color:#1b1714">+254 117 959 105</a>${o.ref ? ', quoting ' + esc(o.ref) : ''}.</div></td></tr>
    </table>
  </td></tr>
  <tr><td align="center" class="em-m" style="padding:18px 10px 0;font-size:12px;color:#a59a8d">Ciel Africa · Nairobi, Kenya · <a href="${site}" style="color:#a59a8d">cielafrica.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

/* what the customer hears when the order moves */
const CUSTOMER_STATUS = {
  ready: { title: 'We’ve received your book', intro: 'All the pages of your photo book have arrived safely. We’ll print it and dispatch it for delivery within 24–48 hours.' },
  printing: { title: 'Your book is being printed', intro: 'Good news: your photo book is at the printer now.' },
  ready_collection: { title: 'Your book is ready to collect', intro: 'Your photo book is printed and ready for collection. Reply to this email or WhatsApp us to arrange a time.' },
  dispatched: { title: 'Your book is on its way', intro: 'Your photo book has been sent out for delivery. We’ll be in touch if the courier needs anything.' },
  delivered: { title: 'Your book has been delivered', intro: 'Your photo book has been delivered. We hope you love it! We’d be glad to see it: tag us or send us a photo.' },
  cancelled: { title: 'Your order has been cancelled', intro: 'Your photo book order has been cancelled. If you didn’t expect this, please reply to this email.' },
  refunded: { title: 'Your payment has been refunded', intro: 'We’ve refunded your photo book payment.' }
};

module.exports = { render, esc, money, CUSTOMER_STATUS, stepIndex };
