/* ============================================================
   CIEL AFRICA — /api/contact  (Vercel Serverless Function)
   Receives contact & project-brief form submissions and emails
   them to the team. Uses Resend (https://resend.com) — free tier.

   Secrets live in Vercel Environment Variables (never in the page):
     RESEND_API_KEY   your Resend API key (re_xxx...)
   Optional overrides (defaults shown):
     MAIL_TO          "lorna@cielafrica.com,hello@cielafrica.com"
     MAIL_FROM        "Ciel Africa <hello@cielafrica.com>"
                      (the domain must be verified in Resend)
   ============================================================ */

const TO   = (process.env.MAIL_TO   || 'lorna@cielafrica.com,hello@cielafrica.com')
               .split(',').map(s => s.trim()).filter(Boolean);
const FROM = process.env.MAIL_FROM || 'Ciel Africa <onboarding@resend.dev>';

function esc(s){return String(s==null?'':s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));}

async function readBody(req){
  // Vercel usually parses JSON into req.body; also handle urlencoded form posts.
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return req.body;
  let raw='';
  await new Promise(r=>{ req.on('data',c=>raw+=c); req.on('end',r); });
  if(!raw) return {};
  const ct=(req.headers['content-type']||'');
  if(ct.includes('application/json')){ try{return JSON.parse(raw);}catch(e){return {};} }
  // urlencoded
  const o={}; raw.split('&').forEach(p=>{const[k,v]=p.split('=');if(k)o[decodeURIComponent(k)]=decodeURIComponent((v||'').replace(/\+/g,' '));});
  return o;
}

