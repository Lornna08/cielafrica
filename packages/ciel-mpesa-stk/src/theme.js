'use strict';
/**
 * Checkout theme: the visual settings of public/checkout.html.
 * The same JSON is exported by the "Make it yours" playground on cielafrica.com,
 * so a theme you design there can be saved as theme.json and used as-is.
 * Only appearance lives here: never put credentials or amounts in a theme.
 */
const DEFAULT_THEME = Object.freeze({
  version: 1,
  merchantName: 'Your Store',
  mode: 'light',
  colors: Object.freeze({ primary: '#141414', accent: '#FF5A1F', background: '#F4F2EE', button: '#1F9D55', buttonText: '#FFFFFF' }),
  radius: 12,
  buttonStyle: 'solid',
  font: 'system',
  layout: 'card'
});

const ENUMS = { mode: ['light', 'dark'], buttonStyle: ['solid', 'outline', 'pill'], font: ['system', 'rounded', 'serif', 'mono'], layout: ['card', 'split', 'compact'] };
const FONT_STACKS = {
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", "Iowan Old Style", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
};
const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

/**
 * Returns a complete, safe theme. Unknown keys are dropped and invalid values fall
 * back to the default, with a list of what was ignored.
 */
function validateTheme(input) {
  const t = JSON.parse(JSON.stringify(DEFAULT_THEME));
  const problems = [];
  const src = input && typeof input === 'object' ? input : {};
  if (src.merchantName != null) {
    const n = String(src.merchantName).replace(/[<>]/g, '').trim().slice(0, 40);
    if (n) t.merchantName = n; else problems.push('merchantName');
  }
  for (const k of Object.keys(ENUMS)) {
    if (src[k] == null) continue;
    if (ENUMS[k].includes(src[k])) t[k] = src[k]; else problems.push(k);
  }
  if (src.radius != null) {
    const r = Number(src.radius);
    if (Number.isFinite(r) && r >= 0 && r <= 28) t.radius = Math.round(r); else problems.push('radius');
  }
  const c = src.colors && typeof src.colors === 'object' ? src.colors : {};
  for (const k of Object.keys(DEFAULT_THEME.colors)) {
    if (c[k] == null) continue;
    if (HEX.test(String(c[k]))) t.colors[k] = String(c[k]).toUpperCase(); else problems.push('colors.' + k);
  }
  return { theme: t, problems };
}

/** CSS custom properties consumed by public/checkout.css */
function themeToCssVars(theme) {
  const t = validateTheme(theme).theme;
  const dark = t.mode === 'dark';
  return {
    '--cm-primary': t.colors.primary,
    '--cm-accent': t.colors.accent,
    '--cm-bg': t.colors.background,
    '--cm-surface': dark ? '#16191E' : '#FFFFFF',
    '--cm-text': dark ? '#F1F2F4' : '#16181B',
    '--cm-muted': dark ? '#9AA1AB' : '#6B6F76',
    '--cm-line': dark ? '#2A2F37' : '#E4E1DA',
    '--cm-btn': t.colors.button,
    '--cm-btn-text': t.colors.buttonText,
    '--cm-radius': t.radius + 'px',
    '--cm-btn-radius': t.buttonStyle === 'pill' ? '999px' : t.radius + 'px',
    '--cm-font': FONT_STACKS[t.font]
  };
}

module.exports = { DEFAULT_THEME, validateTheme, themeToCssVars, FONT_STACKS, ENUMS };
