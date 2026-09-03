/* ============================================================
   CIEL AFRICA — Shared render helpers (cards for teasers/galleries)
   ============================================================ */
window.CIEL = window.CIEL || {};

/* Placeholder media: an inline SVG gradient so cards look intentional
   before real images are added. When you set an item's `image`, it wins. */
CIEL.placeholderMedia = function (label, seed) {
  const hues = [
    ['#132038', '#0b1120'], ['#141b33', '#0c1526'], ['#101d31', '#0a1220'],
    ['#161a2e', '#0b1020'], ['#0f2036', '#0a141f']
  ];
  const [a, b] = hues[Math.abs(seed) % hues.length];
  const t = CIEL.escapeHtml(label || 'Ciel Africa');
  return `<svg viewBox="0 0 400 275" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${t} preview placeholder">
    <defs><linearGradient id="g${seed}" x1="0" y1="0" x2="400" y2="275" gradientUnits="userSpaceOnUse">
      <stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="400" height="275" fill="url(#g${seed})"/>
    <g opacity="0.5" stroke="#24304B" stroke-width="1">
      <rect x="28" y="30" width="344" height="26" rx="6" fill="#0f1830"/>
      <rect x="28" y="72" width="150" height="150" rx="8" fill="#0f1830"/>
      <rect x="192" y="72" width="180" height="70" rx="8" fill="#0f1830"/>
      <rect x="192" y="152" width="180" height="70" rx="8" fill="#0f1830"/>
    </g>
    <circle cx="352" cy="43" r="4" fill="#5EEAD4"/>
    <text x="28" y="255" fill="#3D7EFF" font-family="sans-serif" font-size="13" font-weight="600" opacity="0.9">${t}</text>
  </svg>`;
};

CIEL.mediaFor = function (item, idx) {
  if (item.image) return `<img src="${CIEL.escapeHtml(item.image)}" alt="${CIEL.escapeHtml(item.name)} preview" loading="lazy">`;
  return CIEL.placeholderMedia(item.name, idx);
};

CIEL.iconHeart = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.5-9.5-8.5C1 8 3 4.5 6.5 4.5 8.6 4.5 10 6 12 8c2-2 3.4-3.5 5.5-3.5C21 4.5 23 8 21.5 11.5 19 15.5 12 20 12 20z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
CIEL.iconEye = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>`;
CIEL.arrow = `<svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* Template card */
CIEL.templateCard = function (t, i) {
  const badges = [];
  if (t.new) badges.push('<span class="badge badge--new">New</span>');
  if (t.popular) badges.push('<span class="badge badge--hot">Popular</span>');
  return `<article class="tpl" data-reveal data-cat="${CIEL.escapeHtml(t.category)}" data-name="${CIEL.escapeHtml(t.name.toLowerCase())}" data-new="${t.new?1:0}" data-pop="${t.popular?1:0}" data-price="${t.price}">
    <div class="tpl__media">${CIEL.mediaFor(t, i)}<div class="tpl__badges">${badges.join('')}</div></div>
    <div class="tpl__body">
      <span class="tpl__cat">${CIEL.escapeHtml(t.category)}</span>
      <h4>${CIEL.escapeHtml(t.name)}</h4>
      <p>${CIEL.escapeHtml(t.desc)}</p>
      <p class="muted" style="font-size:0.8rem">Ideal for: ${CIEL.escapeHtml(t.idealFor)}</p>
      <div class="tpl__meta">
        <div class="tpl__price"><span>Starting from</span>$${t.price}</div>
        <div class="tpl__actions">
          <a class="icon-btn" href="quote.html?template=${encodeURIComponent(t.name)}" title="Customize this design">${CIEL.iconEye}</a>
          <a class="btn btn--sm" href="quote.html?template=${encodeURIComponent(t.name)}">Customize</a>
        </div>
      </div>
    </div>
  </article>`;
};

/* Product card */
CIEL.productCard = function (p, i) {
  let badge = '';
  if (p.badge === 'new') badge = '<span class="badge badge--new">New</span>';
  if (p.badge === 'popular') badge = '<span class="badge badge--hot">Popular</span>';
  const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));
  return `<article class="tpl" data-reveal data-cat="${CIEL.escapeHtml(p.category)}" data-name="${CIEL.escapeHtml(p.name.toLowerCase())}" data-price="${p.price}">
    <div class="tpl__media">${CIEL.mediaFor(p, i + 40)}<div class="tpl__badges">${badge}</div></div>
    <div class="tpl__body">
      <span class="tpl__cat">${CIEL.escapeHtml(p.category)}</span>
      <h4>${CIEL.escapeHtml(p.name)}</h4>
      <p>${CIEL.escapeHtml(p.desc)}</p>
      <div style="color:#5EEAD4;font-size:0.85rem;letter-spacing:2px">${stars} <span class="muted" style="letter-spacing:0">${p.rating.toFixed(1)}</span></div>
      <div class="tpl__meta">
        <div class="tpl__price">$${p.price}<span>one-time license</span></div>
        <div class="tpl__actions">
          <button class="icon-btn" title="Add to wishlist">${CIEL.iconHeart}</button>
          <a class="btn btn--sm" href="quote.html?product=${encodeURIComponent(p.name)}">Get it</a>
        </div>
      </div>
    </div>
  </article>`;
};

/* Work card */
CIEL.workCard = function (w, i) {
  const media = w.image ? `<img src="${CIEL.escapeHtml(w.image)}" alt="${CIEL.escapeHtml(w.name)}" loading="lazy">` : CIEL.placeholderMedia(w.name, i + 20);
  return `<a class="work" href="work.html#${w.id}" data-reveal data-cat="${CIEL.escapeHtml(w.category)}">
    ${media}
    <div class="work__overlay">
      <span class="work__cat">${CIEL.escapeHtml(w.category)} · ${CIEL.escapeHtml(w.industry)}</span>
      <h3>${CIEL.escapeHtml(w.name)}</h3>
      <span class="link-arrow">View case study ${CIEL.arrow}</span>
    </div>
  </a>`;
};

/* Post card */
CIEL.postCard = function (p, i) {
  const media = p.image ? `<img src="${CIEL.escapeHtml(p.image)}" alt="${CIEL.escapeHtml(p.title)}" loading="lazy">` : CIEL.placeholderMedia(p.cat, i + 60);
  return `<a class="post" href="insights.html#${p.id}" data-reveal>
    <div class="post__media">${media}</div>
    <span class="post__cat">${CIEL.escapeHtml(p.cat)}</span>
    <h4>${CIEL.escapeHtml(p.title)}</h4>
    <span class="post__meta">${CIEL.escapeHtml(p.date)} · ${CIEL.escapeHtml(p.read)} read</span>
  </a>`;
};

CIEL.techList = ["HTML","CSS","JavaScript","TypeScript","PHP","Laravel","React","Next.js","Node.js","Python","WordPress","WooCommerce","MySQL","PostgreSQL","Tailwind CSS","Docker","Git","GitHub","Figma","REST & APIs","AI / LLMs","Cloud"];
CIEL.techChips = function () {
  return CIEL.techList.map(t => `<span class="tech-chip"><span class="dot"></span>${CIEL.escapeHtml(t)}</span>`).join('');
};

/* Re-run reveal observer on injected nodes */
CIEL.observeReveals = function (root) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = (root || document).querySelectorAll('[data-reveal]:not(.in)');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
};
