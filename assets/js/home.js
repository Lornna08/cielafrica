/* Home page population + interactions */
(function(){
  const $ = s => document.querySelector(s);

  // ---- Software showcase (desktop tabs + mobile inline dashboards) ----
  const list = $('#sc-list'), canvas = $('#sc-canvas'), url = $('#sc-url');
  const frameFor = (id)=>`<div class="sc-inline"><div class="sc-inline__bar"><span></span><span></span><span></span><em class="mono">app.ciel/${id}</em></div><div class="sc-inline__canvas"><svg viewBox="0 0 800 525" preserveAspectRatio="xMidYMid meet">${CIEL.mockups[id]||''}</svg></div></div>`;
  if(list && CIEL.showcase){
    list.innerHTML = CIEL.showcase.map((s,i)=>`
      <div class="sc-item" role="tab" tabindex="0" data-id="${s.id}" aria-selected="${i===0?'true':'false'}" aria-expanded="${i===0?'true':'false'}">
        <div class="sc-item__row"><h3>${CIEL.esc(s.label)}</h3><span class="sc-item__n">${String(i+1).padStart(2,'0')}</span></div>
        <p>${CIEL.esc(s.blurb)}</p>
        <div class="sc-item__mobile">${frameFor(s.id)}</div>
      </div>`).join('');

    const render = (id)=>{
      if(canvas) canvas.innerHTML = `<svg viewBox="0 0 800 525" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${CIEL.mockups[id]||''}</svg>`;
      if(url) url.textContent = 'app.ciel/' + id;
    };
    const items=[...list.querySelectorAll('.sc-item')];
    const selectDesktop = (el)=>{ items.forEach(i=>i.setAttribute('aria-selected','false')); el.setAttribute('aria-selected','true'); render(el.dataset.id); };
    const isTouch = ()=> matchMedia('(max-width:1000px)').matches;
    items.forEach(el=>{
      el.addEventListener('mouseenter', ()=>{ if(!isTouch()) selectDesktop(el); });
      el.addEventListener('click', ()=>{
        if(isTouch()){
          const open = el.getAttribute('aria-expanded')==='true';
          el.setAttribute('aria-expanded', open?'false':'true');
          el.setAttribute('aria-selected', open?'false':'true');
        } else selectDesktop(el);
      });
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.click(); } });
    });
    render(CIEL.showcase[0].id);
  }

  // ---- Website collection (JS auto-slide + swipe/drag, filters) ----
  const rail = $('#col-rail'), filters = $('#col-filters');
  if(rail && CIEL.templates){
    const cats = ['All', ...new Set(CIEL.templates.map(t=>t.category))].slice(0,10);
    let active='All';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let track=null, half=0, offset=0, raf=0, paused=false, dragging=false, startX=0, startOff=0, lastT=0, resumeTimer=0;

    const loop = (t)=>{
      if(!track){ return; }
      if(!lastT) lastT=t;
      const dt=(t-lastT)/1000; lastT=t;
      if(!paused && !dragging){ offset -= dt*38; }        // ~38px/sec auto-scroll
      if(offset <= -half) offset += half;                  // seamless wrap
      if(offset > 0) offset -= half;
      track.style.transform = `translate3d(${offset}px,0,0)`;
      raf=requestAnimationFrame(loop);
    };

    const draw = ()=>{
      cancelAnimationFrame(raf); lastT=0; offset=0;
      const list = active==='All' ? CIEL.templates : CIEL.templates.filter(t=>t.category===active);
      const tiles = list.slice(0,12).map((t,i)=>CIEL.collectionTile(t,i)).join('');
      const canAuto = !reduce && list.length>=3;
      if(canAuto){
        rail.className='crail crail--js';
        rail.innerHTML=`<div class="crail__track">${tiles}${tiles}</div>`;
        track=rail.querySelector('.crail__track');
        requestAnimationFrame(()=>{ half=track.scrollWidth/2; raf=requestAnimationFrame(loop); });
      } else {
        rail.className='crail'; rail.innerHTML=tiles; track=null;
      }
      CIEL.io(rail);
    };

    // pause on hover (desktop)
    rail.addEventListener('mouseenter',()=>{ if(track) paused=true; });
    rail.addEventListener('mouseleave',()=>{ if(track && !dragging) paused=false; });

    // swipe / drag (touch + mouse) — works both directions
    const down=(x)=>{ if(!track)return; dragging=true; paused=true; startX=x; startOff=offset; rail.classList.add('crail--grab'); clearTimeout(resumeTimer); };
    const move=(x)=>{ if(!dragging||!track)return; offset = startOff + (x-startX); };
    const up=()=>{ if(!dragging)return; dragging=false; rail.classList.remove('crail--grab'); resumeTimer=setTimeout(()=>{ paused=false; },1200); };
    rail.addEventListener('pointerdown',e=>{ down(e.clientX); });
    addEventListener('pointermove',e=>{ if(dragging){ e.preventDefault(); move(e.clientX);} }, {passive:false});
    addEventListener('pointerup',up);
    // touch fallbacks
    rail.addEventListener('touchstart',e=>{ down(e.touches[0].clientX); }, {passive:true});
    rail.addEventListener('touchmove',e=>{ move(e.touches[0].clientX); }, {passive:true});
    rail.addEventListener('touchend',up);

    if(filters){
      filters.innerHTML = cats.map((c,i)=>`<button class="cfilter${i===0?' active':''}" data-c="${CIEL.esc(c)}">${CIEL.esc(c)}</button>`).join('');
      filters.addEventListener('click', e=>{ const b=e.target.closest('.cfilter'); if(!b)return;
        filters.querySelectorAll('.cfilter').forEach(f=>f.classList.remove('active')); b.classList.add('active');
        active=b.dataset.c; draw(); });
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
