#!/usr/bin/env python3
"""Builds the Ciel Domains pages from one shared shell.
Run from the repo root:  python3 tools/build-domains.py
Edit the BODY_* blocks below (or the shell), then re-run."""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
V = '20261024f'  # cache-buster for domains assets

NAV_LINKS = [('index.html', 'Home'), ('work.html', 'Work'), ('services.html', 'Services'), ('templates.html', 'Templates'),
             ('products.html', 'Products'), ('domains.html', 'Domains'), ('about.html', 'About'), ('insights.html', 'Insights'), ('contact.html', 'Contact')]

def nav(active):
    links = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if t == active else ""}>{t}</a>' for h, t in NAV_LINKS)
    mobile = ''.join(f'<a href="{h}"><span class="brk">‹</span> {t}</a>' for h, t in NAV_LINKS)
    return f'''<header class="nav" id="nav">
  <div class="nav__in">
    <a href="index.html" class="brand" aria-label="Ciel Africa home"><img src="assets/img/logo-dark.png?v=20261021i" alt="Ciel Africa" class="brand__logo"></a>
    <nav class="nav__links" aria-label="Primary">{links}</nav>
    <button class="nav__cart" data-open-cart aria-label="Open cart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><span class="nav__cartcount" data-cart-count>0</span></button>
    <a href="quote.html" class="nav__cta">Start a project</a>
    <button class="nav__burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="mobile-menu" id="mobileMenu">{mobile}<a href="quote.html" class="btn btn--p">Start a project</a></div>'''

FOOT = '''<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <a href="index.html" class="brand" aria-label="Ciel Africa home"><img src="assets/img/logo-dark.png?v=20261021i" alt="Ciel Africa" class="brand__logo"></a>
      <div class="foot__cols">
        <div class="foot__col"><h4><span class="brk">‹</span> Studio</h4><a href="work.html">Work</a><a href="services.html">Services</a><a href="about.html">About</a><a href="insights.html">Insights</a></div>
        <div class="foot__col"><h4><span class="brk">‹</span> Build with us</h4><a href="quote.html">Start a project</a><a href="templates.html">Templates</a><a href="products.html">Products</a><a href="domains.html">Domains</a></div>
        <div class="foot__col"><h4><span class="brk">‹</span> Contact</h4><a href="mailto:hello@cielafrica.com">hello@cielafrica.com</a><a href="tel:+254706549703">+254 706 549 703</a></div>
      </div>
    </div>
    <div class="foot__bottom">
      <span>© 2026 Ciel Africa.</span>
      <span><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="domains/terms">Domain terms</a></span>
    </div>
  </div>
</footer>
<a class="wa-float" href="https://wa.me/254706549703?text=Hello%20Ciel%20Africa%2C%20I%20have%20a%20question%20about%20a%20domain." target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
  <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path fill="#fff" d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.745 3.046 9.38L1.05 31.3l6.126-1.957A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0z"/><path fill="#25D366" d="M16.004 2.667C23.353 2.667 29.33 8.646 29.33 16c0 7.354-5.977 13.333-13.326 13.333a13.27 13.27 0 0 1-7.49-2.303l-.536-.356-3.636 1.16 1.18-3.542-.388-.562A13.23 13.23 0 0 1 2.67 16C2.67 8.646 8.655 2.667 16.004 2.667z"/><path fill="#fff" d="M12.86 8.6c-.26-.58-.53-.59-.78-.6l-.666-.008c-.232 0-.608.087-.927.435-.318.348-1.217 1.19-1.217 2.9 0 1.71 1.246 3.363 1.42 3.595.174.232 2.4 3.845 5.93 5.238 2.934 1.157 3.531.927 4.168.87.637-.058 2.056-.84 2.346-1.652.29-.812.29-1.508.203-1.653-.087-.145-.318-.232-.666-.406s-2.056-1.015-2.375-1.131c-.318-.116-.55-.174-.782.174-.232.348-.898 1.131-1.101 1.363-.203.232-.406.26-.754.087-.348-.174-1.469-.542-2.798-1.726-1.034-.922-1.732-2.06-1.935-2.408-.203-.348-.022-.536.153-.709.156-.156.348-.406.522-.609.174-.203.232-.348.348-.58.116-.232.058-.435-.029-.609-.087-.174-.763-1.892-1.075-2.563z"/></svg>
</a>'''

