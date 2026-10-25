"""Builds a personal portfolio (5 static pages + data.js) from a config.
Usage (from anywhere): python3 tools/portfolio/build.py wanja|template
Edit the .json config, pf.css or pf.js here, then rebuild; the generated pages
and assets are written into wanja/ or muse/ at the repo root."""
import json, html, sys, shutil, os
E = html.escape
HERE = os.path.dirname(os.path.abspath(__file__))
V = '20261025b'

SV = {
 'ig': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
 'tt': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 3c.3 2.2 1.6 3.6 3.8 3.8v3.1c-1.4.1-2.6-.3-3.8-1v5.9c0 3.9-3.3 6.4-6.8 5.6-3.6-.8-5.1-5.2-2.8-8.1 1.3-1.6 3.2-2.3 5.3-2v3.2c-.4-.1-.9-.2-1.3-.1-1.4.2-2.3 1.4-2 2.8.3 1.2 1.5 2 2.8 1.7 1-.2 1.7-1.1 1.7-2.4V3h3.1z"/></svg>',
 'x': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
 'mail': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
 'wa': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.9-.9-2.8-2.2-.2-.3.2-.3.6-1 .1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.1z"/></svg>',
 'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
 'pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
 'grid': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
 'user': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
 'tag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1.5"/></svg>',
 'chat': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
 'menu': '<svg class="i-m" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
 'close': '<svg class="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 'arrow': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 'chev': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
 'dl': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
}

def load(name):
    return json.load(open(os.path.join(HERE, name + '.json')))

def build(cfg):
    B = cfg['base']; IMG = B + '/assets/img/'; P = cfg['photos']; pr = cfg['profile']; C = cfg['contact']
    ROOT = os.path.abspath(os.path.join(HERE, '..', '..')) + '/'
    OUT = ROOT + cfg['out']; os.makedirs(OUT + 'assets', exist_ok=True)
    first = pr['first']

    def img(slug, sizes, eager=False):
        p = P[slug]
        srcset = ', '.join(f'{IMG}{slug}-{w}.webp {w}w' for w in p['s'])
        small = [w for w in p['s'] if w <= 800]; mid = small[-1] if small else p['s'][0]
        a = ' loading="eager" fetchpriority="high"' if eager else ' loading="lazy"'
        return f'<img src="{IMG}{slug}-{mid}.webp" srcset="{srcset}" sizes="{sizes}" width="{p["w"]}" height="{p["h"]}" alt="{E(p["alt"])}"{a} decoding="async">'

    def viewer(slug, group, label, sizes, cls, eager=False, extra=''):
        return (f'<figure class="{cls}" data-group="{group}" data-slugs="{slug}" data-label="{E(label)}" style="margin:0">'
                f'<button type="button" data-lb="{group}" data-i="0" aria-label="Open photo: {E(P[slug]["alt"])}">{img(slug, sizes, eager)}</button>{extra}</figure>')

    wa = f'https://wa.me/{C["wa"]}'
    socials = ''.join(f'<a href="{u}" target="_blank" rel="noopener" aria-label="{E(l)}">{SV[k]}</a>' for k, u, l in [
        ('ig', C['instagram'][1], 'Instagram ' + C['instagram'][0]), ('tt', C['tiktok'][1], 'TikTok ' + C['tiktok'][0])] + ([('x', C['x'][1], 'X ' + C['x'][0])] if C.get('x') else []) + [('mail', 'mailto:' + C['email'], 'Email ' + C['email'])])

    def head(title, desc, path, preload=None, ld=False):
        url = cfg['site'] + path
        pre = ''
        if preload:
            p = P[preload]; pre = f'<link rel="preload" as="image" imagesrcset="{", ".join(f"{IMG}{preload}-{w}.webp {w}w" for w in p["s"])}" imagesizes="(max-width: 960px) 100vw, 42vw" fetchpriority="high">\n'
        person = {"@context": "https://schema.org", "@type": "Person", "name": pr['name'], "url": cfg['site'] + B, "image": cfg['site'] + B + '/assets/og.jpg',
                  "description": pr['tagline'], "address": {"@type": "PostalAddress", "addressLocality": pr['city'], "addressCountry": pr['country']},
                  "sameAs": [C['instagram'][1], C['tiktok'][1]] + ([C['x'][1]] if C.get('x') else [])}
        if cfg.get('real'):
            person["email"] = "mailto:" + C['email']; person["telephone"] = C['tel']
        robots = '' if cfg.get('real') else '<meta name="robots" content="noindex">\n'
        return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{url}">
{robots}<meta property="og:type" content="profile">
<meta property="og:site_name" content="{E(pr['name'])}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{cfg['site']}{B}/assets/og.jpg?v={V}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F7F4EF">
<link rel="icon" type="image/svg+xml" href="{B}/assets/favicon.svg">
<link rel="apple-touch-icon" href="{B}/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
{pre}<link rel="stylesheet" href="{B}/assets/pf.css?v={V}">
''' + (f'<script type="application/ld+json">{json.dumps(person)}</script>\n' if ld else '') + '</head>\n'

    def header(cur):
        L = [('portfolio', 'Portfolio'), ('about', 'About'), ('rates', 'Services & rates'), ('contact', 'Contact')]
        nav = ''.join(f'<a href="{B}/{k}"' + (' aria-current="page"' if cur == k else '') + f'>{E(l)}</a>' for k, l in L)
        dl = ''.join(f'<a class="dl" href="{h}"' + (' aria-current="page"' if cur == k else '') + f'>{E(l)}{SV["chev"]}</a>' for k, h, l in [('home', B, 'Home')] + [(k, f'{B}/{k}', l) for k, l in L])
        bar = ''
        if cfg.get('banner'):
            bar = f'<div class="tbar" role="region" aria-label="Template notice"><div class="wrap tbar__in"><a href="/">‹ Ciel Africa</a><span>{E(cfg["banner"])}</span><a href="/quote.html?template={E(cfg["template_name"].replace(" ", "%20"))}">Use this template</a></div></div>\n'
        return f'''<a class="skip" href="#main">Skip to content</a>
{bar}<header class="hdr"><div class="wrap hdr__in">
  <a class="brand" href="{B}">{E(pr['name'])}</a>
  <nav class="nav" aria-label="Main">{nav}</nav>
  <div class="hdr__acts"><a class="btn btn--dark btn--sm hdr__book" href="{B}/contact">Work with {E(first)}</a>
  <button type="button" class="burger" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">{SV['menu']}{SV['close']}</button></div>
