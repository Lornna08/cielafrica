/* ============================================================
   CIEL AFRICA — Website Templates data
   HOW TO EDIT:
   - Add/edit objects below. Replace `image` with your own file
     (drop into assets/img/templates/ and point to it).
   - `category` must match one of the CATEGORIES list for filtering.
   - flags: "new" and "popular" control the badges & sort tabs.
   ============================================================ */
window.CIEL = window.CIEL || {};

window.CIEL.templateCategories = [
  "All","Business","Corporate","E-commerce","Portfolio","Restaurant","Real Estate",
  "SaaS","Agency","Finance","Education","Healthcare","Blog","Personal Brand",
  "Landing Page","Startup","NGO","Events","Booking"
];

window.CIEL.templates = [
  { id:"tpl-01", name:"Meridian",   category:"SaaS",         desc:"Clean product marketing site for software companies with pricing and docs.", idealFor:"SaaS & software products", price:299, image:"", new:true,  popular:true },
  { id:"tpl-02", name:"Atrium",     category:"Corporate",    desc:"Confident corporate presence with services, team and investor sections.",    idealFor:"Corporations & institutions", price:349, image:"", new:false, popular:true },
  { id:"tpl-03", name:"Storefront", category:"E-commerce",   desc:"Conversion-focused online store layout with cart, filters and checkout.",     idealFor:"Retail & online shops", price:399, image:"", new:false, popular:true },
  { id:"tpl-04", name:"Canvas",     category:"Portfolio",    desc:"Minimal portfolio to let visual work speak for itself.",                       idealFor:"Designers & studios", price:199, image:"", new:true,  popular:false },
  { id:"tpl-05", name:"Harvest",    category:"Restaurant",   desc:"Warm restaurant site with menu, reservations and gallery.",                    idealFor:"Restaurants & cafés", price:249, image:"", new:false, popular:false },
  { id:"tpl-06", name:"Cornerstone",category:"Real Estate",  desc:"Property listings with map, filters and enquiry flow.",                        idealFor:"Real estate & agents", price:349, image:"", new:false, popular:true },
  { id:"tpl-07", name:"Foundry",    category:"Agency",       desc:"Bold agency site with case studies and capabilities.",                         idealFor:"Creative & dev agencies", price:329, image:"", new:false, popular:false },
  { id:"tpl-08", name:"Ledger",     category:"Finance",      desc:"Trustworthy fintech layout with product and compliance sections.",             idealFor:"Fintech & finance", price:379, image:"", new:true,  popular:false },
  { id:"tpl-09", name:"Scholar",    category:"Education",    desc:"Courses, admissions and campus life for institutions.",                        idealFor:"Schools & e-learning", price:299, image:"", new:false, popular:false },
  { id:"tpl-10", name:"Vitalis",    category:"Healthcare",   desc:"Calm, accessible healthcare site with appointments and services.",             idealFor:"Clinics & health orgs", price:329, image:"", new:false, popular:false },
  { id:"tpl-11", name:"Dispatch",   category:"Blog",         desc:"Editorial blog with rich typography and reading experience.",                  idealFor:"Publishers & writers", price:179, image:"", new:false, popular:false },
  { id:"tpl-12", name:"Signature",  category:"Personal Brand",desc:"Personal brand site for creators, speakers and founders.",                    idealFor:"Creators & founders", price:199, image:"", new:true,  popular:true },
  { id:"tpl-13", name:"Ascent",     category:"Startup",      desc:"Momentum-driven startup launch site with waitlist.",                           idealFor:"Early-stage startups", price:249, image:"", new:false, popular:false },
  { id:"tpl-14", name:"Beacon",     category:"NGO",          desc:"Mission-first non-profit site with donations and programs.",                   idealFor:"NGOs & non-profits", price:229, image:"", new:false, popular:false },
  { id:"tpl-15", name:"Assembly",   category:"Events",       desc:"Event site with schedule, speakers and ticketing.",                            idealFor:"Conferences & events", price:279, image:"", new:false, popular:false },
  { id:"tpl-16", name:"Reserve",    category:"Booking",      desc:"Booking platform layout for services and appointments.",                       idealFor:"Booking & scheduling", price:299, image:"", new:false, popular:true },
  { id:"tpl-17", name:"Horizon",    category:"Landing Page", desc:"High-converting single-page landing template.",                                idealFor:"Campaigns & launches", price:149, image:"", new:true,  popular:false },
  { id:"tpl-18", name:"Enterprise", category:"Business",     desc:"All-purpose business site with services and lead capture.",                     idealFor:"SMEs & businesses", price:279, image:"", new:false, popular:true }
];
