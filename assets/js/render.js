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

CIEL.tileMedia = (item, seed, light) => {
  if (item.image) return `<img src="${CIEL.esc(item.image)}" alt="${CIEL.esc(item.name)} website concept" loading="lazy">`;
  // Prefer the clean, category-specific landing-page preview
  if (CIEL.previewByCategory && item.category && CIEL.previewByCategory[item.category])
    return CIEL.previewByCategory[item.category];
  if (CIEL.templatePreview) return CIEL.templatePreview(item);
  return CIEL.sitePreview(seed, light);
};

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
    <span class="ctile__price">from KES ${CIEL.esc(CIEL.fmt(t.price))}</span></div>
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
    <div class="gcard__media">${kind==='product' && CIEL.productPreview ? (t.image?`<img src="${CIEL.esc(t.image)}" alt="${CIEL.esc(t.name)}" loading="lazy">`:CIEL.productPreview(t)) : CIEL.tileMedia(t,i,false)}<div class="gcard__badges">${badges.join('')}</div></div>
    <div class="gcard__body">
      <span class="gcard__cat">${CIEL.esc(t.category)}</span>
      <h4>${CIEL.esc(t.name)}</h4>
      <p>${CIEL.esc(t.desc)}</p>
      <div class="gcard__foot">
        <span class="gprice">KES ${CIEL.esc(CIEL.fmt(t.price))}<small>${priceLabel}</small></span>
        <a class="btn btn--dark" style="padding:0.55rem 1rem;font-size:0.82rem" href="${link}">${kind==='product'?'Get it':'Customize'}</a>
      </div>
    </div>
  </article>`;
};

/* ---- Work row (editorial) ---- */
CIEL.workRow = function(w, i){
  const media = w.image ? `<img src="${CIEL.esc(w.image)}" alt="${CIEL.esc(w.name)}" loading="lazy">` : w.mockup && CIEL.mockups[w.mockup]
    ? `<div class="wrow__frame"><span class="wrow__frame-bar"><i></i><i></i><i></i></span><div class="wrow__frame-canvas"><svg viewBox="0 0 800 525" preserveAspectRatio="xMidYMid slice">${CIEL.mockups[w.mockup]}</svg></div></div>`
    : (w.image ? `<img src="${CIEL.esc(w.image)}" alt="${CIEL.esc(w.name)}" loading="lazy">` : CIEL.sitePreview(i+30,false));
  const n = String(i+1).padStart(2,'0');
  const tags = (w.technologies||[]).slice(0,3).map(t=>`<span class="wtag">${CIEL.esc(t)}</span>`).join('');
  return `<a class="wrow" href="work.html#${w.id}" data-io>
    <span class="wrow__n">${n}</span>
    <div class="wrow__main"><h3>${CIEL.esc(w.name)}</h3>
      <p class="wrow__desc">${CIEL.esc(w.short||'')}</p>
      <div class="wrow__tags"><span class="wtag" style="color:var(--cyan);border-color:rgba(87,217,196,0.3)">${CIEL.esc(w.industry)}</span>${tags}</div></div>
    <div class="wrow__thumb">${media}</div>
  </a>`;
};

/* ---- Product index row ---- */
CIEL.productRow = function(p){
  return `<a class="prow" href="quote.html?product=${encodeURIComponent(p.name)}" data-io>
    <span class="prow__main"><span class="prow__name">${CIEL.esc(p.name)}</span><span class="prow__meta">${CIEL.esc(p.meta||p.desc||'')}</span></span>
    <span class="prow__cat">${CIEL.esc(p.category)}</span>
    <span class="prow__price">KES ${CIEL.esc(CIEL.fmt(p.price))}<small>one-time</small></span>
    <span class="prow__get">Get it</span>
  </a>`;
};

CIEL.techList = ["TypeScript","React","Next.js","Node.js","Laravel","PHP","Python","PostgreSQL","MySQL","Tailwind","WordPress","WooCommerce","Docker","Git","Figma","REST & APIs","AI / LLMs","Cloud"];


/* ---- browser-framed real UI (reuses .sc-frame styling) ---- */
CIEL.mockupFrame = function(key, url, alt){
  const svg = CIEL.mockups[key] || CIEL.mockups[alt] || '';
  return `<div class="sc-frame">
    <div class="sc-frame__bar"><span class="sc-frame__dot"></span><span class="sc-frame__dot"></span><span class="sc-frame__dot"></span><span class="sc-frame__url">${CIEL.esc(url||('app.ciel/'+key))}</span></div>
    <div class="sc-canvas"><svg viewBox="0 0 800 525" preserveAspectRatio="xMidYMid meet">${svg}</svg></div>
  </div>`;
};

/* ---- work gallery card (work.html grid) — shows the real UI ---- */
CIEL.workCard = function(w, i){
  const media = w.image ? `<img src="${CIEL.esc(w.image)}" alt="${CIEL.esc(w.name)}" loading="lazy">` : w.mockup && CIEL.mockups[w.mockup]
    ? `<div class="wcard__ui"><span class="wcard__bar"><i></i><i></i><i></i></span><div class="wcard__canvas"><svg viewBox="0 0 800 525" preserveAspectRatio="xMidYMid slice">${CIEL.mockups[w.mockup]}</svg></div></div>`
    : (w.image ? `<img src="${CIEL.esc(w.image)}" alt="${CIEL.esc(w.name)}" loading="lazy">` : CIEL.sitePreview(i+30,false));
  const tags = (w.technologies||[]).slice(0,4).map(t=>`<span class="wtag">${CIEL.esc(t)}</span>`).join('');
  return `<a class="wcard" href="work.html#${w.id}" data-io data-cat="${CIEL.esc(w.category)}" data-name="${CIEL.esc((w.name+' '+w.industry).toLowerCase())}">
    <div class="wcard__media">${media}</div>
    <div class="wcard__body">
      <div class="wcard__meta"><span class="wcard__cat">${CIEL.esc(w.category)}</span><span class="wcard__ind">${CIEL.esc(w.industry)}</span></div>
      <h3>${CIEL.esc(w.name)}</h3>
      <p>${CIEL.esc(w.short||'')}</p>
      <div class="wcard__tags">${tags}</div>
      <span class="wcard__view">View case study</span>
    </div>
  </a>`;
};

/* ---- full case study (work.html detail) ---- */
CIEL.caseStudy = function(w, i){
  const techs = (w.technologies||[]).map(t=>`<span class="cs-chip">${CIEL.esc(t)}</span>`).join('');
  const servs = (w.services||[]).map(s=>`<li>${CIEL.esc(s)}</li>`).join('');
  const results = (w.results||[]).map((r,k)=>`<div class="cs-result"><span class="cs-result__n">${String(k+1).padStart(2,'0')}</span><p>${CIEL.esc(r)}</p></div>`).join('');
  const n = String(i+1).padStart(2,'0');
  return `<article class="cs" id="${w.id}">
    <div class="cs__head" data-io>
      <span class="kicker">${n} / ${CIEL.esc(w.category)}</span>
      <h2>${CIEL.esc(w.name)}</h2>
      <p class="lede" style="max-width:44ch">${CIEL.esc(w.short||'')}</p>
      <div class="cs__facts">
        <div><span class="cs__k">Industry</span><span class="cs__v">${CIEL.esc(w.industry)}</span></div>
        <div><span class="cs__k">Stage</span><span class="cs__v">${CIEL.esc(w.year||'Concept')}</span></div>
        <div><span class="cs__k">Services</span><span class="cs__v">${CIEL.esc((w.services||[]).join(' · '))}</span></div>
      </div>
    </div>
    <div class="cs__shot" data-io>${CIEL.mockupFrame(w.mockup, 'app.ciel/'+w.id)}</div>
    <div class="cs__grid">
      <div class="cs__col" data-io>
        <h4>Overview</h4><p class="copy">${CIEL.esc(w.overview||w.short||'')}</p>
        <h4 style="margin-top:1.8rem">The challenge</h4><p class="copy">${CIEL.esc(w.challenge||'')}</p>
        <h4 style="margin-top:1.8rem">What we built</h4><p class="copy">${CIEL.esc(w.solution||'')}</p>
      </div>
      <aside class="cs__aside" data-io>
        <h4>Built with</h4><div class="cs-chips">${techs}</div>
        <h4 style="margin-top:1.8rem">Services</h4><ul class="cs-list">${servs}</ul>
      </aside>
    </div>
    <div class="cs__results" data-io>
      <h4>Outcome</h4>
      <div class="cs__results-row">${results}</div>
    </div>
    ${w.mockupAlt && CIEL.mockups[w.mockupAlt] ? `<div class="cs__shot cs__shot--alt" data-io>${CIEL.mockupFrame(w.mockupAlt,'app.ciel/'+w.id+'/reports')}</div>`:''}
    <div class="cs__cta" data-io>
      <p class="copy" style="margin:0">Want something like ${CIEL.esc(w.name)} for your business?</p>
      <a href="quote.html?service=${encodeURIComponent(w.category)}" class="btn">Start a project like this</a>
    </div>
  </article>`;
};
