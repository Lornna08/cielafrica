/* CIEL AFRICA — when someone taps a WhatsApp order link anywhere on the site, Ciel HQ keeps it
   as a pending order (the message text, the page, and any name/phone/email typed on that page). */
(function () {
  function val(sel) { var e = document.querySelector(sel); return e && e.value ? String(e.value).slice(0, 190) : ''; }
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href*="wa.me/"],a[href*="api.whatsapp.com/"]');
    if (!a) return;
    var text = '';
    try { text = new URL(a.href, location.href).searchParams.get('text') || ''; } catch (e) { }
    var key = 'wa_t_' + (text.length + ':' + text.slice(0, 40));
    try { if (sessionStorage.getItem(key) && Date.now() - +sessionStorage.getItem(key) < 120000) return; sessionStorage.setItem(key, String(Date.now())); } catch (e) { }
    var body = { source: (location.pathname.split('/')[1] || 'home').replace(/\.html$/, ''), page: location.pathname, text: text.slice(0, 2000),
      name: val('input[autocomplete="name"],input[name="name"],#coName'), phone: val('input[type="tel"],#coPhone'), email: val('input[type="email"],#coEmail') };
    try { fetch('/api/hq?route=lead', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: JSON.stringify(body) }).catch(function () { }); } catch (e) { }
  }, true);
})();
