/* ============================================================
   CIEL AFRICA — Selected Work
   Neutral, fictional project concepts that demonstrate the kind
   of software Ciel Africa designs and builds. No real client
   names, stats or logos. Replace freely with real projects:
   set `image`/`shots` to your own files and edit the copy.
   Each project references a UI concept in data/mockups.js via
   `mockup` so the site shows the interface, not just words.
   ============================================================ */
window.CIEL = window.CIEL || {};

window.CIEL.workCategories = ["All","Business System","SaaS","Web Platform","Mobile App","E-commerce","AI & Automation"];

window.CIEL.work = [
  {
    id:"meridian-erp",
    name:"Meridian ERP",
    category:"Business System",
    industry:"Manufacturing & Distribution",
    mockup:"erp", mockupAlt:"analytics",
    year:"Concept",
    image:"", 
    short:"One operations hub for a distributor running finance, stock and orders across three warehouses.",
    technologies:["Next.js","Node.js","PostgreSQL","Redis","Docker"],
    services:["Product Design","Full-stack Engineering","Cloud Deployment"],
    overview:"A distribution business managing thousands of SKUs across multiple warehouses on spreadsheets and disconnected tools. Meridian is a single operations platform — finance, inventory, purchasing and fulfilment in one place, with live dashboards for the people who run the floor.",
    challenge:"Stock levels, invoices and orders lived in separate systems that never agreed. Reconciling month-end took days, and no one could see true margin or stock position in real time.",
    solution:"We modelled the whole operation as one data core, then built role-based dashboards on top: an operations overview, a purchasing pipeline, and finance reporting that ties back to every transaction. Real-time sync keeps warehouses and the back office looking at the same numbers.",
    results:["Month-end reconciliation from days to hours","One source of truth across 3 warehouses","Live margin and stock visibility for managers"]
  },
  {
    id:"pulse-crm",
    name:"Pulse CRM",
    category:"SaaS",
    industry:"B2B Sales Teams",
    mockup:"crm", mockupAlt:"saas",
    year:"Concept",
    image:"",
    short:"A pipeline CRM sales teams actually keep up to date, because it takes seconds not minutes.",
    technologies:["React","TypeScript","Node.js","PostgreSQL","Tailwind"],
    services:["UX/UI Design","SaaS Engineering","API Development"],
    overview:"Most CRMs fail because reps won't update them. Pulse is built around a fast kanban pipeline and keyboard-first data entry, so keeping deals current costs almost no effort — and managers finally get a forecast they can trust.",
    challenge:"The team's existing CRM was so slow to update that the pipeline was always out of date, making forecasting guesswork and coaching impossible.",
    solution:"We designed a drag-and-drop pipeline with inline editing, activity capture and a clean deal view. A metering and billing layer turns it into a multi-tenant SaaS other teams can subscribe to.",
    results:["Pipeline updated in seconds, not minutes","Forecast accuracy managers can rely on","Multi-tenant, subscription-ready architecture"]
  },
  {
    id:"lumina-hms",
    name:"Lumina Hospital System",
    category:"Business System",
    industry:"Healthcare",
    mockup:"hospital", mockupAlt:"analytics",
    year:"Concept",
    image:"",
    short:"Admissions, wards, billing and records coordinated in real time across a hospital.",
    technologies:["Laravel","MySQL","Vue","Redis"],
    services:["Custom Software","Systems Architecture","Support & Maintenance"],
    overview:"A hospital management platform that connects the front desk, wards and billing so patient flow is visible at a glance — who's admitted, which beds are free, what's owed, and what's happening in theatre right now.",
    challenge:"Paper records and siloed systems meant staff couldn't see bed availability or a patient's full status without phone calls, slowing admissions and discharges.",
    solution:"A unified records core with a live wards board, admissions queue and integrated billing. Every department reads and writes the same patient timeline, with role-based access for clinical and administrative staff.",
    results:["Live bed and ward visibility","Faster admissions and discharge flow","Billing tied to the patient record"]
  },
  {
    id:"atlas-logistics",
    name:"Atlas Fleet",
    category:"Mobile App",
    industry:"Logistics & Transport",
    mockup:"logistics", mockupAlt:"analytics",
    year:"Concept",
    image:"",
    short:"Live tracking, routing and dispatch — a control room on the web, a driver app in the field.",
    technologies:["React Native","Node.js","PostgreSQL","Mapbox","WebSockets"],
    services:["Mobile Development","API Development","Design System"],
    overview:"Atlas pairs a dispatcher's control room with a driver mobile app. Dispatch assigns and reroutes jobs live; drivers get turn-by-turn tasks and capture proof of delivery; managers see the whole fleet on one map.",
    challenge:"Dispatch ran on calls and messages, with no live view of where vehicles were or whether jobs were on time.",
    solution:"A real-time tracking backend feeds a live fleet map and a driver app. Routes optimise automatically, and every stop is timestamped so on-time performance is finally measurable.",
    results:["Whole fleet visible on one live map","Automated routing and reassignment","Proof-of-delivery captured per stop"]
  },
  {
    id:"orbit-commerce",
    name:"Orbit Commerce",
    category:"E-commerce",
    industry:"Retail",
    mockup:"ecommerce", mockupAlt:"inventory",
    year:"Concept",
    image:"",
    short:"A storefront built to sell, with a back office that keeps stock and orders in sync.",
    technologies:["Next.js","Stripe","M-Pesa","PostgreSQL","Tailwind"],
    services:["E-commerce Development","UI/UX Design","Payments Integration"],
    overview:"A fast, modern store with a checkout tuned for conversion and a back office that ties orders, stock and payments together — including local mobile-money rails alongside cards.",
    challenge:"An off-the-shelf store was slow, hard to customise, and disconnected from inventory, causing oversells and manual reconciliation.",
    solution:"A headless storefront with a streamlined checkout, integrated card and mobile-money payments, and an admin that reflects stock and orders in real time.",
    results:["Faster storefront and smoother checkout","Card + mobile-money payments in one flow","Stock and orders always in sync"]
  },
  {
    id:"cortex-ai",
    name:"Cortex Automation",
    category:"AI & Automation",
    industry:"Operations",
    mockup:"ai", mockupAlt:"analytics",
    year:"Concept",
    image:"",
    short:"An AI workflow that reads incoming documents, classifies them and routes the work — no manual triage.",
    technologies:["Python","FastAPI","LLMs","PostgreSQL","Docker"],
    services:["AI Automation","Workflow Design","Integration"],
    overview:"Cortex takes a stream of incoming documents — invoices, forms, requests — and classifies, extracts and routes each one automatically, escalating only the edge cases a person needs to see.",
    challenge:"A team spent hours every day manually sorting and re-keying incoming documents, a slow and error-prone bottleneck.",
    solution:"An automation pipeline classifies each document, extracts the fields that matter, and routes it to the right queue or system — with a human-in-the-loop step for anything low-confidence.",
    results:["Manual triage largely eliminated","Consistent extraction and routing","People freed for the exceptions that matter"]
  }
];

window.CIEL.insights = [
  { id:"post-01", cat:"Software Engineering", title:"How we approach scalable architecture from day one", date:"2026", read:"6 min", image:"" },
  { id:"post-02", cat:"AI & Automation",      title:"Practical AI automation for lean business teams",     date:"2026", read:"5 min", image:"" },
  { id:"post-03", cat:"UI/UX",                title:"Designing interfaces people actually understand",     date:"2026", read:"4 min", image:"" },
  { id:"post-04", cat:"Web Development",       title:"Performance budgets: shipping fast, beautiful sites",  date:"2026", read:"7 min", image:"" },
  { id:"post-05", cat:"WordPress",             title:"When custom WordPress beats a page builder",          date:"2026", read:"5 min", image:"" },
  { id:"post-06", cat:"SaaS",                  title:"From idea to MVP: a pragmatic SaaS roadmap",          date:"2026", read:"8 min", image:"" }
];
