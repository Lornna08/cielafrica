/* ============================================================
   CIEL AFRICA — Front-end cart + M-Pesa checkout (DEMO)
   NOTE: Payment is a front-end simulation only. No real Daraja
   call is made yet. Wire the STK push in a serverless function
   (e.g. /api/stkpush on Vercel) and keep keys in env vars.
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
    setQty:function(id,q){ var c=read(),f=c.find(function(i){return i.id===id;}); if(f){f.qty=Math.max(1,q);} write(c); },
    remove:function(id){ write(read().filter(function(i){return i.id!==id;})); },
    clear:function(){ write([]); }
  };

  /* ---- toast ---- */
  function toast(msg){
    var t=document.createElement('div'); t.className='cart-toast'; t.textContent=msg;
    document.body.appendChild(t); requestAnimationFrame(function(){t.classList.add('on');});
    setTimeout(function(){t.classList.remove('on');setTimeout(function(){t.remove();},300);},2200);
  }

  /* ---- drawer ---- */
  function ensureDrawer(){
    if(document.getElementById('cartDrawer'))return;
    var wrap=document.createElement('div');
    wrap.innerHTML=''
      +'<div class="cart-ov" id="cartOv"></div>'
      +'<aside class="cart-dr" id="cartDrawer" aria-label="Your cart" aria-hidden="true">'
      +'  <div class="cart-dr__head"><h3><span class="brk">&lsaquo;</span> Your cart</h3><button class="cart-dr__x" id="cartClose" aria-label="Close">&times;</button></div>'
      +'  <div class="cart-dr__body" id="cartBody"></div>'
      +'  <div class="cart-dr__foot" id="cartFoot"></div>'
      +'</aside>';
    document.body.appendChild(wrap);
    document.getElementById('cartClose').onclick=closeDrawer;
    document.getElementById('cartOv').onclick=closeDrawer;
  }
  function openDrawer(){ ensureDrawer(); paint(); document.getElementById('cartDrawer').classList.add('on'); document.getElementById('cartOv').classList.add('on'); document.getElementById('cartDrawer').setAttribute('aria-hidden','false'); }
  function closeDrawer(){ var d=document.getElementById('cartDrawer'); if(d){d.classList.remove('on');document.getElementById('cartOv').classList.remove('on');d.setAttribute('aria-hidden','true');} }
  CIEL.openCart=openDrawer;

  function paint(){
    // nav badge
    var badges=document.querySelectorAll('[data-cart-count]');
    var n=Cart.count();
    badges.forEach(function(b){ b.textContent=n; b.style.display=n>0?'flex':'none'; });
    // drawer contents
    var body=document.getElementById('cartBody'); if(!body)return;
    var items=Cart.items();
    if(!items.length){ body.innerHTML='<div class="cart-empty"><p>Your cart is empty.</p><a class="btn btn--ghost btn--sm" href="products.html">Browse products</a></div>'; document.getElementById('cartFoot').innerHTML=''; return; }
    body.innerHTML=items.map(function(i){
      return '<div class="cart-row">'
        +'<div class="cart-row__info"><div class="cart-row__name">'+i.name+'</div><div class="cart-row__price">KES '+fmt(i.price)+'</div></div>'
        +'<div class="cart-row__qty"><button data-dec="'+i.id+'" aria-label="Decrease">&minus;</button><span>'+i.qty+'</span><button data-inc="'+i.id+'" aria-label="Increase">+</button></div>'
        +'<button class="cart-row__rm" data-rm="'+i.id+'" aria-label="Remove">&times;</button>'
        +'</div>';
    }).join('');
    document.getElementById('cartFoot').innerHTML=''
      +'<div class="cart-sum"><span>Subtotal</span><b>KES '+fmt(Cart.total())+'</b></div>'
      +'<a class="btn btn--p btn--lg cart-checkout" href="checkout.html">Checkout</a>'
      +'<button class="cart-clear" data-clear>Clear cart</button>';
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
