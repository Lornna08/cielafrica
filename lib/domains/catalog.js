/* ============================================================
   CIEL DOMAINS — extension catalogue (defaults)

   Every value here can be overridden from the admin dashboard
   (/domains/admin → Pricing). Overrides are stored in the
   database; these defaults apply until you change them.

   PRICES ARE INDICATIVE STARTING POINTS, NOT WHOLESALE COSTS.
   They were set a little above Truehost Kenya's public retail list
   (truehost.co.ke/domain-registration, checked Oct 2026). Review them before
   accepting orders. `null` = "price confirmed on request".

   method
     rdap  official registry RDAP server (IANA bootstrap, Oct 2026).
           A "not found" answer means no registration exists in the
           registry, which we show as Available (preliminary). It does
           not reserve the name or rule out registry-reserved/premium.
     dns   no public RDAP server. DNS can prove a name is taken
           (it has nameservers); it cannot prove a name is free, so
           anything without nameservers is "needs confirmation".
     manual  always confirmed by hand.

   verifyBeforePayment  true → the customer submits a request, you
     confirm availability + price on Truehost, then they get a pay link.
   truehost  'listed' = shown on Truehost's public price list;
     'unconfirmed' = not seen there yet, confirm before enabling sales.
   premiumRisk  the registry sells some names at premium prices that
     RDAP does not reveal; short names are always verified first.
   ============================================================ */

const RDAP = {
  verisignCom: 'https://rdap.verisign.com/com/v1/',
  verisignNet: 'https://rdap.verisign.com/net/v1/',
  pir: 'https://rdap.publicinterestregistry.org/rdap/',
  identity: 'https://rdap.identitydigital.services/rdap/',
  biz: 'https://rdap.nic.biz/',
  kenic: 'https://rdap.kenic.or.ke/',
  africa: 'https://rdap.nic.africa/rdap/',
  radix: 'https://rdap.radix.host/rdap/',
  google: 'https://pubapi.registry.google/rdap/',
  cloud: 'https://rdap.registry.cloud/rdap/',
  gmo: 'https://rdap.gmoregistry.net/rdap/',
  design: 'https://rdap.nic.design/',
  blog: 'https://rdap.blog.fury.ca/rdap/',
  xyz: 'https://rdap.centralnic.com/xyz/'
};

const SOURCE_NAMES = {
  [RDAP.verisignCom]: 'Verisign (.com registry)',
  [RDAP.verisignNet]: 'Verisign (.net registry)',
  [RDAP.pir]: 'Public Interest Registry',
  [RDAP.identity]: 'Identity Digital registry',
  [RDAP.biz]: '.biz registry',
  [RDAP.kenic]: 'KeNIC (.ke registry)',
  [RDAP.africa]: 'ZACR (.africa registry)',
  [RDAP.radix]: 'Radix registry',
  [RDAP.google]: 'Google Registry',
  [RDAP.cloud]: '.cloud registry',
  [RDAP.gmo]: 'GMO Registry',
  [RDAP.design]: '.design registry',
  [RDAP.blog]: '.blog registry',
  [RDAP.xyz]: 'CentralNic (.xyz registry)'
};

// t: tld, c: category, r: rdap base (null → dns), p: [register, renew] KES
const T = (tld, c, r, p, o) => Object.assign({
  tld, category: c, rdap: r, method: r ? 'rdap' : 'dns',
  register: p ? p[0] : null, renew: p ? p[1] : null,
  periods: [1, 2, 3, 5], enabled: true,
  verifyBeforePayment: !r || !p, truehost: p ? 'listed' : 'unconfirmed',
  premiumRisk: false, minYears: 1, note: ''
}, o || {});

const DEFAULT_TLDS = [
  // Core
  T('com', 'core', RDAP.verisignCom, [1350, 1900]),
  T('co.ke', 'core', RDAP.kenic, [1200, 1800], { note: 'For businesses in Kenya.' }),
  T('ke', 'core', RDAP.kenic, [3500, 3500]),
  T('africa', 'core', RDAP.africa, [2200, 2400]),
  T('org', 'core', RDAP.pir, [1450, 1800]),
  T('net', 'core', RDAP.verisignNet, [1400, 2250]),
  T('info', 'core', RDAP.identity, [900, 5600], { premiumRisk: true }),
  T('biz', 'core', RDAP.biz, [1300, 4450], { premiumRisk: true }),
  T('co', 'core', null, [1200, 7500]),
  // Technology
  T('tech', 'tech', RDAP.radix, null, { premiumRisk: true }),
  T('dev', 'tech', RDAP.google, [1550, 2800], { premiumRisk: true }),
  T('app', 'tech', RDAP.google, [1550, 3200], { premiumRisk: true }),
  T('ai', 'tech', RDAP.identity, [26500, 16000], { premiumRisk: true, verifyBeforePayment: true, periods: [2, 3, 5], minYears: 2, note: '.ai registrations start at 2 years.' }),
  T('io', 'tech', null, [6500, 13500]),
  T('cloud', 'tech', RDAP.cloud, [900, 4950], { premiumRisk: true }),
  T('digital', 'tech', RDAP.identity, [700, 7950], { premiumRisk: true }),
  T('software', 'tech', RDAP.identity, null, { premiumRisk: true }),
  // Business & creative
  T('online', 'business', RDAP.radix, [600, 7350], { premiumRisk: true }),
  T('site', 'business', RDAP.radix, null, { premiumRisk: true }),
  T('store', 'business', RDAP.radix, null, { premiumRisk: true }),
  T('shop', 'business', RDAP.gmo, [400, 7450], { premiumRisk: true }),
  T('agency', 'business', RDAP.identity, [800, 5900], { premiumRisk: true }),
  T('solutions', 'business', RDAP.identity, null, { premiumRisk: true }),
  T('design', 'business', RDAP.design, [7450, 11250], { premiumRisk: true }),
  T('consulting', 'business', RDAP.identity, [4750, 10550], { premiumRisk: true }),
  T('blog', 'business', RDAP.blog, [550, 4350], { premiumRisk: true }),
  T('me', 'business', null, [1500, 3750]),
  T('xyz', 'business', RDAP.xyz, null, { premiumRisk: true }),
  T('studio', 'business', RDAP.identity, null, { premiumRisk: true, enabled: false })
];

const CATEGORIES = { core: 'Core', tech: 'Technology', business: 'Business & creative' };

const DEFAULT_SETTINGS = {
  currency: 'KES',
  taxRate: 0,            // e.g. 0.16 once you charge VAT
  taxLabel: 'VAT',
  pricesIncludeTax: true,
  orderingEnabled: false, // switch on in the admin once storage + payments are tested
  paymentMethods: { mpesa: true, card: true }, // card needs PAYSTACK_SECRET_KEY
  supportEmail: 'hello@cielafrica.com',
  supportPhone: '+254 706 549 703',
  whatsapp: '254706549703'
};

function sourceName(base) { return SOURCE_NAMES[base] || 'Registry RDAP'; }

module.exports = { DEFAULT_TLDS, CATEGORIES, DEFAULT_SETTINGS, RDAP, sourceName };
