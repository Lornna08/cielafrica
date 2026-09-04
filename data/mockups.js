/* ============================================================
   CIEL AFRICA — UI mockup library (fictional interface concepts)
   Each returns an <svg> string sized to fill .sc-canvas (16:10.5).
   These demonstrate UI/UX ability. All data is illustrative.
   ============================================================ */
window.CIEL = window.CIEL || {};

CIEL.mockups = {};

// shared helpers
const M = {
  bg: '#0a0c10', panel: '#111319', panel2: '#0e1015', line: '#1c2029',
  ink: '#e8e9ec', dim: '#6b7180', faint: '#3a3f4a',
  blue: '#2F6BFF', cyan: '#57D9C4', green: '#3DD68C', amber: '#E5A94E', red: '#E5678A'
};

function chrome(inner, url) {
  return `<rect width="800" height="525" fill="${M.bg}"/>` + inner;
}
// sidebar used by several
function sidebar(active) {
  const items = ['Overview','Records','Reports','Settings'];
  let s = `<rect x="0" y="0" width="150" height="525" fill="${M.panel2}"/><line x1="150" y1="0" x2="150" y2="525" stroke="${M.line}"/>`;
  s += `<circle cx="26" cy="30" r="7" fill="${M.blue}"/><rect x="40" y="25" width="70" height="9" rx="4" fill="${M.faint}"/>`;
  items.forEach((it,i)=>{
    const y = 70 + i*38; const on = i===active;
    if(on) s += `<rect x="12" y="${y-8}" width="126" height="30" rx="7" fill="rgba(47,107,255,0.14)"/>`;
    s += `<rect x="26" y="${y}" width="14" height="14" rx="3" fill="${on?M.blue:M.faint}"/>`;
    s += `<rect x="50" y="${y+3}" width="${60+i*8}" height="8" rx="4" fill="${on?M.ink:M.dim}"/>`;
  });
  return s;
}
function topbar(title) {
  return `<rect x="150" y="0" width="650" height="52" fill="${M.panel2}"/><line x1="150" y1="52" x2="800" y2="52" stroke="${M.line}"/>
    <text x="172" y="32" fill="${M.ink}" font-family="sans-serif" font-size="15" font-weight="600">${title}</text>
    <circle cx="748" cy="26" r="10" fill="${M.panel}"/><circle cx="775" cy="26" r="12" fill="${M.blue}" opacity="0.85"/>`;
}

// ---- ERP dashboard ----
CIEL.mockups.erp = chrome(
  sidebar(0) + topbar('Operations · ERP') +
  `<g transform="translate(172,72)">
    ${[0,1,2].map(i=>`<g transform="translate(${i*210},0)"><rect width="196" height="86" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <rect x="16" y="16" width="70" height="8" rx="4" fill="${M.dim}"/>
      <text x="16" y="52" fill="${M.ink}" font-family="sans-serif" font-size="22" font-weight="700">${['$1.24M','8,420','96.2%'][i]}</text>
      <rect x="16" y="64" width="${40+i*10}" height="7" rx="3.5" fill="${[M.green,M.cyan,M.blue][i]}" opacity="0.8"/></g>`).join('')}
    <g transform="translate(0,104)"><rect width="406" height="230" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <rect x="18" y="18" width="90" height="9" rx="4" fill="${M.dim}"/>
      <polyline points="18,190 60,170 100,178 140,140 182,150 224,116 266,128 308,92 350,104 388,78" fill="none" stroke="${M.cyan}" stroke-width="2.5"/>
      <polyline points="18,200 60,188 100,192 140,168 182,176 224,150 266,160 308,138 350,146 388,126" fill="none" stroke="${M.blue}" stroke-width="2.5" opacity="0.6"/>
      ${[0,1,2,3,4,5,6,7,8,9].map(i=>`<line x1="${18+i*41}" y1="210" x2="${18+i*41}" y2="216" stroke="${M.faint}"/>`).join('')}
    </g>
    <g transform="translate(422,104)"><rect width="184" height="230" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <rect x="16" y="18" width="80" height="9" rx="4" fill="${M.dim}"/>
      ${[0,1,2,3,4].map(i=>`<g transform="translate(16,${44+i*36})"><rect width="10" height="10" rx="2" fill="${[M.green,M.blue,M.cyan,M.amber,M.dim][i]}"/><rect x="20" y="1" width="${90-i*8}" height="8" rx="4" fill="${M.faint}"/><rect x="140" y="1" width="14" height="8" rx="4" fill="${M.dim}"/></g>`).join('')}
    </g>
  </g>`);

