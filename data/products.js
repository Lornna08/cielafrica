/* ============================================================
   CIEL AFRICA — Digital Products data
   HOW TO EDIT: add objects; replace `image` with your file in
   assets/img/products/. `category` must match categories list.
   ============================================================ */
window.CIEL = window.CIEL || {};

window.CIEL.productCategories = [
  "All","WordPress Plugins","WordPress Themes","Website Templates","Landing Pages",
  "PHP Scripts","Laravel Packages","React Components","Next.js Templates",
  "Admin Dashboards","UI Kits","Developer Tools","Automation Scripts","AI Tools","APIs"
];

window.CIEL.products = [
  { id:"prd-01", name:"Nimbus Admin",      category:"Admin Dashboards",  desc:"Production-ready admin dashboard with charts, tables and auth.",        price:59, rating:4.9, reviews:0, badge:"popular", image:"" },
  { id:"prd-02", name:"Aero UI Kit",       category:"UI Kits",           desc:"120+ components and design tokens for modern product interfaces.",      price:39, rating:4.8, reviews:0, badge:"new",     image:"" },
  { id:"prd-03", name:"Quote Engine",      category:"PHP Scripts",       desc:"Drop-in quotation request system with admin and email flow.",          price:49, rating:5.0, reviews:0, badge:"",        image:"" },
  { id:"prd-04", name:"Relay Forms",       category:"WordPress Plugins", desc:"Advanced form builder plugin with conditional logic and exports.",      price:29, rating:4.7, reviews:0, badge:"popular", image:"" },
  { id:"prd-05", name:"Vertex Theme",      category:"WordPress Themes",  desc:"Fast, flexible business theme with a modular page builder.",            price:45, rating:4.9, reviews:0, badge:"",        image:"" },
  { id:"prd-06", name:"Pulse Components",  category:"React Components",  desc:"Headless, accessible React components with Tailwind styling.",          price:35, rating:4.8, reviews:0, badge:"new",     image:"" },
  { id:"prd-07", name:"Launch Next",       category:"Next.js Templates", desc:"Next.js starter with marketing, blog and dashboard routes.",            price:69, rating:5.0, reviews:0, badge:"popular", image:"" },
  { id:"prd-08", name:"Flowline",          category:"Automation Scripts",desc:"Scriptable automation toolkit for routine business tasks.",             price:55, rating:4.6, reviews:0, badge:"",        image:"" },
  { id:"prd-09", name:"Insight API",       category:"APIs",              desc:"Ready-to-deploy analytics API with keys and rate limiting.",            price:79, rating:4.9, reviews:0, badge:"",        image:"" },
  { id:"prd-10", name:"Assistant Kit",     category:"AI Tools",          desc:"Starter kit for building AI assistants into your product.",             price:89, rating:5.0, reviews:0, badge:"new",     image:"" },
  { id:"prd-11", name:"Ship Package",      category:"Laravel Packages",  desc:"Laravel package for billing, teams and subscriptions.",                 price:65, rating:4.8, reviews:0, badge:"",        image:"" },
  { id:"prd-12", name:"Convert Landing",   category:"Landing Pages",     desc:"High-converting landing template pack with A/B variants.",              price:25, rating:4.7, reviews:0, badge:"popular", image:"" }
];
