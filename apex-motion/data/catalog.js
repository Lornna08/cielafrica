/* ==========================================================================
   APEX MOTION — template catalogue
   Fictional brands and products for demonstration only. Prices in the store
   currency (config.currency). Ratings and reviews are SAMPLE data.
   Replace this file (or load it from an API) for a production store.
   ========================================================================== */
window.APEX = window.APEX || {};

APEX.categories = [
  { id: 'wheels', name: 'Wheels', icon: 'wheel', blurb: 'Forged, flow-formed and cast wheels, listed by bolt pattern and offset.' },
  { id: 'tyres', name: 'Tyres', icon: 'tyre', blurb: 'Street, winter and track compounds in the sizes enthusiasts actually run.' },
  { id: 'performance', name: 'Performance', icon: 'piston', blurb: 'Intakes, exhausts and engine-bay parts that make a measurable difference.' },
  { id: 'suspension', name: 'Suspension', icon: 'spring', blurb: 'Coilovers, springs and dampers to set ride height and control.' },
  { id: 'brakes', name: 'Brakes', icon: 'disc', blurb: 'Big-brake kits, discs and pads for road and track.' },
  { id: 'exterior', name: 'Exterior', icon: 'lamp', blurb: 'Lighting and exterior upgrades.' },
  { id: 'interior', name: 'Interior', icon: 'seat', blurb: 'Seats, harnesses and the touch points you use every drive.' },
  { id: 'accessories', name: 'Accessories', icon: 'tool', blurb: 'Gloves, tools and trackside kit.' }
];

APEX.brands = [
  { id: 'apex-forged', name: 'Apex Forged', origin: 'House brand', blurb: 'Our own forged and flow-formed wheel programme, specified in-house.' },
  { id: 'kestrel', name: 'Kestrel Wheelworks', origin: 'Wheels', blurb: 'Lightweight mesh and split-spoke designs with a motorsport brief.' },
  { id: 'torvik', name: 'Torvik', origin: 'Tyres', blurb: 'Street, winter and semi-slick compounds.' },
  { id: 'halden', name: 'Halden Brakes', origin: 'Braking', blurb: 'Calipers, two-piece discs and pads.' },
  { id: 'strata', name: 'Strata Lab', origin: 'Suspension', blurb: 'Coilovers and dampers tuned on road and track.' },
  { id: 'okami', name: 'Okami Racing', origin: 'Exhaust & intake', blurb: 'Titanium exhausts, intakes and engine-bay parts.' },
  { id: 'lumen', name: 'Lumen Auto', origin: 'Lighting', blurb: 'LED lighting upgrades.' },
  { id: 'pitlane', name: 'Pitlane Supply', origin: 'Interior & tools', blurb: 'Seats, harnesses, gloves and trackside tools.' }
];

/* Sample vehicles for the fitment finder. Specs are typical published values,
   included for demonstration; always confirm against the vehicle itself. */
APEX.vehicles = [
  { id: 'bmw-m3-g80', make: 'BMW', model: 'M3 (G80)', years: [2021, 2025], type: 'coupe', bolt: '5x112', cb: 66.6, diameters: [18, 19, 20] },
  { id: 'toyota-supra-a90', make: 'Toyota', model: 'GR Supra (A90)', years: [2019, 2025], type: 'coupe', bolt: '5x112', cb: 66.5, diameters: [18, 19] },
  { id: 'porsche-911-992', make: 'Porsche', model: '911 (992)', years: [2019, 2025], type: 'gt', bolt: '5x130', cb: 71.6, diameters: [20, 21] },
  { id: 'nissan-gtr-r35', make: 'Nissan', model: 'GT-R (R35)', years: [2009, 2024], type: 'gt', bolt: '5x114.3', cb: 66.1, diameters: [20] },
  { id: 'honda-civic-fl5', make: 'Honda', model: 'Civic Type R (FL5)', years: [2023, 2025], type: 'coupe', bolt: '5x120', cb: 64.1, diameters: [18, 19] },
  { id: 'subaru-wrx-vb', make: 'Subaru', model: 'WRX (VB)', years: [2022, 2025], type: 'coupe', bolt: '5x114.3', cb: 56.1, diameters: [18] },
  { id: 'ford-mustang-s650', make: 'Ford', model: 'Mustang (S650)', years: [2024, 2025], type: 'gt', bolt: '5x114.3', cb: 70.5, diameters: [19, 20] },
  { id: 'audi-rs3-8y', make: 'Audi', model: 'RS 3 (8Y)', years: [2022, 2025], type: 'coupe', bolt: '5x112', cb: 57.1, diameters: [19] },
  { id: 'toyota-lc300', make: 'Toyota', model: 'Land Cruiser (300)', years: [2022, 2025], type: 'suv', bolt: '6x139.7', cb: 95.1, diameters: [18, 20, 22] },
  { id: 'range-rover-l460', make: 'Land Rover', model: 'Range Rover (L460)', years: [2022, 2025], type: 'suv', bolt: '5x120', cb: 72.6, diameters: [21, 22] }
];

