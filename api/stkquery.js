/* ============================================================
   CIEL AFRICA — /api/stkquery  (Vercel Serverless Function)
   Asks Daraja whether an STK push was paid, cancelled, or is
   still pending. The browser polls this after sending the push,
   so the page can show a real confirmed/failed result.

   On a confirmed payment it also emails the team (via Resend),
   so you get a notification even if Safaricom's callback is slow
   or blocked.

   Uses the same env vars as stkpush.js (+ Resend for email).
   ============================================================ */

const ENV  = process.env.MPESA_ENV || 'sandbox';
const BASE = ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

const TO   = (process.env.MAIL_TO || 'lorna@cielafrica.com,hello@cielafrica.com')
               .split(',').map(s => s.trim()).filter(Boolean);
const FROM = process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>';

function esc(s){return String(s==null?'':s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));}
function timestamp(){
  const d=new Date(), z=n=>String(n).padStart(2,'0');
  return d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+z(d.getHours())+z(d.getMinutes())+z(d.getSeconds());
}
async function readBody(req){
  if (req.body && typeof req.body==='object' && Object.keys(req.body).length) return req.body;
  let raw=''; await new Promise(r=>{ req.on('data',c=>raw+=c); req.on('end',r); });
  try { return raw ? JSON.parse(raw) : {}; } catch(e){ return {}; }
}
async function notify(subject, html){
  if (!process.env.RESEND_API_KEY) { console.log('STKQUERY notify (no email configured):', subject); return; }
  try {
    await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ from: FROM, to: TO, subject, html })
    });
  } catch(e){ console.error('stkquery email error', e); }
}

module.exports = async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

  const need = ['MPESA_CONSUMER_KEY','MPESA_CONSUMER_SECRET','MPESA_SHORTCODE','MPESA_PASSKEY'];
  if (need.some(k => !process.env[k])) return res.status(200).json({ ok:false, demo:true });

  const body = await readBody(req);
  const checkoutRequestID = body.checkoutRequestID;
  if (!checkoutRequestID) return res.status(400).json({ ok:false, error:'checkoutRequestID required' });

  try {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tok = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, { headers:{ Authorization:`Basic ${auth}` } });
    const token = (await tok.json()).access_token;
    if (!token) return res.status(502).json({ ok:false, error:'auth failed' });

    const ts = timestamp();
    const shortcode = String(process.env.MPESA_SHORTCODE||'').trim();
    const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${ts}`).toString('base64');
    const r = await fetch(`${BASE}/mpesa/stkpushquery/v1/query`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: ts, CheckoutRequestID: checkoutRequestID })
    });
    const data = await r.json();

    // While the user hasn't acted yet, Daraja returns an error like
    // "The transaction is being processed" — treat that as "pending".
    if (data.ResultCode === '0' || data.ResultCode === 0) {
      // paid
      if (body.notify !== false) {
        await notify(
          `✅ M-Pesa payment confirmed — ${esc(body.customerName||'customer')}`,
          `<div style="font-family:Arial,sans-serif;color:#141414">
             <h2 style="margin:0 0 8px">Payment confirmed</h2>
             <table style="border-collapse:collapse;font-size:14px">
               <tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">Customer</td><td style="padding:6px 12px;border:1px solid #eee">${esc(body.customerName||'')} ${esc(body.customerEmail?'('+body.customerEmail+')':'')}</td></tr>
               <tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">Phone</td><td style="padding:6px 12px;border:1px solid #eee">${esc(body.phone||'')}</td></tr>
               <tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">Order</td><td style="padding:6px 12px;border:1px solid #eee">${esc(body.order||'')}</td></tr>
               <tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">Total</td><td style="padding:6px 12px;border:1px solid #eee">${esc(body.total||'')}</td></tr>
             </table>
             <p style="color:#777;margin-top:12px">Send ${esc(body.customerEmail||'the customer')} their download link.</p>
           </div>`
        );
      }
      return res.status(200).json({ ok:true, status:'paid', desc: data.ResultDesc });
    }

    // Known "still pending" signals
    const desc = (data.ResultDesc || data.errorMessage || '').toString();
    const pending = /processed|pending|being processed|wait/i.test(desc) || data.errorCode === '500.001.1001';
    if (pending) return res.status(200).json({ ok:true, status:'pending' });

    // Anything else = failed / cancelled
    return res.status(200).json({ ok:true, status:'failed', desc });
  } catch (e) {
    console.error('stkquery error', e);
    return res.status(200).json({ ok:true, status:'pending' }); // let the browser keep polling
  }
};
