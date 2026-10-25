# MUSE: personal portfolio template (`/muse`)

A portfolio for models, photographers and creators. It uses the same builder as Wanja Mwangi's site, filled with a **fictional sample profile** (Amara Njeri, photographer) and Unsplash photos.

- **Pages:** home (profile first), portfolio with category tabs and a full-screen photo viewer, about, rate card and contact.
- **Template mode:**
  - The enquiry form never sends anything, and it says so.
  - Email, WhatsApp, phone and social links show a short note instead of opening.
  - The banner at the top marks the page as a template.
  - Search engines are told not to index the pages.
- **Sample brands:** the six "brands worked with" logos are invented wordmarks rendered for the template.

## Making it someone's site

1. Copy `tools/portfolio/template.json` to a new config and change `out` and `base` to the new folder.
2. Swap the photos into `<folder>/assets/img/` as `slug-480/800/1200/1600.webp`, and list them under `photos`.
3. Set `real: true` and `form.mode: "send"`, add a `_form` key to `api/contact.js` that sends to the owner's address, and remove `banner` and `credits_html`.
4. Run `python3 tools/portfolio/build.py <config-name>`.

## Photo credits

All photographs are from [Unsplash](https://unsplash.com) and used under the Unsplash License:

| Slug | Photo | Photographer |
|---|---|---|
| `photographer` | [2L-qjlBmhBI](https://unsplash.com/photos/2L-qjlBmhBI) | Emmanuel Yeboah Okine ([@emmanuel_okine](https://unsplash.com/@emmanuel_okine)) |
| `braids-white-top` | [FYxhALJcywI](https://unsplash.com/photos/FYxhALJcywI) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `braids-camisole-gaze` | [6oU5SYnjfMQ](https://unsplash.com/photos/6oU5SYnjfMQ) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `braids-eyes-closed` | [WCEMFqEIVek](https://unsplash.com/photos/WCEMFqEIVek) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `mono-profile` | [gbRTZdPv03w](https://unsplash.com/photos/gbRTZdPv03w) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `ponytail-profile` | [QS9ZX5UnS14](https://unsplash.com/photos/QS9ZX5UnS14) | jekafe ([@jekafe](https://unsplash.com/@jekafe)) |
| `golden-hands` | [GmD1ozPp0QA](https://unsplash.com/photos/GmD1ozPp0QA) | Sẹ́gun Toríọlá ([@seguntoriola](https://unsplash.com/@seguntoriola)) |
| `headwrap-hoops` | [1I3_xTAXTxo](https://unsplash.com/photos/1I3_xTAXTxo) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `headwrap-rest` | [XhhB5DCpbSA](https://unsplash.com/photos/XhhB5DCpbSA) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `locs-laugh` | [57-0lgqwQOY](https://unsplash.com/photos/57-0lgqwQOY) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `locs-gaze` | [KoMVonRUZ5A](https://unsplash.com/photos/KoMVonRUZ5A) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `locs-tilt` | [tRf6Fu3RYE4](https://unsplash.com/photos/tRf6Fu3RYE4) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `turtleneck-rope` | [61xt7ELYQGA](https://unsplash.com/photos/61xt7ELYQGA) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `pinstripe-afro` | [8YkE6veYNUw](https://unsplash.com/photos/8YkE6veYNUw) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `afro-playful` | [4c-wxrZMFsY](https://unsplash.com/photos/4c-wxrZMFsY) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `green-arms-crossed` | [lMRlRS-ww84](https://unsplash.com/photos/lMRlRS-ww84) | Sẹ́gun Toríọlá ([@seguntoriola](https://unsplash.com/@seguntoriola)) |
| `green-pose` | [7KN1DvUb_Zw](https://unsplash.com/photos/7KN1DvUb_Zw) | Sẹ́gun Toríọlá ([@seguntoriola](https://unsplash.com/@seguntoriola)) |
| `turtleneck-wide` | [gzfJ92jKs2g](https://unsplash.com/photos/gzfJ92jKs2g) | Gideon Hezekiah ([@gideonhezekiah](https://unsplash.com/@gideonhezekiah)) |
| `beige-suit-chair` | [SS1Oldoervo](https://unsplash.com/photos/SS1Oldoervo) | Sẹ́gun Toríọlá ([@seguntoriola](https://unsplash.com/@seguntoriola)) |
| `pink-tracksuit` | [2XC-i05hZF0](https://unsplash.com/photos/2XC-i05hZF0) | Sẹ́gun Toríọlá ([@seguntoriola](https://unsplash.com/@seguntoriola)) |
| `beige-hijab` | [j3Gg3CMiyzs](https://unsplash.com/photos/j3Gg3CMiyzs) | Sẹ́gun Toríọlá ([@seguntoriola](https://unsplash.com/@seguntoriola)) |
| `cafe-peace` | [vGYsNdTZl8A](https://unsplash.com/photos/vGYsNdTZl8A) | FOTOGRAFÍA EDITORIAL ([@fotografiaeditorial](https://unsplash.com/@fotografiaeditorial)) |
| `cafe-smile` | [Ll9YOG20UFI](https://unsplash.com/photos/Ll9YOG20UFI) | Nolan Manning ([@nolanrmanning](https://unsplash.com/@nolanrmanning)) |
