/* ============================================================
   CIEL AFRICA — large template cards (homepage + Work page)
   CIEL.tplCards(el, list, {more:true}) draws the same card for
   each template in `list`: media (video, image or dashboard +
   iPhone), flag, live badge, description, price and actions.
   ============================================================ */
window.CIEL = window.CIEL || {};
(function(){
  var esc=function(x){return (CIEL.esc||function(y){return String(y==null?'':y).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});})(x);};
  var fmt=function(n){return (CIEL.fmt||function(m){return Number(m).toLocaleString('en-US');})(n);};
  var price=function(t){return t.price>0?'KES '+fmt(t.price):'On request';};
  CIEL.tplCards=function(el,feats,opts){
    opts=opts||{}; if(!el||!feats||!feats.length) return;
    var T=CIEL.templates||[],P=CIEL.previewByCategory||{};
    var html=feats.map(function(feat,k){
      var webm=feat.video&&/\.mp4(\?|$)/.test(feat.video)?'<source src="'+esc(feat.video.replace(/\.mp4(\?|$)/,'.webm$1'))+'" type="video/webm">':'';
      var media=feat.video?'<video muted loop playsinline preload="none" poster="'+esc(feat.image||'')+'" aria-label="'+esc(feat.name)+' preview"><source src="'+esc(feat.video)+'" type="video/mp4">'+webm+'</video>':(feat.image?'<img src="'+esc(feat.image)+'" alt="'+esc(feat.name)+' preview" loading="lazy">':(P[feat.category]||''));
      if(feat.homeVideo){var hv=feat.homeVideo;media='<video muted loop playsinline preload="none" poster="'+esc(feat.homePoster||feat.image||'')+'" aria-label="'+esc(feat.name)+' preview"><source src="'+esc(hv)+'" type="video/mp4"><source src="'+esc(hv.replace(/\.mp4(\?|$)/,'.webm$1'))+'" type="video/webm"></video>';}
      if(feat.phone&&feat.video){ /* dashboard + iPhone 17 Pro Max side by side, no laptop */
        if(feat.duoVideo){var dv=feat.duoVideo;media='<video muted loop playsinline preload="none" poster="'+esc(feat.duoPoster||feat.image||'')+'" aria-label="'+esc(feat.name)+' preview"><source src="'+esc(dv)+'" type="video/mp4"><source src="'+esc(dv.replace(/\.mp4(\?|$)/,'.webm$1'))+'" type="video/webm"></video>';}
        media='<div class="htpl__duo"><div class="htpl__dash">'+media+'</div>'+'<div class="ip17 htpl__phone ip17--blue" role="img" aria-label="@@LBL@@"><div class="ip17__body"><i class="ip17__k ip17__k--act"></i><i class="ip17__k ip17__k--vu"></i><i class="ip17__k ip17__k--vd"></i><i class="ip17__k ip17__k--pwr"></i><i class="ip17__k ip17__k--cam"></i><div class="ip17__bezel"><div class="ip17__scr"><div class="ip17__sb"><span>9:41</span><svg viewBox="0 0 68 13" aria-hidden="true"><rect x="0" y="8.5" width="3" height="4" rx="1" stroke="none"/><rect x="4.6" y="6.5" width="3" height="6" rx="1" stroke="none"/><rect x="9.2" y="4" width="3" height="8.5" rx="1" stroke="none"/><rect x="13.8" y="1.5" width="3" height="11" rx="1" stroke="none"/><path d="M31 12.4 28.5 9.7a3.5 3.5 0 0 1 5 0Z" stroke="none"/><path d="M26.1 7.3a6.9 6.9 0 0 1 9.8 0M23.7 4.8a10.3 10.3 0 0 1 14.6 0" fill="none" stroke-width="1.7" stroke-linecap="round"/><rect x="44.5" y="1.2" width="20" height="10.6" rx="3.2" fill="none" stroke-width="1.1" opacity=".45"/><rect x="46.3" y="3" width="14.6" height="7" rx="1.7" stroke="none"/><rect x="65.6" y="4.6" width="1.6" height="3.8" rx=".8" stroke="none" opacity=".45"/></svg></div><i class="ip17__di"></i>@@IMG@@<i class="ip17__hb"></i></div></div></div></div>'.replace('@@LBL@@',esc(feat.name)+' on an iPhone 17 Pro Max').replace('@@IMG@@','<img src="'+esc(feat.phone)+'" alt="" loading="lazy" width="880" height="1804">')+'</div>';
      }
      var link=feat.link||('quote.html?template='+encodeURIComponent(feat.name));
      var quote='quote.html?template='+encodeURIComponent(feat.name);
      var same=feat.demo&&feat.link===feat.demo;
      var pts=k<2?(feat.points||[]).slice(0,3):[];
      return '<article class="htpl__feat'+(k%2?' htpl__feat--alt':'')+'" data-r>'+
        '<a class="htpl__media" href="'+esc(feat.demo||link)+'" aria-label="'+esc(feat.name)+'"'+(feat.homeRatio?' style="aspect-ratio:'+esc(feat.homeRatio)+'"':'')+'>'+media+'</a>'+
        '<div class="htpl__info"><div class="htpl__tags"><span class="htpl__flag">'+esc(feat.flag||(k?'Featured':'Latest build'))+'</span>'+(feat.demo?'<span class="htpl__live htpl__live--in">Live template</span>':'')+'</div>'+
          '<h3>'+esc(feat.name)+'</h3><p>'+esc(feat.desc)+'</p>'+
          (pts.length?'<ul class="htpl__pts">'+pts.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+
          '<div class="htpl__foot"><span class="htpl__price">'+price(feat)+'<small>'+(feat.price>0?'starting · one-time setup':'quoted per organisation')+'</small></span>'+
          '<span class="htpl__acts">'+(feat.demo?'<a class="btn btn--p btn--sm" href="'+esc(feat.demo)+'">Try the live template ↗</a>':'')+(same?'<a class="btn btn--ghost btn--sm" href="'+esc(quote)+'">Customize</a>':'<a class="btn btn--ghost btn--sm" href="'+esc(link)+'">View details</a>')+'</span></div>'+
        '</div></article>';
    }).join('');
    if(opts.more){
      var cats={};T.forEach(function(t){cats[t.category]=1;});
      html+='<div class="htpl__more" data-r><p>'+T.length+' designs across '+Object.keys(cats).length+' industries — every one customised to your brand.</p><a class="ul" href="templates.html"><span class="brk">‹</span> Browse all templates</a></div>';
    }
    el.innerHTML=html;
    if(CIEL.io)CIEL.io(el);
    var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.querySelectorAll('video').forEach(function(v){
      if(reduce||!('IntersectionObserver' in window)){v.setAttribute('preload','metadata');return;}
      new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){});}else v.pause();});},{threshold:.25}).observe(v);
    });
  };
  /* templates shown on the homepage, in `home` order (1, 2, 3 …) */
  CIEL.homeTemplates=function(){
    var T=CIEL.templates||[];
    var H=T.filter(function(t){return t.home>0;}).sort(function(a,b){return a.home-b.home;});
    if(!H.length) H=T.filter(function(t){return t.featured;}).slice(0,4);
    return H.length?H:T.slice(0,1);
  };
  /* every template we've actually built (has a live demo): homepage ones first, then the rest */
  CIEL.builtTemplates=function(){
    var T=CIEL.templates||[],H=CIEL.homeTemplates().filter(function(t){return t.demo;});
    return H.concat(T.filter(function(t){return t.demo&&H.indexOf(t)<0;}));
  };
})();