APEX.vehicleTypes = [
  { id: 'coupe', name: 'Coupés', icon: 'coupe', image: 'img/hero/coupe.webp',
    alt: 'Black widebody sports coupé on a studio floor',
    specs: [
      { t: 'GT wing · 3-way adjustable', x: 12, y: 18 },
      { t: 'Forged 6-spoke · R18 · 8.1 kg', x: 22, y: 64 },
      { t: 'Carbon splitter · 3 mm', x: 66, y: 74 }
    ] },
  { id: 'gt', name: 'Grand tourers', icon: 'gt', image: 'img/hero/gt.webp',
    alt: 'White grand-touring coupé in profile with black wheels',
    specs: [
      { t: 'Flow-formed mesh · R20 / R21', x: 14, y: 70 },
      { t: '6-piston calipers · 410 mm discs', x: 62, y: 80 },
      { t: 'Ducktail spoiler · active', x: 8, y: 36 }
    ] },
  { id: 'suv', name: 'SUVs', icon: 'suv', image: 'img/hero/suv.webp',
    alt: 'Black luxury SUV on a studio floor',
    specs: [
      { t: 'Monoblock R22 · 1,000 kg load', x: 46, y: 70 },
      { t: 'Air-suspension lowering links', x: 64, y: 44 },
      { t: 'Dual-ring LED lamps', x: 8, y: 50 }
    ] }
];

