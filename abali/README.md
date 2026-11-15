# ABALI HOSPITAL — hospital website template

A Ciel Africa template for hospitals, clinics, medical centres and healthcare providers.
*Abali Hospital* is a sample hospital. Its doctors, figures, reviews, hours, address and contact details are
sample content and must be replaced for each client. No credentials, accreditations or medical claims are made.

## What's inside
- **Opening scene.** A living double helix drawn from about 95,000 green particles (half that on phones) on the graphics card (WebGL,
  no libraries): strands, rungs, a soft haze, glow motes and fine tendrils like tissue under a microscope. It
  assembles from a loose cloud as the page opens, turns slowly, follows the pointer a little on desktop, and
  loosens and lifts as you scroll away. On phones and portrait tablets it lies across the top of the screen with
  the words below it. It pauses when off screen, and shows a still image without WebGL or with reduced motion.
- **Header.** A floating pill navigation and *Book an appointment*; a full-screen menu on smaller screens. The
  header steps aside while you scroll down and returns when you scroll up.
- **About.** An editorial statement, a photograph and three pillars.
- **Services.** Nine departments as an interactive list: on desktop the photograph beside it changes as you point
  at or open a department; on phones each department opens with its own photograph. Each has *Book in …*, which
  scrolls to the form with the department chosen.
- **Why Abali.** A deep-green composition of four reasons, two with photographs.
- **Specialists.** Portrait cards in a scrolling row. Each opens a profile (side panel on desktop, bottom sheet on
  phones) with clinic days, languages and *Book with …*, which fills in the department and doctor.
- **Figures.** Counting numbers, labelled as example figures while `sample` is on.
- **Patient information.** The visit in five steps with a progress line, what to bring, insurance and payment,
  and facility photographs.
- **Appointment request form.** Name, phone, email, department, preferred doctor (filtered by department), date
  (from tomorrow, up to 60 days ahead), time (slots inside outpatient hours; closed days are refused), message and
  consent. Every field is checked with clear messages.
- **Patient stories**, **contact and location** (hours with *Clinics open now* in the hospital's time zone and
  today highlighted, map placeholder or embed) and a **footer** with departments, contact and social links.

## Appointments: what works today and what is still needed
The form is fully working in the browser, but **it does not book anything by itself**.
- With `booking.endpoint` empty (template mode) it checks every detail, then says plainly that nothing was sent.
- With an endpoint (Formspree, Getform, the hospital's own API or booking system) it POSTs JSON:
  `name, phone, email, department, doctor, date, time, message, summary`.
  It shows *Request received* only when the endpoint answers with a 2xx status, and always says the hospital
  will call to confirm. Anything else shows an error and keeps the details.
- To take real bookings with live availability, connect the hospital's scheduling system: the endpoint should
  check the slot and reply, and staff confirm by phone or SMS.

## Set it up for a new hospital or clinic
You only edit two files and the photos. Nothing in `js/` or `css/` needs to change.

1. **`config/site.config.js`**
   - `sample`: set to `false` once the sample content is replaced (removes the *Sample* labels and the form notice).
   - `brand` (name, short name, logo file), `theme` (eight colours), `fonts` (any Google Fonts pair).
   - `nav`, `hero` (kicker, headline lines, text, buttons, the floating department chips) and `hero.helix`
     (colours, density, size and placement for wide and tall screens).
   - `booking`: endpoint, slot length, earliest day and how far ahead, and the note beside the form.
   - `contact`: phone, emergency line, email, WhatsApp, address, map embed and directions link, time zone,
     outpatient hours per day, and the notes.
   - `social`, `seo`.
2. **`data/content.js`**: the introduction, departments (name, text, tags, photo), the reasons, specialists,
   figures, the patient journey, what to bring, facilities, insurance text and reviews.
3. **Photos** in `img/p/` as `name-800.webp` and `name-1600.webp`. Credits are in `credits.html` and
   `img/CREDITS.md`; replace both with the hospital's own photography.

## Notes
- Plain HTML, CSS and JavaScript. No build step, no frameworks, no tracking.
- Accessible: real buttons and labels, focus kept inside the menu and profile while open, Escape closes them,
  visible focus rings, `aria-live` for review changes and form messages, and full reduced-motion support.
- The `<base>` tag in `index.html` is for cielafrica.com/abali; on another domain or folder, or opened from disk,
  paths resolve from the page's own folder automatically.