def page(file, title, desc, canonical, active, body, scripts, robots=None, base=None):
    rob = f'<meta name="robots" content="{robots}">\n' if robots else ''
    basetag = ''
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
{basetag}<title>{title}</title>
<meta name="description" content="{desc}">
{rob}<link rel="canonical" href="https://cielafrica.com/{canonical}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://cielafrica.com/{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:site_name" content="Ciel Africa">
<meta property="og:image" content="https://cielafrica.com/assets/img/og.png?v=20261021i">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FAFAF8">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png?v=20261021i">
<link rel="apple-touch-icon" sizes="180x180" href="assets/img/apple-touch-icon.png?v=20261021i">
<link rel="manifest" href="site.webmanifest?v=20261021i">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/base.css?v=20261021i">
<link rel="stylesheet" href="assets/css/components.css?v=20261024e">
<link rel="stylesheet" href="assets/css/domains.css?v={V}">
</head>
<body class="dm">
<a href="#main" class="sr-only">Skip to content</a>
{nav(active) if active is not None else ''}
<main id="main">
{body}
</main>
{FOOT if active is not None else ''}
<script src="assets/js/site.js?v=20261021i"></script>
{'<script src="assets/js/cart.js?v=20261021i"></script>' if active is not None else ''}
{scripts}
</body>
</html>
'''
    # absolute paths so pages served under /domains/... resolve assets and links correctly
    html = re.sub(r'(href|src)="(?!https?:|/|#|mailto:|tel:|data:|javascript:)([^"]+)"', lambda m: m.group(1) + '="/' + m.group(2) + '"', html)
    html = html.replace('href="/index.html"', 'href="/"')
    if file == 'domains-admin.html':
        html = html.replace('<link rel="stylesheet" href="/assets/css/domains-admin.css?v=' + V + '">', '').replace('</head>', '<link rel="stylesheet" href="/assets/css/domains-admin.css?v=' + V + '">\n</head>')
    (ROOT / file).write_text(html)
    print('wrote', file)

ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'

BODY_DOMAINS = f'''
<section class="dmh">
  <div class="wrap dmh__grid">
    <div>
      <span class="eyebrow"><span class="brk">‹</span> Ciel Domains</span>
      <h1>Find the perfect <span class="em">domain</span> for your next big idea.</h1>
      <p class="dmh__sub">Search for your domain, discover creative alternatives and establish your brand online with Ciel Africa.</p>
      <form class="dms" id="dmForm" action="domains" method="get" role="search" novalidate>
        <label class="sr-only" for="dmQ">Search a name or domain</label>
        <input class="dms__in" id="dmQ" name="q" type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="200" placeholder="Search a name, e.g. zurihomes">
        <label class="sr-only" for="dmExt">Extension</label>
        <select class="dms__ext" id="dmExt" name="ext"><option value="">Any ext.</option><option value="com">.com</option><option value="co.ke">.co.ke</option><option value="ke">.ke</option><option value="africa">.africa</option></select>
        <button class="dms__go" id="dmGo" type="submit">{ICON_SEARCH}<span>Search</span></button>
      </form>
      <p class="dms__err" id="dmErr" role="alert"></p>
      <div class="dmx" id="dmChips" aria-label="Popular extensions"></div>
      <p class="dms__hint">Your domain journey starts here. Search for your ideal name, choose an extension and let us handle the registration.</p>
      <ol class="dmsteps" aria-label="How it works"><li><b>01</b>Search &amp; compare</li><li><b>02</b>Pay with M-Pesa</li><li><b>03</b>We register it for you</li></ol>
    </div>
    <div class="dmt" id="dmTry" aria-label="Preview of your name as a website, an email address and a business card">
      <div class="dmt__c dmt__br" aria-hidden="true">
        <div class="dmt__tabs"><div class="dmt__tab"><span class="dmt__fav" data-t="initial" data-fade>Z</span><span data-t="brand" data-fade>Zuri Homes</span></div></div>
        <div class="dmt__bar">{ICON_LOCK}<b data-t="domain" data-fade>zurihomes.co.ke</b></div>
        <div class="dmt__page"><div class="dmt__word" data-t="brand" data-fade>Zuri Homes</div><div class="dmt__tag">Welcome to <span data-t="domain" data-fade>zurihomes.co.ke</span></div><div class="dmt__nav"><i>Home</i><i>About</i><i>Contact</i></div></div>
      </div>
      <div class="dmt__c dmt__ml" aria-hidden="true">
        <div class="dmt__mh"><span>New message</span><span>Send</span></div>
        <div class="dmt__mr"><span>From</span><b>hello@<span data-t="domain" data-fade>zurihomes.co.ke</span></b></div>
        <div class="dmt__mr"><span>Subject</span><b>We’re officially online</b></div>
        <div class="dmt__mb">Hi! Our new website is live — find us at <span data-t="domain" data-fade>zurihomes.co.ke</span>.</div>
      </div>
      <div class="dmt__c dmt__bc" aria-hidden="true">
        <span class="brk">‹</span>
        <div><div class="dmt__bcn" data-t="brand" data-fade>Zuri Homes</div><div class="dmt__bcd">hello@<b data-t="domain" data-fade>zurihomes.co.ke</b></div></div>
      </div>
      <span class="dmt__cap">Try it on — it updates as you type.</span>
    </div>
  </div>