/* p(id, name, brand, category, price, extra) — compact product factory */
(function () {
  var P = [];
  function p(id, name, brand, cat, price, x) {
    var o = { id: id, slug: slugify(name), name: name, brand: brand, category: cat, price: price, image: 'img/products/' + id + '.webp' };
    for (var k in x) o[k] = x[k];
    P.push(o);
  }
  function slugify(s) { return s.toLowerCase().replace(/[″"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  var ring = 'Supplied with hub-centric rings for common centre bores.';

  /* ---------------- WHEELS ---------------- */
  p('w-04', 'Forged Monoblock R19', 'apex-forged', 'wheels', 890, { unit: 'per wheel', tags: ['forged', 'track'], created: 6, pop: 98, rating: 4.9, reviews: 64, stock: 18,
    desc: 'A single-piece wheel forged from 6061-T6 aluminium, with a twin-spoke face machined for brake clearance. Light enough to feel on turn-in, strong enough for track days.',
    finishes: [{ n: 'Brushed silver', c: '#C9CBCC' }, { n: 'Satin black', c: '#222' }, { n: 'Bronze', c: '#8C6A3D' }],
    sizes: ['19 × 8.5 ET35', '19 × 9.5 ET40', '19 × 10 ET45'],
    fit: { diameter: 19, bolts: ['5x112', '5x114.3', '5x120'], cb: 72.6, weight: '8.9 kg', load: '725 kg' },
    specs: { Construction: 'Forged monoblock, 6061-T6', Diameter: '19 in', Widths: '8.5 / 9.5 / 10 in', Offsets: 'ET35 / ET40 / ET45', 'Bolt patterns': '5×112, 5×114.3, 5×120', 'Centre bore': '72.6 mm (rings included)', Weight: 'from 8.9 kg', 'Load rating': '725 kg per wheel' } });
  p('w-08', 'FlowForm Split-6 R20', 'kestrel', 'wheels', 740, { unit: 'per wheel', tags: ['street'], created: 12, pop: 91, rating: 4.7, reviews: 41, stock: 24,
    desc: 'Six split spokes with a flow-formed barrel: the strength of a pressure-rolled rim at a cast-wheel price.',
    finishes: [{ n: 'Graphite', c: '#4A4B4D' }, { n: 'Gloss black', c: '#111' }],
    sizes: ['20 × 9 ET35', '20 × 10 ET40'],
    fit: { diameter: 20, bolts: ['5x112', '5x114.3', '5x120'], cb: 72.6, weight: '10.6 kg', load: '750 kg' },
    specs: { Construction: 'Flow-formed, low-pressure cast centre', Diameter: '20 in', Widths: '9 / 10 in', Offsets: 'ET35 / ET40', 'Bolt patterns': '5×112, 5×114.3, 5×120', 'Centre bore': '72.6 mm (rings included)', Weight: 'from 10.6 kg', 'Load rating': '750 kg per wheel' } });
  p('w-06', 'Track Mesh R18', 'kestrel', 'wheels', 560, { unit: 'per wheel', tags: ['track', 'forged'], created: 20, pop: 88, rating: 4.8, reviews: 52, stock: 9,
    desc: 'A classic cross-spoke mesh with a deep polished lip. Two-piece construction lets us build width and offset to order.',
    finishes: [{ n: 'Satin gold', c: '#B28C3A' }, { n: 'Silver', c: '#BFC2C4' }],
    sizes: ['18 × 8.5 ET30', '18 × 9.5 ET25'],
    fit: { diameter: 18, bolts: ['5x112', '5x114.3', '5x120'], cb: 72.6, weight: '9.4 kg', load: '690 kg' },
    specs: { Construction: 'Two-piece, forged centre', Diameter: '18 in', Widths: '8.5 / 9.5 in', Offsets: 'ET30 / ET25', 'Bolt patterns': '5×112, 5×114.3, 5×120', 'Centre bore': '72.6 mm (rings included)', Weight: 'from 9.4 kg', 'Load rating': '690 kg per wheel' } });
  p('w-03', 'StreetForm R19', 'apex-forged', 'wheels', 560, { unit: 'per wheel', tags: ['street'], created: 30, pop: 84, rating: 4.6, reviews: 37, stock: 32,
    desc: 'Five twin spokes that run to the very edge of the rim, for the widest possible look on a 19-inch wheel.',
    finishes: [{ n: 'Gloss black', c: '#111' }, { n: 'Gunmetal', c: '#55575A' }],
    sizes: ['19 × 8.5 ET35', '19 × 9.5 ET40'],
    fit: { diameter: 19, bolts: ['5x112', '5x120'], cb: 72.6, weight: '11.2 kg', load: '690 kg' },
    specs: { Construction: 'Flow-formed', Diameter: '19 in', Widths: '8.5 / 9.5 in', Offsets: 'ET35 / ET40', 'Bolt patterns': '5×112, 5×120', 'Centre bore': '72.6 mm (rings included)', Weight: 'from 11.2 kg', 'Load rating': '690 kg per wheel' } });
  p('w-09', 'Apex Aero R20', 'apex-forged', 'wheels', 980, { unit: 'per wheel', tags: ['forged'], created: 3, pop: 86, rating: 4.8, reviews: 18, stock: 6, badge: 'New',
    desc: 'Ten blade spokes shaped to pull air across the brakes. Forged, then polished by hand.',
    finishes: [{ n: 'Polished titanium', c: '#9EA3A8' }, { n: 'Satin black', c: '#222' }],
    sizes: ['20 × 9 ET40', '20 × 10.5 ET45'],
    fit: { diameter: 20, bolts: ['5x112', '5x114.3', '5x130'], cb: 71.6, weight: '9.8 kg', load: '780 kg' },
    specs: { Construction: 'Forged monoblock, 6061-T6', Diameter: '20 in', Widths: '9 / 10.5 in', Offsets: 'ET40 / ET45', 'Bolt patterns': '5×112, 5×114.3, 5×130', 'Centre bore': '71.6 mm (rings included)', Weight: 'from 9.8 kg', 'Load rating': '780 kg per wheel' } });
  p('w-02', 'Apex Aero Diamond R21', 'apex-forged', 'wheels', 1240, { unit: 'per wheel', tags: ['forged'], created: 9, pop: 80, rating: 4.9, reviews: 14, stock: 4,
    desc: 'A web-spoke forged design with a diamond-cut face. Sized for big-brake grand tourers.',
    finishes: [{ n: 'Diamond-cut black', c: '#1B1B1B' }],
    sizes: ['21 × 9 ET50', '21 × 11.5 ET60'],
    fit: { diameter: 21, bolts: ['5x130', '5x112'], cb: 71.6, weight: '10.9 kg', load: '800 kg' },
    specs: { Construction: 'Forged monoblock, diamond-cut', Diameter: '21 in', Widths: '9 / 11.5 in', Offsets: 'ET50 / ET60', 'Bolt patterns': '5×130, 5×112', 'Centre bore': '71.6 mm', Weight: 'from 10.9 kg', 'Load rating': '800 kg per wheel' } });
  p('w-01', 'Circuit Spec R20', 'apex-forged', 'wheels', 1180, { unit: 'per wheel', tags: ['track', 'forged'], created: 15, pop: 90, rating: 4.9, reviews: 27, stock: 8,
    desc: 'Ten-spoke forged wheel with a centre-lock look and a lava-orange powder coat that stays bright after a season of brake dust.',
    finishes: [{ n: 'Lava orange', c: '#D9541E' }, { n: 'Satin black', c: '#222' }],
    sizes: ['20 × 9.5 ET50', '20 × 12 ET47'],
    fit: { diameter: 20, bolts: ['5x130'], cb: 71.6, weight: '9.3 kg', load: '780 kg' },
    specs: { Construction: 'Forged monoblock', Diameter: '20 in', Widths: '9.5 / 12 in', Offsets: 'ET50 / ET47', 'Bolt patterns': '5×130', 'Centre bore': '71.6 mm', Weight: 'from 9.3 kg', 'Load rating': '780 kg per wheel' } });
  p('w-07', 'Circuit Mesh R18', 'kestrel', 'wheels', 610, { unit: 'per wheel', tags: ['track'], created: 40, pop: 89, rating: 4.7, reviews: 73, stock: 20,
    desc: 'A Y-spoke mesh with a low centre and a strong outer lip. Clears most factory big brakes in 18 inch.',
    finishes: [{ n: 'Gunmetal', c: '#5B6168' }, { n: 'Silver', c: '#BFC2C4' }],
    sizes: ['18 × 8.5 ET40', '18 × 9.5 ET38'],
    fit: { diameter: 18, bolts: ['5x112', '5x114.3', '5x120'], cb: 72.6, weight: '8.6 kg', load: '690 kg' },
    specs: { Construction: 'Flow-formed', Diameter: '18 in', Widths: '8.5 / 9.5 in', Offsets: 'ET40 / ET38', 'Bolt patterns': '5×112, 5×114.3, 5×120', 'Centre bore': '72.6 mm (rings included)', Weight: 'from 8.6 kg', 'Load rating': '690 kg per wheel' } });
  p('w-05', 'FlowForm Y-Spoke R19', 'kestrel', 'wheels', 640, { unit: 'per wheel', tags: ['street'], created: 25, pop: 82, rating: 4.6, reviews: 29, stock: 16,
    desc: 'Seven Y-spokes and a concave face that grows deeper with width.',
    finishes: [{ n: 'Hyper silver', c: '#C3C6C8' }, { n: 'Gloss black', c: '#111' }],
    sizes: ['19 × 8.5 ET40', '19 × 9.5 ET42'],
    fit: { diameter: 19, bolts: ['5x112', '5x114.3'], cb: 66.6, weight: '10.1 kg', load: '700 kg' },
    specs: { Construction: 'Flow-formed', Diameter: '19 in', Widths: '8.5 / 9.5 in', Offsets: 'ET40 / ET42', 'Bolt patterns': '5×112, 5×114.3', 'Centre bore': '66.6 mm', Weight: 'from 10.1 kg', 'Load rating': '700 kg per wheel' } });
  p('w-10', 'Grand Touring 20-Spoke R20', 'apex-forged', 'wheels', 820, { unit: 'per wheel', tags: ['forged'], created: 50, pop: 70, rating: 4.5, reviews: 12, stock: 10,
    desc: 'Twenty fine spokes and a mirror-polished face for touring builds that want to look as good parked as moving.',
    finishes: [{ n: 'Chrome-polished', c: '#D7D9DB' }],
    sizes: ['20 × 9 ET35', '20 × 10 ET40'],
    fit: { diameter: 20, bolts: ['5x112', '5x114.3', '5x120'], cb: 72.6, weight: '11.8 kg', load: '750 kg' },
    specs: { Construction: 'Forged, polished', Diameter: '20 in', Widths: '9 / 10 in', Offsets: 'ET35 / ET40', 'Bolt patterns': '5×112, 5×114.3, 5×120', 'Centre bore': '72.6 mm (rings included)', Weight: 'from 11.8 kg', 'Load rating': '750 kg per wheel' } });
  p('w-11', 'Rally Y-Mesh R18', 'kestrel', 'wheels', 540, { unit: 'per wheel', tags: ['street', 'essentials'], created: 60, pop: 76, rating: 4.6, reviews: 58, stock: 28,
    desc: 'A durable cast Y-mesh that works on daily drivers and weekend cars alike.',
    finishes: [{ n: 'Silver', c: '#BFC2C4' }, { n: 'Matte bronze', c: '#7E6440' }],
    sizes: ['18 × 8 ET45', '18 × 8.5 ET40'],
    fit: { diameter: 18, bolts: ['5x114.3', '5x112'], cb: 73.1, weight: '9.9 kg', load: '690 kg' },
    specs: { Construction: 'Low-pressure cast', Diameter: '18 in', Widths: '8 / 8.5 in', Offsets: 'ET45 / ET40', 'Bolt patterns': '5×114.3, 5×112', 'Centre bore': '73.1 mm (rings included)', Weight: 'from 9.9 kg', 'Load rating': '690 kg per wheel' } });
  p('w-12', 'Shadow Five R20', 'apex-forged', 'wheels', 690, { unit: 'per wheel', tags: ['street'], created: 18, pop: 78, rating: 4.7, reviews: 21, stock: 0,
    desc: 'Five split spokes in satin black. Understated on a dark car, dramatic on a light one.',
    finishes: [{ n: 'Satin black', c: '#222' }],
    sizes: ['20 × 9 ET35', '20 × 10 ET38'],
    fit: { diameter: 20, bolts: ['5x114.3', '5x120'], cb: 72.6, weight: '11.0 kg', load: '750 kg' },
    specs: { Construction: 'Flow-formed', Diameter: '20 in', Widths: '9 / 10 in', Offsets: 'ET35 / ET38', 'Bolt patterns': '5×114.3, 5×120', 'Centre bore': '72.6 mm (rings included)', Weight: 'from 11.0 kg', 'Load rating': '750 kg per wheel' } });

  /* ---------------- TYRES ---------------- */
  p('t-01', 'Circuit R Semi-Slick', 'torvik', 'tyres', 289, { unit: 'per tyre', tags: ['track'], created: 8, pop: 87, rating: 4.8, reviews: 44, stock: 40, badge: 'Limited',
    desc: 'A road-legal semi-slick for track days. Heat-cycled once at the factory so the compound is stable from the first session.',
    sizes: ['245/40 R18', '265/35 R18', '255/35 R19', '285/30 R19'],
    fit: { rims: [18, 19] },
    specs: { Type: 'Semi-slick, road legal', Rims: '18 / 19 in', 'Tread wear': '100', 'Heat cycling': 'Once, at the factory', Use: 'Dry track days and fast road' } });
  p('t-03', 'Street Sport UHP', 'torvik', 'tyres', 179, { unit: 'per tyre', tags: ['essentials', 'street'], created: 35, pop: 85, rating: 4.6, reviews: 120, stock: 96,
    desc: 'An ultra-high-performance summer tyre with a stiff shoulder for steering response and a quiet centre rib for motorway miles.',
    sizes: ['225/40 R18', '245/35 R19', '255/35 R19', '245/35 R20', '275/30 R20'],
    fit: { rims: [18, 19, 20] },
    specs: { Type: 'Summer UHP', Rims: '18 / 19 / 20 in', 'Tread wear': '300', Use: 'Dry and wet road, above 7 °C' } });
  p('t-04', 'Alpine Winter', 'torvik', 'tyres', 164, { unit: 'per tyre', tags: ['essentials'], created: 45, pop: 66, rating: 4.5, reviews: 33, stock: 52,
    desc: 'A directional winter tyre with dense sipes for snow and slush. Pre-drilled for studs where they are permitted.',
    sizes: ['225/45 R18', '245/40 R19', '265/50 R20', '285/45 R22'],
    fit: { rims: [18, 19, 20, 22] },
    specs: { Type: 'Winter, directional', Rims: '18 / 19 / 20 / 22 in', Marking: '3PMSF', Studs: 'Pre-drilled (check local rules)' } });
  p('t-02', 'Pit Lane Wheel & Tyre Package', 'apex-forged', 'tyres', 3480, { unit: 'per set of four', tags: ['track'], created: 22, pop: 72, rating: 4.9, reviews: 9, stock: 3,
    desc: 'Four Circuit Mesh wheels mounted and balanced with semi-slicks, ready to bolt on in the paddock.',
    sizes: ['18 in · 245/40 & 265/35', '19 in · 255/35 & 285/30'],
    fit: { rims: [18, 19] },
    specs: { Includes: '4 wheels, 4 tyres, valves, balancing', Wheels: 'Circuit Mesh, gunmetal', Tyres: 'Circuit R Semi-Slick', Lead: 'Built to order in 5 working days' } });

  /* ---------------- BRAKES ---------------- */
  p('b-02', 'Six-Piston Big Brake Kit', 'halden', 'brakes', 1890, { unit: 'per axle', tags: ['track'], created: 10, pop: 92, rating: 4.8, reviews: 31, stock: 7,
    desc: 'Forged six-piston calipers over 380 mm two-piece floating discs. Supplied with braided lines, pads and a bedding-in guide.',
    finishes: [{ n: 'Red', c: '#C62D2D' }, { n: 'Black', c: '#151515' }, { n: 'Orange', c: '#E2621B' }],
    sizes: ['380 × 34 mm', '405 × 34 mm'],
    fit: { vehicles: ['bmw-m3-g80', 'toyota-supra-a90', 'nissan-gtr-r35', 'ford-mustang-s650', 'audi-rs3-8y'], minWheel: 19 },
    specs: { Calipers: 'Forged aluminium, 6 piston', Discs: 'Two-piece floating, 380 or 405 mm', Lines: 'Braided stainless', 'Minimum wheel': '19 in (check template)', Includes: 'Pads, lines, brackets, hardware' } });
  p('b-01', 'Carbon-Ceramic Brake Kit', 'halden', 'brakes', 5900, { unit: 'per axle', tags: ['track'], created: 28, pop: 60, rating: 5.0, reviews: 4, stock: 2,
    desc: 'Carbon-ceramic discs with ten-piston calipers. A large cut in unsprung mass and very little fade, at a price that reflects both.',
    sizes: ['410 × 38 mm'],
    fit: { vehicles: ['porsche-911-992', 'nissan-gtr-r35', 'bmw-m3-g80'], minWheel: 20 },
    specs: { Discs: 'Carbon-ceramic, 410 mm', Calipers: '10 piston, monoblock', 'Minimum wheel': '20 in', Includes: 'Pads, lines, brackets' } });
  p('b-03', 'Drilled & Slotted Discs', 'halden', 'brakes', 340, { unit: 'per pair', tags: ['essentials', 'street'], created: 55, pop: 81, rating: 4.4, reviews: 88, stock: 60,
    desc: 'Direct-replacement discs, cross-drilled and slotted to clear gas and pad debris. Zinc-coated against corrosion.',
    sizes: ['Front pair', 'Rear pair'],
    fit: { vehicles: ['bmw-m3-g80', 'toyota-supra-a90', 'honda-civic-fl5', 'subaru-wrx-vb', 'audi-rs3-8y'] },
    specs: { Type: 'Direct replacement', Finish: 'Drilled, slotted, zinc-coated', Includes: '2 discs' } });
  p('b-04', 'Street Pad & Disc Set', 'halden', 'brakes', 260, { unit: 'per axle', tags: ['essentials'], created: 70, pop: 74, rating: 4.5, reviews: 140, stock: 80,
    desc: 'Plain discs with a low-dust ceramic pad. The sensible service upgrade for daily drivers.',
    sizes: ['Front axle', 'Rear axle'],
    fit: { vehicles: ['honda-civic-fl5', 'subaru-wrx-vb', 'ford-mustang-s650', 'audi-rs3-8y', 'toyota-lc300'] },
    specs: { Discs: 'Plain, coated', Pads: 'Low-dust ceramic', Includes: '2 discs, 1 pad set, wear sensors where fitted' } });

  /* ---------------- SUSPENSION ---------------- */
  p('s-03', 'Street Coilovers', 'strata', 'suspension', 1140, { unit: 'per set', tags: ['track', 'street'], created: 14, pop: 90, rating: 4.7, reviews: 46, stock: 12,
    desc: 'Monotube coilovers with 32 clicks of damping and threaded bodies for height adjustment without changing spring preload.',
    sizes: ['Street spring rates', 'Track spring rates'],
    fit: { vehicles: ['bmw-m3-g80', 'toyota-supra-a90', 'honda-civic-fl5', 'subaru-wrx-vb', 'audi-rs3-8y', 'ford-mustang-s650'] },
    specs: { Damper: 'Monotube, 32-click adjustable', Height: 'Threaded body', 'Top mounts': 'Camber-adjustable front', Warranty: '2 years' } });
  p('s-02', 'Progressive Lowering Springs', 'strata', 'suspension', 320, { unit: 'per set', tags: ['street', 'essentials'], created: 38, pop: 79, rating: 4.5, reviews: 67, stock: 34,
    desc: 'Progressive-rate springs that lower the car by around 25–30 mm while keeping the factory dampers in their working range.',
    sizes: ['-25 mm', '-30 mm'],
    fit: { vehicles: ['honda-civic-fl5', 'subaru-wrx-vb', 'audi-rs3-8y', 'ford-mustang-s650'] },
    specs: { Drop: '25–30 mm (vehicle dependent)', Rate: 'Progressive', Use: 'With factory dampers' } });
  p('s-01', 'Gas Monotube Dampers', 'strata', 'suspension', 690, { unit: 'per set of four', tags: ['essentials'], created: 65, pop: 63, rating: 4.4, reviews: 22, stock: 18,
    desc: 'Replacement dampers with firmer valving than standard for drivers who want more control without coilovers.',
    sizes: ['Set of four'],
    fit: { vehicles: ['honda-civic-fl5', 'subaru-wrx-vb', 'toyota-lc300'] },
    specs: { Type: 'Gas monotube', Valving: 'Sport', Includes: '4 dampers' } });

  /* ---------------- PERFORMANCE ---------------- */
  p('x-02', 'Titanium Cat-Back System', 'okami', 'performance', 1650, { unit: 'per system', tags: ['street'], created: 11, pop: 85, rating: 4.8, reviews: 19, stock: 5,
    desc: 'A titanium cat-back with a valved rear section: quiet at a cruise, open under load. Roughly half the weight of a steel system.',
    finishes: [{ n: 'Blued titanium', c: '#3E5C9A' }, { n: 'Raw titanium', c: '#9AA0A6' }],
    sizes: ['Valved', 'Non-valved'],
    fit: { vehicles: ['bmw-m3-g80', 'toyota-supra-a90', 'audi-rs3-8y'] },
    specs: { Material: 'Grade 2 titanium', Tips: '100 mm, blued', Valves: 'Optional, retains factory control', Note: 'Check local noise rules' } });
  p('x-04', 'Burnt Titanium Tips', 'okami', 'performance', 380, { unit: 'per pair', tags: ['street'], created: 24, pop: 77, rating: 4.6, reviews: 35, stock: 22,
    desc: 'Slip-on burnt-titanium tips with a rolled edge. Clamp-on fitting, no welding.',
    sizes: ['89 mm', '101 mm'], fit: { vehicles: ['ford-mustang-s650', 'subaru-wrx-vb', 'honda-civic-fl5'] },
    specs: { Material: 'Titanium, heat-coloured', Fitting: 'Clamp-on' } });
  p('x-03', 'Carbon Tailpipe Trims', 'okami', 'performance', 420, { unit: 'per pair', tags: ['street'], created: 33, pop: 71, rating: 4.7, reviews: 16, stock: 14,
    desc: 'Twill carbon sleeves with machined titanium inner rings and a perforated heat shield.',
    sizes: ['Pair'], fit: { vehicles: ['bmw-m3-g80', 'audi-rs3-8y'] },
    specs: { Material: 'Carbon fibre, titanium ring', Fitting: 'Clamp-on' } });
  p('x-01', 'Black Chrome Tips', 'okami', 'performance', 260, { unit: 'per pair', tags: ['street', 'essentials'], created: 48, pop: 68, rating: 4.4, reviews: 51, stock: 30,
    desc: 'Black-chrome stainless tips for a darker rear end. Easy to clean and resistant to discolouring.',
    sizes: ['90 mm', '100 mm'], fit: { vehicles: ['audi-rs3-8y', 'toyota-supra-a90', 'ford-mustang-s650'] },
    specs: { Material: 'Stainless steel, black chrome', Fitting: 'Clamp-on' } });
  p('e-01', 'Cold Air Intake Kit', 'okami', 'performance', 460, { unit: 'per kit', tags: ['street'], created: 16, pop: 83, rating: 4.5, reviews: 40, stock: 19,
    desc: 'A sealed airbox with a high-flow filter and silicone couplers. Gains vary by engine and tune; expect sharper response more than headline power.',
    sizes: ['Kit'], fit: { vehicles: ['toyota-supra-a90', 'bmw-m3-g80', 'honda-civic-fl5', 'subaru-wrx-vb'] },
    specs: { Filter: 'Washable cotton gauze', Couplers: '4-ply silicone', Note: 'Results depend on engine calibration' } });
  p('e-02', 'Silicone Hose Kit', 'okami', 'performance', 240, { unit: 'per kit', tags: ['essentials'], created: 42, pop: 62, rating: 4.6, reviews: 27, stock: 26,
    desc: 'Four-ply silicone coolant hoses that resist heat and swelling far longer than rubber.',
    finishes: [{ n: 'Black', c: '#111' }, { n: 'Red', c: '#B4231F' }],
    sizes: ['Full kit'], fit: { vehicles: ['subaru-wrx-vb', 'honda-civic-fl5', 'nissan-gtr-r35'] },
    specs: { Material: '4-ply silicone', Includes: 'Hoses and stainless clamps' } });

  /* ---------------- EXTERIOR ---------------- */
  p('l-01', 'LED Projector Headlights', 'lumen', 'exterior', 1350, { unit: 'per pair', tags: ['street'], created: 5, pop: 80, rating: 4.7, reviews: 13, stock: 6, badge: 'New',
    desc: 'Plug-in LED projector units with dual-ring daytime lights and sequential indicators.',
    sizes: ['Pair, left-hand drive', 'Pair, right-hand drive'], fit: { vehicles: ['bmw-m3-g80', 'ford-mustang-s650'] },
    specs: { Type: 'LED projector', Fitting: 'Plug-in, no coding on supported models', Note: 'Road-legal status varies by country' } });
  p('l-02', 'LED Bulb Upgrade Kit', 'lumen', 'exterior', 129, { unit: 'per kit', tags: ['essentials'], created: 52, pop: 69, rating: 4.3, reviews: 96, stock: 70,
    desc: 'Replacement LED bulbs for interior and number-plate lights. A quick, crisp upgrade.',
    sizes: ['Interior kit', 'Interior + plate kit'], fit: { vehicles: ['honda-civic-fl5', 'subaru-wrx-vb', 'toyota-lc300', 'audi-rs3-8y'] },
    specs: { Colour: '6000 K', Includes: 'Interior and number-plate bulbs' } });

  /* ---------------- INTERIOR ---------------- */
  p('i-01', 'Sport Bucket Seat', 'pitlane', 'interior', 1290, { unit: 'each', tags: ['track'], created: 26, pop: 73, rating: 4.7, reviews: 11, stock: 4,
    desc: 'A reclinable sport bucket in perforated leather with contrast bolsters. Keeps you in place without feeling like a race seat.',
    finishes: [{ n: 'Black / red', c: '#1A1A1A' }, { n: 'All black', c: '#111' }],
    sizes: ['Standard', 'Wide'], fit: { vehicles: ['bmw-m3-g80', 'toyota-supra-a90', 'honda-civic-fl5'] },
    specs: { Shell: 'Steel frame, reclinable', Trim: 'Perforated leather', Mount: 'Vehicle-specific brackets sold separately' } });
  p('i-02', '6-Point Harness', 'pitlane', 'interior', 480, { unit: 'each', tags: ['track'], created: 19, pop: 65, rating: 4.8, reviews: 8, stock: 10,
    desc: 'A six-point harness with cam-lock buckle and 3-inch shoulder straps. For use with a fixed-back seat and harness bar.',
    sizes: ['3-inch shoulder', '2-inch shoulder (HANS)'], fit: { vehicles: [] },
    specs: { Buckle: 'Cam lock', Straps: '3 in / 2 in shoulder', Note: 'Requires harness bar and compatible seat' } });

  /* ---------------- ACCESSORIES ---------------- */
  p('a-01', 'Leather Driving Gloves', 'pitlane', 'accessories', 95, { unit: 'per pair', tags: ['essentials'], created: 13, pop: 76, rating: 4.6, reviews: 58, stock: 45,
    desc: 'Unlined nappa leather with outside stitching, cut short at the wrist for a clean feel through the wheel.',
    sizes: ['S', 'M', 'L', 'XL'], fit: { vehicles: [] }, specs: { Material: 'Nappa leather', Lining: 'Unlined' } });
  p('a-02', 'Trackside Socket Set', 'pitlane', 'accessories', 140, { unit: 'per set', tags: ['essentials'], created: 58, pop: 64, rating: 4.7, reviews: 70, stock: 38,
    desc: 'Shallow and deep sockets on a rail with a 72-tooth ratchet. Small enough for the boot, complete enough for a day at the track.',
    sizes: ['3/8 in drive'], fit: { vehicles: [] }, specs: { Drive: '3/8 in', Includes: '26 sockets, ratchet, rail' } });
  p('a-03', 'Combination Spanner Roll', 'pitlane', 'accessories', 85, { unit: 'per set', tags: ['essentials'], created: 75, pop: 58, rating: 4.5, reviews: 42, stock: 50,
    desc: 'Ratcheting combination spanners from 8 to 19 mm in a tough roll-up pouch.',
    sizes: ['8–19 mm'], fit: { vehicles: [] }, specs: { Sizes: '8–19 mm', Includes: '12 spanners, pouch' } });

  APEX.products = P;
  APEX.slugify = slugify;
})();

APEX.collections = [
  { id: 'track-spec', name: 'Track Spec', count: 0, tag: 'track', image: 'img/editorial/track.webp', blurb: 'Semi-slicks, big brakes and forged wheels for drivers who measure in tenths.' },
  { id: 'street-culture', name: 'Street Culture', tag: 'street', image: 'img/editorial/street.webp', blurb: 'Stance, sound and the details people notice at the meet.' },
  { id: 'forged-series', name: 'Forged Series', tag: 'forged', image: 'img/editorial/forged.webp', blurb: 'Monoblock and two-piece forged wheels, specified in-house.' },
  { id: 'essentials', name: 'Performance Essentials', tag: 'essentials', image: 'img/editorial/essentials.webp', blurb: 'The service parts, tyres and tools every build needs.' }
];

APEX.gallery = [
  { img: 'img/gallery/g-01.webp', alt: 'Red-lit instrument cluster at night', h: 'tall' },
  { img: 'img/gallery/g-02.webp', alt: 'Orange coupé in an underground car park', h: 'wide' },
  { img: 'img/gallery/g-03.webp', alt: 'Gloved hand on a steering wheel', h: 'tall' },
  { img: 'img/gallery/g-04.webp', alt: 'Black coupé with underglow in a car park', h: 'wide' },
  { img: 'img/gallery/g-05.webp', alt: 'Muscle car spinning its rear tyres in smoke', h: 'wide' },
  { img: 'img/gallery/g-06.webp', alt: 'Tools laid out on a workbench', h: 'tall' },
  { img: 'img/gallery/g-07.webp', alt: 'Speedometer needle sweeping', h: 'wide' },
  { img: 'img/gallery/g-08.webp', alt: 'Close-up of a performance wheel', h: 'tall' }
];