module.exports = async function handler(req, res){
  // CORS / preflight (same-origin, but safe)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

  const data = await readBody(req);

  // honeypot: ignore bots that fill the hidden _honey field
  if (data._honey) return res.status(200).json({ ok:true });

  const isBrief = data._form === 'brief';
  // Wanja Mwangi's portfolio (/wanja): enquiries go to Wanja, never to an address sent by the browser.
  const isWanja = data._form === 'wanja';
  const ref = String(data._ref || '').slice(0, 80);
  // strip helper fields
  ['_subject','_captcha','_template','_next','_honey','_form','_ref'].forEach(k=>{ delete data[k]; });
  const to = isWanja
    ? (process.env.WANJA_MAIL_TO || 'wanjamary916@gmail.com').split(',').map(x => x.trim()).filter(Boolean)
    : TO;

  const name  = data.Name || data.name || '';
  const email = data.Email || data.email || '';
  const phoneIn = String(data.Phone || data.phone || data.WhatsApp || data['Phone / WhatsApp'] || data['WhatsApp or phone'] || '').trim();
  // the project form only needs a way to reach you: an email or a phone/WhatsApp number
  if (!email && !(isBrief && /\d{7,}/.test(phoneIn.replace(/\D/g, '')))) return res.status(400).json({ ok:false, error: isBrief ? 'Add a phone number or an email so we can reach you' : 'Email is required' });

  const rows = Object.keys(data)
    .filter(k => String(data[k]).trim() !== '')
    .map(k => k.startsWith('## ')
      ? `<tr><td colspan="2" style="padding:14px 0 6px;font-weight:700;font-size:15px;border:0">${esc(k.slice(3))}</td></tr>`
      : `<tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">${esc(k)}</td><td style="padding:6px 12px;border:1px solid #eee;white-space:pre-wrap">${esc(data[k])}</td></tr>`)
    .join('');

  const subject = (isWanja
      ? `New brand enquiry — ${name||email}${data.Brand ? ' · ' + data.Brand : ''}`
      : `New lead: ${isBrief || data.Details ? 'project brief' : 'enquiry'} — ${name||email}${ref ? ' · ' + ref : ''}`
    ).replace(/[\r\n]+/g,' ').slice(0, 160);
  const html = `
    <div style="font-family:Arial,sans-serif;color:#141414;max-width:560px">
      <h2 style="margin:0 0 4px">${isWanja ? 'New enquiry from your portfolio' : 'New message from cielafrica.com'}</h2>
      <p style="color:#777;margin:0 0 16px">${email ? `Reply directly to this email to reach ${esc(name||'them')}.` : `No email given: reach ${esc(name||'them')} on WhatsApp or by phone.`}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
    </div>`;

  // every website enquiry is a lead: keep it in Ciel Admin (private Blob store) as high priority and alert the owner's phone
  if (!isWanja) {
    const kind = isBrief || data.Details ? 'brief' : 'message';
    const pick = re => { const k = Object.keys(data).find(x => re.test(x) && String(data[x]).trim()); return k ? String(data[k]).replace(/\s+/g, ' ').trim() : ''; };
    let id = '', saving = null, pid = '';
    try {
      const BS = require('../lib/photobooks/blobstore');
      if (BS.on()) {
        const at = Date.now(); id = at.toString(36) + require('crypto').randomBytes(4).toString('hex');
        const fields = Object.keys(data).filter(k => !k.startsWith('## ') && String(data[k]).trim() !== '').slice(0, 40).map(k => [String(k).slice(0, 60), String(data[k]).slice(0, 3000)]);
        /* a project brief also starts a project (status: New lead), with the scope they ticked */
        if (kind === 'brief') {
          pid = 'p' + id.slice(0, 15);
          const looking = String(data['Looking for'] || ref || 'New project'), type = looking.split(' — ')[0], cat = looking.split(' — ').slice(1).join(' — ');
          const scope = String(data['Must-haves'] || '').split(/,\s*(?=[A-Z0-9])/).map(x => x.trim()).filter(Boolean).map(x => '[ ] ' + x).join('\n');
          const proj = { id: pid, name: ((data.Company || name || 'New client') + ' · ' + (cat || type)).slice(0, 120), client: String(name).slice(0, 120), company: String(data.Company || '').slice(0, 120), email: String(email).slice(0, 190), phone: phoneIn.slice(0, 30),
            type: type.slice(0, 60), category: cat.slice(0, 120), desc: [data['Project description'], data['Also must'] ? 'Also: ' + data['Also must'] : '', data['Anything else'] ? 'Note: ' + data['Anything else'] : ''].filter(Boolean).join('\n\n').slice(0, 4000),
            scope: scope.slice(0, 4000), budget: String(data.Budget || '').slice(0, 40), status: 'lead', priority: 'high', lead: id, milestones: '', createdAt: at, updatedAt: at };
          saving = BS.getJSON('hq/projects.json').catch(() => null).then(d => { d = d || { items: [], v: 0 }; d.items.push(proj); d.v = (d.v || 0) + 1; return BS.putJSON('hq/projects.json', d); });
        }
        const savingLead = BS.putJSON('hq/inbox/' + id + '.json', { id, kind, status: 'new', stage: 'new', priority: 'high', createdAt: at, subject, ref,
          customer: { name: String(name).slice(0, 80), email: String(email).slice(0, 190), phone: pick(/phone|whatsapp/i).slice(0, 30) }, fields, project: pid || undefined });
        saving = Promise.all([savingLead, saving]);
      }
    } catch (e) { console.error('contact inbox error', e && e.message); }
    // the alert goes out even if saving failed, so a lead is never silent
    const what = kind === 'brief' ? ['Project brief', pick(/^(service|product|template|looking for)$/i), pick(/budget/i)].filter(Boolean).join(' · ') : 'Enquiry · ' + (pick(/message|details/i) || subject);
    /* the phone alert goes out while the lead is being saved, not after */
    await Promise.all([saving && saving.catch(e => console.error('contact inbox error', e && e.message)), require('../lib/hq/notify').event({ kind: 'lead', title: 'New lead · ' + (name || email), body: what.slice(0, 140), url: id ? '/admin#leads/' + id : '/admin#leads', tag: 'lead-' + (id || Date.now()), urgent: true,
      task: { contact: [name, phoneIn, email].filter(Boolean).join(' · ').slice(0, 160), phone: phoneIn.slice(0, 30), email: String(email).slice(0, 190), ref: pid || '', notes: [what, pick(/^project description$|message|details/i)].filter(Boolean).join('\n\n').slice(0, 2000) } })]);
  }

  // If email isn't configured yet, don't fail the user — accept and log.
  if (!process.env.RESEND_API_KEY && isWanja) {
    // Never tell a visitor their enquiry reached Wanja when it can't be delivered.
    return res.status(503).json({ ok:false, error:'Email delivery is not configured' });
  }
  if (!process.env.RESEND_API_KEY) {
    console.log('CONTACT (email not configured yet):', JSON.stringify(data));
    return res.status(200).json({ ok:true, note:'received (email delivery not configured yet)' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ from: FROM, to, reply_to: email || undefined, subject, html,
        // website leads arrive flagged as important in the mailbox
        headers: isWanja ? undefined : { 'X-Priority': '1 (Highest)', 'X-MSMail-Priority': 'High', Importance: 'high' } })
    });
    if (!r.ok) {
      const t = await r.text();
      console.error('Resend error', r.status, t);
      return res.status(502).json({ ok:false, error:'Email provider error' });
    }
    return res.status(200).json({ ok:true });
  } catch (e) {
    console.error('contact handler error', e);
    return res.status(500).json({ ok:false, error:'Server error' });
  }
};