</section>

<section class="dmr wrap" id="results" hidden aria-live="polite">
  <div class="dmr__top"><h2 id="dmRTitle">Results</h2><p id="dmRMeta"></p></div>
  <div class="dmn" id="dmNotes"></div>
  <div id="dmMain"></div>
  <div class="dmind" id="dmInd" role="group" aria-label="What is the domain for?"><span>What’s it for?</span></div>
  <div id="dmGroups"></div>
  <p class="dmfine">Availability comes from each extension’s official registry where one is published, and from public DNS otherwise. Results are preliminary and don’t reserve a name — a domain is yours only once we confirm it’s registered.</p>
</section>

<section class="sec wrap" id="pricing">
  <div class="sechead" data-r>
    <span class="sechead__mark">‹</span>
    <h2 class="sechead__t">Popular extensions,<br>honest prices.</h2>
    <p class="sechead__lead">First-year and renewal prices shown side by side. Some extensions are cheap to start and costly to keep — you’ll always see both.</p>
  </div>
  <div class="dmtabs" id="dmTabs" role="tablist" aria-label="Extension categories"></div>
  <div class="dmpg" id="dmPrices"><div class="dmpc"><span class="dmpc__r">Loading prices…</span></div></div>
  <p class="dmfine" id="dmTax">Prices in Kenyan shillings (KES).</p>
</section>

<section class="sec wrap" id="how" style="padding-top:0">
  <div class="sechead" data-r>
    <span class="sechead__mark">‹</span>
    <h2 class="sechead__t">How registration<br>actually works.</h2>
    <p class="sechead__lead">No robots pretending. A real person registers every domain, and you’re told the truth at each step.</p>
  </div>
  <ol class="dmhow" data-r>
    <li><b>01 · Search</b><h3>Check the registry</h3><p>We ask the official registry for each extension where it publishes one. It’s a strong signal, not a reservation — someone else could still register the name first.</p></li>
    <li><b>02 · Order</b><h3>Pay, or confirm first</h3><p>Most domains you can pay for straight away with M-Pesa. For a few extensions, we confirm the name and price with the registry before charging you anything.</p></li>
    <li><b>03 · Register</b><h3>We register it by hand</h3><p>After payment is confirmed, we check again and register the domain in your name through an accredited registrar — usually within one working day.</p></li>
    <li><b>04 · Done</b><h3>Yours, or your money back</h3><p>You get an email when the registry confirms it. If it can’t be registered, you get a full refund — or an alternative at the same price if you choose.</p></li>
  </ol>
</section>