</div></header>
<div class="drawer" id="drawer" inert>
  <nav aria-label="Menu">{dl}</nav>
  <div class="drawer__acts"><a class="btn btn--wa" href="{wa}" target="_blank" rel="noopener">{SV['wa']}WhatsApp</a><a class="btn" href="mailto:{C['email']}">{SV['mail']}Email</a></div>
</div>
'''

    foot = f'''<footer class="ftr"><div class="wrap">
  <div class="ftr__grid">
    <div><p class="ftr__name">{E(pr['name'])}</p><p>{E(pr['short'])}<br>{E(pr['location'])}</p></div>
    <div><h3>Pages</h3><ul><li><a href="{B}/portfolio">Portfolio</a></li><li><a href="{B}/about">About</a></li><li><a href="{B}/rates">Services &amp; rates</a></li><li><a href="{B}/contact">Contact</a></li></ul></div>
    <div><h3>Contact</h3><ul><li><a href="mailto:{C['email']}">{E(C['email'])}</a></li><li><a href="{wa}" target="_blank" rel="noopener">WhatsApp {E(C['phone'])}</a></li></ul></div>
    <div><h3>Follow</h3><ul><li><a href="{C['instagram'][1]}" target="_blank" rel="noopener">Instagram {E(C['instagram'][0])}</a></li><li><a href="{C['tiktok'][1]}" target="_blank" rel="noopener">TikTok {E(C['tiktok'][0])}</a></li>''' + (f'<li><a href="{C["x"][1]}" target="_blank" rel="noopener">X {E(C["x"][0])}</a></li>' if C.get('x') else '') + f'''</ul></div>
  </div>
  <div class="ftr__base"><span>© <span data-year>2026</span> {E(pr['name'])}. All rights reserved.</span><a href="/">{E(cfg['credit'])}</a></div>
</div></footer>
<script src="{B}/assets/data.js?v={V}"></script>
<script src="{B}/assets/pf.js?v={V}"></script>
</body>
</html>
'''

    cta = f'''<section class="sec" aria-labelledby="cta-h"><div class="wrap"><div class="cta reveal">
  <div><span class="eyebrow" style="color:#E3C7B4">Let’s work together</span><h2 id="cta-h" style="margin-top:6px">{E(cfg['cta_title'])}</h2><p style="margin-top:10px">{E(cfg['cta_text'])}</p></div>
  <div class="cta__acts"><a class="btn btn--light" href="{B}/contact#enquire">Send an enquiry</a><a class="btn" href="{wa}" target="_blank" rel="noopener">WhatsApp</a></div>
