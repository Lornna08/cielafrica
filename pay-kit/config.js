/* ==========================================================================
   CIEL PAY KIT — settings
   One checkout page for M-Pesa (STK push) and card payments.
   Edit this file only. Nothing in pay.js or pay.css needs to change.
   ========================================================================== */
window.PAY = {
  /* LIVE TEMPLATE MODE. true = nothing is sent anywhere and no money moves. The page
     plays the real screens with a small "Live template" panel to choose the outcome.
     Set to false once your server endpoints below are live. */
  template: true,

  merchant: {
    name: 'Mokara Coffee',            // sample merchant, replace
    logo: '',                         // path to an SVG or PNG; empty = the name as a wordmark
    backUrl: '../products.html',      // "Back to store"
    supportPhone: '',                 // shown on the help sheet, e.g. '+254 7XX XXX XXX'
    supportEmail: ''
  },

  /* Colours: accent is buttons and highlights, ink is the order panel. */
  theme: { accent: '#0F8F4E', mpesa: '#0F8F4E', ink: '#0E1411', paper: '#F6F5F1' },

  currency: { code: 'KES', locale: 'en-KE' },

  /* The order being paid. In a real store your server fills this in
     (for example by rendering this page with the order, or from ?order=). */
  order: {
    reference: 'ORD-10482',           // sample
    items: [
      { name: 'Colombia Supremo, 250 g', qty: 2, price: 950, image: '../mokara/img/p/colombia-supremo-front-480.webp' },
      { name: 'House Espresso, 250 g',   qty: 1, price: 1100, image: '../mokara/img/p/espresso-house-blend-front-480.webp' }
    ],
    delivery: 250,
    note: 'Sample order.'
  },

  methods: ['mpesa', 'card'],         // order of the tabs; remove one to hide it

  /* M-PESA (Lipa na M-Pesa STK push). Your server talks to Safaricom Daraja;
     this page never holds keys or secrets.
     stkEndpoint     POST { phone: '2547XXXXXXXX', amount, reference }
                     → { id }  (your CheckoutRequestID or your own id)
     statusEndpoint  GET  statusEndpoint?id=…
                     → { status: 'pending' | 'success' | 'failed', resultCode, receipt, message }
                     Report 'success' only after Daraja's callback says ResultCode 0. */
  mpesa: {
    stkEndpoint: '',
    statusEndpoint: '',
    pollSeconds: 3,
    waitSeconds: 90,                  // how long the page waits for an answer before offering to try again
    resendAfter: 30,                  // seconds before "Send again" is offered
    /* Optional manual fallback when the prompt does not arrive. Leave empty to hide. */
    paybill: '',                      // e.g. '123456'
    till: '',                         // or a Buy Goods till number
    /* Daraja ResultCodes → what the customer reads. */
    results: {
      '1032': 'You cancelled the request on your phone.',
      '1037': 'Your phone could not be reached. Check that it is on and has signal.',
      '1':    'Your M-PESA balance was not enough for this payment.',
      '2001': 'The PIN entered was not correct.',
      'default': 'The payment did not go through.'
    }
  },

  /* CARDS. Card details must be handled by a PCI-compliant payment provider.
     When template is false the page does NOT collect card numbers: it sends the
     order to checkoutEndpoint, which creates a hosted checkout session with
     your provider (Paystack, Flutterwave, Pesapal, Stripe, DPO …) and
     returns { url }. The customer pays there and comes back to returnUrl.
     The card form on this page is shown in live template mode only. */
  card: {
    provider: '',                     // shown as "Secured by …", e.g. 'Paystack'
    checkoutEndpoint: '',
    brands: ['visa', 'mastercard', 'amex']
  },

  /* Shown on the receipt. */
  receipt: { note: '' }              // e.g. 'We have emailed your receipt.' (only if your server really does)
};