<section class="sec wrap" style="padding-top:0">
  <div class="sechead" data-r>
    <span class="sechead__mark">‹</span>
    <h2 class="sechead__t">Why get your domain<br>from Ciel Africa.</h2>
  </div>
  <div class="dmwhy" data-r>
    <div><span class="brk">‹</span><h3>Search you can trust</h3><p>Every result says where the answer came from. If we can’t tell whether a name is free, we say so — we never guess “available”.</p></div>
    <div><span class="brk">‹</span><h3>Kenya first</h3><p>.co.ke and .ke alongside the global favourites, prices in shillings, and M-Pesa at checkout.</p></div>
    <div><span class="brk">‹</span><h3>People, not a hosting maze</h3><p>Questions go to the same team that builds our products — by email or WhatsApp, with your order reference.</p></div>
    <div><span class="brk">‹</span><h3>Ready for what comes next</h3><p>When you’re ready to use it, we build <a href="services.html">websites and apps</a>, set up <a href="services.html">cloud hosting</a>, or start you from a <a href="templates.html">template</a>.</p></div>
  </div>
</section>

<section class="sec wrap" id="faq" style="padding-top:0">
  <div class="sechead" data-r><span class="sechead__mark">‹</span><h2 class="sechead__t">Questions, answered.</h2></div>
  <div class="dmfaq" data-r>
    <details><summary>Does searching reserve a domain for me?</summary><p>No. Search results are preliminary. A domain is only reserved once it’s registered — until then, anyone in the world can register it. That’s why we register as soon as your payment is confirmed.</p></details>
    <details><summary>How long does registration take?</summary><p>We register by hand, usually within one working day of your payment being confirmed. Some registries, including .ke, can take a little longer to confirm. We email you at every step.</p></details>
    <details><summary>What if the domain can’t be registered?</summary><p>If a domain turns out to be taken, reserved or rejected by the registry, you’re eligible for a full refund of what you paid for it. If you’d rather have a similar name, we can register an alternative at the same agreed price — but only with your agreement.</p></details>
    <details><summary>Why do some extensions say “we confirm before you pay”?</summary><p>Some extensions don’t publish a public registry lookup, some names are sold at premium prices the registry doesn’t show in a search, and some prices need checking with the registry. For those, you send a request first, we confirm the name and price, and only then send you a payment link.</p></details>
    <details><summary>How do renewals work?</summary><p>Your first payment covers the term you choose. Renewal is separate and is charged at the renewal price shown on this page at the time — often higher than the first year. We’ll contact you before the domain expires; nothing is charged automatically.</p></details>
    <details><summary>Who owns the domain?</summary><p>The domain is registered with the registrant details you give at checkout, so use the person or organisation that should own it.</p></details>
    <details><summary>Can I transfer a domain or use my own nameservers?</summary><p>Yes — contact us with your order reference and we’ll set your nameservers or guide you through a transfer. These are handled by our team rather than automatically.</p></details>
    <details><summary>How can I pay?</summary><p>With M-Pesa through a prompt on your phone. Card payment appears at checkout when it’s available. We never see or store your card details or M-Pesa PIN.</p></details>
    <details><summary>Where does the availability information come from?</summary><p>For most extensions we ask the official registry’s RDAP service (for example Verisign for .com and KeNIC for .co.ke). For .co, .io and .me there’s no public RDAP service, so we check public DNS — which can prove a name is taken, but not that it’s free — and confirm those by hand.</p></details>
  </div>
</section>

<section class="sec wrap" style="padding-top:0" id="terms">
  <div class="dmterms" data-r>
    <div><h2>The short version of our terms.</h2><p>Plain language, before you pay — not after. The full <a href="domains/terms" style="color:var(--ink);font-weight:600;border-bottom:2px solid var(--orange)">registration and refund terms</a> are one click away.</p></div>
    <ul>
      <li>Payment is collected before we register your domain by hand.</li>
      <li>Search results are preliminary and do not reserve a domain.</li>
      <li>Registration depends on final availability and the registry’s rules.</li>
      <li>Can’t be registered? You’re eligible for a full refund of what you paid for that domain.</li>
      <li>Refund timing depends on the payment provider.</li>
      <li>You may choose an alternative at the same agreed price — only with your consent.</li>
      <li>Any change to your domain or its price needs your agreement.</li>
      <li>Renewals are separate from the first registration.</li>
    </ul>
  </div>
