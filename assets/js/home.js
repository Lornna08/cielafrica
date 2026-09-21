/* Home page population + interactions */
(function(){
  const $ = s => document.querySelector(s);

  // ---- Software showcase (tabs) ----
  const list = $('#sc-list'), canvas = $('#sc-canvas'), url = $('#sc-url');
  if(list && CIEL.showcase){
    list.innerHTML = CIEL.showcase.map((s,i)=>`
      <div class="sc-item" role="tab" tabindex="0" data-id="${s.id}" aria-selected="${i===0?'true':'false'}">
        <div class="sc-item__row"><h3>${CIEL.esc(s.label)}</h3><span class="sc-item__n">${String(i+1).padStart(2,'0')}</span></div>
        <p>${CIEL.esc(s.blurb)}</p>
      </div>`).join('');

    const render = (id)=>{
      canvas.innerHTML = `<svg viewBox="0 0 800 525" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${CIEL.mockups[id]||''}</svg>`;
      if(url) url.textContent = 'app.ciel/' + id;
    };
    const select = (el)=>{
      list.querySelectorAll('.sc-item').forEach(i=>i.setAttribute('aria-selected','false'));
      el.setAttribute('aria-selected','true');
      render(el.dataset.id);
    };
    list.querySelectorAll('.sc-item').forEach(el=>{
      el.addEventListener('mouseenter', ()=>select(el));
      el.addEventListener('click', ()=>select(el));
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); select(el);} });
    });
    render(CIEL.showcase[0].id);
  }

  // ---- Website collection (light rail + filters) ----
  const rail = $('#col-rail'), filters = $('#col-filters');
  if(rail && CIEL.templates){
    const cats = ['All', ...new Set(CIEL.templates.map(t=>t.category))].slice(0,10);
    let active = 'All';
    const draw = ()=>{
      const list = active==='All' ? CIEL.templates : CIEL.templates.filter(t=>t.category===active);
      rail.innerHTML = list.slice(0,12).map((t,i)=>CIEL.collectionTile(t,i)).join('');
      CIEL.io(rail);
    };
    if(filters){
      filters.innerHTML = cats.map((c,i)=>`<button class="cfilter${i===0?' active':''}" data-c="${CIEL.esc(c)}">${CIEL.esc(c)}</button>`).join('');
      filters.addEventListener('click', e=>{ const b=e.target.closest('.cfilter'); if(!b)return;
        filters.querySelectorAll('.cfilter').forEach(f=>f.classList.remove('active')); b.classList.add('active');
        active=b.dataset.c; draw(); rail.scrollLeft=0; });
    }
    draw();
  }

  // ---- Selected work (rows) ----
  const wrows = $('#work-rows');
  if(wrows && CIEL.work) wrows.innerHTML = CIEL.work.slice(0,5).map((w,i)=>CIEL.workRow(w,i)).join('');

  // ---- Products (index) ----
  const pidx = $('#prod-index');
  if(pidx && CIEL.products) pidx.innerHTML = CIEL.products.slice(0,6).map(p=>CIEL.productRow(p)).join('');

  CIEL.io(document);
})();