</div></div></section>
'''
    roles = ''.join(f'<li>{E(r)}</li>' for r in pr['roles'])
    quick = ''.join(f'<li><a href="{h}">{SV[i]}{E(l)}</a></li>' for i, h, l in [('grid', f'{B}/portfolio', 'Portfolio'), ('user', f'{B}/about', 'About'), ('tag', f'{B}/rates', 'Rate card'), ('chat', f'{B}/contact', 'Contact')])
    facts = ''.join(f'<div><dt>{E(a)}</dt><dd>{E(b)}</dd></div>' for a, b in cfg['facts'])
    about_p = ''.join(f'<p>{E(x)}</p>' for x in cfg['about'])
    pdf = f'<a class="btn" href="{B}/assets/{cfg["pdf"]}" download>{SV["dl"]}Download PDF</a>' if cfg.get('pdf') else ''

    # ---------- HOME ----------
    home = head(cfg['title'], cfg['desc'], B, preload=pr['photo'], ld=True) + '<body>\n' + header('home') + f'''<main id="main">
<section class="profile" aria-labelledby="name"><div class="wrap profile__grid">
  {viewer(pr['photo'], 'profile', pr['name'], '(max-width: 960px) 100vw, 42vw', 'profile__ph', eager=True, extra=f'<span class="loc">{SV["pin"]}{E(pr["location"])}</span>')}
  <div>
    <span class="eyebrow">{E(cfg['hello'])}</span>
    <h1 id="name">{E(pr['name'])}</h1>
    <ul class="roles" aria-label="Roles">{roles}</ul>
    <p class="tagline">{E(pr['tagline'])}</p>
    <div class="profile__cta"><a class="btn btn--dark" href="{B}/contact">Work with {E(first)}</a><a class="btn" href="{B}/portfolio">View portfolio</a></div>
    <ul class="quick" aria-label="Quick links">{quick}</ul>
    <div class="socials">{socials}</div>
  </div>
</div></section>

<section class="sec sec--alt" aria-labelledby="port-h"><div class="wrap">
  <div class="sec__h"><div><span class="eyebrow">Portfolio</span><h2 id="port-h">Explore the work</h2></div><a class="link" href="{B}/portfolio">View all {SV['arrow']}</a></div>
  <div class="cats" data-render="cats"></div>
</div></section>

<section class="sec" aria-labelledby="feat-h"><div class="wrap">
  <div class="sec__h"><div><span class="eyebrow">Featured</span><h2 id="feat-h">Selected photographs</h2></div></div>
  <div class="grid" data-render="featured"></div>
  <p style="margin-top:20px;text-align:center"><a class="btn" href="{B}/portfolio">See the full portfolio</a></p>
</div></section>

<section class="sec sec--alt" id="about" aria-labelledby="about-h"><div class="wrap about">
  {viewer(cfg['about_photo'], 'aboutimg', 'About ' + pr['name'], '(max-width: 960px) 100vw, 40vw', 'about__ph reveal')}
  <div class="about__txt"><span class="eyebrow">About</span><h2 id="about-h">{E(cfg['about_title'])}</h2><div style="margin-top:14px">{about_p}</div>
    <dl class="facts">{facts}</dl>
    <p style="margin-top:20px"><a class="link" href="{B}/about">More about {E(first)} {SV['arrow']}</a></p></div>
</div></section>

<section class="sec" aria-labelledby="svc-h"><div class="wrap">
  <div class="sec__h"><div><span class="eyebrow">Services</span><h2 id="svc-h">Services &amp; rates</h2><p>{E(cfg['svc_intro'])}</p></div></div>
  <ul class="svcs" data-render="svcs"></ul>
  <div class="rates-top" style="margin-top:20px"><a class="btn btn--dark" href="{B}/rates">See the full rate card</a>{pdf}</div>
</div></section>

<section class="sec sec--alt" aria-labelledby="brands-h"><div class="wrap">
  <div class="sec__h"><div><span class="eyebrow">Partners</span><h2 id="brands-h">Brands worked with</h2></div></div>
  <div class="brands" data-render="brands"></div>
</div></section>
{cta}</main>
''' + foot

    # ---------- PORTFOLIO ----------
    port = head('Portfolio — ' + pr['name'], cfg['port_desc'], B + '/portfolio') + '<body>\n' + header('portfolio') + f'''<main id="main">