</section>

<section class="wrap" style="padding-bottom:clamp(4rem,9vw,7rem)">
  <div class="band" data-r><div class="band__in"><h2>Stuck on a name? <span class="em">Talk to us.</span></h2><p>Tell us what you’re building and we’ll help you find a name that works — and set up email, hosting or a website on it when you’re ready.</p><div class="dmlinks"><a href="https://wa.me/254706549703?text=Hi%20Ciel%20Africa%2C%20I%20need%20help%20choosing%20a%20domain." class="btn btn--p btn--lg" target="_blank" rel="noopener">WhatsApp us</a><a href="mailto:hello@cielafrica.com?subject=Domain%20question" class="btn btn--ghost-d btn--lg">hello@cielafrica.com</a></div></div><span class="band__brk" aria-hidden="true">‹</span></div>
</section>

<div class="dmtray" id="dmTray" role="region" aria-label="Compare domains"><span class="dmtray__l" id="dmTrayL"></span><button class="btn btn--p" id="dmTrayGo" type="button">Compare alternatives</button><button class="dmtray__x" id="dmTrayX" type="button" aria-label="Clear comparison">×</button></div>

<dialog class="dmdlg" id="dmCmp" aria-labelledby="dmCmpT"><div class="dmdlg__p"><div class="dmdlg__h"><h2 id="dmCmpT">Compare alternatives</h2><button class="dmdlg__x" type="button" data-close aria-label="Close">×</button></div><div class="dmdlg__b"><div class="dmcmpt" id="dmCmpB"></div></div></div></dialog>

<dialog class="dmdlg dmco" id="dmCo" aria-labelledby="dmCoT"><div class="dmdlg__p">
  <div class="dmdlg__h"><h2 id="dmCoT">Register this domain</h2><button class="dmdlg__x" type="button" data-close aria-label="Close">×</button></div>
  <div class="dmco__steps" aria-hidden="true"><i class="on"></i><i></i><i></i></div>
  <div class="dmdlg__b" id="dmCoB"></div>
  <div class="dmco__foot" id="dmCoF"></div>
</div></dialog>
'''

BODY_ORDER = '''
<section class="dmop wrap">
  <span class="eyebrow"><span class="brk">‹</span> Ciel Domains · Your order</span>
  <div id="dmOrder"><div class="dmcard"><p>Loading your order…</p></div></div>
