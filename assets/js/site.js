/* ============================================================
   CIEL AFRICA — Site JS v2
   ============================================================ */
(function(){
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav shrink
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 20);
  onScroll(); addEventListener('scroll', onScroll, {passive:true});

  // Mobile menu
  const toggle = document.querySelector('.nav__toggle');
  if(toggle){
    toggle.addEventListener('click', ()=>{
      const open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open?'true':'false');
      document.body.style.overflow = open?'hidden':'';
    });
    document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>{
      document.body.classList.remove('menu-open'); document.body.style.overflow='';
    }));
  }

  // Reveal (one shared, deliberate)
  window.CIEL = window.CIEL || {};
  CIEL.io = function(root){
    const scope = root||document;
    // Hero content must be visible immediately on load — never wait for scroll.
    scope.querySelectorAll('.hero [data-io]:not(.vis)').forEach(e=>e.classList.add('vis'));

    const els = scope.querySelectorAll('[data-io]:not(.vis)');
    if(reduce || !('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('vis')); return; }
    const obs = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('vis'); obs.unobserve(e.target);} });
    }, {threshold:0.12, rootMargin:'0px 0px -6% 0px'});
    els.forEach(e=>obs.observe(e));

    // Safety net: anything still hidden shortly after load gets revealed,
    // so content can never be stuck invisible if the observer misfires.
    setTimeout(()=>{ scope.querySelectorAll('[data-io]:not(.vis)').forEach(e=>{
      const r=e.getBoundingClientRect();
      if(r.top < innerHeight*1.2) e.classList.add('vis');
    }); }, 700);
  };
  CIEL.io(document);

  // Year
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());


  // ---- Scroll restoration: return to the same spot on back / re-visit ----
  try{
    if('scrollRestoration' in history) history.scrollRestoration='manual';
    const KEY='ciel:scroll:'+location.pathname;
    const save=()=>{ try{ sessionStorage.setItem(KEY, String(scrollY)); }catch(e){} };
    // save on leaving / clicking internal links
    addEventListener('pagehide', save);
    addEventListener('beforeunload', save);
    let st; addEventListener('scroll', ()=>{ clearTimeout(st); st=setTimeout(save,150); }, {passive:true});
    // restore after layout settles
    const restore=()=>{ try{ const y=sessionStorage.getItem(KEY); if(y!==null){ const n=parseInt(y,10)||0; requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,n))); } }catch(e){} };
    if(document.readyState==='complete') restore(); else addEventListener('load', restore);
    // bfcache back button
    addEventListener('pageshow', e=>{ if(e.persisted) restore(); });
  }catch(e){}

  CIEL.fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
  CIEL.esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
})();
