/* CIEL DOMAINS — price calculation (integer KES, no floating money) */

/**
 * quote(tldCfg, years, settings, label)
 * Registration for N years = first-year price + renewal price × (N − 1).
 * Renewals after the paid term are charged separately later.
 */
function quote(t, years, settings, label) {
  years = Number(years);
  if (!t || !t.enabled) return { ok: false, code: 'tld', message: 'We don’t offer this extension right now.' };
  if (!Number.isInteger(years) || !t.periods.includes(years)) return { ok: false, code: 'years', message: 'Choose a registration term of ' + t.periods.join(', ') + ' year(s).' };
  const reasons = [];
  if (t.verifyBeforePayment) reasons.push('extension');
  if (t.register == null || t.renew == null) reasons.push('price');
  const priced = t.register != null && t.renew != null;
  const subtotal = priced ? t.register + t.renew * (years - 1) : null;
  const rate = Number(settings.taxRate) || 0;
  let tax = 0, total = subtotal;
  if (priced && rate > 0) {
    if (settings.pricesIncludeTax) tax = Math.round(subtotal - subtotal / (1 + rate));
    else { tax = Math.round(subtotal * rate); total = subtotal + tax; }
  }
  return {
    ok: true, currency: settings.currency || 'KES', years,
    firstYear: t.register, renewal: t.renew, subtotal, tax, total,
    tax_rate: rate, tax_label: settings.taxLabel, tax_included: !!settings.pricesIncludeTax,
    priced, verifyBeforePayment: reasons.length > 0, verifyReasons: reasons
  };
}

function fmt(n, cur) { return n == null ? 'On request' : (cur || 'KES') + ' ' + Number(n).toLocaleString('en-KE'); }

module.exports = { quote, fmt };
