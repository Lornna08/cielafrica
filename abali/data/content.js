/* ==========================================================================
   ABALI HOSPITAL — content
   Departments, specialists, figures, the patient journey, reviews and the
   words on the page. Everything here is SAMPLE content for the template:
   replace it with the hospital's own. Photos live in img/p/ as
   name-800.webp and name-1600.webp.
   ========================================================================== */
window.AB = window.AB || {};

AB.content = {
  /* B. Introduction. In `statement`, [img:name] can place a small round photo inside the sentence (optional). */
  intro: {
    kicker: 'About Abali',
    statement: 'We listen first, explain every step in plain words, and treat you as a *whole person*, not a list of symptoms.',
    text: 'Abali brings general practice, specialist clinics, diagnostics and in-patient care into one place, so your records, your results and your care team stay together.',
    pillars: [
      { title: 'One record', text: 'Every test, scan and note in one file your doctors share.' },
      { title: 'One team', text: 'A named doctor and nurse who know your history.' },
      { title: 'One roof', text: 'Clinics, laboratory, imaging and pharmacy in the same building.' }
    ]
  },

  /* C. Departments. `img` is a photo in img/p/ (without the size). `tags` are short lines shown when open. */
  departments: [
    { id: 'general', name: 'General Medicine', short: 'Check-ups, ongoing conditions and first answers when something feels wrong.', tags: ['Adult consultations', 'Chronic care plans', 'Health screening'], img: 'general' },
    { id: 'paeds', name: 'Paediatrics', short: 'Care for babies, children and teenagers, with time for parents’ questions.', tags: ['Well-baby visits', 'Vaccinations', 'Growth and development'], img: 'peds' },
    { id: 'maternity', name: 'Maternity & Women’s Health', short: 'From planning a pregnancy to the first weeks at home.', tags: ['Antenatal clinics', 'Delivery suites', 'Postnatal support'], img: 'maternity' },
    { id: 'cardio', name: 'Cardiology', short: 'Heart checks, blood pressure and long-term heart care.', tags: ['ECG and monitoring', 'Blood pressure clinic', 'Heart health reviews'], img: 'care-bp' },
    { id: 'ortho', name: 'Orthopaedics', short: 'Bones, joints and movement, from injuries to long-standing pain.', tags: ['Fracture care', 'Joint pain clinic', 'Physiotherapy'], img: 'ortho' },
    { id: 'dental', name: 'Dental Care', short: 'Routine dental care and treatment for the whole family.', tags: ['Check-ups and cleaning', 'Fillings', 'Children’s dentistry'], img: 'dental' },
    { id: 'lab', name: 'Laboratory Services', short: 'Blood tests and samples processed on site, with results sent to your doctor.', tags: ['Blood tests', 'Urine and stool tests', 'Results to your doctor'], img: 'lab' },
    { id: 'imaging', name: 'Diagnostic Imaging', short: 'Scans and X-rays read by our radiology team.', tags: ['X-ray', 'Ultrasound', 'CT and MRI'], img: 'imaging' },
    { id: 'emergency', name: 'Emergency Care', short: 'An emergency team ready day and night.', tags: ['Open 24 hours', 'Triage on arrival', 'Admission when needed'], img: 'corridor' }
  ],

  /* D. Why Abali. Four short reasons, shown as a composition. */
  why: {
    kicker: 'Why Abali',
    title: 'Care that feels *coordinated*, because it is.',
    items: [
      { title: 'Patient-centred care', text: 'Your questions shape the plan. We explain the options and decide with you.', img: 'listen', size: 'xl' },
      { title: 'Experienced professionals', text: 'Specialists and nurses who work as one team around each patient.', tone: 'pollen' },
      { title: 'Modern facilities', text: 'Imaging, laboratory and theatres on site, so tests don’t mean another trip.', img: 'imaging-room' },
      { title: 'Clear communication', text: 'Results explained in plain language, with a named contact for follow-up.', tone: 'forest' }
    ]
  },

  /* E. Specialists: SAMPLE profiles. Replace names, roles, photos and details with your own team. */
  specialists: [
    { id: 'kofi', name: 'Dr. Brian Otieno', role: 'Cardiology', dept: 'cardio', img: 'doc-kofi', days: 'Tue, Thu', languages: 'English, Swahili, Dholuo', bio: 'Runs the heart health and blood pressure clinics, with a focus on long-term plans patients can actually follow.' },
    { id: 'lena', name: 'Dr. Njeri Kamau', role: 'Maternity & Women’s Health', dept: 'maternity', img: 'doc-lena', days: 'Mon to Fri', languages: 'English, Swahili, Kikuyu', bio: 'Supports women through pregnancy, delivery and the weeks after, with antenatal classes for first-time parents.' },
    { id: 'tunde', name: 'Dr. David Kiprotich', role: 'Orthopaedics', dept: 'ortho', img: 'doc-tunde', days: 'Mon, Thu, Sat', languages: 'English, Swahili, Kalenjin', bio: 'Treats fractures, sports injuries and joint pain, working closely with the physiotherapy team on recovery.' },
    { id: 'amara', name: 'Dr. Achieng Odhiambo', role: 'Paediatrics', dept: 'paeds', img: 'doc-amara', days: 'Mon, Wed, Fri', languages: 'English, Swahili', bio: 'Leads the children’s clinic. Known for unhurried appointments and for explaining things to children as well as their parents.' }
  ],

  /* F. Figures: EXAMPLE numbers for the template. Replace with verified figures, or remove. */
  stats: [
    { value: 120, suffix: '+', label: 'beds across wards and suites' },
    { value: 38, suffix: '', label: 'specialists and consultants' },
    { value: 9, suffix: '', label: 'departments under one roof' },
    { value: 24, suffix: '/7', label: 'emergency care, every day' }
  ],

  /* G. Patient information: the journey, what to bring, and the facilities. */
  journey: [
    { title: 'Book', text: 'Request a time online, by phone or on WhatsApp. We call to confirm.' },
    { title: 'Arrive', text: 'Check in at reception with your ID and any referral letter.' },
    { title: 'Consult', text: 'Meet your doctor, talk it through and agree the next steps together.' },
    { title: 'Tests & results', text: 'Any tests are done on site and the results go straight to your doctor.' },
    { title: 'Follow-up', text: 'A plan to take home, and a named contact if anything changes.' }
  ],
  bring: ['A form of ID', 'Your insurance or payment details', 'A list of the medicines you take', 'Any referral letter or earlier results'],
  facilities: [
    { title: 'Private and shared rooms', img: 'room' },
    { title: 'Laboratory on site', img: 'lab-tubes' },
    { title: 'Operating theatres', img: 'theatre' },
    { title: 'Calm waiting areas', img: 'waiting' }
  ],
  insurance: 'Sample text: list the insurance providers you accept and the payment options here.',

  /* I. Reviews: SAMPLE reviews for the template. Replace with real, permitted patient reviews. */
  reviews: [
    { quote: 'The doctor actually listened. I left knowing what was wrong, what the tests were for and what to do next.', name: 'Sample patient', meta: 'General Medicine' },
    { quote: 'From the scan to the results, everything happened in one morning, and someone explained each step to us.', name: 'Sample patient', meta: 'Diagnostic Imaging' },
    { quote: 'The maternity team made a frightening week feel calm. We always knew who to call.', name: 'Sample patient', meta: 'Maternity' }
  ]
};