// ---- CRM pipeline (kanban) ----
CIEL.mockups.crm = chrome(
  sidebar(1) + topbar('Pipeline · CRM') +
  `<g transform="translate(172,72)">
    ${['New','Qualified','Proposal','Won'].map((c,ci)=>`<g transform="translate(${ci*152},0)">
      <text x="0" y="12" fill="${M.dim}" font-family="sans-serif" font-size="11" font-weight="600">${c}</text>
      <text x="120" y="12" fill="${M.faint}" font-family="sans-serif" font-size="11">${[6,4,3,5][ci]}</text>
      ${[0,1,2].slice(0,3-((ci===2)?1:0)).map(k=>`<g transform="translate(0,${24+k*74})"><rect width="138" height="62" rx="8" fill="${M.panel}" stroke="${M.line}"/>
        <rect x="12" y="12" width="${80-k*6}" height="8" rx="4" fill="${M.ink}"/>
        <rect x="12" y="28" width="60" height="7" rx="3.5" fill="${M.faint}"/>
        <circle cx="20" cy="48" r="7" fill="${[M.blue,M.cyan,M.green][ci%3]}" opacity="0.8"/>
        <rect x="34" y="44" width="40" height="7" rx="3.5" fill="${M.dim}"/>
        <rect x="104" y="42" width="24" height="12" rx="6" fill="rgba(61,214,140,0.16)"/></g>`).join('')}
    </g>`).join('')}
  </g>`);

// ---- Hospital management ----
CIEL.mockups.hospital = chrome(
  sidebar(0) + topbar('Wards · Hospital MS') +
  `<g transform="translate(172,72)">
    ${[['Admitted','142',M.blue],['Available beds','38',M.green],['In surgery','7',M.amber],['Discharges','24',M.cyan]].map((d,i)=>`<g transform="translate(${i*154},0)"><rect width="142" height="78" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="14" y="14" width="76" height="8" rx="4" fill="${M.dim}"/><text x="14" y="52" fill="${M.ink}" font-family="sans-serif" font-size="24" font-weight="700">${d[1]}</text><rect x="14" y="62" width="30" height="6" rx="3" fill="${d[2]}"/></g>`).join('')}
    <g transform="translate(0,96)"><rect width="606" height="238" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <rect x="18" y="18" width="120" height="9" rx="4" fill="${M.dim}"/>
      <line x1="18" y1="44" x2="588" y2="44" stroke="${M.line}"/>
      ${[0,1,2,3,4].map(r=>`<g transform="translate(18,${58+r*36})">
        <circle cx="8" cy="8" r="6" fill="${[M.green,M.amber,M.green,M.blue,M.green][r]}"/>
        <rect x="26" y="4" width="120" height="8" rx="4" fill="${M.ink}" opacity="0.85"/>
        <rect x="220" y="4" width="80" height="8" rx="4" fill="${M.faint}"/>
        <rect x="340" y="4" width="60" height="8" rx="4" fill="${M.faint}"/>
        <rect x="470" y="1" width="90" height="14" rx="7" fill="rgba(47,107,255,0.14)"/></g>`).join('')}
    </g>
  </g>`);

