/* ============================================================
   CIEL AFRICA — /api/mpesa-callback  (Vercel Serverless Function)
   Safaricom Daraja calls this URL after an STK push, to report
   whether the customer paid or cancelled.

   Set MPESA_CALLBACK_URL = https://cielafrica.com/api/mpesa-callback
   in your Daraja app AND in Vercel env vars.

   What it does now:
   - Accepts Safaricom's POST, reads the result, and (if configured)
     emails the team a paid/failed notice via Resend.
   - Always replies 200 with the ACK shape Daraja expects, so
     Safaricom doesn't retry.

   Note: this is stateless (no database). It notifies you by email
   on every payment. Hooking up automatic download-link delivery or
   an orders database is a later upgrade.
   ============================================================ */

const TO   = (process.env.MAIL_TO || 'lorna@cielafrica.com,hello@cielafrica.com')
               .split(',').map(s => s.trim()).filter(Boolean);
const FROM = process.env.MAIL_FROM || 'Ciel Africa <hello@cielafrica.com>';

function esc(s){return String(s==null?'':s).replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));}

async function readBody(req){
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return req.body;
  let raw=''; await new Promise(r=>{ req.on('data',c=>raw+=c); req.on('end',r); });
  try { return raw ? JSON.parse(raw) : {}; } catch(e){ return {}; }
}

async function notify(subject, html){
  if (!process.env.RESEND_API_KEY) { console.log('MPESA CALLBACK (no email configured):', subject); return; }
  try {
    await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ from: FROM, to: TO, subject, html })
    });
  } catch(e){ console.error('callback email error', e); }
}

module.exports = async function handler(req, res){
  // Daraja only POSTs here; reply 200 fast so it doesn't retry.
  if (req.method !== 'POST') return res.status(200).json({ ResultCode: 0, ResultDesc: 'OK' });

  const body = await readBody(req);
  try {
    const cb = (body.Body && body.Body.stkCallback) || {};
    const code = cb.ResultCode;
    const desc = cb.ResultDesc || '';
    const items = ((cb.CallbackMetadata && cb.CallbackMetadata.Item) || []);
    const get = n => { const it = items.find(x => x.Name === n); return it ? it.Value : ''; };

    if (code === 0) {
      const amount  = get('Amount');
      const receipt = get('MpesaReceiptNumber');
      const phone   = get('PhoneNumber');
      try { await require('../lib/hq/shop').paid(cb.CheckoutRequestID, { phone }, { receipt, amount }); } catch (e) { console.error('callback record error', e && e.message); }
      await notify(
        `✅ M-Pesa payment received — KES ${esc(amount)}`,
        `<div style="font-family:Arial,sans-serif;color:#141414">
           <h2 style="margin:0 0 8px">Payment received</h2>
           <table style="border-collapse:collapse;font-size:14px">
             <tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">Amount</td><td style="padding:6px 12px;border:1px solid #eee">KES ${esc(amount)}</td></tr>
             <tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">M-Pesa receipt</td><td style="padding:6px 12px;border:1px solid #eee">${esc(receipt)}</td></tr>
             <tr><td style="padding:6px 12px;background:#faf9f6;font-weight:600;border:1px solid #eee">Phone</td><td style="padding:6px 12px;border:1px solid #eee">${esc(phone)}</td></tr>
           </table>
           <p style="color:#777;margin-top:12px">Send the customer their download link.</p>
         </div>`
      );
    } else {
      // non-zero = cancelled / failed / timeout
      try { await require('../lib/hq/shop').failed(cb.CheckoutRequestID, desc); } catch (e) { }
      await notify(
        `M-Pesa payment not completed (code ${esc(code)})`,
        `<div style="font-family:Arial,sans-serif;color:#141414">
           <h2 style="margin:0 0 8px">Payment not completed</h2>
           <p>Result code: ${esc(code)}<br>${esc(desc)}</p>
         </div>`
      );
    }
  } catch(e){
    console.error('mpesa-callback parse error', e);
  }

  // Always ACK so Safaricom stops retrying.
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
};
