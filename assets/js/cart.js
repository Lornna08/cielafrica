/* ============================================================
   CIEL AFRICA — cart drawer (items in localStorage; checkout at /checkout.html)
   ============================================================ */
window.CIEL = window.CIEL || {};
(function(){
  var KEY='ciel_cart_v1';
  function read(){ try{return JSON.parse(localStorage.getItem(KEY))||[];}catch(e){return [];} }
  function write(c){ try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){} paint(); }
  function fmt(n){ return Number(n).toLocaleString('en-US'); }

  var Cart = CIEL.cart = {
    items:function(){ return read(); },
    count:function(){ return read().reduce(function(s,i){return s+i.qty;},0); },
    total:function(){ return read().reduce(function(s,i){return s+i.price*i.qty;},0); },
    add:function(id,name,price){
      var c=read(), f=c.find(function(i){return i.id===id;});
      if(f)f.qty++; else c.push({id:id,name:name,price:Number(price),qty:1});
      write(c); openDrawer(); toast(name+' added to cart');
    },
    /* photo books: { id, name, price, qty, pb:{p,product,pages}, thumb } — priced again on the server at checkout */
    addItem:function(it,silent){
      var c=read(), f=c.find(function(i){return i.id===it.id;});
      if(f){ Object.assign(f,it,{qty:it.pb&&it.pb.product==='digital'?1:(f.qty+(it.qty||1))}); } else c.push(Object.assign({qty:1},it));
      write(c); if(!silent){ openDrawer(); toast(it.name+' added to cart'); }
    },
    update:function(id,patch){ var c=read(),f=c.find(function(i){return i.id===id;}); if(f) Object.assign(f,patch); write(c); },
    siteItems:function(){ return read().filter(function(i){return !i.pb;}); },
    siteTotal:function(){ return read().filter(function(i){return !i.pb;}).reduce(function(s,i){return s+i.price*i.qty;},0); },
    pbItems:function(){ return read().filter(function(i){return !!i.pb;}); },
    setQty:function(id,q){ var c=read(),f=c.find(function(i){return i.id===id;}); if(f){f.qty=Math.max(1,q);} write(c); },
    remove:function(id){ write(read().filter(function(i){return i.id!==id;})); },
    clear:function(){ write([]); }
  };

  /* ---- toast ---- */
  function toast(msg){
    document.querySelectorAll('.cart-toast').forEach(function(x){x.remove();});
    var t=document.createElement('div'); t.className='cart-toast'; t.textContent=msg;
    document.body.appendChild(t); requestAnimationFrame(function(){t.classList.add('on');});
    setTimeout(function(){t.classList.remove('on');setTimeout(function(){t.remove();},300);},2200);
  }

  /* ---- drawer ---- */
  var ICO={
    bag:'<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect x="10" y="20" width="44" height="36" rx="7" fill="#141414"/><path d="M22 22v-4a10 10 0 0 1 20 0v4" stroke="#141414" stroke-width="4" stroke-linecap="round"/><path d="M36.5 31 28 38l8.5 7" stroke="#FF5A1F" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    tpl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M9 9v11"/></svg>',
    box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    arr:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    srch:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  };
  var TINTS=['#FF5A1F','#1B2A4A','#1F9D55','#7A4E00','#5B3FD1','#141414'];
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function tint(id){ var h=0; String(id).split('').forEach(function(c){h=(h*31+c.charCodeAt(0))>>>0;}); return TINTS[h%TINTS.length]; }
  function ensureDrawer(){
    if(document.getElementById('cartDrawer'))return;
    var wrap=document.createElement('div');
    wrap.innerHTML=''
      +'<div class="cart-ov" id="cartOv"></div>'
      +'<aside class="cart-dr" id="cartDrawer" aria-label="Your cart" aria-hidden="true">'
      +'  <div class="cart-dr__head"><h3>Your cart <span class="cart-dr__n" id="cartN"></span></h3><button class="cart-dr__x" id="cartClose" aria-label="Close">&times;</button></div>'
      +'  <div class="cart-dr__body" id="cartBody"></div>'
      +'  <div class="cart-dr__foot" id="cartFoot"></div>'
      +'</aside>';
    document.body.appendChild(wrap);
    document.getElementById('cartClose').onclick=closeDrawer;
    document.getElementById('cartOv').onclick=closeDrawer;
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeDrawer(); });
  }
  function openDrawer(){ ensureDrawer(); paint(); document.getElementById('cartDrawer').classList.add('on'); document.getElementById('cartOv').classList.add('on'); document.getElementById('cartDrawer').setAttribute('aria-hidden','false'); document.body.classList.add('cart-open'); }
  function closeDrawer(){ var d=document.getElementById('cartDrawer'); if(d){d.classList.remove('on');document.getElementById('cartOv').classList.remove('on');d.setAttribute('aria-hidden','true');} document.body.classList.remove('cart-open'); }
  CIEL.openCart=openDrawer;

  function paint(){
    var badges=document.querySelectorAll('[data-cart-count]');
    var n=Cart.count();
    badges.forEach(function(b){ b.textContent=n; b.style.display=n>0?'flex':'none'; });
    var body=document.getElementById('cartBody'); if(!body)return;
    var items=Cart.items(), foot=document.getElementById('cartFoot');
    document.getElementById('cartN').textContent=n?n+(n===1?' item':' items'):'';
    if(!items.length){
      body.innerHTML='<div class="cart-empty">'
        +'<div class="cart-empty__art">'+ICO.bag+'</div>'
        +'<h4>Nothing here yet</h4><p>Start with a name for your idea — or pick something we’ve already built.</p>'
        +'<form class="cart-find" action="/domains" method="get" role="search"><label class="sr-only" for="cartFindQ">Find a domain</label>'+ICO.globe+'<input id="cartFindQ" name="q" placeholder="Find your domain" autocomplete="off" maxlength="80"><button type="submit" aria-label="Search">'+ICO.srch+'</button></form>'
        +'<div class="cart-go">'
        +'<a href="/domains"><span class="cart-go__i" style="--c:#FF5A1F">'+ICO.globe+'</span><span><b>Domains</b><small>.co.ke from KES 1,700</small></span>'+ICO.arr+'</a>'
        +'<a href="/templates.html"><span class="cart-go__i" style="--c:#1B2A4A">'+ICO.tpl+'</span><span><b>Templates</b><small>Live sites you can start from</small></span>'+ICO.arr+'</a>'
        +'<a href="/products.html"><span class="cart-go__i" style="--c:#1F9D55">'+ICO.box+'</span><span><b>Products</b><small>Ready-made software</small></span>'+ICO.arr+'</a>'
        +'</div></div>';
      foot.innerHTML='<a class="cart-help" href="https://wa.me/254706549703?text=Hi%20Ciel%20Africa%2C%20I%20need%20help%20choosing." target="_blank" rel="noopener">Not sure what you need? <b>Ask us on WhatsApp</b></a>';
      return;
    }
    body.innerHTML=items.map(function(i){
      return '<div class="cart-row">'
        +(i.thumb?'<span class="cart-row__th cart-row__th--img"><img src="'+esc(i.thumb)+'" alt="" draggable="false"></span>':'<span class="cart-row__th" style="--c:'+tint(i.id)+'">'+esc(String(i.name||'?').trim().charAt(0).toUpperCase())+'</span>')
        +'<div class="cart-row__info"><div class="cart-row__name">'+esc(i.name)+'</div><div class="cart-row__price">KES '+fmt(i.price)+(i.qty>1?' × '+i.qty:'')+'</div>'
        +(i.pb&&i.pb.product==='digital'?'<div class="cart-row__sub">Print-ready PDF · '+i.pb.pages+' pages</div>':(i.pb?'<div class="cart-row__sub">Printed hardcover · '+i.pb.pages+' pages</div>':'')+'<div class="cart-row__qty"><button data-dec="'+esc(i.id)+'" aria-label="Decrease">&minus;</button><span>'+i.qty+'</span><button data-inc="'+esc(i.id)+'" aria-label="Increase">+</button></div>')+'</div>'
        +'<div class="cart-row__end"><b>KES '+fmt(i.price*i.qty)+'</b><button class="cart-row__rm" data-rm="'+esc(i.id)+'">Remove</button></div>'
        +'</div>';
    }).join('');
    foot.innerHTML=''
      +'<div class="cart-sum"><span>Subtotal</span><b>KES '+fmt(Cart.total())+'</b></div>'
      +(function(){ var pb=items.some(function(i){return i.pb;}), site=items.some(function(i){return !i.pb;});
          if(pb&&!site) return '<a class="btn btn--p btn--lg cart-checkout" href="/photobooks/checkout">Checkout '+ICO.arr+'</a>';
          if(pb&&site) return '<a class="btn btn--p btn--lg cart-checkout" href="/photobooks/checkout">Check out photo books '+ICO.arr+'</a><a class="btn btn--ghost cart-checkout cart-checkout--2" href="/checkout.html">Check out other items '+ICO.arr+'</a>';
          return '<a class="btn btn--p btn--lg cart-checkout" href="/checkout.html">Checkout '+ICO.arr+'</a>'; })()
      +'<div class="cart-trust">'+ICO.lock+'Pay securely with M-Pesa</div>'
      +'<div class="cart-more"><a href="/products.html">Continue shopping</a><button class="cart-clear" data-clear>Clear cart</button></div>';
    body.querySelectorAll('[data-inc]').forEach(function(b){b.onclick=function(){var i=Cart.items().find(function(x){return x.id===b.dataset.inc;});Cart.setQty(b.dataset.inc,i.qty+1);paint();};});
    body.querySelectorAll('[data-dec]').forEach(function(b){b.onclick=function(){var i=Cart.items().find(function(x){return x.id===b.dataset.dec;});Cart.setQty(b.dataset.dec,i.qty-1);paint();};});
    body.querySelectorAll('[data-rm]').forEach(function(b){b.onclick=function(){Cart.remove(b.dataset.rm);paint();};});
    var cl=document.querySelector('[data-clear]'); if(cl)cl.onclick=function(){Cart.clear();paint();};
  }

  /* ---- wire up on load ---- */
  document.addEventListener('DOMContentLoaded',function(){
    ensureDrawer(); paint();
    // add-to-cart buttons (delegated)
    document.body.addEventListener('click',function(e){
      var add=e.target.closest('[data-add-cart]');
      if(add){ e.preventDefault(); Cart.add(add.getAttribute('data-id'),add.getAttribute('data-name'),add.getAttribute('data-price')); }
      var open=e.target.closest('[data-open-cart]');
      if(open){ e.preventDefault(); openDrawer(); }
    });
  });
})();