// ---- Analytics ----
CIEL.mockups.analytics = chrome(
  sidebar(2) + topbar('Analytics') +
  `<g transform="translate(172,72)">
    <g><rect width="290" height="150" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="18" y="18" width="90" height="9" rx="4" fill="${M.dim}"/>
      ${[40,70,55,90,75,110,95,130].map((h,i)=>`<rect x="${20+i*32}" y="${132-h}" width="20" height="${h}" rx="3" fill="${i===7?M.cyan:M.blue}" opacity="${i===7?1:0.5}"/>`).join('')}
    </g>
    <g transform="translate(306,0)"><rect width="300" height="150" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="18" y="18" width="70" height="9" rx="4" fill="${M.dim}"/>
      <circle cx="90" cy="90" r="44" fill="none" stroke="${M.faint}" stroke-width="14"/>
      <circle cx="90" cy="90" r="44" fill="none" stroke="${M.cyan}" stroke-width="14" stroke-dasharray="180 276" stroke-linecap="round" transform="rotate(-90 90 90)"/>
      ${[0,1,2].map(i=>`<g transform="translate(160,${60+i*30})"><rect width="10" height="10" rx="2" fill="${[M.cyan,M.blue,M.faint][i]}"/><rect x="20" y="1" width="${90-i*15}" height="8" rx="4" fill="${M.dim}"/></g>`).join('')}
    </g>
    <g transform="translate(0,166)"><rect width="606" height="168" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="18" y="18" width="100" height="9" rx="4" fill="${M.dim}"/>
      <polyline points="18,140 80,120 142,128 204,96 266,108 328,70 390,86 452,54 514,66 588,40" fill="none" stroke="${M.green}" stroke-width="2.5"/>
      <path d="M18,140 80,120 142,128 204,96 266,108 328,70 390,86 452,54 514,66 588,40 588,150 18,150Z" fill="url(#ag)" opacity="0.15"/>
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M.green}"/><stop offset="1" stop-color="${M.green}" stop-opacity="0"/></linearGradient></defs>
    </g>
  </g>`);

// ---- School management ----
CIEL.mockups.school = chrome(
  sidebar(1) + topbar('Students · School MS') +
  `<g transform="translate(172,72)">
    <rect width="606" height="60" rx="10" fill="${M.panel}" stroke="${M.line}"/>
    ${['Enrolled','Attendance','Fees paid','Classes'].map((t,i)=>`<g transform="translate(${20+i*150},0)"><rect x="0" y="16" width="70" height="7" rx="3.5" fill="${M.dim}"/><text x="0" y="46" fill="${M.ink}" font-family="sans-serif" font-size="18" font-weight="700">${['1,284','94%','88%','42'][i]}</text></g>`).join('')}
    <g transform="translate(0,76)"><rect width="606" height="258" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <line x1="18" y1="44" x2="588" y2="44" stroke="${M.line}"/>
      <text x="18" y="30" fill="${M.dim}" font-family="sans-serif" font-size="12" font-weight="600">Class register</text>
      ${[0,1,2,3,4,5].map(r=>`<g transform="translate(18,${58+r*33})"><circle cx="10" cy="8" r="9" fill="${['#2F6BFF','#57D9C4','#3DD68C','#E5A94E','#E5678A','#8A6BFF'][r]}" opacity="0.85"/><rect x="30" y="4" width="130" height="8" rx="4" fill="${M.ink}" opacity="0.8"/><rect x="260" y="4" width="70" height="8" rx="4" fill="${M.faint}"/><rect x="400" y="4" width="50" height="8" rx="4" fill="${M.faint}"/><rect x="520" y="1" width="52" height="14" rx="7" fill="rgba(61,214,140,0.16)"/></g>`).join('')}
    </g>
  </g>`);

// ---- E-commerce ----
CIEL.mockups.ecommerce = chrome(
  sidebar(0) + topbar('Store · Commerce') +
  `<g transform="translate(172,72)">
    ${[0,1].map(i=>`<g transform="translate(${i*310},0)"><rect width="296" height="80" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="16" y="16" width="80" height="8" rx="4" fill="${M.dim}"/><text x="16" y="54" fill="${M.ink}" font-family="sans-serif" font-size="22" font-weight="700">${['$48,290','1,024 orders'][i]}</text></g>`).join('')}
    <g transform="translate(0,96)">
      ${[0,1,2,3].map(i=>`<g transform="translate(${i*152},0)"><rect width="140" height="150" rx="10" fill="${M.panel}" stroke="${M.line}"/>
        <rect x="10" y="10" width="120" height="80" rx="6" fill="${M.panel2}"/>
        <rect x="46" y="36" width="48" height="28" rx="4" fill="${[M.blue,M.cyan,M.green,M.amber][i]}" opacity="0.35"/>
        <rect x="12" y="100" width="90" height="8" rx="4" fill="${M.ink}" opacity="0.8"/>
        <rect x="12" y="116" width="50" height="8" rx="4" fill="${M.faint}"/>
        <text x="12" y="140" fill="${M.cyan}" font-family="monospace" font-size="12">$${[39,59,24,89][i]}</text></g>`).join('')}
    </g>
    <g transform="translate(0,258)"><rect width="606" height="76" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <polyline points="18,54 90,44 162,50 234,30 306,40 378,22 450,34 522,16 588,24" fill="none" stroke="${M.green}" stroke-width="2.5"/></g>
  </g>`);

