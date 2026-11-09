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
  periods: [1, 2, 3, 5], enabled: !!(r && p && !(o && o.method === 'dns')),
  verifyBeforePayment: false, truehost: p ? 'listed' : 'unconfirmed',
  premiumRisk: false, minYears: 1, note: ''
}, o || {});

const DEFAULT_TLDS = [
  // Core
  T('com', 'core', RDAP.verisignCom, [1850, 2050]),
  T('co.ke', 'core', RDAP.kenic, [1700, 1900], { note: 'For businesses in Kenya.' }),
  T('ke', 'core', RDAP.kenic, [4000, 4200]),
  T('africa', 'core', RDAP.africa, [2700, 2900]),
  T('org', 'core', RDAP.pir, [1950, 2150]),
  T('net', 'core', RDAP.verisignNet, [1900, 2100]),
  T('info', 'core', RDAP.identity, [1400, 1600], { premiumRisk: true }),
  T('biz', 'core', RDAP.biz, [1800, 2000], { premiumRisk: true }),
  // Off by default: no public registry lookup, so availability can't be confirmed automatically.
  T('co', 'core', null, [1700, 1900]),
  // Technology
  T('dev', 'tech', RDAP.google, [2050, 2250], { premiumRisk: true }),
  T('app', 'tech', RDAP.google, [2050, 2250], { premiumRisk: true }),
  T('ai', 'tech', RDAP.identity, [27000, 27200], { premiumRisk: true, periods: [2, 3, 5], minYears: 2, note: '.ai registrations start at 2 years.' }),
  T('cloud', 'tech', RDAP.cloud, [1400, 1600], { premiumRisk: true }),
  T('digital', 'tech', RDAP.identity, [1200, 1400], { premiumRisk: true }),
  T('io', 'tech', null, [7000, 7200]),
  // Off by default until you set a price in the admin
  T('tech', 'tech', RDAP.radix, null, { premiumRisk: true }),
  T('software', 'tech', RDAP.identity, null, { premiumRisk: true }),
  // Business & creative
  T('online', 'business', RDAP.radix, [1100, 1300], { premiumRisk: true }),
  T('agency', 'business', RDAP.identity, [1300, 1500], { premiumRisk: true }),
  T('design', 'business', RDAP.design, [7950, 8150], { premiumRisk: true }),
  T('consulting', 'business', RDAP.identity, [5250, 5450], { premiumRisk: true }),
  T('blog', 'business', RDAP.blog, [1050, 1250], { premiumRisk: true }),
  // GMO's RDAP server rate-limits cloud servers (HTTP 429 on every query, Oct 2026) → DNS only → off by default
  T('shop', 'business', RDAP.gmo, [900, 1100], { premiumRisk: true, method: 'dns' }),
  T('me', 'business', null, [2000, 2200]),
  T('site', 'business', RDAP.radix, null, { premiumRisk: true }),
  T('store', 'business', RDAP.radix, null, { premiumRisk: true }),
  T('solutions', 'business', RDAP.identity, null, { premiumRisk: true }),
  T('xyz', 'business', RDAP.xyz, null, { premiumRisk: true }),
  T('studio', 'business', RDAP.identity, null, { premiumRisk: true })
];

const CATEGORIES = { core: 'Core', tech: 'Technology', business: 'Business & creative' };

const DEFAULT_SETTINGS = {
  currency: 'KES',
  taxRate: 0,            // e.g. 0.16 once you charge VAT
  taxLabel: 'VAT',
  pricesIncludeTax: true,
  orderingEnabled: true,  // customers pay with M-Pesa straight away; switch off in the admin to pause sales
  paymentMethods: { mpesa: true, card: true }, // card needs PAYSTACK_SECRET_KEY
  supportEmail: 'hello@cielafrica.com',
  supportPhone: '+254 117 959 105',
  whatsapp: '254117959105'
};

function sourceName(base) { return SOURCE_NAMES[base] || 'Registry RDAP'; }

module.exports = { DEFAULT_TLDS, CATEGORIES, DEFAULT_SETTINGS, RDAP, sourceName };
