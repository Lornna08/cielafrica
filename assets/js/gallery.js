/* ============================================================
   CIEL AFRICA — Gallery: filter, search, sort
   Works for templates, products and work pages.
   ============================================================ */
(function () {
  const root = document.querySelector('[data-gallery]');
  if (!root) return;

  const type = root.dataset.gallery; // 'templates' | 'products' | 'work'
  const grid = root.querySelector('[data-grid]');
  const filterBar = root.querySelector('[data-filters]');
  const searchInput = root.querySelector('[data-search]');
  const sortSelect = root.querySelector('[data-sort]');
  const countEl = root.querySelector('[data-count]');

  const dataMap = {
    templates: { items: CIEL.templates, cats: CIEL.templateCategories, card: CIEL.templateCard, gridClass: 'gallery' },
    products:  { items: CIEL.products, cats: CIEL.productCategories, card: CIEL.productCard, gridClass: 'gallery' },
    work:      { items: CIEL.work, cats: CIEL.workCategories, card: CIEL.workCard, gridClass: 'work-grid' }
  };
  const cfg = dataMap[type];
  if (!cfg) return;

  let activeCat = 'All';
  let query = '';
  let sort = 'featured';

  // Build filter chips
  if (filterBar) {
    filterBar.innerHTML = cfg.cats.map((c, i) =>
      `<button class="filter${i === 0 ? ' active' : ''}" data-cat="${CIEL.escapeHtml(c)}">${CIEL.escapeHtml(c)}</button>`
    ).join('');
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      filterBar.querySelectorAll('.filter').forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.dataset.cat;
      render();
    });
  }

  if (searchInput) searchInput.addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); render(); });
  if (sortSelect) sortSelect.addEventListener('change', (e) => { sort = e.target.value; render(); });

  function filtered() {
    let list = cfg.items.filter(it => {
      const catOk = activeCat === 'All' || it.category === activeCat;
      const hay = (it.name + ' ' + (it.desc || '') + ' ' + (it.category || '') + ' ' + (it.industry || '')).toLowerCase();
      const qOk = !query || hay.includes(query);
      return catOk && qOk;
    });
    if (sort === 'price-low') list = list.slice().sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sort === 'price-high') list = list.slice().sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sort === 'name') list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'new') list = list.slice().sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
    else if (sort === 'popular') list = list.slice().sort((a, b) => ((b.popular || b.badge === 'popular') ? 1 : 0) - ((a.popular || a.badge === 'popular') ? 1 : 0));
    return list;
  }

  function render() {
    const list = filtered();
    grid.innerHTML = list.length
      ? list.map((it, i) => cfg.card(it, i)).join('')
      : `<div class="card" style="grid-column:1/-1;text-align:center;padding:3rem">
           <h3 style="margin-bottom:0.5rem">Nothing matches yet</h3>
           <p style="margin:0 auto">Try a different category or search term.</p>
         </div>`;
    if (countEl) countEl.textContent = `${list.length} ${list.length === 1 ? 'result' : 'results'}`;
    CIEL.observeReveals(grid);
  }

  render();
})();
