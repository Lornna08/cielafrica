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
    var restore=function(){ try{ if(/^\/photobooks\/(design|checkout|track|my-books)/.test(location.pathname)) return; var y=sessionStorage.getItem(KEY); if(y!==null){ var n=parseInt(y,10)||0; requestAnimationFrame(function(){requestAnimationFrame(function(){ scrollTo(0,n); });}); } }catch(e){} };
    if(document.readyState==='complete') restore(); else addEventListener('load', restore);
    addEventListener('pageshow', function(e){ if(e.persisted) restore(); });
  }catch(e){}
})();

/* "Back to my book": after someone works on a photo book, a small button follows them round the site
   until they close it (it comes back the next time they edit a book). Saved by assets/pbk/editor.js. */
(function(){
  var el=null, cssOn=false;
  function check(){ try{
    if(el&&el.isConnected) return;
    if(/^\/(checkout|thanks)(\.html)?$/.test(location.pathname)) return;
    var b=JSON.parse(localStorage.getItem('pbk_last')||'null'); if(!b||!(b.id||b.ref)) return;
    var order=b.kind==='order';
    var x=+localStorage.getItem('pbk_last_x')||0; if(x>=b.at) return;
    if(Date.now()-b.at>(order?120:60)*864e5) return;
    var css='.ciel-mybk{position:fixed;left:clamp(.8rem,3vw,1.4rem);bottom:calc(clamp(.9rem,3vw,1.5rem) + env(safe-area-inset-bottom,0px));z-index:79;display:flex;align-items:center;gap:.6rem;max-width:calc(100vw - 6.5rem);background:#1b1714;color:#fff;border-radius:16px;padding:.45rem .45rem .45rem .5rem;box-shadow:0 14px 34px -8px rgba(20,12,6,.45),0 3px 10px rgba(20,12,6,.2);font:600 .9rem/1.2 Inter,system-ui,-apple-system,sans-serif;transform:translateY(140%);transition:transform .35s cubic-bezier(.2,.8,.2,1)}'+
      '.ciel-mybk.is-on{transform:none}.pbk-editing .ciel-mybk,.pbk-checkout .ciel-mybk{display:none}'+
      '.ciel-mybk a{display:flex;align-items:center;gap:.65rem;color:inherit;text-decoration:none;min-width:0}'+
      '.ciel-mybk img,.ciel-mybk i{flex:none;width:34px;height:46px;border-radius:3px;object-fit:cover;background:#ff5a1f;box-shadow:0 2px 6px rgba(0,0,0,.35)}'+
      '.ciel-mybk span{display:flex;flex-direction:column;min-width:0}.ciel-mybk small{font-weight:500;font-size:.76rem;color:#cfc6bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw}'+
      '.ciel-mybk b{white-space:nowrap}'+
      '.ciel-mybk button{flex:none;border:0;background:rgba(255,255,255,.1);color:#fff;width:30px;height:30px;border-radius:50%;font-size:1.05rem;line-height:1;cursor:pointer}.ciel-mybk button:hover{background:rgba(255,255,255,.22)}';
    if(!cssOn){ var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st); cssOn=true; }
    el=document.createElement('div'); el.className='ciel-mybk'; el.setAttribute('role','complementary'); el.setAttribute('aria-label','Your photo book');
    var name=String(b.name||'My photo book').replace(/[<>&"]/g,''), ref=String(b.ref||'').replace(/[^\w-]/g,'');
    el.innerHTML='<a href="'+(order?'/photobooks/track?ref='+encodeURIComponent(ref):'/photobooks/design?p='+encodeURIComponent(b.id))+'" data-go>'+(b.img&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(b.img)?'<img alt="" src="'+b.img+'">':'<i></i>')+'<span><b>'+(order?'Track my order':'Back to my book')+'</b><small>'+(order?'Order '+ref+' · ':'')+name+'</small></span></a><button type="button" aria-label="Hide this">×</button>';
    el.querySelector('button').onclick=function(){ try{localStorage.setItem('pbk_last_x',String(Date.now()));}catch(e){} el.classList.remove('is-on'); setTimeout(function(){el.remove();},400); };
    document.body.appendChild(el); setTimeout(function(){el.classList.add('is-on');},600);
  }catch(e){} }
  /* books made before this button existed: find the latest one on this device (only if the photo book store already exists) */
  function fromDevice(){ try{
    if(localStorage.getItem('pbk_last')||!window.indexedDB||!indexedDB.databases) return;
    indexedDB.databases().then(function(l){
      if(!l.some(function(d){return d.name==='ciel-photobooks';})) return;
      var r=indexedDB.open('ciel-photobooks'); r.onsuccess=function(){ var db=r.result; try{
        if(!db.objectStoreNames.contains('projects')){ db.close(); return; }
        var hasP=db.objectStoreNames.contains('purchases'), tx=db.transaction(hasP?['projects','purchases']:['projects'],'readonly'), bought={};
        if(hasP){ var pq=tx.objectStore('purchases').getAll(); pq.onsuccess=function(){ (pq.result||[]).forEach(function(x){ bought[x.projectId]=1; }); }; }
        var q=tx.objectStore('projects').getAll(); tx.oncomplete=function(){
          var od={}; try{ od=JSON.parse(localStorage.getItem('pbk_ordered')||'{}'); }catch(e){} Object.keys(bought).forEach(function(k){ od[k]=1; });
          var ps=(q.result||[]).filter(function(p){ return p.app==='pbk'&&!od[p.id]; }).sort(function(a,b){ return (b.updatedAt||0)-(a.updatedAt||0); });
          db.close(); if(!ps.length||localStorage.getItem('pbk_last')) return;
          localStorage.setItem('pbk_last',JSON.stringify({kind:'book',id:ps[0].id,name:ps[0].name||'My photo book',at:ps[0].updatedAt||Date.now()})); check();
        };
      }catch(e){ db.close(); } };
    }).catch(function(){});
  }catch(e){} }
  function start(){ check(); fromDevice(); addEventListener('pbk-last',function(){ if(el){ el.remove(); el=null; } check(); }); try{ new MutationObserver(function(){ if(!document.body.classList.contains('pbk-editing')) setTimeout(check,300); }).observe(document.body,{attributes:true,attributeFilter:['class']}); }catch(e){} }
  if(document.body) start(); else addEventListener('DOMContentLoaded',start);
})();