// ---- Logistics / fleet ----
CIEL.mockups.logistics = chrome(
  sidebar(0) + topbar('Fleet · Logistics') +
  `<g transform="translate(172,72)">
    <g><rect width="360" height="262" rx="10" fill="${M.panel2}" stroke="${M.line}"/>
      <path d="M40,60 Q140,40 200,120 T340,180" fill="none" stroke="${M.line}" stroke-width="2" stroke-dasharray="4 5"/>
      <path d="M60,200 Q160,220 240,140 T320,70" fill="none" stroke="${M.line}" stroke-width="2" stroke-dasharray="4 5"/>
      <circle cx="40" cy="60" r="8" fill="${M.blue}"/><circle cx="340" cy="180" r="8" fill="${M.green}"/>
      <circle cx="200" cy="120" r="6" fill="${M.cyan}"/><circle cx="240" cy="140" r="6" fill="${M.amber}"/>
      <circle cx="320" cy="70" r="6" fill="${M.cyan}"/>
      <g transform="translate(150,110)"><rect width="10" height="10" rx="2" fill="${M.cyan}"/></g>
    </g>
    <g transform="translate(376,0)"><rect width="230" height="262" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="16" y="18" width="90" height="9" rx="4" fill="${M.dim}"/>
      ${[0,1,2,3,4].map(i=>`<g transform="translate(16,${44+i*42})"><circle cx="8" cy="10" r="7" fill="${[M.green,M.blue,M.amber,M.green,M.cyan][i]}"/><rect x="26" y="2" width="90" height="8" rx="4" fill="${M.ink}" opacity="0.8"/><rect x="26" y="16" width="60" height="7" rx="3.5" fill="${M.faint}"/><rect x="170" y="4" width="30" height="10" rx="5" fill="${M.faint}"/></g>`).join('')}
    </g>
  </g>`);

// ---- SaaS billing ----
CIEL.mockups.saas = chrome(
  sidebar(3) + topbar('Billing · SaaS') +
  `<g transform="translate(172,72)">
    <g><rect width="606" height="120" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <rect x="20" y="20" width="80" height="8" rx="4" fill="${M.dim}"/>
      <text x="20" y="70" fill="${M.ink}" font-family="sans-serif" font-size="30" font-weight="700">$18,940</text>
      <rect x="20" y="86" width="120" height="7" rx="3.5" fill="${M.green}" opacity="0.7"/>
      ${[60,80,70,95,88,110,102].map((h,i)=>`<rect x="${380+i*30}" y="${100-h}" width="18" height="${h}" rx="3" fill="${M.blue}" opacity="${0.4+i*0.08}"/>`).join('')}
    </g>
    <g transform="translate(0,136)"><rect width="606" height="198" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <text x="18" y="30" fill="${M.dim}" font-family="sans-serif" font-size="12" font-weight="600">Subscriptions</text>
      <line x1="18" y1="44" x2="588" y2="44" stroke="${M.line}"/>
      ${[['Starter','$29',M.blue],['Growth','$99',M.cyan],['Scale','$299',M.green],['Enterprise','Custom',M.amber]].map((d,i)=>`<g transform="translate(18,${58+i*33})"><rect width="10" height="10" rx="2" fill="${d[2]}"/><rect x="24" y="1" width="90" height="8" rx="4" fill="${M.ink}" opacity="0.8"/><rect x="300" y="1" width="60" height="8" rx="4" fill="${M.faint}"/><text x="520" y="9" fill="${M.cyan}" font-family="monospace" font-size="11">${d[1]}</text></g>`).join('')}
    </g>
  </g>`);

