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

  // ---- Website collection (auto-sliding rail + filters) ----
  const rail = $('#col-rail'), filters = $('#col-filters');
  if(rail && CIEL.templates){
    const cats = ['All', ...new Set(CIEL.templates.map(t=>t.category))].slice(0,10);
    let active = 'All';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = ()=>{
      const list = active==='All' ? CIEL.templates : CIEL.templates.filter(t=>t.category===active);
      const tiles = list.slice(0,12).map((t,i)=>CIEL.collectionTile(t,i)).join('');
      const canAuto = !reduce && list.length>=4 && active==='All';
      if(canAuto){
        // duplicate the set so the -50% loop is seamless
        rail.className = 'crail crail--auto';
        rail.innerHTML = `<div class="crail__track">${tiles}${tiles}</div>`;
        // tune duration to content width
        const track = rail.querySelector('.crail__track');
        requestAnimationFrame(()=>{ const w=track.scrollWidth/2; track.style.animationDuration = Math.max(24, w/22)+'s'; });
      } else {
        rail.className = 'crail';
        rail.innerHTML = tiles;
      }
      CIEL.io(rail);
    };
    if(filters){
      filters.innerHTML = cats.map((c,i)=>`<button class="cfilter${i===0?' active':''}" data-c="${CIEL.esc(c)}">${CIEL.esc(c)}</button>`).join('');
      filters.addEventListener('click', e=>{ const b=e.target.closest('.cfilter'); if(!b)return;
        filters.querySelectorAll('.cfilter').forEach(f=>f.classList.remove('active')); b.classList.add('active');
        active=b.dataset.c; draw(); rail.scrollLeft=0; });
    }
    // manual drag-to-scroll (works when not auto, and lets users nudge)
    let down=false,sx=0,sl=0;
    rail.addEventListener('pointerdown',e=>{ down=true; rail.classList.add('crail--dragging'); sx=e.clientX; sl=rail.scrollLeft; });
    addEventListener('pointerup',()=>{ down=false; rail.classList.remove('crail--dragging'); });
    rail.addEventListener('pointermove',e=>{ if(!down)return; rail.scrollLeft = sl-(e.clientX-sx); });
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
