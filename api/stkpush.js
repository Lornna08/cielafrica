/* ============================================================
   CIEL AFRICA — /api/stkpush  (Vercel Serverless Function)
   Initiates an M-Pesa STK Push (Lipa na M-Pesa) via Safaricom Daraja.

   >>> YOUR DARAJA KEYS GO IN VERCEL ENVIRONMENT VARIABLES <<<
   (Vercel dashboard → Project → Settings → Environment Variables)
   NEVER put them in the website code or share them in chat.

     MPESA_CONSUMER_KEY       your Daraja app Consumer Key
     MPESA_CONSUMER_SECRET    your Daraja app Consumer Secret
     MPESA_SHORTCODE          your Paybill/Till (or 174379 for sandbox)
     MPESA_PASSKEY            the Lipa na M-Pesa Online passkey
     MPESA_ENV                "sandbox" (default) or "production"
     MPESA_CALLBACK_URL       https://cielafrica.com/api/mpesa-callback
   ============================================================ */

const ENV   = process.env.MPESA_ENV || 'sandbox';
const BASE  = ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

function normalizePhone(p){
  p = String(p||'').replace(/\D/g,'');
  if (p.startsWith('0'))  p = '254' + p.slice(1);
  if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;
  if (p.startsWith('254')) return p;
  return p;
}
function timestamp(){
  const d = new Date(), z = n => String(n).padStart(2,'0');
  return d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+z(d.getHours())+z(d.getMinutes())+z(d.getSeconds());
}
async function readBody(req){
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return req.body;
  let raw=''; await new Promise(r=>{ req.on('data',c=>raw+=c); req.on('end',r); });
  try { return raw ? JSON.parse(raw) : {}; } catch(e){ return {}; }
}

module.exports = async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });

  const need = ['MPESA_CONSUMER_KEY','MPESA_CONSUMER_SECRET','MPESA_SHORTCODE','MPESA_PASSKEY'];
  const missing = need.filter(k => !process.env[k]);
  if (missing.length) {
    // Keys not added yet — tell the front-end to stay in demo mode.
    return res.status(200).json({ ok:false, demo:true, error:'M-Pesa not configured yet' });
  }

  const body = await readBody(req);
  const phone  = normalizePhone(body.phone);
  /* prices come from the published catalogue, not from the browser */
  let priced = Array.isArray(body.items) ? require('../lib/hq/delivery').price(body.items) : null;
  /* anything not in the published catalogue: the order still goes through, but nothing is delivered automatically */
  if (priced && !priced.ok) priced = null;
  const amount = priced ? priced.total : Math.max(1, Math.round(Number(body.amount)||0));
  const ref    = (body.reference || 'Ciel Africa').toString().slice(0,12);
  if (phone.length < 12 || !amount) return res.status(400).json({ ok:false, error:'Valid phone and amount required' });

  try {
    // 1) OAuth token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tok = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, { headers:{ Authorization:`Basic ${auth}` } });
    const tokJson = await tok.json();
    const token = tokJson.access_token;
    if (!token) return res.status(502).json({ ok:false, error:'Could not authenticate with Daraja' });

    // 2) STK push
    // Paybill vs Till (Buy Goods):
    //  - Paybill:  BusinessShortCode = Paybill,  PartyB = Paybill,  type = CustomerPayBillOnline
    //  - Till:     BusinessShortCode = Store/HeadOffice no (MPESA_SHORTCODE),
    //              PartyB = Till (Buy Goods) no (MPESA_TILL),      type = CustomerBuyGoodsOnline
    // The password is ALWAYS built with MPESA_SHORTCODE (the store/paybill number) + passkey.
    const ts = timestamp();
    const shortcode = String(process.env.MPESA_SHORTCODE || '').trim();     // store/head-office (till) OR paybill
    const till      = String(process.env.MPESA_TILL || '').trim();          // only for Buy Goods / Till
    const isTill    = !!till;
    const password  = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${ts}`).toString('base64');
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: isTill ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: isTill ? till : shortcode,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://cielafrica.com/api/mpesa-callback',
      AccountReference: ref,
      TransactionDesc: 'Ciel Africa order'
    };
    const stk = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await stk.json();
    if (data.ResponseCode === '0') {
      try { await require('../lib/hq/shop').started(data.CheckoutRequestID, Object.assign({}, body, { phone }), amount, priced); } catch (e) { console.error('stkpush record error', e && e.message); }
      return res.status(200).json({ ok:true, checkoutRequestID: data.CheckoutRequestID, amount, message:'STK push sent — check your phone.' });
    }
    return res.status(400).json({ ok:false, error: data.errorMessage || data.ResponseDescription || 'STK push failed' });
  } catch (e) {
    console.error('stkpush error', e);
    return res.status(500).json({ ok:false, error:'Server error' });
  }
};