// ---- Booking ----
CIEL.mockups.booking = chrome(
  sidebar(0) + topbar('Calendar · Booking') +
  `<g transform="translate(172,72)">
    <rect width="606" height="262" rx="10" fill="${M.panel}" stroke="${M.line}"/>
    ${['Mon','Tue','Wed','Thu','Fri'].map((d,i)=>`<text x="${40+i*116}" y="30" fill="${M.dim}" font-family="sans-serif" font-size="11" font-weight="600">${d}</text>`).join('')}
    <line x1="18" y1="42" x2="588" y2="42" stroke="${M.line}"/>
    ${[0,1,2,3,4].map(col=>[0,1,2].map(row=>{ const has=(col+row)%2===0||col===2; if(!has)return''; const c=[M.blue,M.cyan,M.green,M.amber][(col+row)%4]; return `<rect x="${28+col*116}" y="${56+row*66}" width="98" height="54" rx="7" fill="${c}" opacity="0.16" stroke="${c}" stroke-opacity="0.5"/><rect x="${38+col*116}" y="${68+row*66}" width="60" height="7" rx="3.5" fill="${M.ink}" opacity="0.7"/><rect x="${38+col*116}" y="${82+row*66}" width="40" height="6" rx="3" fill="${M.dim}"/>`; }).join('')).join('')}
  </g>`);

// ---- Inventory ----
CIEL.mockups.inventory = chrome(
  sidebar(1) + topbar('Stock · Inventory') +
  `<g transform="translate(172,72)">
    ${[['SKUs','3,412'],['Low stock','28'],['Value','$212K']].map((d,i)=>`<g transform="translate(${i*204},0)"><rect width="190" height="72" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="16" y="16" width="70" height="7" rx="3.5" fill="${M.dim}"/><text x="16" y="50" fill="${M.ink}" font-family="sans-serif" font-size="22" font-weight="700">${d[1]}</text></g>`).join('')}
    <g transform="translate(0,90)"><rect width="606" height="244" rx="10" fill="${M.panel}" stroke="${M.line}"/>
      <line x1="18" y1="44" x2="588" y2="44" stroke="${M.line}"/>
      <text x="18" y="30" fill="${M.dim}" font-family="sans-serif" font-size="12" font-weight="600">Items</text>
      ${[0,1,2,3,4,5].map(r=>{const pct=[80,30,60,15,90,45][r];const c=pct<25?M.red:pct<50?M.amber:M.green;return `<g transform="translate(18,${58+r*30})"><rect x="0" y="2" width="120" height="8" rx="4" fill="${M.ink}" opacity="0.8"/><rect x="200" y="4" width="240" height="6" rx="3" fill="${M.faint}"/><rect x="200" y="4" width="${240*pct/100}" height="6" rx="3" fill="${c}"/><text x="460" y="10" fill="${M.dim}" font-family="monospace" font-size="10">${pct}%</text></g>`;}).join('')}
    </g>
  </g>`);

