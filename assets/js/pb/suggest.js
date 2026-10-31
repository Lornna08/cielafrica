/* ============================================================
   CIEL PHOTO BOOKS — design suggestions
   Built-in suggestions work with no AI service: they only reuse words
   the customer typed (places, years, their own sentence) and generic
   phrases. They never invent names, dates, relationships or events.
   When an AI provider is configured on the server, its suggestions are
   used instead (only the text description is sent, never photos).
   ============================================================ */
(function (root) {
  'use strict';
  var PLACES = {
    zanzibar: 'zanzibar-blue', 'stone town': 'zanzibar-blue', paris: 'paris-rose', 'cape town': 'cape-coral', amsterdam: 'amsterdam-canal',
    diani: 'diani-shore', mombasa: 'diani-shore', watamu: 'diani-shore', malindi: 'diani-shore', kilifi: 'diani-shore', lamu: 'lamu-dhow',
    'maasai mara': 'savanna-gold', 'masai mara': 'savanna-gold', mara: 'savanna-gold', serengeti: 'savanna-gold', amboseli: 'savanna-gold', tsavo: 'savanna-gold', samburu: 'savanna-gold', safari: 'savanna-gold',
    nairobi: null, naivasha: null, nakuru: null, kisumu: null, nanyuki: null, kigali: null, kampala: null, 'dar es salaam': null, arusha: null, london: null, dubai: null, 'new york': null, lagos: null, accra: null, johannesburg: null, marrakech: null, rome: null, barcelona: null, lisbon: null, istanbul: null, bali: null
  };
  var KINDS = [
    ['wedding', /\b(wedding|married|marry|bride|groom|engage(d|ment)|vows|honeymoon)\b/i, ['ivory-vows', 'love-letter', 'gallery-white']],
    ['baby', /\b(baby|newborn|first year|born|infant|pregnan\w*|toddler)\b/i, ['first-year', 'gallery-white', 'crayon-days']],
    ['graduation', /\b(graduat\w*|degree|universit\w*|campus|class of|diploma)\b/i, ['cap-and-gown', 'year-in-review', 'good-company']],
    ['celebration', /\b(birthday|party|celebrat\w*|turning \d+|anniversary party)\b/i, ['confetti', 'good-company', 'crayon-days']],
    ['love', /\b(relationship|love|anniversar\w*|together|boyfriend|girlfriend|partner|husband|wife|fianc\w*)\b/i, ['love-letter', 'ivory-vows', 'gallery-white']],
    ['childhood', /\b(childhood|growing up|grew up|kids?|children|school days|when i was)\b/i, ['crayon-days', 'family-table', 'first-year']],
    ['friendship', /\b(friends?|friendship|besties|crew|squad|girls'? trip|boys'? trip)\b/i, ['good-company', 'confetti', 'year-in-review']],
    ['family', /\b(family|mum|mom|dad|parents|grand(ma|pa|parents|mother|father)|cousins|reunion|siblings)\b/i, ['family-table', 'first-year', 'gallery-white']],
    ['portfolio', /\b(portfolio|photograph(y|er)|shoots?|my work|editorial)\b/i, ['portfolio-mono', 'gallery-white', 'year-in-review']],
    ['life', /\b(recap|life at|my life|year in|this year|twenty|thirty|forty|\d{2}th)\b/i, ['year-in-review', 'gallery-white', 'portfolio-mono']],
    ['travel', /\b(trip|holiday|vacation|travel\w*|safari|beach|journey|visit\w*|tour|road ?trip|abroad|getaway)\b/i, ['diani-shore', 'zanzibar-blue', 'savanna-gold']]
  ];
  var POOL = {
    wedding: [['Our Wedding', 'we'], ['The Wedding'], ['I Do'], ['Happily Ever After'], ['The Best Day'], ['Two Hearts']],
    baby: [['The First Year'], ['Hello, Little One'], ['Tiny Moments'], ['Small Wonders'], ['Our Little One', 'we']],
    graduation: [['The Graduate'], ['Cap & Gown'], ['The Road to Graduation'], ['Onwards']],
    celebration: [['Celebrate'], ['Another Trip Around the Sun'], ['The Party'], ['Good Times']],
    love: [['Our Story', 'we'], ['Us', 'we'], ['You & Me'], ['Love, Always'], ['Side by Side']],
    childhood: [['Growing Up'], ['The Early Years'], ['Once Upon a Childhood'], ['Little Days']],
    friendship: [['Good Company'], ['The Crew'], ['Friends Like These'], ['Better Together']],
    family: [['Our Family', 'we'], ['Family'], ['Home'], ['Where We Belong', 'we']],
    portfolio: [['Selected Work'], ['Portfolio'], ['Through the Lens'], ['Frames']],
    life: [['A Year in Pictures'], ['Life Lately'], ['Chapters'], ['The Good Days']],
    travel: [['Postcards'], ['Wanderlust'], ['Somewhere New'], ['Far & Wide']],
    any: [['Moments Worth Keeping'], ['Little Moments'], ['Snapshots'], ['The Good Days'], ['Memories'], ['Keepsake']]
  };
  var DEDIC = ['For the people in these pages.', 'For everyone who was there.', 'To many more.', 'Made to remember.', 'For the moments we never want to forget.'];

  function rng(seed) { var a = (seed >>> 0) || 7; return function () { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cap(s) { return s.replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); }); }

  function analyse(desc) {
    var d = String(desc || ''), low = d.toLowerCase(), kinds = [], places = [], years = [];
    KINDS.forEach(function (k) { if (k[1].test(d)) kinds.push(k[0]); });
    var found = [];
    Object.keys(PLACES).sort(function (a, b) { return b.length - a.length; }).forEach(function (p) { var m = new RegExp('\\b' + p + '\\b', 'i').exec(low); if (m && !found.some(function (x) { return x.p.indexOf(p) >= 0; })) found.push({ p: p, at: m.index }); });
    found.sort(function (a, b) { return a.at - b.at; }).forEach(function (x) { places.push(cap(x.p)); });
    (d.match(/\b(19[5-9]\d|20[0-4]\d)\b/g) || []).forEach(function (y) { if (years.indexOf(y) < 0) years.push(y); });
    var we = /\b(we|our|us)\b/i.test(d);
    var sentence = (d.split(/[.!?\n]/)[0] || '').trim();
    if (places.length && kinds.indexOf('travel') < 0) kinds.push('travel');
    return { kinds: kinds, places: places, years: years, we: we, sentence: sentence.length >= 8 && sentence.length <= 70 ? sentence : '' };
  }

  function local(input, seed, cfg) {
    var a = analyse(input.description), r = rng(seed || 1), titles = [], subs = [], tpls = [];
    var place = a.places[0], year = a.years[0];
    if (input.title) titles.push(input.title.trim());
    if (place) { titles.push(place); titles.push(place + ' Days'); if (year) titles.push(place + ' ' + year); titles.push('Postcards from ' + place); }
    a.kinds.forEach(function (k) { (POOL[k] || []).forEach(function (t) { if (!t[1] || a.we) titles.push(t[0]); }); });
    if (year && a.kinds.indexOf('life') >= 0) titles.unshift(year + ' in Pictures');
    if (year && a.kinds.indexOf('graduation') >= 0) titles.unshift('Class of ' + year);
    shuffle(POOL.any, r).forEach(function (t) { titles.push(t[0]); });
    var seen = {}; titles = titles.filter(function (t) { var k = t.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
    var head = titles.slice(0, input.title ? 1 : 0), rest = titles.slice(head.length);
    rest = rest.slice(0, 3).concat(shuffle(rest.slice(3), r));
    titles = head.concat(rest).slice(0, 6);
    if (year) subs.push(year);
    if (place && year) subs.push(place + ' · ' + year);
    if (a.sentence) subs.push(a.sentence.charAt(0).toUpperCase() + a.sentence.slice(1));
    a.places.forEach(function (p) { if (PLACES[p.toLowerCase()]) tpls.push(PLACES[p.toLowerCase()]); });
    a.kinds.forEach(function (k) { KINDS.forEach(function (K) { if (K[0] === k) tpls = tpls.concat(K[2]); }); });
    tpls = tpls.concat(['gallery-white', 'portfolio-mono', 'blank']);
    var vis = {}; ((cfg && cfg.templates) || []).forEach(function (t) { if (t.visible !== false) vis[t.id] = 1; });
    var ts = {}; tpls = tpls.filter(function (t) { if (ts[t] || (cfg && !vis[t])) return false; ts[t] = 1; return true; }).slice(0, 4);
    var k0 = a.kinds[0] || 'any';
    var density = { wedding: 'airy', baby: 'airy', portfolio: 'airy', love: 'airy', friendship: 'full', celebration: 'full', life: 'full' }[k0] || 'balanced';
    return {
      source: 'built-in', titles: titles, subtitles: subs, dedications: shuffle(DEDIC, r).slice(0, 3), templates: tpls,
      density: density, sections: a.years.length || a.places.length > 1 ? 'Group photos by date or place into short chapters.' : 'Keep photos in the order you choose; add section pages wherever you like.',
      notes: describe(a), analysis: { kinds: a.kinds, places: a.places, years: a.years }
    };
  }
  function describe(a) {
    var bits = [];
    if (a.places.length) bits.push('places you mentioned (' + a.places.join(', ') + ')');
    if (a.years.length) bits.push('the year' + (a.years.length > 1 ? 's' : '') + ' you wrote (' + a.years.join(', ') + ')');
    if (a.kinds.length) bits.push('the kind of book it sounds like (' + a.kinds.join(', ') + ')');
    return bits.length ? 'Based on ' + bits.join(', ') + '.' : 'General ideas — add a few words about your book for more specific ones.';
  }

  /** server AI (if configured). Resolves to null when unavailable so the caller falls back to built-in ideas. */
  function ai(input, seed) {
    return fetch('/api/photobooks?route=suggest', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ciel' }, body: JSON.stringify({ description: String(input.description || '').slice(0, 1500), title: String(input.title || '').slice(0, 120), seed: seed }) })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (j) { return j && j.ok && j.suggestions ? j.suggestions : null; })
      .catch(function () { return null; });
  }
  function status() { return fetch('/api/photobooks?route=caps', { headers: { 'X-Requested-With': 'ciel' } }).then(function (r) { return r.json(); }).catch(function () { return {}; }); }

  root.PBSuggest = { local: local, ai: ai, analyse: analyse, status: status };
})(self);