<div class="wrap phead"><span class="eyebrow">Portfolio</span><h1>{E(pr['name'])}’s work</h1><p>{E(cfg['port_intro'])}</p></div>
<nav class="tabs" aria-label="Portfolio categories"><div class="wrap tabs__in" data-tabs></div></nav>
<div class="wrap chapters" data-chapters aria-live="polite"></div>
<noscript><div class="wrap"><p>Turn on JavaScript to see the photographs.</p></div></noscript>
{cta}</main>
''' + foot

    # ---------- ABOUT ----------
    about_long = ''.join(f'<p>{E(x)}</p>' for x in cfg['about_long'])
    aboutpg = head('About — ' + pr['name'], cfg['about_desc'], B + '/about', ld=True) + '<body>\n' + header('about') + f'''<main id="main">
<section class="sec" style="padding-top:28px" aria-labelledby="ab-h"><div class="wrap about">
  {viewer(cfg['about_photo'], 'aboutimg', 'About ' + pr['name'], '(max-width: 960px) 100vw, 40vw', 'about__ph')}
  <div class="about__txt"><span class="eyebrow">About</span><h1 id="ab-h" style="font-size:clamp(34px,5vw,52px);margin-top:6px">{E(pr['name'])}</h1>
    <ul class="roles" aria-label="Roles">{roles}</ul>
    <div style="margin-top:18px">{about_long}</div>
    <dl class="facts">{facts}</dl>
    <div class="profile__cta"><a class="btn btn--dark" href="{B}/contact">Work with {E(first)}</a><a class="btn" href="{B}/portfolio">View portfolio</a></div>
    <div class="socials">{socials}</div>
  </div>
</div></section>
<section class="sec sec--alt" aria-labelledby="do-h"><div class="wrap">
  <div class="sec__h"><div><span class="eyebrow">Services</span><h2 id="do-h">What {E(first)} offers</h2></div><a class="link" href="{B}/rates">Rates {SV['arrow']}</a></div>
  <ul class="chips" data-render="chips"></ul>
</div></section>
<section class="sec" aria-labelledby="cat-h"><div class="wrap">
  <div class="sec__h"><div><span class="eyebrow">Portfolio</span><h2 id="cat-h">Areas of work</h2></div><a class="link" href="{B}/portfolio">View all {SV['arrow']}</a></div>
  <div class="cats" data-render="cats"></div>
</div></section>
<section class="sec sec--alt" aria-labelledby="brands-h"><div class="wrap">
  <div class="sec__h"><div><span class="eyebrow">Partners</span><h2 id="brands-h">Brands worked with</h2></div></div>
  <div class="brands" data-render="brands"></div>
</div></section>
{cfg.get('credits_html','')}{cta}</main>
''' + foot

    # ---------- RATES ----------
    rates = head('Services & Rates — ' + pr['name'], cfg['rates_desc'], B + '/rates') + '<body>\n' + header('rates') + f'''<main id="main">
<div class="wrap phead"><span class="eyebrow">Services &amp; rates</span><h1>Rate card</h1><p>{E(cfg['rates_intro'])}</p>
  <div class="rates-top"><a class="btn btn--dark" href="{B}/contact#enquire">Send an enquiry</a>{pdf}</div></div>
<div class="wrap rates-wrap" style="padding-bottom:24px">
  <nav class="rjump" aria-label="Rate card sections" data-render="rjump"></nav>
  <div>
    <div data-render="rates"></div>
    <div class="terms reveal" id="terms"><h2>Booking terms</h2><ul data-terms></ul></div>
    <p class="note">{E(cfg['rates_note'])}</p>
  </div>
</div>
<noscript><div class="wrap"><p>Turn on JavaScript to see the rate card.</p></div></noscript>
{cta}</main>
''' + foot

    # ---------- CONTACT ----------
    ch = [('mail', 'mailto:' + C['email'], 'Email', C['email']), ('wa', wa, 'WhatsApp', C['phone']), ('phone', 'tel:' + C['tel'], 'Call', C['phone']),
          ('ig', C['instagram'][1], 'Instagram', C['instagram'][0]), ('tt', C['tiktok'][1], 'TikTok', C['tiktok'][0])]
    if C.get('x'): ch.append(('x', C['x'][1], 'X', C['x'][0]))
    if C.get('email2'): ch.append(('mail', 'mailto:' + C['email2'], 'Also by email', C['email2']))
    chan = ''.join(f'<li><a href="{h}"' + (' target="_blank" rel="noopener"' if h.startswith('http') else '') + f'><span class="ic">{SV[i]}</span><span><small>{E(l)}</small><b>{E(v)}</b></span></a></li>' for i, h, l, v in ch)
    chan += f'<li><div><span class="ic">{SV["pin"]}</span><span><small>Based in</small><b>{E(pr["location"])}</b></span></div></li>'
    note = cfg['form_note']
    contact = head('Contact — ' + pr['name'], cfg['contact_desc'], B + '/contact') + '<body>\n' + header('contact') + f'''<main id="main">