// ---- AI automation ----
CIEL.mockups.ai = chrome(
  sidebar(2) + topbar('Workflows · AI') +
  `<g transform="translate(172,72)">
    <rect width="606" height="262" rx="10" fill="${M.panel2}" stroke="${M.line}"/>
    <g transform="translate(40,50)">
      ${[['Trigger',M.blue,0,60],['Classify',M.cyan,170,20],['Extract',M.cyan,170,100],['Route',M.green,330,60],['Notify',M.amber,490,60]].map(n=>`<g transform="translate(${n[2]},${n[3]})"><rect width="110" height="52" rx="9" fill="${M.panel}" stroke="${n[1]}" stroke-opacity="0.5"/><circle cx="20" cy="26" r="8" fill="${n[1]}" opacity="0.8"/><rect x="36" y="18" width="56" height="7" rx="3.5" fill="${M.ink}" opacity="0.8"/><rect x="36" y="30" width="38" height="6" rx="3" fill="${M.faint}"/></g>`).join('')}
      <path d="M150,86 C165,86 155,46 170,46" fill="none" stroke="${M.line}" stroke-width="2"/>
      <path d="M150,86 C165,86 155,126 170,126" fill="none" stroke="${M.line}" stroke-width="2"/>
      <path d="M280,46 C310,46 300,86 330,86" fill="none" stroke="${M.line}" stroke-width="2"/>
      <path d="M280,126 C310,126 300,86 330,86" fill="none" stroke="${M.line}" stroke-width="2"/>
      <path d="M440,86 L490,86" fill="none" stroke="${M.line}" stroke-width="2"/>
      <circle cx="160" cy="86" r="3" fill="${M.cyan}"/><circle cx="320" cy="86" r="3" fill="${M.green}"/><circle cx="475" cy="86" r="3" fill="${M.amber}"/>
    </g>
    <g transform="translate(40,200)"><rect width="526" height="40" rx="8" fill="${M.panel}" stroke="${M.line}"/><circle cx="24" cy="20" r="7" fill="${M.green}"/><rect x="40" y="16" width="200" height="8" rx="4" fill="${M.dim}"/><rect x="470" y="12" width="40" height="16" rx="8" fill="rgba(61,214,140,0.18)"/></g>
  </g>`);

// ---- Property management ----
CIEL.mockups.property = chrome(
  sidebar(0) + topbar('Units · Property MS') +
  `<g transform="translate(172,72)">
    ${[['Occupancy','92%'],['Rent due','$14.2K'],['Requests','9']].map((d,i)=>`<g transform="translate(${i*204},0)"><rect width="190" height="72" rx="10" fill="${M.panel}" stroke="${M.line}"/><rect x="16" y="16" width="70" height="7" rx="3.5" fill="${M.dim}"/><text x="16" y="50" fill="${M.ink}" font-family="sans-serif" font-size="22" font-weight="700">${d[1]}</text></g>`).join('')}
    <g transform="translate(0,90)">
      ${[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{const st=[0,1,0,0,2,0,1,0,0,0,2,0][i];const c=[M.green,M.amber,M.red][st];return `<g transform="translate(${(i%4)*152},${Math.floor(i/4)*80})"><rect width="140" height="68" rx="9" fill="${M.panel}" stroke="${M.line}"/><rect x="12" y="12" width="40" height="8" rx="4" fill="${M.ink}" opacity="0.8"/><circle cx="120" cy="16" r="5" fill="${c}"/><rect x="12" y="30" width="80" height="6" rx="3" fill="${M.faint}"/><rect x="12" y="46" width="50" height="6" rx="3" fill="${M.faint}"/></g>`;}).join('')}
    </g>
  </g>`);

CIEL.showcase = [
  { id:'erp',        label:'ERP & Operations',        blurb:'Unified operations, finance and reporting in one system your whole team can trust.' },
  { id:'crm',        label:'CRM & Sales Pipeline',     blurb:'Track every deal from first contact to close, with a pipeline your team actually updates.' },
  { id:'hospital',   label:'Hospital Management',      blurb:'Wards, admissions, billing and records — coordinated in real time.' },
  { id:'analytics',  label:'Dashboards & Analytics',   blurb:'Turn scattered data into decisions with dashboards built around your metrics.' },
  { id:'school',     label:'School Management',        blurb:'Enrolment, attendance, fees and academics for the whole institution.' },
  { id:'ecommerce',  label:'E-commerce Platforms',     blurb:'Storefronts and back-office built to sell, ship and scale.' },
  { id:'logistics',  label:'Logistics & Fleet',        blurb:'Live tracking, routing and dispatch for moving things on time.' },
  { id:'ai',         label:'AI Automation',            blurb:'Workflows that classify, extract and route work — so people don\u2019t have to.' },
  { id:'saas',       label:'SaaS & Billing',           blurb:'Subscriptions, teams and metering for products that charge over time.' },
  { id:'property',   label:'Property Management',      blurb:'Units, tenants, rent and maintenance in one clear place.' }
];
