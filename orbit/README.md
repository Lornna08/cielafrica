# ORBIT Social: template

*Every channel. One clear direction.*

ORBIT Social is a social media management workspace for agencies and multi-brand teams, built as a working front-end template. It runs entirely in the browser with sample accounts and data, so nothing is ever posted to a real network.

Live: <https://www.cielafrica.com/orbit/>

## What's in it

| Area | What works in the template |
|---|---|
| Overview | KPIs, needs-attention queue, next 7 days, performance chart, account health, activity |
| Compose | Brand and account picking; per-network captions, limits and validation (chars, hashtags, media/video rules, X link counting); live previews for Instagram, Facebook, LinkedIn, TikTok, YouTube and X; library picker, uploads, snippets, emoji; date and time in the workspace time zone; autosave with restore |
| Calendar | Month, week and list views; filters; drag to reschedule with undo; "No date yet" strip; keyboard and screen-reader alternative through the post drawer's **Reschedule** dialog |
| Content Library | Media grid and list, uploads (IndexedDB), metadata, usage, duplicate to brand; captions and snippets; published posts for reuse; campaigns |
| Approvals | Multi-step workflow (internal review, then client approval, per brand); approve, request changes, comments, history; content edits reset approvals |
| Analytics | Range and network/account filters, KPIs against the previous period, charts, per-network table, top posts, campaigns, CSV export, print |
| Inbox | Comments, messages and mentions; reply and internal notes; assign, tag, resolve; drafts kept while the view refreshes |
| Team & Roles | Members, invites, brand access, suspend and remove; editable permissions matrix |
| Settings | Workspace, brands, connected accounts, approval workflow, time zone and best times, notifications, profile, data export and reset |

## Architecture

Vanilla JS, no build step. All modules sit under the `OS` namespace.

- `js/time.js`: time-zone maths. Instants are stored as UTC ISO strings and every view renders them in the workspace zone (default Africa/Nairobi), so changing the zone never moves a post in time.
- `js/policy.js`: roles, permissions, default matrix and the approval rules (no self-approval unless enabled, the role must be on the current step, one person cannot sign two steps of one version). It is UMD, so the same file runs in Node.
- `js/platforms.js`: per-network capabilities, validation and the adapter layer. `SampleAdapter` simulates; `ServerAdapter` is the stub a backend implements.
- `js/store.js`: the service layer. **Every write calls `policy.assert` first**, so a hidden button is never the only protection. Switching user in the account menu runs the same checks.
- `js/data.js`: seed data for a fictional agency (Northlight Studio) and five fictional brands.
- `js/pages-*.js`: views. `js/app.js`: shell, router, brand switcher, command palette, notifications.

## What is simulated

- **Accounts.** Every connected account is a labelled sample. No OAuth flow runs and no tokens exist.
- **Publishing.** "Publish now" and the scheduler mark posts as published with `simulated: true`. Posts to an expired sample account fail and say so.
- **Analytics.** Generated sample series, deterministic per day and labelled as sample data on screen and in the CSV.
- **Inbox.** Sample conversations. Replies are stored and marked "Not delivered".
- **Email.** Invites and notifications are created in the app only; no email is sent.
- **Storage.** State lives in `localStorage` (`orbit:template:v1`) and uploads in IndexedDB (`orbit-template-media`). **Reset** in the banner restores the seed.

## Path to production

1. **Server and database.** Move `store.js` behind an API (Postgres or similar). Run `policy.js` on the server for every request; the client copy only shapes the UI.
2. **Auth.** Real sign-in, sessions, invites by email, workspace membership.
3. **Network connections.** Implement `ServerAdapter` per network with official APIs and OAuth: Meta Graph API (Instagram and Facebook, needs app review), LinkedIn Marketing API, TikTok Content Posting API (needs audit for public posting), YouTube Data API, X API (paid tier). Keep tokens encrypted on the server and refresh them there.
4. **Scheduler.** Replace the in-browser timer with a job queue (e.g. a worker with retries and idempotency keys), record per-account results, and alert on failure.
5. **Media.** Upload to object storage with signed URLs; transcode video server-side.
6. **Insights and inbox.** Sync from each network's insights and messaging APIs where they're available, respecting rate limits and data-retention rules.

## Credentials this depends on

None to run the template. A production build needs: developer apps and approvals on each network (client IDs and secrets, kept server-side), a database, object storage, an email provider and a job runner.

## Photo credits

Images from [Unsplash](https://unsplash.com/?utm_source=ciel_africa&utm_medium=referral), used under the Unsplash License:

- Phil Desforges ([@storybyphil](https://unsplash.com/@storybyphil)): latte-art.webp
- Mike Kenneally ([@asthetik](https://unsplash.com/@asthetik)): coffee-beans.webp
- Tim Mossholder ([@timmossholder](https://unsplash.com/@timmossholder)): roasting.webp
- Nathan Dumlao ([@nate_dumlao](https://unsplash.com/@nate_dumlao)): espresso-pour.webp, espresso-reel.mp4
- Karl Fredrickson ([@kfred](https://unsplash.com/@kfred)): pour-over.webp
- Nick Harsell ([@nickharsell](https://unsplash.com/@nickharsell)): flat-white.webp
- Meghan Holmes ([@yellowteapot](https://unsplash.com/@yellowteapot)): battle-ropes.webp
- bruce mars ([@brucemars](https://unsplash.com/@brucemars)): mat-class.webp, class-reel.mp4
- CATHY PHAM ([@cathypham243](https://unsplash.com/@cathypham243)): dumbbell-row.webp
- Heidi Erickson ([@herickson7](https://unsplash.com/@herickson7)): kettlebells.webp
- Sven Mieke ([@sxoxm](https://unsplash.com/@sxoxm)): barbell-squad.webp
- Karina lago ([@karinalago](https://unsplash.com/@karinalago)): sunrise-run.webp
- Christian Lambert ([@_christianlambert](https://unsplash.com/@_christianlambert)): pool-palms.webp
- Sasha Kaunas ([@akaunas](https://unsplash.com/@akaunas)): infinity-deck.webp
- Irene Alvarado ([@airin47](https://unsplash.com/@airin47)): dhow-sunset.webp, dhow-reel.mp4
- Norbert Braun ([@medion4you](https://unsplash.com/@medion4you)): white-beach.webp
- Mustafa Masetic ([@mmvisualstories](https://unsplash.com/@mmvisualstories)): coastline.webp
- Albert Vincent Wu ([@albertvincentwu](https://unsplash.com/@albertvincentwu)): suite.webp
- ibnu ihza ([@mahendra_10](https://unsplash.com/@mahendra_10)): textures.webp
- Birgith Roosipuu ([@msbirgith](https://unsplash.com/@msbirgith)): serum-duo.webp
- Content Pixie ([@contentpixie](https://unsplash.com/@contentpixie)): dropper-white.webp
- Viva Luna Studios ([@vivalunastudios](https://unsplash.com/@vivalunastudios)): roller-oil.webp
- Sanket Khatua ([@sanket_khatua](https://unsplash.com/@sanket_khatua)): dropper-glass.webp
- Leighann Blackwood ([@ohleighann](https://unsplash.com/@ohleighann)): moisturise.webp, routine-reel.mp4
- Good Faces ([@goodfacesagency](https://unsplash.com/@goodfacesagency)): glow-portrait.webp

All brands, people and conversations are fictional.
