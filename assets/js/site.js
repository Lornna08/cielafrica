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
    const els = (root||document).querySelectorAll('[data-io]:not(.vis)');
    if(reduce || !('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('vis')); return; }
    const obs = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('vis'); obs.unobserve(e.target);} });
    }, {threshold:0.12, rootMargin:'0px 0px -6% 0px'});
    els.forEach(e=>obs.observe(e));
  };
  CIEL.io(document);

  // Year
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

  CIEL.esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
})();
