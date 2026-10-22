/* ============================================================
   CIEL AFRICA — Website Templates data
   HOW TO EDIT:
   - Add/edit objects below. Replace `image` with your own file
     (drop into assets/img/templates/ and point to it).
   - `category` must match one of the CATEGORIES list for filtering.
   - flags: "new" and "popular" control the badges & sort tabs.
   - optional: link (detail page), demo (live demo URL), video (looping
     preview), featured (wide card at the top of the grid).
   ============================================================ */
window.CIEL = window.CIEL || {};

window.CIEL.templateCategories = [
  "All","Business","Corporate","E-commerce","Portfolio","Restaurant","Real Estate",
  "SaaS","Agency","Finance","Education","Healthcare","Blog","Personal Brand",
  "Landing Page","Startup","NGO","Events","Booking"
];

window.CIEL.templates = [
  { id:"tpl-cielshop", name:"Ciel Shop", category:"E-commerce", desc:"Complete inventory, orders, batches, warehouses and analytics system — with a live demo you can try now.", idealFor:"Retailers, wholesalers & distributors", price:20000, image:"assets/img/ciel-shop/card.webp?v=20261022d", new:true, popular:true, link:"ciel-shop.html", demo:"ciel-shop/demo.html", video:"assets/img/ciel-shop/reel.mp4?v=20261022d", featured:true },
  { id:"tpl-01", name:"Meridian",   category:"SaaS",         desc:"Clean product marketing site for software companies with pricing and docs.", idealFor:"SaaS & software products", price:18000, image:"", new:true,  popular:true },
  { id:"tpl-02", name:"Atrium",     category:"Corporate",    desc:"Confident corporate presence with services, team and investor sections.",    idealFor:"Corporations & institutions", price:22000, image:"", new:false, popular:true },
  { id:"tpl-03", name:"Storefront", category:"E-commerce",   desc:"Conversion-focused online store layout with cart, filters and checkout.",     idealFor:"Retail & online shops", price:26000, image:"", new:false, popular:true },
  { id:"tpl-04", home:true, name:"Canvas",     category:"Portfolio",    desc:"Minimal portfolio to let visual work speak for itself.",                       idealFor:"Designers & studios", price:12000, image:"", new:true,  popular:false },
  { id:"tpl-05", name:"Harvest",    category:"Restaurant",   desc:"Warm restaurant site with menu, reservations and gallery.",                    idealFor:"Restaurants & cafés", price:15000, image:"", new:false, popular:false },
  { id:"tpl-06", name:"Cornerstone",category:"Real Estate",  desc:"Property listings with map, filters and enquiry flow.",                        idealFor:"Real estate & agents", price:22000, image:"", new:false, popular:true },
  { id:"tpl-07", name:"Foundry",    category:"Agency",       desc:"Bold agency site with case studies and capabilities.",                         idealFor:"Creative & dev agencies", price:20000, image:"", new:false, popular:false },
  { id:"tpl-08", home:true, name:"Ledger",     category:"Finance",      desc:"Trustworthy fintech layout with product and compliance sections.",             idealFor:"Fintech & finance", price:24000, image:"", new:true,  popular:false },
  { id:"tpl-09", name:"Scholar",    category:"Education",    desc:"Courses, admissions and campus life for institutions.",                        idealFor:"Schools & e-learning", price:18000, image:"", new:false, popular:false },
  { id:"tpl-10", name:"Vitalis",    category:"Healthcare",   desc:"Calm, accessible healthcare site with appointments and services.",             idealFor:"Clinics & health orgs", price:20000, image:"", new:false, popular:false },
  { id:"tpl-11", name:"Dispatch",   category:"Blog",         desc:"Editorial blog with rich typography and reading experience.",                  idealFor:"Publishers & writers", price:11000, image:"", new:false, popular:false },
  { id:"tpl-12", name:"Signature",  category:"Personal Brand",desc:"Personal brand site for creators, speakers and founders.",                    idealFor:"Creators & founders", price:12000, image:"", new:true,  popular:true },
  { id:"tpl-13", name:"Ascent",     category:"Startup",      desc:"Momentum-driven startup launch site with waitlist.",                           idealFor:"Early-stage startups", price:15000, image:"", new:false, popular:false },
  { id:"tpl-14", name:"Beacon",     category:"NGO",          desc:"Mission-first non-profit site with donations and programs.",                   idealFor:"NGOs & non-profits", price:14000, image:"", new:false, popular:false },
  { id:"tpl-15", name:"Assembly",   category:"Events",       desc:"Event site with schedule, speakers and ticketing.",                            idealFor:"Conferences & events", price:17000, image:"", new:false, popular:false },
  { id:"tpl-16", name:"Reserve",    category:"Booking",      desc:"Booking platform layout for services and appointments.",                       idealFor:"Booking & scheduling", price:18000, image:"", new:false, popular:true },
  { id:"tpl-17", name:"Horizon",    category:"Landing Page", desc:"High-converting single-page landing template.",                                idealFor:"Campaigns & launches", price:9500, image:"", new:true,  popular:false },
  { id:"tpl-18", name:"Enterprise", category:"Business",     desc:"All-purpose business site with services and lead capture.",                     idealFor:"SMEs & businesses", price:17000, image:"", new:false, popular:true }
];
