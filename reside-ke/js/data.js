/* ============================================================
   Reside Ke — demo dataset
   Fictional agency, people, listings and transactions. Dates are
   generated relative to "today" so the demo always looks current.
   Nothing here is a real property, valuation or sale.
   ============================================================ */
window.ES = window.ES || {};

(function () {
  'use strict';
  var DAY = 864e5;

  ES.config = {
    product: 'Reside Ke',
    agency: 'Northgate Realty',
    city: 'Nairobi',
    currency: 'KES',
    locale: 'en-KE',
    userId: 'u1',
    saleRate: 3,          // % of sale price
    rentMonths: 1,        // letting fee, in months of rent
    monthlyTarget: 3000000,
    storageKey: 'reside-ke:demo:v1'
  };

  ES.STAGES = [
    { id: 'new', name: 'New opportunity', short: 'New', p: 10, c: '#94A3B8' },
    { id: 'qualified', name: 'Qualified', short: 'Qualified', p: 20, c: '#7C8CF8' },
    { id: 'viewing', name: 'Viewing scheduled', short: 'Viewing', p: 35, c: '#38BDF8' },
    { id: 'offer', name: 'Offer submitted', short: 'Offer', p: 50, c: '#F59E0B' },
    { id: 'under_offer', name: 'Under offer', short: 'Under offer', p: 70, c: '#2F5BEA' },
    { id: 'contract', name: 'Contract', short: 'Contract', p: 90, c: '#0F1729' },
    { id: 'won', name: 'Closed won', short: 'Closed won', p: 100, c: '#22A06B' },
    { id: 'lost', name: 'Closed lost', short: 'Lost', p: 0, c: '#E0473C' }
  ];

  ES.LEAD_STATUS = [
    { id: 'new', name: 'New' }, { id: 'contacted', name: 'Contacted' }, { id: 'qualified', name: 'Qualified' },
    { id: 'viewing', name: 'Viewing scheduled' }, { id: 'negotiating', name: 'Negotiating' },
    { id: 'converted', name: 'Converted' }, { id: 'lost', name: 'Lost' }
  ];

  ES.PTYPES = ['Detached house', 'Villa', 'Apartment', 'Townhouse', 'Office', 'Retail'];
  ES.AREAS = ['Runda', 'Karura', 'Kitisuru', 'Lavington', 'Kileleshwa', 'Karen', 'Westlands', 'Kilimani', 'Parklands', 'Upper Hill', 'Riverside', 'Gigiri', 'Ruaka', 'Syokimau', 'Limuru', 'Tigoni', 'Nyali', 'Diani', 'Mombasa Road'];
  ES.AMENITIES = ['Swimming pool', 'Garden', 'Borehole', 'Backup generator', 'Solar water heating', 'DSQ (staff quarters)', 'Gym', 'Lift', 'CCTV & 24h security', 'Electric fence', 'Fibre internet', 'Balcony', 'Study', 'Walk-in closet', 'Rooftop terrace', 'Children\'s play area', 'Ample parking', 'Sea view'];
  ES.SOURCES = ['Website', 'Property portal', 'Referral', 'Walk-in', 'Instagram', 'WhatsApp', 'Signboard'];
  ES.DOC_KINDS = { listing: 'Listing agreement', offer: 'Offer letter', sale: 'Sale agreement', lease: 'Lease agreement', photos: 'Property photographs', inspection: 'Inspection report', disclosure: 'Disclosure document', valuation: 'Valuation report' };

  ES.generate = function (now) {
    now = now || new Date();
    var seed = 20261023;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    var t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    function at(days, h, m) { return new Date(t0 + days * DAY + ((h == null ? 10 : h) * 60 + (m || 0)) * 6e4).toISOString(); }
    var img = function (n) { return 'img/p/' + n + '.webp'; };

    /* ---------- team ---------- */
    var team = [
      { id: 'u1', name: 'Imani Wanjiku', role: 'Principal agent', avatar: 'img/a/imani.webp', online: true, phone: '+254 700 100 201', email: 'imani@northgate.example' },
      { id: 'u2', name: 'Wanjiru Kamau', role: 'Sales agent', avatar: 'img/a/wanjiru.webp', online: true, phone: '+254 700 100 202', email: 'wanjiru@northgate.example' },
      { id: 'u3', name: 'Brian Mwangi', role: 'Sales agent', avatar: 'img/a/brian.webp', online: true, phone: '+254 700 100 203', email: 'brian@northgate.example' },
      { id: 'u4', name: 'Omar Hassan', role: 'Coast lead', avatar: 'img/a/omar.webp', online: false, phone: '+254 700 100 204', email: 'omar@northgate.example' },
      { id: 'u5', name: 'Achieng Otieno', role: 'Lettings manager', avatar: 'img/a/achieng.webp', online: true, phone: '+254 700 100 205', email: 'achieng@northgate.example' },
      { id: 'u6', name: 'Kevin Odhiambo', role: 'Commercial agent', avatar: 'img/a/kevin.webp', online: false, phone: '+254 700 100 206', email: 'kevin@northgate.example' },
      { id: 'u7', name: 'Daniel Kiprop', role: 'Listings coordinator', avatar: 'img/a/daniel.webp', online: true, phone: '+254 700 100 207', email: 'daniel@northgate.example' }
    ];

    /* ---------- contacts ---------- */
    var cid = 0, contacts = [];
    function contact(name, types, extra) {
      cid++;
      var first = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
      var c = Object.assign({
        id: 'c' + cid, name: name, types: types,
        phone: '+254 7' + (10 + (cid * 7) % 89) + ' ' + String(100 + (cid * 37) % 899) + ' ' + String(100 + (cid * 53) % 899),
        email: first + '.' + (cid + 10) + '@example.com', company: '', agentId: team[cid % team.length].id,
        createdAt: at(-20 - Math.floor(rnd() * 300)), notes: [], comms: []
      }, extra || {});
      contacts.push(c); return c;
    }
    // owners / sellers / landlords
    var oKarura = contact('Margaret Ndegwa', ['seller', 'owner']);
    var oKitisuru = contact('Paul & Ruth Gachanja', ['seller', 'owner']);
    var oRunda = contact('Stephen Kiragu', ['seller', 'owner']);
    var oDiani = contact('Fatma Said', ['seller', 'owner']);
    var oLimuru = contact('Elijah Muriuki', ['seller', 'owner']);
    var oNyali = contact('Coastline Holdings Ltd', ['seller', 'owner'], { company: 'Coastline Holdings Ltd' });
    var oLav = contact('Dr. Wangari Mathenge', ['seller', 'owner']);
    var oKil = contact('Anthony Kibet', ['seller', 'owner']);
    var oKaren = contact('Silvia Odera', ['seller', 'owner']);
    var oTigoni = contact('George Kamande', ['seller', 'owner']);
    var oWest = contact('Brookside Developers', ['seller', 'owner'], { company: 'Brookside Developers' });
    var oUpper = contact('Hilltop Residences Ltd', ['seller', 'owner'], { company: 'Hilltop Residences Ltd' });
    var oMews = contact('Joseph Ngugi', ['seller', 'owner']);
    var oRuaka = contact('Esther Wairimu', ['seller', 'owner']);
    var oGigiri = contact('Gigiri Capital Partners', ['seller', 'owner'], { company: 'Gigiri Capital Partners' });
    var lKilimani = contact('Lucy Achola', ['landlord', 'owner']);
    var lParklands = contact('Raj Patel', ['landlord', 'owner']);
    var lRiverside = contact('Riverside Grand Ltd', ['landlord', 'owner'], { company: 'Riverside Grand Ltd' });
    var lSyok = contact('Moses Kilonzo', ['landlord', 'owner']);
    var lWsq = contact('Westlands Square Ltd', ['landlord', 'owner'], { company: 'Westlands Square Ltd' });
    var lMsa = contact('Athi Park Properties', ['landlord', 'owner'], { company: 'Athi Park Properties' });
    // buyers & tenants
    var bArjun = contact('Arjun Shah', ['buyer']);
    var bHassan = contact('Hassan Ali', ['buyer']);
    var bGrace = contact('Grace Wambui', ['buyer']);
    var bSamuel = contact('Samuel Otieno', ['buyer']);
    var bFaith = contact('Faith Chebet', ['buyer']);
    var bLinda = contact('Linda Mutua', ['buyer']);
    var bJoan = contact('Joan Njeri', ['buyer']);
    var bTom = contact('Tom Barasa', ['buyer']);
    var bDavid = contact('David Kariuki', ['buyer']);
    var bAisha = contact('Aisha Abdalla', ['buyer']);
    var bRuth = contact('Ruth Akinyi', ['buyer']);
    var bTrust = contact('Mwangi Family Trust', ['buyer'], { company: 'Mwangi Family Trust' });
    var bJames = contact('James Ochieng', ['buyer']);
    var bCarol = contact('Carol Nyambura', ['buyer']);
    var tPeter = contact('Peter Kamau', ['tenant']);
    var tNadia = contact('Nadia Rahman', ['tenant']);
    var tZuri = contact('Zuri Logistics Ltd', ['tenant'], { company: 'Zuri Logistics Ltd' });
    var tMary = contact('Mary Atieno', ['tenant']);
    var tSunil = contact('Sunil Mehta', ['tenant']);
    var tKoru = contact('Koru Freight Ltd', ['tenant'], { company: 'Koru Freight Ltd' });
    // vendors & professionals
    var vPhoto = contact('Lens & Light Studio', ['vendor'], { company: 'Lens & Light Studio' });
    var vVal = contact('Mwangi & Co. Valuers', ['professional'], { company: 'Mwangi & Co. Valuers' });
    var vLaw = contact('Okoth & Partners Advocates', ['professional'], { company: 'Okoth & Partners Advocates' });
    var vStage = contact('Nest Staging', ['vendor'], { company: 'Nest Staging' });
    var vPlumb = contact('FixRight Maintenance', ['vendor'], { company: 'FixRight Maintenance' });

    /* ---------- listings ---------- */
    var pid = 1040, props = [];
    function prop(o) {
      pid++;
      var p = Object.assign({
        id: 'p' + pid, ref: 'EST-' + pid, city: 'Nairobi', published: true, parking: 2, plot: '',
        amenities: [], views: 200 + Math.floor(rnd() * 1600), listedAt: at(-10 - Math.floor(rnd() * 80)), notes: [], floors: 2,
        description: ''
      }, o);
      if (p.minPrice == null) p.minPrice = Math.round(p.price * 0.96 / 1e5) * 1e5;
      if (p.estimate == null) p.estimate = Math.round(p.price * (0.97 + rnd() * 0.07) / 1e5) * 1e5;
      props.push(p); return p;
    }
    var P1 = prop({ title: 'Karura Ridge House', type: 'Detached house', category: 'sale', status: 'active', price: 124000000, minPrice: 118500000, estimate: 121500000, area: 'Runda', address: '14 Ridgeview Close, Runda', beds: 5, baths: 5, size: 520, plot: '0.5 acre', parking: 4, floors: 2, agentId: 'u1', ownerId: oKarura.id, featured: true, views: 1842, listedAt: at(-23), images: [img('karura-1'), img('karura-2'), img('int-living-1'), img('int-kitchen-1'), img('int-bed-1'), img('int-living-2')], amenities: ['Garden', 'Borehole', 'Backup generator', 'Solar water heating', 'DSQ (staff quarters)', 'CCTV & 24h security', 'Study', 'Walk-in closet'], description: 'A contemporary family home on a quiet close above the Karura forest edge. Timber-screened upper floor, stone-clad ground floor, double-volume living room opening onto a terraced lawn. Five en-suite bedrooms, a study and a separate two-room DSQ.' });
    var P2 = prop({ title: 'Kitisuru Gable House', type: 'Detached house', category: 'sale', status: 'active', price: 89500000, area: 'Kitisuru', address: 'Kitisuru Road, Kitisuru', beds: 4, baths: 4, size: 410, plot: '0.5 acre', parking: 3, agentId: 'u2', ownerId: oKitisuru.id, images: [img('kitisuru-1'), img('kitisuru-2'), img('int-living-3'), img('int-bed-2')], amenities: ['Garden', 'Borehole', 'Balcony', 'Electric fence', 'Fibre internet'], description: 'Steep-gabled timber-clad home with a cantilevered master balcony, set in a mature garden of frangipani and acacia.' });
    var P3 = prop({ title: 'Runda Timber Lodge', type: 'Detached house', category: 'sale', status: 'under_offer', price: 98000000, area: 'Runda', address: 'Mimosa Road, Runda', beds: 5, baths: 4, size: 465, plot: '1 acre', parking: 4, floors: 1, agentId: 'u3', ownerId: oRunda.id, images: [img('runda-1'), img('int-living-4'), img('int-kitchen-2')], amenities: ['Garden', 'Borehole', 'Backup generator', 'DSQ (staff quarters)', 'Ample parking'], description: 'Single-storey lodge-style home with a timber portico, stone base and a gravel forecourt on a full acre.' });
    var P4 = prop({ title: 'Diani Palm House', type: 'Villa', category: 'sale', status: 'active', price: 72000000, area: 'Diani', city: 'Kwale', address: 'Beach Road, Diani', beds: 4, baths: 4, size: 380, plot: '0.75 acre', parking: 3, agentId: 'u4', ownerId: oDiani.id, images: [img('diani-1'), img('int-living-2')], amenities: ['Swimming pool', 'Garden', 'Solar water heating', 'Sea view'], description: 'Glass-fronted coastal villa behind a row of royal palms, five minutes from the beach.' });
    var P5 = prop({ title: 'Limuru Barn House', type: 'Detached house', category: 'sale', status: 'active', price: 38500000, area: 'Limuru', city: 'Kiambu', address: 'Tiekunu, Limuru', beds: 3, baths: 2, size: 210, plot: '0.25 acre', parking: 2, agentId: 'u2', ownerId: oLimuru.id, images: [img('limuru-1')], amenities: ['Garden', 'Borehole', 'Study'], description: 'Weathered-timber barn conversion with a framed picture window over the tea hills.' });
    var P6 = prop({ title: 'Nyali Seafront Villa', type: 'Villa', category: 'sale', status: 'active', price: 145000000, area: 'Nyali', city: 'Mombasa', address: 'Links Road, Nyali', beds: 5, baths: 6, size: 610, plot: '0.6 acre', parking: 4, floors: 3, agentId: 'u4', ownerId: oNyali.id, images: [img('nyali-1'), img('int-bed-1')], amenities: ['Swimming pool', 'Rooftop terrace', 'Sea view', 'CCTV & 24h security', 'Backup generator'], description: 'Three-level white villa with glass balustrades, a rooftop terrace and a 14-metre pool.' });
    var P7 = prop({ title: 'Lavington Courtyard Villa', type: 'Villa', category: 'sale', status: 'active', price: 165000000, area: 'Lavington', address: 'James Gichuru Road, Lavington', beds: 5, baths: 6, size: 640, plot: '0.75 acre', parking: 5, agentId: 'u1', ownerId: oLav.id, images: [img('lavington-1'), img('int-dining'), img('int-living-1')], amenities: ['Swimming pool', 'Gym', 'Study', 'DSQ (staff quarters)', 'Backup generator', 'CCTV & 24h security'], description: 'Crisp white villa around an infinity-edge pool with cedar soffits and floor-to-ceiling glazing.' });
    var P8 = prop({ title: 'Kileleshwa Garden Residence', type: 'Detached house', category: 'sale', status: 'under_offer', price: 84000000, area: 'Kileleshwa', address: 'Laikipia Road, Kileleshwa', beds: 4, baths: 4, size: 395, plot: '0.3 acre', parking: 3, floors: 3, agentId: 'u3', ownerId: oKil.id, images: [img('kileleshwa-1'), img('int-kitchen-1')], amenities: ['Swimming pool', 'Garden', 'Fibre internet'], description: 'Townhouse-scale modern home with a plunge pool and timber deck off the kitchen.' });
    var P9 = prop({ title: 'Karen Horizon Villa', type: 'Villa', category: 'sale', status: 'active', price: 132000000, area: 'Karen', address: 'Langata South Road, Karen', beds: 5, baths: 5, size: 580, plot: '1 acre', parking: 4, floors: 1, agentId: 'u2', ownerId: oKaren.id, images: [img('karen-1'), img('int-living-3')], amenities: ['Swimming pool', 'Garden', 'Borehole', 'Solar water heating', 'Electric fence'], description: 'Low, wide single-storey villa with a lit pool terrace facing the Ngong Hills.' });
    var P10 = prop({ title: 'Tigoni Pool House', type: 'Detached house', category: 'sale', status: 'sold', price: 76000000, area: 'Tigoni', city: 'Kiambu', address: 'Red Hill Road, Tigoni', beds: 4, baths: 4, size: 420, plot: '1 acre', parking: 4, agentId: 'u3', ownerId: oTigoni.id, images: [img('tigoni-1')], amenities: ['Swimming pool', 'Garden', 'Borehole'], description: 'Two-storey home with a long pool, paved sun terrace and indigenous garden.' });
    var P11 = prop({ title: 'Westlands Park Residences, 6B', type: 'Apartment', category: 'sale', status: 'active', price: 24500000, area: 'Westlands', address: 'Rhapta Road, Westlands', beds: 3, baths: 3, size: 165, plot: '', parking: 2, floors: 1, agentId: 'u5', ownerId: oWest.id, images: [img('apt-westlands')], amenities: ['Lift', 'Gym', 'Backup generator', 'CCTV & 24h security', 'Balcony'], description: 'Sixth-floor corner apartment in a new mixed-material block with landscaped courtyard.' });
    var P12 = prop({ title: 'Upper Hill Sky Penthouse', type: 'Apartment', category: 'sale', status: 'active', price: 42000000, area: 'Upper Hill', address: 'Matumbato Road, Upper Hill', beds: 4, baths: 4, size: 260, parking: 3, floors: 2, agentId: 'u1', ownerId: oUpper.id, images: [img('apt-upperhill')], amenities: ['Lift', 'Rooftop terrace', 'Gym', 'Backup generator', 'CCTV & 24h security'], description: 'Duplex penthouse with stepped terraces and views across the city skyline.' });
    var P13 = prop({ title: 'Lavington Mews, House 3', type: 'Townhouse', category: 'sale', status: 'under_offer', price: 46000000, area: 'Lavington', address: 'Hatheru Road, Lavington', beds: 4, baths: 4, size: 280, plot: '', parking: 2, floors: 3, agentId: 'u2', ownerId: oMews.id, images: [img('town-lavington')], amenities: ['Garden', 'Balcony', 'Fibre internet', 'CCTV & 24h security'], description: 'Brick-and-zinc townhouse with bay windows, part of a gated mews of six.' });
    var P14 = prop({ title: 'Ruaka Terraces, No. 12', type: 'Townhouse', category: 'sale', status: 'active', price: 18900000, area: 'Ruaka', city: 'Kiambu', address: 'Ruaka Road, Ruaka', beds: 3, baths: 3, size: 190, parking: 2, floors: 2, agentId: 'u3', ownerId: oRuaka.id, images: [img('town-ruaka')], amenities: ['Children\'s play area', 'CCTV & 24h security', 'Ample parking'], description: 'End-of-terrace townhouse in a 24-unit gated community near Two Rivers.' });
    var P15 = prop({ title: 'Gigiri Office Block', type: 'Office', category: 'sale', status: 'active', price: 310000000, area: 'Gigiri', address: 'Limuru Road, Gigiri', beds: 0, baths: 8, size: 2400, plot: '0.8 acre', parking: 60, floors: 5, agentId: 'u6', ownerId: oGigiri.id, images: [img('com-gigiri')], amenities: ['Lift', 'Backup generator', 'CCTV & 24h security', 'Fibre internet', 'Ample parking'], description: 'Grade-A five-storey office building with ventilated glass facade, fully let to two tenants.' });
    var P16 = prop({ title: 'Kilimani Heights, Apt 11C', type: 'Apartment', category: 'rent', status: 'active', price: 185000, minPrice: 175000, estimate: 180000, area: 'Kilimani', address: 'Argwings Kodhek Road, Kilimani', beds: 3, baths: 3, size: 170, parking: 2, floors: 1, agentId: 'u5', ownerId: lKilimani.id, images: [img('apt-kilimani'), img('int-living-4')], amenities: ['Lift', 'Gym', 'Swimming pool', 'Backup generator', 'Balcony'], description: 'High-floor three-bedroom with west-facing glass balconies and sunset views.' });
    var P17 = prop({ title: 'Parklands Court, Apt 4A', type: 'Apartment', category: 'rent', status: 'let', price: 120000, minPrice: 115000, estimate: 118000, area: 'Parklands', address: '3rd Parklands Avenue', beds: 2, baths: 2, size: 115, parking: 1, floors: 1, agentId: 'u5', ownerId: lParklands.id, images: [img('apt-parklands')], amenities: ['Lift', 'Backup generator', 'Balcony'], description: 'Two-bedroom with cantilevered balcony in a brick-clad block.' });
    var P18 = prop({ title: 'Riverside Grand, Apt 902', type: 'Apartment', category: 'rent', status: 'active', price: 260000, minPrice: 245000, estimate: 255000, area: 'Riverside', address: 'Riverside Drive', beds: 3, baths: 4, size: 210, parking: 2, floors: 1, agentId: 'u5', ownerId: lRiverside.id, images: [img('apt-riverside'), img('int-bed-2')], amenities: ['Lift', 'Gym', 'Swimming pool', 'Backup generator', 'Rooftop terrace'], description: 'Ninth-floor apartment with stone-clad facade, glass balconies and a rooftop pool.' });
    var P19 = prop({ title: 'Syokimau Row House 7', type: 'Townhouse', category: 'rent', status: 'let', price: 65000, minPrice: 60000, estimate: 64000, area: 'Syokimau', city: 'Machakos', address: 'Katani Road, Syokimau', beds: 3, baths: 2, size: 150, parking: 1, floors: 3, agentId: 'u5', ownerId: lSyok.id, images: [img('town-syokimau')], amenities: ['Children\'s play area', 'CCTV & 24h security'], description: 'Three-storey row house in a terrace of black-clad townhomes.' });
    var P20 = prop({ title: 'Westlands Square, 5th Floor', type: 'Office', category: 'rent', status: 'active', price: 950000, minPrice: 900000, estimate: 930000, area: 'Westlands', address: 'Waiyaki Way, Westlands', beds: 0, baths: 4, size: 620, parking: 18, floors: 1, agentId: 'u6', ownerId: lWsq.id, images: [img('com-westlands')], amenities: ['Lift', 'Backup generator', 'Fibre internet', 'CCTV & 24h security'], description: 'Full-floor open-plan office in a curved glass tower with 18 allocated bays.' });
    var P21 = prop({ title: 'Mombasa Road Logistics Office', type: 'Office', category: 'rent', status: 'let', price: 480000, minPrice: 450000, estimate: 470000, area: 'Mombasa Road', address: 'Old Mombasa Road', beds: 0, baths: 3, size: 540, parking: 24, floors: 2, agentId: 'u6', ownerId: lMsa.id, images: [img('com-mombasard')], amenities: ['Backup generator', 'Ample parking', 'CCTV & 24h security'], description: 'Two-floor office with loading access, close to JKIA and the expressway.' });

    // archived (sold) listings used by commission history
    var archived = [
      ['Muthaiga North Bungalow', 'Detached house', 'Muthaiga North', 68e6, 'u2', 'kitisuru-2', 11],
      ['Westlands Loft, 3F', 'Apartment', 'Westlands', 21e6, 'u5', 'apt-westlands', 11],
      ['Karen Hardy Cottage', 'Detached house', 'Karen', 54e6, 'u1', 'limuru-1', 10],
      ['Kilimani Garden Flat', 'Apartment', 'Kilimani', 16.5e6, 'u3', 'apt-parklands', 10],
      ['Spring Valley Villa', 'Villa', 'Spring Valley', 118e6, 'u1', 'lavington-1', 9],
      ['Ngong Road Retail Unit', 'Retail', 'Ngong Road', 36e6, 'u6', 'com-mombasard', 8],
      ['Loresho Family Home', 'Detached house', 'Loresho', 72e6, 'u2', 'runda-1', 8],
      ['Shanzu Beach Apartment', 'Apartment', 'Shanzu', 19.5e6, 'u4', 'apt-riverside', 7],
      ['Thigiri Ridge House', 'Detached house', 'Thigiri', 96e6, 'u3', 'karura-2', 7],
      ['Riverside Office Suite', 'Office', 'Riverside', 58e6, 'u6', 'com-gigiri', 6],
      ['Lavington Green Townhouse', 'Townhouse', 'Lavington', 39e6, 'u2', 'town-lavington', 5],
      ['Runda Grove Villa', 'Villa', 'Runda', 128e6, 'u1', 'karen-1', 5],
      ['Kileleshwa Court, Apt 7', 'Apartment', 'Kileleshwa', 28e6, 'u5', 'apt-kilimani', 4],
      ['Nyari Estate House', 'Detached house', 'Nyari', 46e6, 'u3', 'kileleshwa-1', 4],
      ['Kitisuru Hill Residence', 'Detached house', 'Kitisuru', 88e6, 'u2', 'kitisuru-1', 3],
      ['Syokimau Terrace 3', 'Townhouse', 'Syokimau', 24e6, 'u3', 'town-syokimau', 3],
      ['Bamburi Beach Villa', 'Villa', 'Bamburi', 62e6, 'u4', 'diani-1', 2],
      ['Rosslyn Ridge House', 'Detached house', 'Rosslyn', 105e6, 'u1', 'tigoni-1', 1],
      ['Upper Hill Studio Offices', 'Office', 'Upper Hill', 33e6, 'u6', 'com-westlands', 1]
    ];
    var archProps = [];
    archived.forEach(function (a, i) {
      archProps.push(prop({ title: a[0], type: a[1], category: 'sale', status: 'sold', price: a[3], area: a[2], address: a[2], beds: a[1] === 'Office' || a[1] === 'Retail' ? 0 : 3 + (i % 3), baths: 3, size: 180 + i * 25, agentId: a[4], ownerId: [oKarura, oKil, oRunda, oMews][i % 4].id, images: [img(a[5])], published: false, archived: true, views: 600 + i * 80, listedAt: at(-(a[6] * 30.4 + 60)), monthsAgo: a[6] }));
    });

    /* ---------- deals ---------- */
    var did = 2030, deals = [];
    function deal(o) {
      did++;
      var p = props.filter(function (x) { return x.id === o.propertyId; })[0];
      var d = Object.assign({
        id: 'd' + did, ref: 'DL-' + did, kind: p.category, value: p.price, rate: null,
        sellerId: p.ownerId, agentId: p.agentId, createdAt: at(-30), offers: [], commissionStatus: 'projected', notes: [], lostReason: ''
      }, o);
      deals.push(d); return d;
    }
    deal({ propertyId: P9.id, buyerId: bGrace.id, stage: 'new', expectedClose: at(62), createdAt: at(-2) });
    deal({ propertyId: P20.id, buyerId: tZuri.id, stage: 'new', expectedClose: at(30), createdAt: at(-1) });
    deal({ propertyId: P2.id, buyerId: bSamuel.id, stage: 'qualified', expectedClose: at(48), createdAt: at(-9) });
    deal({ propertyId: P12.id, buyerId: bFaith.id, stage: 'qualified', expectedClose: at(41), createdAt: at(-7), agentId: 'u1' });
    deal({ propertyId: P1.id, buyerId: bArjun.id, stage: 'viewing', expectedClose: at(45), createdAt: at(-12) });
    deal({ propertyId: P7.id, buyerId: bLinda.id, stage: 'viewing', expectedClose: at(52), createdAt: at(-6) });
    deal({ propertyId: P16.id, buyerId: tPeter.id, stage: 'viewing', expectedClose: at(14), createdAt: at(-4) });
    deal({ propertyId: P1.id, buyerId: bHassan.id, stage: 'offer', value: 119500000, expectedClose: at(34), createdAt: at(-18), offers: [{ amount: 116000000, at: at(-9, 15, 20), status: 'countered' }, { amount: 119500000, at: at(-2, 11, 5), status: 'open' }] });
    deal({ propertyId: P5.id, buyerId: bJoan.id, stage: 'offer', value: 37200000, expectedClose: at(27), createdAt: at(-15), offers: [{ amount: 37200000, at: at(-3, 16, 40), status: 'open' }] });
    deal({ propertyId: P11.id, buyerId: bTom.id, stage: 'offer', value: 23800000, expectedClose: at(21), createdAt: at(-11), offers: [{ amount: 23800000, at: at(-1, 9, 30), status: 'open' }] });
    deal({ propertyId: P3.id, buyerId: bDavid.id, stage: 'under_offer', value: 96000000, expectedClose: at(19), createdAt: at(-33), offers: [{ amount: 92000000, at: at(-21), status: 'countered' }, { amount: 96000000, at: at(-14), status: 'accepted' }] });
    deal({ propertyId: P8.id, buyerId: bAisha.id, stage: 'under_offer', value: 82500000, expectedClose: at(12), createdAt: at(-29), offers: [{ amount: 82500000, at: at(-10), status: 'accepted' }] });
    deal({ propertyId: P13.id, buyerId: bRuth.id, stage: 'under_offer', value: 45200000, expectedClose: at(25), createdAt: at(-26), offers: [{ amount: 45200000, at: at(-8), status: 'accepted' }] });
    deal({ propertyId: P6.id, buyerId: bTrust.id, stage: 'contract', value: 141000000, expectedClose: at(9), createdAt: at(-52), offers: [{ amount: 138000000, at: at(-40), status: 'countered' }, { amount: 141000000, at: at(-31), status: 'accepted' }] });
    deal({ propertyId: P18.id, buyerId: tNadia.id, stage: 'contract', expectedClose: at(6), createdAt: at(-16) });
    deal({ propertyId: P4.id, buyerId: bCarol.id, stage: 'lost', value: 64000000, expectedClose: at(-5), createdAt: at(-40), closedAt: at(-12), lostReason: 'Buyer could not get financing at that price', offers: [{ amount: 64000000, at: at(-20), status: 'declined' }] });
    // earlier lost deals (keep the win rate honest)
    deal({ propertyId: P2.id, buyerId: bTom.id, stage: 'lost', value: 81000000, createdAt: at(-150), expectedClose: at(-110), closedAt: at(-118), lostReason: 'Bought another property' });
    deal({ propertyId: P12.id, buyerId: bJoan.id, stage: 'lost', value: 38500000, createdAt: at(-200), expectedClose: at(-160), closedAt: at(-171), lostReason: 'Price too high' });
    deal({ propertyId: P14.id, buyerId: bLinda.id, stage: 'lost', value: 17500000, createdAt: at(-95), expectedClose: at(-60), closedAt: at(-66), lostReason: 'Buyer could not get financing' });
    deal({ propertyId: P9.id, buyerId: bFaith.id, stage: 'lost', value: 120000000, createdAt: at(-260), expectedClose: at(-220), closedAt: at(-231), lostReason: 'Seller withdrew' });
    // closed won — this month
    deal({ propertyId: P10.id, buyerId: bJames.id, stage: 'won', value: 74500000, expectedClose: at(-4), createdAt: at(-60), closedAt: at(-4, 14), commissionStatus: 'earned', offers: [{ amount: 74500000, at: at(-30), status: 'accepted' }] });
    // closed rentals (leases signed)
    deal({ propertyId: P17.id, buyerId: tMary.id, stage: 'won', closedAt: at(-150), createdAt: at(-170), expectedClose: at(-150), commissionStatus: 'paid' });
    deal({ propertyId: P19.id, buyerId: tSunil.id, stage: 'won', closedAt: at(-305), createdAt: at(-320), expectedClose: at(-305), commissionStatus: 'paid' });
    deal({ propertyId: P21.id, buyerId: tKoru.id, stage: 'won', closedAt: at(-210), createdAt: at(-230), expectedClose: at(-210), commissionStatus: 'paid' });

    // commission history: archived sales closed over the past 11 months
    var buyersPool = [bCarol, bGrace, bSamuel, bFaith, bLinda, bTom, bJoan, bDavid, bAisha, bRuth, bArjun, bHassan];
    archProps.forEach(function (p, i) {
      var m = p.monthsAgo, closed = new Date(now.getFullYear(), now.getMonth() - m, 6 + (i * 7) % 20, 15);
      deal({ propertyId: p.id, buyerId: buyersPool[i % buyersPool.length].id, stage: 'won', value: Math.round(p.price * (0.95 + rnd() * 0.04) / 1e5) * 1e5, closedAt: closed.toISOString(), createdAt: new Date(closed.getTime() - 50 * DAY).toISOString(), expectedClose: closed.toISOString(), commissionStatus: m <= 1 ? 'approved' : 'paid', rate: i % 4 === 2 ? 2.5 : 3 });
    });

    /* ---------- leases, payments, maintenance, applications ---------- */
    var leases = [
      { id: 'l1', propertyId: P17.id, tenantId: tMary.id, landlordId: lParklands.id, start: at(-150), end: at(215), rent: 120000, deposit: 240000, status: 'active' },
      { id: 'l2', propertyId: P19.id, tenantId: tSunil.id, landlordId: lSyok.id, start: at(-305), end: at(25), rent: 65000, deposit: 130000, status: 'active' },
      { id: 'l3', propertyId: P21.id, tenantId: tKoru.id, landlordId: lMsa.id, start: at(-210), end: at(520), rent: 480000, deposit: 1440000, status: 'active' },
      { id: 'l4', propertyId: P16.id, tenantId: contact('Brian Ouma', ['tenant']).id, landlordId: lKilimani.id, start: at(-395), end: at(-30), rent: 175000, deposit: 350000, status: 'ended' }
    ];
    var payments = [];
    leases.forEach(function (l) {
      if (l.status !== 'active') return;
      for (var m = 5; m >= 0; m--) {
        var due = new Date(now.getFullYear(), now.getMonth() - m, 5);
        if (due < new Date(l.start)) continue;
        var status = m === 0 ? (l.id === 'l2' ? 'late' : (now.getDate() > 5 ? 'paid' : 'due')) : 'paid';
        payments.push({ id: 'pay' + payments.length, leaseId: l.id, due: due.toISOString(), amount: l.rent, status: status, recordedAt: status === 'paid' ? new Date(due.getTime() + (1 + (m % 3)) * DAY).toISOString() : null });
      }
    });
    var maintenance = [
      { id: 'm1', propertyId: P17.id, title: 'Kitchen sink leaking under cabinet', priority: 'high', status: 'open', createdAt: at(-2, 9), vendorId: vPlumb.id },
      { id: 'm2', propertyId: P19.id, title: 'Replace gate remote batteries & receiver', priority: 'low', status: 'in_progress', createdAt: at(-6), vendorId: vPlumb.id },
      { id: 'm3', propertyId: P21.id, title: 'Generator service (500h)', priority: 'medium', status: 'scheduled', createdAt: at(-4), vendorId: vPlumb.id },
      { id: 'm4', propertyId: P17.id, title: 'Repaint balcony railing', priority: 'low', status: 'done', createdAt: at(-40), vendorId: vPlumb.id }
    ];
    var applications = [
      { id: 'ap1', propertyId: P16.id, name: 'Peter Kamau', phone: '+254 722 410 118', income: 820000, moveIn: at(21), status: 'screening', createdAt: at(-3) },
      { id: 'ap2', propertyId: P16.id, name: 'Wairimu Gitau', phone: '+254 733 902 441', income: 610000, moveIn: at(35), status: 'received', createdAt: at(-1) },
      { id: 'ap3', propertyId: P18.id, name: 'Nadia Rahman', phone: '+254 711 230 559', income: 1450000, moveIn: at(10), status: 'approved', createdAt: at(-12) },
      { id: 'ap4', propertyId: P20.id, name: 'Zuri Logistics Ltd', phone: '+254 20 765 4410', income: 0, moveIn: at(45), status: 'received', createdAt: at(-1) }
    ];

    /* ---------- leads ---------- */
    var lid = 0, leads = [];
    function lead(o) {
      lid++;
      var l = Object.assign({ id: 'ld' + lid, email: '', createdAt: at(-Math.floor(rnd() * 25) - 1), notes: [], contactId: null }, o);
      if (!l.email) l.email = l.name.split(' ')[0].toLowerCase() + '.' + (lid + 40) + '@example.com';
      leads.push(l); return l;
    }
    lead({ name: 'Kelvin Mutiso', phone: '+254 712 554 019', source: 'Website', propertyId: P1.id, budget: 120000000, location: 'Runda', ptype: 'Detached house', agentId: 'u1', status: 'new', lastContact: null, nextFollowUp: at(0, 15), createdAt: at(0, 8, 42) });
    lead({ name: 'Anne Wekesa', phone: '+254 721 330 845', source: 'Property portal', propertyId: P12.id, budget: 40000000, location: 'Upper Hill', ptype: 'Apartment', agentId: 'u1', status: 'new', lastContact: null, nextFollowUp: at(1, 10), createdAt: at(0, 7, 15) });
    lead({ name: 'Collins Rotich', phone: '+254 700 118 260', source: 'Instagram', propertyId: P4.id, budget: 70000000, location: 'Diani', ptype: 'Villa', agentId: 'u4', status: 'new', lastContact: null, nextFollowUp: at(-1, 12), createdAt: at(-1, 18) });
    lead({ name: 'Sharon Moraa', phone: '+254 745 662 901', source: 'WhatsApp', propertyId: P16.id, budget: 190000, location: 'Kilimani', ptype: 'Apartment', agentId: 'u5', status: 'new', lastContact: null, nextFollowUp: at(0, 17), createdAt: at(-1, 9) });
    lead({ name: 'Ibrahim Noor', phone: '+254 722 908 334', source: 'Referral', propertyId: P6.id, budget: 150000000, location: 'Nyali', ptype: 'Villa', agentId: 'u4', status: 'contacted', lastContact: at(-2), nextFollowUp: at(-1, 11), createdAt: at(-5) });
    lead({ name: 'Patricia Ndungu', phone: '+254 733 450 778', source: 'Website', propertyId: P7.id, budget: 160000000, location: 'Lavington', ptype: 'Villa', agentId: 'u1', status: 'contacted', lastContact: at(-1), nextFollowUp: at(2, 11), createdAt: at(-6) });
    lead({ name: 'Victor Langat', phone: '+254 710 224 563', source: 'Signboard', propertyId: P14.id, budget: 19000000, location: 'Ruaka', ptype: 'Townhouse', agentId: 'u3', status: 'contacted', lastContact: at(-3), nextFollowUp: at(1, 14), createdAt: at(-8) });
    lead({ name: 'Mercy Chepkoech', phone: '+254 725 873 120', source: 'Property portal', propertyId: P11.id, budget: 25000000, location: 'Westlands', ptype: 'Apartment', agentId: 'u5', status: 'qualified', lastContact: at(-1), nextFollowUp: at(3, 10), createdAt: at(-12) });
    lead({ name: 'Ahmed Yusuf', phone: '+254 711 390 772', source: 'Referral', propertyId: P15.id, budget: 300000000, location: 'Gigiri', ptype: 'Office', agentId: 'u6', status: 'qualified', lastContact: at(-4), nextFollowUp: at(-2, 10), createdAt: at(-15) });
    lead({ name: 'Grace Wambui', phone: '+254 722 615 080', source: 'Website', propertyId: P9.id, budget: 130000000, location: 'Karen', ptype: 'Villa', agentId: 'u2', status: 'converted', lastContact: at(-2), nextFollowUp: null, createdAt: at(-14), contactId: bGrace.id });
    lead({ name: 'Arjun Shah', phone: '+254 733 121 909', source: 'Referral', propertyId: P1.id, budget: 125000000, location: 'Runda', ptype: 'Detached house', agentId: 'u1', status: 'converted', lastContact: at(-1), nextFollowUp: null, createdAt: at(-20), contactId: bArjun.id });
    lead({ name: 'Nelson Kirui', phone: '+254 714 556 301', source: 'Walk-in', propertyId: P2.id, budget: 85000000, location: 'Kitisuru', ptype: 'Detached house', agentId: 'u2', status: 'viewing', lastContact: at(-1), nextFollowUp: at(2, 15), createdAt: at(-10) });
    lead({ name: 'Diana Muthoni', phone: '+254 728 340 662', source: 'Instagram', propertyId: P18.id, budget: 250000, location: 'Riverside', ptype: 'Apartment', agentId: 'u5', status: 'viewing', lastContact: at(-2), nextFollowUp: at(1, 11), createdAt: at(-9) });
    lead({ name: 'Oscar Wafula', phone: '+254 701 773 418', source: 'Property portal', propertyId: P5.id, budget: 36000000, location: 'Limuru', ptype: 'Detached house', agentId: 'u2', status: 'negotiating', lastContact: at(-1), nextFollowUp: at(0, 16), createdAt: at(-18) });
    lead({ name: 'Beatrice Kanini', phone: '+254 726 008 517', source: 'Website', propertyId: P13.id, budget: 42000000, location: 'Lavington', ptype: 'Townhouse', agentId: 'u2', status: 'lost', lastContact: at(-9), nextFollowUp: null, createdAt: at(-30), lostReason: 'Bought elsewhere' });
    lead({ name: 'Felix Omondi', phone: '+254 713 662 245', source: 'WhatsApp', propertyId: P20.id, budget: 900000, location: 'Westlands', ptype: 'Office', agentId: 'u6', status: 'contacted', lastContact: at(-1), nextFollowUp: at(1, 9), createdAt: at(-4) });
    lead({ name: 'Rose Nduta', phone: '+254 720 449 036', source: 'Website', propertyId: P3.id, budget: 95000000, location: 'Runda', ptype: 'Detached house', agentId: 'u3', status: 'lost', lastContact: at(-6), nextFollowUp: null, createdAt: at(-25), lostReason: 'Property went under offer' });
    lead({ name: 'Hussein Abdi', phone: '+254 734 900 287', source: 'Referral', propertyId: P6.id, budget: 140000000, location: 'Nyali', ptype: 'Villa', agentId: 'u4', status: 'qualified', lastContact: at(-3), nextFollowUp: at(4, 10), createdAt: at(-11) });

    /* ---------- calendar events ---------- */
    var eid = 0, events = [];
    function ev(o) { eid++; events.push(Object.assign({ id: 'e' + eid, duration: 45, status: 'scheduled', notes: '' }, o)); }
    ev({ type: 'viewing', title: 'Viewing — Karura Ridge House', start: at(0, 11, 0), propertyId: P1.id, contactId: bArjun.id, agentId: 'u1', notes: 'Second viewing; bring floor plans and the borehole report.' });
    ev({ type: 'meeting', title: 'Staging walkthrough with Nest Staging', start: at(0, 14, 30), propertyId: P1.id, contactId: vStage.id, agentId: 'u7', duration: 60 });
    ev({ type: 'call', title: 'Call Oscar Wafula about counter-offer', start: at(0, 16, 0), propertyId: P5.id, agentId: 'u2', duration: 15 });
    ev({ type: 'viewing', title: 'Viewing — Kilimani Heights 11C', start: at(1, 10, 0), propertyId: P16.id, contactId: tPeter.id, agentId: 'u5' });
    ev({ type: 'deadline', title: 'Offer deadline — Westlands Park 6B', start: at(1, 17, 0), propertyId: P11.id, contactId: bTom.id, agentId: 'u5', duration: 0 });
    ev({ type: 'viewing', title: 'Viewing — Lavington Courtyard Villa', start: at(2, 11, 30), propertyId: P7.id, contactId: bLinda.id, agentId: 'u1', duration: 60 });
    ev({ type: 'viewing', title: 'Viewing — Kitisuru Gable House', start: at(2, 15, 0), propertyId: P2.id, contactId: bSamuel.id, agentId: 'u2' });
    ev({ type: 'milestone', title: 'Contract signing — Nyali Seafront Villa', start: at(9, 12, 0), propertyId: P6.id, contactId: bTrust.id, agentId: 'u4', duration: 90 });
    ev({ type: 'milestone', title: 'Lease signing — Riverside Grand 902', start: at(6, 10, 0), propertyId: P18.id, contactId: tNadia.id, agentId: 'u5', duration: 60 });
    ev({ type: 'renewal', title: 'Lease renewal — Syokimau Row House 7', start: at(25, 9, 0), propertyId: P19.id, contactId: tSunil.id, agentId: 'u5', duration: 30 });
    ev({ type: 'meeting', title: 'Valuation review with Mwangi & Co.', start: at(3, 9, 30), propertyId: P9.id, contactId: vVal.id, agentId: 'u2', duration: 60 });
    ev({ type: 'viewing', title: 'Viewing — Karen Horizon Villa', start: at(4, 10, 30), propertyId: P9.id, contactId: bGrace.id, agentId: 'u2' });
    ev({ type: 'task', title: 'Upload new photos for Karura Ridge House', start: at(0, 9, 0), propertyId: P1.id, agentId: 'u7', duration: 0 });
    ev({ type: 'task', title: 'Send title search to Okoth & Partners', start: at(1, 9, 0), propertyId: P3.id, contactId: vLaw.id, agentId: 'u3', duration: 0 });
    ev({ type: 'task', title: 'Chase signed listing agreement — Gigiri', start: at(-1, 9, 0), propertyId: P15.id, agentId: 'u6', duration: 0 });
    ev({ type: 'call', title: 'Follow up Ahmed Yusuf (Gigiri block)', start: at(-2, 10, 0), propertyId: P15.id, agentId: 'u6', duration: 15 });
    ev({ type: 'viewing', title: 'Viewing — Diani Palm House', start: at(5, 11, 0), propertyId: P4.id, agentId: 'u4' });
    ev({ type: 'meeting', title: 'Weekly pipeline review', start: at(3, 8, 30), agentId: 'u1', duration: 45 });
    ev({ type: 'viewing', title: 'Viewing — Riverside Grand 902', start: at(1, 15, 30), propertyId: P18.id, agentId: 'u5' });
    ev({ type: 'deadline', title: 'Completion — Kileleshwa Garden Residence', start: at(12, 12, 0), propertyId: P8.id, contactId: bAisha.id, agentId: 'u3', duration: 0 });
    // past (done)
    ev({ type: 'viewing', title: 'Viewing — Karura Ridge House', start: at(-6, 11, 0), propertyId: P1.id, contactId: bHassan.id, agentId: 'u1', status: 'done' });
    ev({ type: 'viewing', title: 'Viewing — Karura Ridge House', start: at(-11, 15, 0), propertyId: P1.id, contactId: bArjun.id, agentId: 'u1', status: 'done' });
    ev({ type: 'viewing', title: 'Viewing — Runda Timber Lodge', start: at(-19, 10, 0), propertyId: P3.id, contactId: bDavid.id, agentId: 'u3', status: 'done' });
    ev({ type: 'viewing', title: 'Viewing — Limuru Barn House', start: at(-8, 12, 0), propertyId: P5.id, contactId: bJoan.id, agentId: 'u2', status: 'done' });
    ev({ type: 'viewing', title: 'Viewing — Westlands Park 6B', start: at(-5, 14, 0), propertyId: P11.id, contactId: bTom.id, agentId: 'u5', status: 'done' });
    ev({ type: 'viewing', title: 'Viewing — Upper Hill Penthouse', start: at(-3, 16, 0), propertyId: P12.id, contactId: bFaith.id, agentId: 'u1', status: 'done' });
    ev({ type: 'meeting', title: 'Listing presentation — Lavington', start: at(-14, 10, 0), propertyId: P7.id, contactId: oLav.id, agentId: 'u1', status: 'done' });
    ev({ type: 'viewing', title: 'Viewing — Kilimani Heights 11C', start: at(-2, 17, 0), propertyId: P16.id, contactId: tPeter.id, agentId: 'u5', status: 'done' });

    /* ---------- documents ---------- */
    var docs = [];
    function doc(name, kind, propertyId, dealId, sizeKb, by, days, status) { docs.push({ id: 'doc' + (docs.length + 1), name: name, kind: kind, propertyId: propertyId, dealId: dealId || null, size: sizeKb, by: by, at: at(days), status: status || 'final' }); }
    doc('Listing agreement — Karura Ridge House.pdf', 'listing', P1.id, null, 412, 'u1', -24, 'signed');
    doc('Karura Ridge — photo set (6).zip', 'photos', P1.id, null, 2410, 'u7', 0, 'final');
    doc('Borehole & water quality report.pdf', 'inspection', P1.id, null, 860, 'u1', -18);
    doc('Offer — Hassan Ali — revised.pdf', 'offer', P1.id, 'd2038', 188, 'u1', -2, 'received');
    doc('Sale agreement draft — Nyali Seafront Villa.docx', 'sale', P6.id, 'd2044', 236, 'u4', -6, 'draft');
    doc('Valuation report — Nyali Seafront Villa.pdf', 'valuation', P6.id, null, 1320, 'u4', -35);
    doc('Lease — Parklands Court 4A.pdf', 'lease', P17.id, null, 344, 'u5', -150, 'signed');
    doc('Lease — Syokimau Row House 7.pdf', 'lease', P19.id, null, 298, 'u5', -305, 'signed');
    doc('Seller disclosure — Runda Timber Lodge.pdf', 'disclosure', P3.id, null, 154, 'u3', -28, 'signed');
    doc('Structural inspection — Kileleshwa.pdf', 'inspection', P8.id, null, 1890, 'u3', -9);
    doc('Listing agreement — Gigiri Office Block.pdf', 'listing', P15.id, null, 512, 'u6', -3, 'sent');
    doc('Offer — Joan Njeri.pdf', 'offer', P5.id, 'd2039', 176, 'u2', -3, 'received');
    doc('Lavington Courtyard — photo set (12).zip', 'photos', P7.id, null, 5120, 'u7', -15);

    /* ---------- chat ---------- */
    var convs = [
      { id: 'cv1', kind: 'dm', userId: 'u2', unread: 2 },
      { id: 'cv2', kind: 'dm', userId: 'u3', unread: 0 },
      { id: 'cv3', kind: 'dm', userId: 'u4', unread: 1 },
      { id: 'cv4', kind: 'dm', userId: 'u5', unread: 0 },
      { id: 'cv5', kind: 'dm', userId: 'u7', unread: 0 }
    ];
    var msgs = [];
    function msg(conv, from, text, days, h, m, extra) { msgs.push(Object.assign({ id: 'msg' + (msgs.length + 1), convId: conv, from: from, text: text, at: at(days, h, m) }, extra || {})); }
    msg('cv1', 'u2', '', -1, 17, 2, { voice: 61, propertyId: P1.id });
    msg('cv1', 'u2', 'Staging is booked for Thursday — the media room gets the dark sofa.', -1, 17, 4, { propertyId: P1.id });
    msg('cv1', 'u1', '', 0, 8, 45, { photos: [img('karura-2'), img('kitisuru-1'), img('int-living-1')], count: 6, size: '2.4 MB', propertyId: P1.id, reactions: { '👏': 1, '😊': 2 } });
    msg('cv1', 'u2', 'Can I see a photo of the upstairs, or other options nearby?', 0, 9, 30);
    msg('cv1', 'u2', 'Hello! 👋', 0, 9, 31);
    msg('cv2', 'u3', 'Title search for Runda Timber Lodge is back clean. Sending to Okoth today.', -1, 16, 12);
    msg('cv2', 'u1', 'Great — copy me in and book completion for the 3rd week.', -1, 16, 20);
    msg('cv3', 'u4', 'Mwangi Family Trust confirmed the deposit for Nyali. Contract signing on the ' + new Date(t0 + 9 * DAY).getDate() + 'th.', 0, 8, 10);
    msg('cv4', 'u5', 'Peter Kamau wants a second viewing at Kilimani Heights before he signs.', -1, 11, 5);
    msg('cv4', 'u1', 'Fine by me. Offer him tomorrow 10:00.', -1, 11, 9);
    msg('cv5', 'u7', 'Photographer uploaded the new Karura set — 6 photos, the twilight ones are 🔥', 0, 8, 2);

    /* ---------- activity ---------- */
    var activity = [];
    function act(kind, text, days, h, m, ref, by) { activity.push({ at: at(days, h, m), kind: kind, text: text, ref: ref || null, by: by || 'u1' }); }
    act('lead', 'New lead Kelvin Mutiso for Karura Ridge House', 0, 8, 42, { type: 'lead', id: 'ld1' }, 'u1');
    act('photo', '6 new photos added to Karura Ridge House', 0, 8, 2, { type: 'property', id: P1.id }, 'u7');
    act('lead', 'New lead Anne Wekesa for Upper Hill Sky Penthouse', 0, 7, 15, { type: 'lead', id: 'ld2' }, 'u1');
    act('offer', 'Offer KES 23.8M submitted on Westlands Park 6B', -1, 9, 30, { type: 'deal', id: 'd2040' }, 'u5');
    act('viewing', 'Viewing booked — Kilimani Heights 11C', -1, 14, 0, { type: 'property', id: P16.id }, 'u5');
    act('offer', 'Revised offer KES 119.5M from Hassan Ali on Karura Ridge House', -2, 11, 5, { type: 'deal', id: 'd2038' }, 'u1');
    act('stage', 'Riverside Grand 902 moved to Contract', -2, 16, 30, { type: 'deal', id: 'd2045' }, 'u5');
    act('commission', 'Commission KES 2.24M recorded — Tigoni Pool House', -4, 14, 10, { type: 'deal', id: 'd2051' }, 'u3');
    act('listing', 'Price updated on Limuru Barn House to KES 38.5M', -5, 10, 0, { type: 'property', id: P5.id }, 'u2');
    act('stage', 'Nyali Seafront Villa moved to Contract', -6, 12, 0, { type: 'deal', id: 'd2044' }, 'u4');

    /* ---------- notifications ---------- */
    var notes = [
      { id: 'n1', kind: 'lead', text: 'New lead: Kelvin Mutiso — Karura Ridge House', at: at(0, 8, 42), read: false, ref: { type: 'lead', id: 'ld1' } },
      { id: 'n2', kind: 'overdue', text: 'Follow-up overdue: Ibrahim Noor (Nyali)', at: at(-1, 11), read: false, ref: { type: 'lead', id: 'ld5' } },
      { id: 'n3', kind: 'offer', text: 'Offer awaiting response: Westlands Park 6B — KES 23.8M', at: at(-1, 9, 30), read: false, ref: { type: 'deal', id: 'd2040' } },
      { id: 'n4', kind: 'lease', text: 'Lease ends in 25 days: Syokimau Row House 7', at: at(-1, 8), read: false, ref: { type: 'property', id: P19.id } },
      { id: 'n5', kind: 'rent', text: 'Rent overdue: Syokimau Row House 7 (KES 65,000)', at: at(-1, 8, 5), read: true, ref: { type: 'rentals' } }
    ];

    return {
      version: 1, seededAt: now.toISOString(), touched: false,
      settings: { saleRate: ES.config.saleRate, rentMonths: ES.config.rentMonths, monthlyTarget: ES.config.monthlyTarget, agency: ES.config.agency, currency: 'KES' },
      team: team, contacts: contacts, properties: props, deals: deals, leads: leads, events: events, docs: docs,
      leases: leases, payments: payments, maintenance: maintenance, applications: applications,
      convs: convs, msgs: msgs, activity: activity, notifications: notes, seq: 100
    };
  };
})();