<div class="wrap phead"><span class="eyebrow">Contact</span><h1>Let’s work together</h1><p>{E(cfg['contact_intro'])}</p>
  <div class="rates-top"><a class="btn btn--wa" href="{wa}" target="_blank" rel="noopener">{SV['wa']}WhatsApp</a><a class="btn" href="mailto:{C['email']}">{SV['mail']}Email</a></div></div>
<div class="wrap ct" style="margin-top:28px">
  <ul class="chan" aria-label="Contact details">{chan}</ul>
  <div class="formbox" id="enquire">
    <span class="eyebrow">Brand enquiry</span><h2>Tell {E(first)} about your project</h2><p class="muted">{E(cfg['form_intro'])}</p>
    <form class="form" data-enquiry novalidate>
      <div class="f"><label for="f-name">Your name</label><input id="f-name" name="Name" autocomplete="name" required aria-describedby="e-name"><span class="f__err" id="e-name" data-err="Name"></span></div>
      <div class="f"><label for="f-email">Email</label><input id="f-email" name="Email" type="email" autocomplete="email" required aria-describedby="e-email"><span class="f__err" id="e-email" data-err="Email"></span></div>
      <div class="f"><label for="f-brand">Brand or company <i>(optional)</i></label><input id="f-brand" name="Brand" autocomplete="organization"></div>
      <div class="f"><label for="f-phone">Phone / WhatsApp <i>(optional)</i></label><input id="f-phone" name="Phone" type="tel" autocomplete="tel"></div>
      <div class="f"><label for="f-service">Service <i>(optional)</i></label><select id="f-service" name="Service"><option value="">Choose a service (optional)</option></select></div>
      <div class="f"><label for="f-date">Date or timing <i>(optional)</i></label><input id="f-date" name="Preferred date" placeholder="e.g. 12 December, or early next month"></div>
      <div class="f"><label for="f-details">Project details</label><textarea id="f-details" name="Details" required aria-describedby="e-details" placeholder="What you’d like to create, where, and anything else {E(first)} should know."></textarea><span class="f__err" id="e-details" data-err="Details"></span></div>
      <div class="hp" aria-hidden="true"><label for="f-hp">Leave this empty</label><input id="f-hp" name="_honey" tabindex="-1" autocomplete="off"></div>
      <div class="status" data-status role="alert" tabindex="-1" hidden></div>
      <div class="form__foot"><button class="btn btn--dark" type="submit">Send enquiry {SV['arrow']}</button><p>{E(note)}</p></div>
    </form>
  </div>
</div>
</main>
''' + foot

    for n, s in [('index.html', home), ('portfolio.html', port), ('about.html', aboutpg), ('rates.html', rates), ('contact.html', contact)]:
        open(OUT + n, 'w').write(s)
    # data.js
    data = {'base': B, 'img': IMG, 'site': cfg['site'], 'profile': {'name': pr['name'], 'first': first}, 'form': cfg['form'],
            'PHOTOS': P, 'CATEGORIES': cfg['categories'], 'FEATURED': cfg['featured'], 'SERVICES': cfg['services'], 'RATES': cfg['rates'],
            'TERMS': cfg['terms'], 'BRANDS': cfg['brands'], 'CONTACT': {'email': C['email'], 'wa': C['wa']}}
    open(OUT + 'assets/data.js', 'w').write(cfg['data_header'] + 'window.PF = ' + json.dumps(data, indent=1, ensure_ascii=False) + ';\n')
    shutil.copy(os.path.join(HERE, 'pf.css'), OUT + 'assets/pf.css')
    shutil.copy(os.path.join(HERE, 'pf.js'), OUT + 'assets/pf.js')
    print('built', OUT)

if __name__ == '__main__':
    build(load(sys.argv[1]))
