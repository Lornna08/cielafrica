/* ============================================================
   CIEL AFRICA — Gallery (templates / products / work pages) v2
   ============================================================ */
(function(){
  const root = document.querySelector('[data-gallery]');
  if(!root) return;
  const type = root.dataset.gallery;
  const grid = root.querySelector('[data-grid]');
  const filterBar = root.querySelector('[data-filters]');
  const searchInput = root.querySelector('[data-search]');
  const sortSelect = root.querySelector('[data-sort]');
  const countEl = root.querySelector('[data-count]');

  const cfg = {
    templates:{ items:CIEL.templates, cats:CIEL.templateCategories, card:(t,i)=>CIEL.galleryCard(t,i,'template'), grid:'ggrid' },
    products:{  items:CIEL.products,  cats:CIEL.productCategories,  card:(t,i)=>CIEL.galleryCard(t,i,'product'),  grid:'ggrid' },
    work:{      items:CIEL.work,      cats:CIEL.workCategories,     card:(t,i)=>CIEL.workRow(t,i),                 grid:'' }
  }[type];
  if(!cfg) return;

  let activeCat='All', query='', sort='featured';

  if(filterBar){
    filterBar.innerHTML = cfg.cats.map((c,i)=>`<button class="gfilter${i===0?' active':''}" data-c="${CIEL.esc(c)}">${CIEL.esc(c)}</button>`).join('');
    filterBar.addEventListener('click',e=>{ const b=e.target.closest('.gfilter'); if(!b)return;
      filterBar.querySelectorAll('.gfilter').forEach(f=>f.classList.remove('active')); b.classList.add('active'); activeCat=b.dataset.c; render(); });
  }
  if(searchInput) searchInput.addEventListener('input',e=>{ query=e.target.value.trim().toLowerCase(); render(); });
  if(sortSelect) sortSelect.addEventListener('change',e=>{ sort=e.target.value; render(); });

  function filtered(){
    let list = cfg.items.filter(it=>{
      const catOk = activeCat==='All' || it.category===activeCat;
      const hay = (it.name+' '+(it.desc||'')+' '+(it.category||'')+' '+(it.industry||'')).toLowerCase();
      return catOk && (!query || hay.includes(query));
    });
    if(sort==='price-low') list=list.slice().sort((a,b)=>(a.price||0)-(b.price||0));
    else if(sort==='price-high') list=list.slice().sort((a,b)=>(b.price||0)-(a.price||0));
    else if(sort==='name') list=list.slice().sort((a,b)=>a.name.localeCompare(b.name));
    else if(sort==='new') list=list.slice().sort((a,b)=>(b.new?1:0)-(a.new?1:0));
    else if(sort==='popular') list=list.slice().sort((a,b)=>((b.popular||b.badge==='popular')?1:0)-((a.popular||a.badge==='popular')?1:0));
    return list;
  }
  function render(){
    const list=filtered();
    grid.innerHTML = list.length ? list.map((it,i)=>cfg.card(it,i)).join('')
      : `<div style="grid-column:1/-1;padding:3rem;text-align:center;border:1px solid var(--line);border-radius:12px"><h3 style="margin-bottom:0.5rem">Nothing matches yet</h3><p class="copy" style="margin:0 auto">Try a different category or search term.</p></div>`;
    if(countEl) countEl.textContent = `${list.length} ${list.length===1?'result':'results'}`;
    CIEL.io(grid);
  }
  render();
})();