</section>
'''

BODY_TERMS = '''
<section class="dmop wrap">
  <span class="eyebrow"><span class="brk">‹</span> Ciel Domains</span>
  <div class="dmdoc">
    <h1 style="font-size:clamp(2rem,4vw,3rem)">Domain registration &amp; refund terms</h1>
    <p style="margin-top:1rem">Version 2026-10-24. These terms apply to domain names ordered on cielafrica.com/domains from Ciel Africa (“we”, “us”). They sit alongside our general <a href="terms.html" style="text-decoration:underline">terms</a> and <a href="privacy.html" style="text-decoration:underline">privacy policy</a>.</p>

    <h2>1. How we register domains</h2>
    <ol>
      <li>We register domains by hand through an accredited registrar after your payment has been confirmed by the payment provider.</li>
      <li>Payment is collected <b>before</b> we register your domain.</li>
      <li>For some extensions or names, we first confirm availability and the registry price with you before taking payment. You will see this at checkout as “we confirm before you pay”.</li>
      <li>We aim to complete registration within one working day of confirmed payment. Some registries take longer to confirm.</li>
    </ol>

    <h2>2. Search results are preliminary</h2>
    <ul>
      <li>Search results come from public registry services (RDAP) where available, and from public DNS otherwise. They are a snapshot at the time of the search.</li>
      <li>A search result <b>does not reserve</b> a domain. A domain can be registered by someone else at any moment until we complete your registration.</li>
      <li>A result marked “availability needs confirmation” means no public source could confirm the name is free.</li>
      <li>Registration is always subject to final availability and to the registry’s rules and eligibility requirements (for example, registrant details for .ke domains).</li>
    </ul>

    <h2>3. Prices, taxes and renewals</h2>
    <ul>
      <li>Prices are in Kenyan shillings (KES). The total shown at checkout is what you pay for the term you choose; it is calculated as the first-year price plus the renewal price for each additional year.</li>
      <li>Any tax that applies is shown at checkout. There are no other fees at checkout.</li>
      <li>Some names are sold by registries at premium prices that a search cannot show. If the registry price for your domain is different from what you saw, we will tell you before charging, or — if you have already paid — before registering, and you choose whether to continue. We never charge more without your agreement.</li>
      <li>Renewal is separate from the first registration and is charged at the renewal price in force at the time. Renewal prices are shown next to first-year prices and are often higher. Nothing is renewed or charged automatically; we will contact you before expiry.</li>
    </ul>

    <h2>4. If a domain cannot be registered</h2>
    <ul>
      <li>If, after you have paid, the domain turns out to be registered by someone else, reserved, premium-priced beyond what you agreed, or rejected by the registry, you are eligible for a <b>full refund of the amount you paid for that domain</b>.</li>
      <li>If you prefer, you may choose an alternative domain at the same agreed price, subject to its availability and your explicit consent. We will never switch your domain without your agreement.</li>
      <li>Any change to the selected domain or its price requires your agreement.</li>
    </ul>

    <h2>5. Refunds</h2>
    <ul>
      <li>Card and Paystack payments are refunded to the original payment method through Paystack. M-Pesa payments are refunded to the paying M-Pesa number.</li>
      <li>Refund processing times depend on the payment provider. We will tell you when a refund is started and again when the provider confirms it is complete.</li>
      <li>Once a domain has been registered in your name, the registration cannot be cancelled or refunded, because the registry fee cannot be recovered.</li>
    </ul>

    <h2>6. Your details and ownership</h2>
    <ul>
      <li>The domain is registered using the registrant details you provide. Make sure they are accurate and belong to the person or organisation that should own the domain; registries may suspend domains with false details.</li>
      <li>You must not order a domain that infringes someone else’s trademark or is intended to impersonate another person or organisation.</li>
    </ul>

    <h2>7. Data we keep</h2>
    <ul>
      <li>We collect only what is needed to register the domain and support you: name, email, phone, address, town, country and, optionally, your organisation.</li>
      <li>Registrant details are shared with the registrar and registry as required to register the domain.</li>
      <li>We never see or store card numbers, CVVs or M-Pesa PINs.</li>
      <li>Unpaid orders and requests are deleted after 30 days. Paid orders are kept for 5 years for accounting and tax records, then deleted.</li>
      <li>To ask for a copy or correction of your data, email hello@cielafrica.com with your order reference.</li>
    </ul>

    <h2>8. Contact</h2>
    <p>Email hello@cielafrica.com or WhatsApp +254 706 549 703, quoting your order reference (it starts with “CD-”).</p>
    <p style="margin-top:2rem"><a class="btn btn--dark" href="domains.html">Search for a domain</a></p>
  </div>
</section>
'''

BODY_ADMIN = '''
<div id="adm"></div>
'''

page('domains.html', 'Domains — Find a domain name | Ciel Africa',
     'Search .co.ke, .ke, .africa, .com and more. Honest availability from official registries, creative alternatives, KES prices and M-Pesa checkout.',
     'domains', 'Domains', BODY_DOMAINS, f'<script src="assets/js/domains.js?v={V}"></script>')
page('domains-order.html', 'Your domain order — Ciel Africa', 'Track your Ciel Domains order.', 'domains/order', 'Domains', BODY_ORDER,
     f'<script src="assets/js/domains-order.js?v={V}"></script>', robots='noindex, nofollow')
page('domains-terms.html', 'Domain registration & refund terms — Ciel Africa', 'How Ciel Africa registers domains, handles payment, renewals and refunds.',
     'domains/terms', 'Domains', BODY_TERMS, '')
page('domains-admin.html', 'Ciel Domains admin', 'Admin', 'domains/admin', None, BODY_ADMIN,
     f'<link rel="stylesheet" href="assets/css/domains-admin.css?v={V}"><script src="assets/js/domains-admin.js?v={V}"></script>', robots='noindex, nofollow')
