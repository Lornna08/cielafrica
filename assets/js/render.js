/* ============================================================
   CIEL AFRICA — Render helpers v2
   ============================================================ */
window.CIEL = window.CIEL || {};

/* Website-preview placeholder: a stylized browser mock in the tile's palette.
   `light` variant for the paper collection section. Swap by setting item.image. */
CIEL.sitePreview = function(seed, light){
  const pal = light
    ? [['#eceae2','#ffffff','#c9c6bd'],['#e8ece9','#ffffff','#bcd0c6'],['#eae8ee','#ffffff','#c8c2d4'],['#efe9e4','#ffffff','#d6c6b8'],['#e6ebef','#ffffff','#c0ccd8']]
    : [['#0f1218','#171b22','#242a34'],['#0e1416','#141b1e','#22303050'],['#101018','#171724','#2a2a40'],['#0f1310','#161d17','#243024']];
  const [bg,card,acc] = pal[Math.abs(seed)%pal.length];
  const barTxt = light ? '#b9b6ad' : '#2a2e37';
  const line = light ? '#dcd9d0' : '#20242d';
  const block = light ? '#e0ddd4' : '#1b1f27';
  const accentBlocks = ['#2F6BFF','#57D9C4','#3DD68C','#E5A94E'][Math.abs(seed)%4];
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Website concept preview">
    <rect width="400" height="300" fill="${bg}"/>
    <rect x="0" y="0" width="400" height="26" fill="${card}"/>
    <circle cx="16" cy="13" r="3.5" fill="${barTxt}"/><circle cx="28" cy="13" r="3.5" fill="${barTxt}"/><circle cx="40" cy="13" r="3.5" fill="${barTxt}"/>
    <rect x="120" y="8" width="160" height="10" rx="5" fill="${block}"/>
    <rect x="24" y="46" width="150" height="16" rx="4" fill="${light?'#141519':'#e8e9ec'}" opacity="0.9"/>
    <rect x="24" y="70" width="120" height="16" rx="4" fill="${accentBlocks}" opacity="0.85"/>
    <rect x="24" y="102" width="180" height="7" rx="3.5" fill="${block}"/>
    <rect x="24" y="114" width="150" height="7" rx="3.5" fill="${block}"/>
    <rect x="24" y="140" width="70" height="22" rx="5" fill="${accentBlocks}" opacity="0.9"/>
    <rect x="250" y="46" width="126" height="120" rx="8" fill="${card}" stroke="${line}"/>
    <rect x="266" y="62" width="60" height="30" rx="4" fill="${accentBlocks}" opacity="0.3"/>
    <rect x="266" y="102" width="94" height="7" rx="3.5" fill="${block}"/>
    <rect x="266" y="114" width="70" height="7" rx="3.5" fill="${block}"/>
    ${[0,1,2].map(i=>`<rect x="${24+i*120}" y="196" width="110" height="80" rx="8" fill="${card}" stroke="${line}"/><rect x="${38+i*120}" y="210" width="30" height="30" rx="6" fill="${['#2F6BFF','#57D9C4','#3DD68C'][i]}" opacity="0.35"/><rect x="${38+i*120}" y="250" width="70" height="7" rx="3.5" fill="${block}"/><rect x="${38+i*120}" y="262" width="46" height="6" rx="3" fill="${block}"/>`).join('')}
  </svg>`;
};

CIEL.tileMedia = (item, seed, light) =>
  item.image ? `<img src="${CIEL.esc(item.image)}" alt="${CIEL.esc(item.name)} website concept" loading="lazy">` : CIEL.sitePreview(seed, light);

/* ---- Collection tile (light section, horizontal rail) ---- */
CIEL.collectionTile = function(t, i){
  return `<article class="ctile" data-io data-cat="${CIEL.esc(t.category)}">
    <div class="ctile__media">${CIEL.tileMedia(t,i,true)}
      <div class="ctile__preview">
        <a class="btn btn--sm" href="quote.html?template=${encodeURIComponent(t.name)}" style="background:#fff;color:#000;padding:0.6rem 1rem;border-radius:6px;font-size:0.82rem;font-weight:600">Customize this design</a>
        <a class="btn btn--sm" href="quote.html?template=${encodeURIComponent(t.name)}" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);padding:0.6rem 1rem;border-radius:6px;font-size:0.82rem;font-weight:600">Request a quote</a>
      </div>
    </div>
    <div class="ctile__meta"><div><span class="ctile__cat">${CIEL.esc(t.category)}</span><h4>${CIEL.esc(t.name)}</h4></div>
    <span class="ctile__price">from $${t.price}</span></div>
  </article>`;
};

/* ---- Generic gallery card (dark pages: templates.html, products.html) ---- */
CIEL.galleryCard = function(t, i, kind){
  const badges = [];
  if(t.new) badges.push('<span class="gbadge gbadge--new">New</span>');
  if(t.popular || t.badge==='popular') badges.push('<span class="gbadge gbadge--pop">Popular</span>');
  const link = kind==='product' ? `quote.html?product=${encodeURIComponent(t.name)}` : `quote.html?template=${encodeURIComponent(t.name)}`;
  const priceLabel = kind==='product' ? 'license' : 'starting';
  return `<article class="gcard" data-io data-cat="${CIEL.esc(t.category)}" data-name="${CIEL.esc(t.name.toLowerCase())}" data-price="${t.price}" data-new="${t.new?1:0}" data-pop="${(t.popular||t.badge==='popular')?1:0}">
    <div class="gcard__media">${CIEL.tileMedia(t,i,false)}<div class="gcard__badges">${badges.join('')}</div></div>
    <div class="gcard__body">
      <span class="gcard__cat">${CIEL.esc(t.category)}</span>
      <h4>${CIEL.esc(t.name)}</h4>
      <p>${CIEL.esc(t.desc)}</p>
      <div class="gcard__foot">
        <span class="gprice">$${t.price}<small>${priceLabel}</small></span>
        <a class="btn btn--dark" style="padding:0.55rem 1rem;font-size:0.82rem" href="${link}">${kind==='product'?'Get it':'Customize'}</a>
      </div>
    </div>
  </article>`;
};

/* ---- Work row (editorial) ---- */
CIEL.workRow = function(w, i){
  const media = w.image ? `<img src="${CIEL.esc(w.image)}" alt="${CIEL.esc(w.name)}" loading="lazy">` : CIEL.sitePreview(i+30,false);
  const n = String(i+1).padStart(2,'0');
  const tags = (w.technologies||[]).slice(0,3).map(t=>`<span class="wtag">${CIEL.esc(t)}</span>`).join('');
  return `<a class="wrow" href="work.html#${w.id}" data-io>
    <span class="wrow__n">${n}</span>
    <div class="wrow__main"><h3>${CIEL.esc(w.name)}</h3>
      <div class="wrow__tags"><span class="wtag" style="color:var(--cyan);border-color:rgba(87,217,196,0.3)">${CIEL.esc(w.industry)}</span>${tags}</div></div>
    <div class="wrow__thumb">${media}</div>
  </a>`;
};

/* ---- Product index row ---- */
CIEL.productRow = function(p){
  return `<a class="prow" href="quote.html?product=${encodeURIComponent(p.name)}" data-io>
    <span class="prow__name">${CIEL.esc(p.name)}</span>
    <span class="prow__cat">${CIEL.esc(p.category)}</span>
    <span class="prow__price">$${p.price}<small>one-time</small></span>
    <span class="prow__get">Get it</span>
  </a>`;
};

CIEL.techList = ["TypeScript","React","Next.js","Node.js","Laravel","PHP","Python","PostgreSQL","MySQL","Tailwind","WordPress","WooCommerce","Docker","Git","Figma","REST & APIs","AI / LLMs","Cloud"];
