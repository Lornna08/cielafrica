/* ============================================================
   CIEL AFRICA — Site JS v3 (editorial)
   ============================================================ */
(function(){
  'use strict';
  window.CIEL = window.CIEL || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // nav scroll border
  var nav = document.getElementById('nav');
  var onScroll = function(){ if(nav) nav.classList.toggle('scrolled', scrollY > 8); };
  onScroll(); addEventListener('scroll', onScroll, {passive:true});

  // mobile menu
  var burger = document.getElementById('burger');
  if(burger){
    burger.addEventListener('click', function(){
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.mobile-menu a').forEach(function(a){
      a.addEventListener('click', function(){
        document.body.classList.remove('menu-open');
        document.body.style.overflow='';
        if(burger) burger.setAttribute('aria-expanded','false');
      });
    });
  }

  // reveal on scroll
  CIEL.io = function(root){
    var els = (root||document).querySelectorAll('[data-r]:not(.in)');
    if(reduce || !('IntersectionObserver' in window)){ els.forEach(function(e){e.classList.add('in');}); return; }
    var obs = new IntersectionObserver(function(ents){
      ents.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, {threshold:0.12, rootMargin:'0px 0px -5% 0px'});
    els.forEach(function(e){ obs.observe(e); });
  };
  CIEL.io(document);

  // helpers reused by pages
  CIEL.fmt = function(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  CIEL.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };

  // year
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });

  // scroll restoration (return to spot on back)
  try{
    if('scrollRestoration' in history) history.scrollRestoration='manual';
    var KEY='ciel:scroll:'+location.pathname;
    var save=function(){ try{ sessionStorage.setItem(KEY, String(scrollY)); }catch(e){} };
    addEventListener('pagehide', save); addEventListener('beforeunload', save);
    var st; addEventListener('scroll', function(){ clearTimeout(st); st=setTimeout(save,150); }, {passive:true});
    var restore=function(){ try{ var y=sessionStorage.getItem(KEY); if(y!==null){ var n=parseInt(y,10)||0; requestAnimationFrame(function(){requestAnimationFrame(function(){ scrollTo(0,n); });}); } }catch(e){} };
    if(document.readyState==='complete') restore(); else addEventListener('load', restore);
    addEventListener('pageshow', function(e){ if(e.persisted) restore(); });
  }catch(e){}
})();
