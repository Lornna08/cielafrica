/* ============================================================
   CIEL DOMAINS — registrar provider interface

   Today registrations are fulfilled by hand on Truehost, so the
   ManualRegistrar below only records what the admin does. When a
   reseller/registrar API is available later, implement the same
   methods (e.g. TruehostApiRegistrar) and select it with
   DOMAINS_REGISTRAR=<name>. The storefront, checkout, orders and
   admin dashboard call only these methods, so nothing else changes.

   Interface
     name                         string
     capabilities                 { availability, pricing, register, renew, transfer, dns }
     checkAvailability(domain)    → { state, premium?, price? }   (optional; RDAP is used otherwise)
     getPricing(tld)              → { register, renew, currency } (optional; catalogue is used otherwise)
     register(order)              → { ok, reference, expiresAt }  (manual: admin records it)
     renew(domain, years)         → { ok, reference }
     transfer(domain, authCode)   → { ok, reference }
     setNameservers(domain, ns[]) → { ok }
   ============================================================ */

const ManualRegistrar = {
  name: 'manual-truehost',
  capabilities: { availability: false, pricing: false, register: 'manual', renew: 'manual', transfer: 'manual', dns: 'manual' },
  async checkAvailability() { return null; },
  async getPricing() { return null; },
  async register() { return { ok: false, manual: true, message: 'Register on Truehost, then record the reference in the admin.' }; },
  async renew() { return { ok: false, manual: true }; },
  async transfer() { return { ok: false, manual: true }; },
  async setNameservers() { return { ok: false, manual: true }; }
};

const REGISTRARS = { 'manual-truehost': ManualRegistrar };

function getRegistrar() { return REGISTRARS[process.env.DOMAINS_REGISTRAR || 'manual-truehost'] || ManualRegistrar; }

module.exports = { getRegistrar, ManualRegistrar, REGISTRARS };
