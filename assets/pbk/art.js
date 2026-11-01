/* ============================================================
   CIEL AFRICA PHOTO BOOKS — illustration & sticker library
   Original vector artwork drawn for Ciel Africa covers and pages.
   Each entry: n = name, k = keywords, b = viewBox (w h), s = SVG body.
   ============================================================ */
(function (root) {
  'use strict';
  var A = {};
  function add(id, n, k, b, s) { A[id] = { id: id, n: n, k: k, b: b, s: s }; }

  /* ---------------- KENYA ---------------- */
  add('kicc', 'Nairobi skyline', 'kenya nairobi city tower kicc', '400 440',
    '<defs><linearGradient id="kc1" x1="0" x2="1"><stop offset="0" stop-color="#9c4f2c"/><stop offset=".45" stop-color="#d88a5a"/><stop offset="1" stop-color="#8a4325"/></linearGradient>' +
    '<linearGradient id="kc2" x1="0" x2="1"><stop offset="0" stop-color="#cfc3ad"/><stop offset=".5" stop-color="#f4ecdc"/><stop offset="1" stop-color="#b9ab92"/></linearGradient>' +
    '<linearGradient id="kc3" x1="0" x2="1"><stop offset="0" stop-color="#6f7f8f"/><stop offset=".5" stop-color="#a9b9c6"/><stop offset="1" stop-color="#5f6e7c"/></linearGradient></defs>' +
    // background towers
    '<rect x="40" y="250" width="46" height="160" fill="url(#kc3)"/><rect x="40" y="250" width="46" height="8" fill="#56636f"/>' +
    '<g fill="#dfe8ee" opacity=".55"><rect x="47" y="266" width="8" height="5"/><rect x="60" y="266" width="8" height="5"/><rect x="73" y="266" width="8" height="5"/><rect x="47" y="282" width="8" height="5"/><rect x="60" y="282" width="8" height="5"/><rect x="73" y="282" width="8" height="5"/><rect x="47" y="298" width="8" height="5"/><rect x="60" y="298" width="8" height="5"/><rect x="73" y="298" width="8" height="5"/><rect x="47" y="314" width="8" height="5"/><rect x="60" y="314" width="8" height="5"/><rect x="73" y="314" width="8" height="5"/></g>' +
    '<rect x="300" y="200" width="56" height="210" fill="url(#kc3)"/><polygon points="300,200 328,176 356,200" fill="#56636f"/>' +
    '<g fill="#dfe8ee" opacity=".55"><rect x="308" y="214" width="40" height="4"/><rect x="308" y="228" width="40" height="4"/><rect x="308" y="242" width="40" height="4"/><rect x="308" y="256" width="40" height="4"/><rect x="308" y="270" width="40" height="4"/><rect x="308" y="284" width="40" height="4"/><rect x="308" y="298" width="40" height="4"/><rect x="308" y="312" width="40" height="4"/><rect x="308" y="326" width="40" height="4"/></g>' +
    // conical amphitheatre
    '<path d="M228 410 L272 300 L316 410 Z" fill="#b8643a"/><path d="M272 300 L316 410 L286 410 Z" fill="#8f4a28"/><rect x="226" y="398" width="92" height="14" fill="#7d3f22"/>' +
    // KICC tower body
    '<rect x="150" y="128" width="100" height="282" fill="url(#kc1)"/>' +
    '<g fill="#6e3317" opacity=".55"><rect x="160" y="128" width="5" height="282"/><rect x="176" y="128" width="5" height="282"/><rect x="192" y="128" width="5" height="282"/><rect x="208" y="128" width="5" height="282"/><rect x="224" y="128" width="5" height="282"/><rect x="240" y="128" width="4" height="282"/></g>' +
    '<g fill="#f3d2b4" opacity=".35"><rect x="167" y="128" width="3" height="282"/><rect x="183" y="128" width="3" height="282"/><rect x="199" y="128" width="3" height="282"/></g>' +
    // floor bands
    '<g fill="#7a3a1c" opacity=".35"><rect x="150" y="170" width="100" height="3"/><rect x="150" y="215" width="100" height="3"/><rect x="150" y="260" width="100" height="3"/><rect x="150" y="305" width="100" height="3"/><rect x="150" y="350" width="100" height="3"/></g>' +
    // helipad crown
    '<path d="M138 120 Q200 96 262 120 L256 132 Q200 112 144 132 Z" fill="#8f4a28"/>' +
    '<ellipse cx="200" cy="104" rx="78" ry="14" fill="url(#kc2)"/><rect x="122" y="104" width="156" height="10" fill="url(#kc2)"/><ellipse cx="200" cy="114" rx="78" ry="12" fill="#a99a80"/>' +
    '<ellipse cx="200" cy="102" rx="66" ry="10" fill="#efe6d4"/><rect x="194" y="70" width="12" height="34" fill="#cbbd9f"/><rect x="190" y="64" width="20" height="8" rx="2" fill="#b3a487"/>' +
    // podium + ground
    '<rect x="132" y="392" width="136" height="20" fill="#e3d6bd"/><rect x="20" y="410" width="360" height="10" rx="5" fill="#3c4a3a" opacity=".85"/>' +
    // acacia
    '<path d="M100 412 Q104 372 96 352" stroke="#3a2516" stroke-width="5" fill="none"/><path d="M98 360 Q86 352 74 352 M98 360 Q112 350 126 352" stroke="#3a2516" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M58 352 Q66 336 98 338 Q132 334 142 350 Q118 358 98 356 Q74 360 58 352 Z" fill="#43603a"/>');

  add('dhow', 'Dhow sail', 'kenya mombasa coast boat sea lamu', '400 400',
    '<defs><linearGradient id="dh1" x1="0" x2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#f3e6cc"/><stop offset="1" stop-color="#d9c7a3"/></linearGradient>' +
    '<linearGradient id="dh2" y1="0" y2="1"><stop offset="0" stop-color="#9a5a2f"/><stop offset="1" stop-color="#5a2f16"/></linearGradient></defs>' +
    '<path d="M196 40 L204 40 L210 300 L198 300 Z" fill="#6b3d1f"/>' +
    '<path d="M70 92 Q200 30 330 48 Q306 170 214 290 Q150 268 104 236 Q160 170 70 92 Z" fill="url(#dh1)"/>' +
    '<path d="M70 92 Q200 30 330 48" stroke="#8a6a44" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<path d="M150 70 Q170 170 140 252 M230 50 Q244 160 200 280" stroke="#d2bf98" stroke-width="3" fill="none" opacity=".8"/>' +
    '<path d="M196 40 L196 18 L230 28 L196 36" fill="#d64b2c"/>' +
    '<path d="M58 292 L350 292 Q330 340 290 350 L110 350 Q72 336 58 292 Z" fill="url(#dh2)"/>' +
    '<path d="M58 292 L350 292 L346 304 L62 304 Z" fill="#c98b4e"/><path d="M80 318 L330 318" stroke="#3f200e" stroke-width="3" opacity=".5"/>' +
    '<path d="M350 292 L372 270 L366 296 Z" fill="#7a4524"/>' +
    '<g fill="none" stroke="#1d7fae" stroke-width="7" stroke-linecap="round"><path d="M40 362 Q70 346 100 362 T160 362 T220 362 T280 362 T340 362 T380 360"/></g>' +
    '<g fill="none" stroke="#5bb7da" stroke-width="5" stroke-linecap="round" opacity=".9"><path d="M80 384 Q105 372 130 384 T180 384 T230 384 T280 384 T330 384"/></g>');

  add('serengeti', 'Acacia sunset', 'kenya serengeti safari savanna acacia giraffe sunset', '400 400',
    '<defs><radialGradient id="sg1" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="#ffd25e"/><stop offset=".7" stop-color="#ff9a2e"/><stop offset="1" stop-color="#f06a1d"/></radialGradient></defs>' +
    '<circle cx="200" cy="196" r="150" fill="url(#sg1)"/>' +
    '<g fill="#ffe08a" opacity=".55"><rect x="54" y="252" width="292" height="7" rx="3"/><rect x="66" y="272" width="268" height="6" rx="3"/><rect x="86" y="290" width="228" height="5" rx="2"/></g>' +
    '<path d="M20 330 Q120 310 200 322 Q290 334 380 318 L380 360 L20 360 Z" fill="#3b2314"/>' +
    '<path d="M150 326 Q156 270 140 230 M146 248 Q120 232 96 230 M150 270 Q178 246 214 238 M141 236 Q150 214 168 206" stroke="#3b2314" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M54 222 Q70 196 120 198 Q150 188 190 192 Q236 186 262 204 Q248 218 210 220 Q170 226 130 222 Q86 230 54 222 Z" fill="#3b2314"/>' +
    '<path d="M100 214 Q130 206 170 210" stroke="#5a3a24" stroke-width="3" fill="none" opacity=".5"/>' +
    // giraffe
    '<g stroke="#3b2314" stroke-linecap="round" fill="none"><path d="M296 290 L290 326 M306 292 L304 326 M338 290 L344 326 M330 292 L334 326" stroke-width="7"/><path d="M314 280 L318 214 Q320 196 330 186" stroke-width="14"/></g>' +
    '<g fill="#3b2314"><ellipse cx="318" cy="284" rx="30" ry="16"/><path d="M326 176 Q340 170 352 178 L350 186 Q340 184 332 192 Z"/><path d="M328 178 L326 166 M334 176 L336 164" stroke="#3b2314" stroke-width="3"/><path d="M290 280 Q280 284 278 300" stroke="#3b2314" stroke-width="3" fill="none"/></g>' +
    '<g fill="#3b2314"><path d="M40 330 L44 312 Q38 300 46 296 L56 296 L60 310 L62 330 Z" opacity=".9"/></g>');

  add('shield', 'Maasai shield', 'kenya maasai shield spears culture karibu', '400 440',
    '<defs><linearGradient id="sh1" x1="0" x2="1"><stop offset="0" stop-color="#a10e1f"/><stop offset=".5" stop-color="#d5172f"/><stop offset="1" stop-color="#9a0c1c"/></linearGradient></defs>' +
    '<g stroke-linecap="round"><path d="M80 420 L320 30" stroke="#f2f0ea" stroke-width="9"/><path d="M320 420 L80 30" stroke="#f2f0ea" stroke-width="9"/>' +
    '<path d="M80 420 L320 30" stroke="#b9b5aa" stroke-width="3" opacity=".6"/><path d="M320 420 L80 30" stroke="#b9b5aa" stroke-width="3" opacity=".6"/></g>' +
    '<path d="M320 30 L334 4 L340 22 Z M80 30 L66 4 L60 22 Z" fill="#cfd4d8"/><path d="M318 34 L344 -6 L330 40 Z" fill="#e7eaec"/><path d="M82 34 L56 -6 L70 40 Z" fill="#e7eaec"/>' +
    '<ellipse cx="200" cy="225" rx="108" ry="180" fill="#151515"/>' +
    '<ellipse cx="200" cy="225" rx="96" ry="168" fill="url(#sh1)"/>' +
    '<path d="M200 66 Q262 225 200 384 Q138 225 200 66 Z" fill="#151515"/>' +
    '<path d="M200 96 Q244 225 200 354 Q156 225 200 96 Z" fill="#f4efe4"/>' +
    '<path d="M200 140 Q222 225 200 310 Q178 225 200 140 Z" fill="#d5172f"/>' +
    '<ellipse cx="200" cy="225" rx="10" ry="34" fill="#151515"/>' +
    '<path d="M126 110 Q112 225 126 340" stroke="#f4efe4" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M274 110 Q288 225 274 340" stroke="#f4efe4" stroke-width="10" fill="none" stroke-linecap="round"/>' +
    '<path d="M154 74 Q126 120 128 160 M246 74 Q274 120 272 160" stroke="#ffffff" stroke-width="5" fill="none" opacity=".25" stroke-linecap="round"/>');

  add('lion', 'Lion', 'kenya lion safari wild king', '400 400',
    '<defs><radialGradient id="ln1" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d07a2a"/><stop offset="1" stop-color="#8f4512"/></radialGradient><radialGradient id="ln2" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#f6c06a"/><stop offset="1" stop-color="#d9912f"/></radialGradient></defs>' +
    '<path d="M200 24 L230 60 L276 44 L284 92 L330 96 L316 140 L360 164 L326 196 L356 236 L310 248 L318 296 L270 288 L256 336 L216 304 L200 352 L184 304 L144 336 L130 288 L82 296 L90 248 L44 236 L74 196 L40 164 L84 140 L70 96 L116 92 L124 44 L170 60 Z" fill="url(#ln1)"/>' +
    '<ellipse cx="200" cy="200" rx="96" ry="108" fill="url(#ln2)"/>' +
    '<circle cx="128" cy="124" r="22" fill="#d9912f"/><circle cx="128" cy="124" r="11" fill="#9a5418"/><circle cx="272" cy="124" r="22" fill="#d9912f"/><circle cx="272" cy="124" r="11" fill="#9a5418"/>' +
    '<ellipse cx="200" cy="248" rx="54" ry="40" fill="#fbe1b0"/>' +
    '<path d="M168 178 Q180 168 192 178" stroke="#3a2210" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M208 178 Q220 168 232 178" stroke="#3a2210" stroke-width="7" fill="none" stroke-linecap="round"/>' +
    '<path d="M178 220 L222 220 L200 248 Z" fill="#4a2a14"/><path d="M200 248 L200 262 M200 262 Q186 278 172 268 M200 262 Q214 278 228 268" stroke="#4a2a14" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<g fill="#c47a3a"><circle cx="170" cy="252" r="3"/><circle cx="160" cy="244" r="3"/><circle cx="230" cy="252" r="3"/><circle cx="240" cy="244" r="3"/></g>');

  /* ---------------- LOVE / COUPLE ---------------- */
  add('heart', 'Heart', 'love couple heart romance valentine', '400 380',
    '<defs><radialGradient id="ht1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff5a6a"/><stop offset=".6" stop-color="#e3162f"/><stop offset="1" stop-color="#a50a1c"/></radialGradient></defs>' +
    '<path d="M200 352 C120 290 30 230 30 140 C30 74 80 30 136 30 C170 30 190 50 200 72 C210 50 230 30 264 30 C320 30 370 74 370 140 C370 230 280 290 200 352 Z" fill="url(#ht1)"/>' +
    '<path d="M86 104 Q100 64 144 60" stroke="#fff" stroke-width="16" stroke-linecap="round" fill="none" opacity=".55"/><circle cx="76" cy="138" r="8" fill="#fff" opacity=".5"/>');

  add('heart-balloons', 'Heart balloons', 'love couple balloons hearts anniversary', '400 440',
    '<defs><radialGradient id="hb1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff6b7a"/><stop offset="1" stop-color="#c50f28"/></radialGradient><radialGradient id="hb2" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffc2d1"/><stop offset="1" stop-color="#f27aa0"/></radialGradient></defs>' +
    '<path d="M150 236 Q170 300 196 330 Q230 370 200 430" stroke="#7a5a5a" stroke-width="3" fill="none"/><path d="M262 210 Q240 290 214 330 Q186 370 204 430" stroke="#7a5a5a" stroke-width="3" fill="none"/>' +
    '<g transform="rotate(-12 150 130)"><path d="M150 236 C100 196 46 160 46 106 C46 66 76 40 110 40 C130 40 142 52 150 66 C158 52 170 40 190 40 C224 40 254 66 254 106 C254 160 200 196 150 236 Z" fill="url(#hb1)"/><path d="M82 94 Q90 66 116 62" stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none" opacity=".55"/><path d="M144 236 L156 236 L150 246 Z" fill="#a50a1c"/></g>' +
    '<g transform="rotate(10 262 110)"><path d="M262 210 C218 174 170 142 170 94 C170 58 196 36 226 36 C244 36 255 46 262 59 C269 46 280 36 298 36 C328 36 354 58 354 94 C354 142 306 174 262 210 Z" fill="url(#hb2)"/><path d="M200 84 Q206 60 228 56" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none" opacity=".6"/><path d="M256 210 L268 210 L262 220 Z" fill="#e0628a"/></g>' +
    '<path d="M186 404 Q200 392 214 404 Q200 418 186 404 Z" fill="#e3162f"/>');

  add('rings', 'Wedding rings', 'wedding rings marriage engagement couple anniversary', '400 360',
    '<defs><linearGradient id="rg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".35" stop-color="#e7b84a"/><stop offset=".7" stop-color="#b9831e"/><stop offset="1" stop-color="#f3d27a"/></linearGradient><linearGradient id="rg2" x1="0" x2="1"><stop offset="0" stop-color="#e8f6ff"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#9fd3f0"/></linearGradient></defs>' +
    '<circle cx="150" cy="216" r="100" fill="none" stroke="url(#rg1)" stroke-width="26"/>' +
    '<circle cx="256" cy="216" r="100" fill="none" stroke="url(#rg1)" stroke-width="26"/>' +
    '<path d="M150 116 A100 100 0 0 1 238 168" fill="none" stroke="url(#rg1)" stroke-width="26"/>' +
    '<path d="M228 92 L284 92 L300 112 L256 150 L212 112 Z" fill="url(#rg2)" stroke="#bfe3f7" stroke-width="2"/><path d="M212 112 L300 112 M240 92 L232 112 L256 150 L280 112 L272 92" stroke="#bfe3f7" stroke-width="2" fill="none"/>' +
    '<path d="M244 150 L268 150 L262 128 L250 128 Z" fill="#d9a63a"/>' +
    '<path d="M70 196 Q74 150 110 126" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>');

  add('cherries', 'Cherries', 'love couple cherries pair summer fruit', '400 420',
    '<defs><radialGradient id="ch1" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#ff4d5e"/><stop offset=".7" stop-color="#c8102e"/><stop offset="1" stop-color="#7d0716"/></radialGradient></defs>' +
    '<path d="M136 270 Q150 160 220 60 M268 260 Q248 150 220 60" stroke="#4f7a2a" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M220 60 Q270 20 330 44 Q300 96 230 72 Z" fill="#5fa036"/><path d="M228 66 Q280 50 318 50" stroke="#3f7a22" stroke-width="3" fill="none"/>' +
    '<circle cx="132" cy="320" r="82" fill="url(#ch1)"/><circle cx="276" cy="306" r="82" fill="url(#ch1)"/>' +
    '<path d="M86 300 Q92 266 122 254" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".55"/><path d="M230 286 Q236 252 266 240" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity=".55"/>');

  /* ---------------- EVENTS ---------------- */
  add('champagne', 'Champagne toast', 'event celebrate party champagne cheers anniversary wedding new year', '400 420',
    '<defs><linearGradient id="cp1" x1="0" x2="1"><stop offset="0" stop-color="#f2c94c"/><stop offset=".5" stop-color="#ffe9a3"/><stop offset="1" stop-color="#e0a92a"/></linearGradient></defs>' +
    '<g transform="rotate(-16 150 220)"><path d="M118 40 L182 40 L178 190 Q174 230 150 236 Q126 230 122 190 Z" fill="#ffffff" opacity=".55" stroke="#ffffff" stroke-width="4"/><path d="M124 96 L176 96 L174 190 Q170 224 150 228 Q130 224 126 190 Z" fill="url(#cp1)"/><rect x="146" y="236" width="8" height="110" fill="#ffffff" opacity=".85"/><ellipse cx="150" cy="350" rx="44" ry="10" fill="#ffffff" opacity=".85"/><g fill="#fff"><circle cx="140" cy="200" r="4"/><circle cx="160" cy="170" r="3"/><circle cx="146" cy="140" r="3"/><circle cx="158" cy="118" r="4"/></g></g>' +
    '<g transform="rotate(16 250 220)"><path d="M218 40 L282 40 L278 190 Q274 230 250 236 Q226 230 222 190 Z" fill="#ffffff" opacity=".55" stroke="#ffffff" stroke-width="4"/><path d="M224 96 L276 96 L274 190 Q270 224 250 228 Q230 224 226 190 Z" fill="url(#cp1)"/><rect x="246" y="236" width="8" height="110" fill="#ffffff" opacity=".85"/><ellipse cx="250" cy="350" rx="44" ry="10" fill="#ffffff" opacity=".85"/><g fill="#fff"><circle cx="240" cy="196" r="3"/><circle cx="258" cy="160" r="4"/><circle cx="244" cy="128" r="3"/></g></g>' +
    '<g fill="#ffe08a"><path d="M200 8 L206 30 L200 52 L194 30 Z"/><path d="M172 22 L184 36 M228 22 L216 36" stroke="#ffe08a" stroke-width="5" stroke-linecap="round"/><circle cx="160" cy="10" r="5"/><circle cx="242" cy="8" r="6"/><circle cx="200" cy="70" r="4"/></g>');

  add('balloons', 'Party balloons', 'event birthday party balloons celebrate', '400 440',
    '<defs><radialGradient id="bl1" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffd76a"/><stop offset="1" stop-color="#f3a712"/></radialGradient><radialGradient id="bl2" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#7ad8ff"/><stop offset="1" stop-color="#1f8fd1"/></radialGradient><radialGradient id="bl3" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff8aa8"/><stop offset="1" stop-color="#e2386a"/></radialGradient></defs>' +
    '<g stroke="#6b6b6b" stroke-width="2.5" fill="none"><path d="M118 220 Q140 300 196 360"/><path d="M200 196 Q206 280 198 360"/><path d="M286 214 Q262 300 202 360"/></g>' +
    '<ellipse cx="118" cy="140" rx="72" ry="84" fill="url(#bl3)"/><path d="M110 222 L126 222 L118 232 Z" fill="#c92a5a"/>' +
    '<ellipse cx="286" cy="134" rx="72" ry="84" fill="url(#bl2)"/><path d="M278 216 L294 216 L286 226 Z" fill="#1676b0"/>' +
    '<ellipse cx="200" cy="108" rx="76" ry="88" fill="url(#bl1)"/><path d="M192 194 L208 194 L200 204 Z" fill="#d68f0c"/>' +
    '<g fill="#fff" opacity=".55"><ellipse cx="92" cy="104" rx="12" ry="22" transform="rotate(20 92 104)"/><ellipse cx="172" cy="68" rx="12" ry="24" transform="rotate(20 172 68)"/><ellipse cx="262" cy="98" rx="12" ry="22" transform="rotate(20 262 98)"/></g>' +
    '<path d="M180 366 Q198 350 200 362 Q202 350 220 366 Q202 376 200 366 Q198 376 180 366 Z" fill="#e2386a"/>');

  add('disco', 'Disco ball', 'event party disco night dance celebrate', '400 420',
    '<defs><radialGradient id="ds1" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9ced6"/><stop offset="1" stop-color="#5c6370"/></radialGradient><clipPath id="ds2"><circle cx="200" cy="240" r="150"/></clipPath></defs>' +
    '<rect x="197" y="0" width="6" height="90" fill="#7a7f88"/>' +
    '<circle cx="200" cy="240" r="150" fill="url(#ds1)"/>' +
    '<g clip-path="url(#ds2)" stroke="#4a505b" stroke-width="2" opacity=".55" fill="none">' +
    '<path d="M50 120 H350 M50 150 H350 M50 180 H350 M50 210 H350 M50 240 H350 M50 270 H350 M50 300 H350 M50 330 H350 M50 360 H350"/>' +
    '<path d="M200 90 V390 M170 90 Q150 240 170 390 M140 90 Q100 240 140 390 M110 90 Q50 240 110 390 M230 90 Q250 240 230 390 M260 90 Q300 240 260 390 M290 90 Q350 240 290 390"/></g>' +
    '<g clip-path="url(#ds2)"><rect x="150" y="150" width="28" height="28" fill="#ffffff" opacity=".9"/><rect x="120" y="180" width="24" height="28" fill="#ffe7f4" opacity=".8"/><rect x="230" y="270" width="28" height="28" fill="#c8f1ff" opacity=".7"/><rect x="178" y="122" width="24" height="26" fill="#fff6c9" opacity=".8"/><rect x="262" y="210" width="26" height="28" fill="#ffd3e6" opacity=".6"/></g>' +
    '<g fill="#fff"><path d="M330 90 L336 112 L358 118 L336 124 L330 146 L324 124 L302 118 L324 112 Z"/><path d="M70 330 L74 344 L88 348 L74 352 L70 366 L66 352 L52 348 L66 344 Z"/></g>');

  add('cake', 'Birthday cake', 'event birthday cake party celebrate candles', '400 420',
    '<rect x="70" y="200" width="260" height="170" rx="18" fill="#ffb6c8"/><path d="M70 236 Q102 266 134 236 T198 236 T262 236 T330 236 L330 214 Q330 200 316 200 L84 200 Q70 200 70 214 Z" fill="#fff4e8"/>' +
    '<rect x="70" y="300" width="260" height="16" fill="#e8577e"/><rect x="56" y="366" width="288" height="16" rx="8" fill="#f2e6d8"/>' +
    '<g fill="#e8577e"><circle cx="110" cy="276" r="7"/><circle cx="170" cy="282" r="7"/><circle cx="230" cy="276" r="7"/><circle cx="290" cy="282" r="7"/></g>' +
    '<g><rect x="132" y="120" width="14" height="80" rx="4" fill="#7cc7f2"/><rect x="193" y="104" width="14" height="96" rx="4" fill="#ffd25e"/><rect x="254" y="120" width="14" height="80" rx="4" fill="#9be08a"/></g>' +
    '<g fill="#ff9a2e"><path d="M139 92 Q152 108 139 118 Q126 108 139 92 Z"/><path d="M200 76 Q213 92 200 102 Q187 92 200 76 Z"/><path d="M261 92 Q274 108 261 118 Q248 108 261 92 Z"/></g>' +
    '<g fill="#fff2a8"><path d="M139 102 Q144 110 139 114 Q134 110 139 102 Z"/><path d="M200 86 Q205 94 200 98 Q195 94 200 86 Z"/><path d="M261 102 Q266 110 261 114 Q256 110 261 102 Z"/></g>');

  /* ---------------- FRIENDS ---------------- */
  add('sunglasses', 'Heart sunglasses', 'friends besties summer sunglasses fun girls trip', '400 260',
    '<defs><linearGradient id="sg9" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6fae"/><stop offset="1" stop-color="#b8136a"/></linearGradient></defs>' +
    '<path d="M24 92 Q10 80 18 66 L60 60" stroke="#ff4f9a" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M376 92 Q390 80 382 66 L340 60" stroke="#ff4f9a" stroke-width="10" fill="none" stroke-linecap="round"/>' +
    '<path d="M110 220 C70 190 30 160 30 112 C30 80 52 58 80 58 C96 58 106 66 112 78 C118 66 128 58 144 58 C172 58 194 80 194 112 C194 160 150 190 110 220 Z" fill="#ff4f9a"/>' +
    '<path d="M290 220 C250 190 206 160 206 112 C206 80 228 58 256 58 C272 58 282 66 288 78 C294 66 304 58 320 58 C348 58 370 80 370 112 C370 160 330 190 290 220 Z" fill="#ff4f9a"/>' +
    '<path d="M110 204 C76 178 44 152 44 114 C44 90 60 72 82 72 C96 72 106 82 112 94 C118 82 128 72 142 72 C164 72 180 90 180 114 C180 152 144 178 110 204 Z" fill="url(#sg9)"/>' +
    '<path d="M290 204 C256 178 220 152 220 114 C220 90 236 72 258 72 C272 72 282 82 288 94 C294 82 304 72 318 72 C340 72 356 90 356 114 C356 152 324 178 290 204 Z" fill="url(#sg9)"/>' +
    '<path d="M186 100 Q200 84 214 100" stroke="#ff4f9a" stroke-width="10" fill="none"/>' +
    '<path d="M66 112 Q72 92 92 88" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".6"/><path d="M242 112 Q248 92 268 88" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".6"/>');

  add('icecreams', 'Ice cream cheers', 'friends summer ice cream besties sweet', '400 440',
    '<defs><pattern id="ic9" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="18" height="18" fill="#e9a65a"/><path d="M0 0 V18 M9 0 V18" stroke="#c9843c" stroke-width="3"/></pattern></defs>' +
    '<g transform="rotate(-18 140 260)"><path d="M90 220 L190 220 L140 420 Z" fill="url(#ic9)"/><circle cx="140" cy="180" r="62" fill="#ffb3c7"/><path d="M80 210 Q100 240 120 214 Q140 244 160 214 Q180 240 200 210 L200 196 L80 196 Z" fill="#ffb3c7"/><circle cx="140" cy="116" r="16" fill="#d0102e"/><path d="M140 100 Q150 80 166 76" stroke="#3f7a22" stroke-width="4" fill="none"/><g fill="#fff" opacity=".6"><ellipse cx="114" cy="160" rx="10" ry="16"/></g></g>' +
    '<g transform="rotate(18 260 260)"><path d="M210 220 L310 220 L260 420 Z" fill="url(#ic9)"/><circle cx="260" cy="180" r="62" fill="#9ee6c9"/><path d="M200 210 Q220 240 240 214 Q260 244 280 214 Q300 240 320 210 L320 196 L200 196 Z" fill="#9ee6c9"/><g stroke-linecap="round" stroke-width="6"><path d="M236 150 L244 158" stroke="#ff4f9a"/><path d="M276 140 L268 150" stroke="#ffd25e"/><path d="M290 176 L298 168" stroke="#5bb7da"/><path d="M250 190 L258 198" stroke="#ffd25e"/><path d="M230 182 L224 192" stroke="#5bb7da"/><path d="M270 196 L278 188" stroke="#ff4f9a"/></g><g fill="#fff" opacity=".6"><ellipse cx="234" cy="160" rx="10" ry="16"/></g></g>');

  add('cocktails', 'Two cocktails', 'friends cheers drinks cocktails party besties', '400 420',
    '<g transform="rotate(-12 140 220)"><path d="M70 90 L210 90 L140 210 Z" fill="#ff7aa2" opacity=".9"/><path d="M60 80 L220 80 L140 214 Z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><rect x="136" y="214" width="8" height="120" fill="#fff"/><ellipse cx="140" cy="338" rx="46" ry="10" fill="#fff"/><circle cx="196" cy="70" r="22" fill="#ffd25e"/><circle cx="196" cy="70" r="14" fill="#fff3b0"/><path d="M110 60 L150 140" stroke="#5bb7da" stroke-width="5"/></g>' +
    '<g transform="rotate(12 260 220)"><path d="M190 90 L330 90 L260 210 Z" fill="#5fd0c5" opacity=".9"/><path d="M180 80 L340 80 L260 214 Z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><rect x="256" y="214" width="8" height="120" fill="#fff"/><ellipse cx="260" cy="338" rx="46" ry="10" fill="#fff"/><circle cx="214" cy="66" r="18" fill="#d0102e"/><path d="M214 48 Q224 30 240 28" stroke="#3f7a22" stroke-width="4" fill="none"/></g>' +
    '<g fill="#fff"><path d="M200 20 L205 38 L223 43 L205 48 L200 66 L195 48 L177 43 L195 38 Z"/></g>');

  /* ---------------- BABY ---------------- */
  add('teddy', 'Teddy bear', 'baby teddy bear newborn kids first year cute', '400 420',
    '<defs><radialGradient id="td1" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#c9925e"/><stop offset="1" stop-color="#94602f"/></radialGradient></defs>' +
    '<ellipse cx="200" cy="300" rx="110" ry="100" fill="url(#td1)"/><ellipse cx="200" cy="314" rx="62" ry="58" fill="#e8c49a"/>' +
    '<ellipse cx="96" cy="370" rx="44" ry="34" fill="#94602f"/><ellipse cx="96" cy="372" rx="24" ry="18" fill="#e8c49a"/><ellipse cx="304" cy="370" rx="44" ry="34" fill="#94602f"/><ellipse cx="304" cy="372" rx="24" ry="18" fill="#e8c49a"/>' +
    '<ellipse cx="98" cy="256" rx="30" ry="46" fill="#94602f" transform="rotate(30 98 256)"/><ellipse cx="302" cy="256" rx="30" ry="46" fill="#94602f" transform="rotate(-30 302 256)"/>' +
    '<circle cx="120" cy="64" r="40" fill="#a86f3a"/><circle cx="120" cy="64" r="22" fill="#e8c49a"/><circle cx="280" cy="64" r="40" fill="#a86f3a"/><circle cx="280" cy="64" r="22" fill="#e8c49a"/>' +
    '<circle cx="200" cy="130" r="96" fill="url(#td1)"/>' +
    '<ellipse cx="200" cy="166" rx="46" ry="36" fill="#f0d2ad"/><ellipse cx="200" cy="150" rx="16" ry="11" fill="#3a2210"/><path d="M200 162 L200 176 M200 176 Q188 186 178 178 M200 176 Q212 186 222 178" stroke="#3a2210" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<circle cx="164" cy="116" r="10" fill="#2a1a0c"/><circle cx="236" cy="116" r="10" fill="#2a1a0c"/><circle cx="167" cy="113" r="3" fill="#fff"/><circle cx="239" cy="113" r="3" fill="#fff"/>' +
    '<path d="M200 222 L150 196 Q140 222 150 246 Z" fill="#7cc7f2"/><path d="M200 222 L250 196 Q260 222 250 246 Z" fill="#7cc7f2"/><circle cx="200" cy="222" r="14" fill="#5aaee0"/>');

  add('onesie', 'Baby onesie', 'baby onesie newborn clothes first year cute', '400 420',
    '<path d="M150 30 Q200 70 250 30 L320 60 L372 140 L318 178 L292 144 L292 300 Q292 340 262 350 L240 400 L160 400 L138 350 Q108 340 108 300 L108 144 L82 178 L28 140 L80 60 Z" fill="#ffd8e4"/>' +
    '<path d="M150 30 Q200 70 250 30" stroke="#f3a3bd" stroke-width="10" fill="none"/><path d="M28 140 L82 178 M372 140 L318 178" stroke="#f3a3bd" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M160 400 L240 400" stroke="#f3a3bd" stroke-width="10" stroke-linecap="round"/>' +
    '<g fill="#fff"><circle cx="176" cy="384" r="6"/><circle cx="200" cy="384" r="6"/><circle cx="224" cy="384" r="6"/></g>' +
    '<path d="M200 262 C170 238 146 220 146 194 C146 176 160 164 176 164 C188 164 196 172 200 180 C204 172 212 164 224 164 C240 164 254 176 254 194 C254 220 230 238 200 262 Z" fill="#ff6f91"/>');

  add('stroller', 'Pram', 'baby pram stroller newborn walk', '400 380',
    '<path d="M60 170 L300 170 Q300 280 190 280 Q60 280 60 170 Z" fill="#9fd6ef"/><path d="M60 170 Q60 50 190 40 L190 170 Z" fill="#5fb3dc"/><path d="M80 170 Q90 90 172 66" stroke="#fff" stroke-width="6" fill="none" opacity=".5"/>' +
    '<path d="M300 170 L344 104 L372 104" stroke="#3d4a56" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M110 280 L96 320 M270 280 L284 320" stroke="#3d4a56" stroke-width="8" stroke-linecap="round"/>' +
    '<circle cx="96" cy="330" r="34" fill="#3d4a56"/><circle cx="96" cy="330" r="14" fill="#c9d2da"/><circle cx="284" cy="330" r="34" fill="#3d4a56"/><circle cx="284" cy="330" r="14" fill="#c9d2da"/>' +
    '<g fill="#fff"><circle cx="120" cy="214" r="8"/><circle cx="170" cy="230" r="8"/><circle cx="220" cy="230" r="8"/><circle cx="268" cy="214" r="8"/></g>');

  /* ---------------- PETS ---------------- */
  add('dog', 'Dog', 'pets dog puppy corgi good boy', '400 400',
    '<path d="M86 40 L150 120 L104 170 Q70 110 86 40 Z" fill="#c8661f"/><path d="M314 40 L250 120 L296 170 Q330 110 314 40 Z" fill="#c8661f"/><path d="M98 66 L136 118 L110 146 Q90 106 98 66 Z" fill="#f7b5a0"/><path d="M302 66 L264 118 L290 146 Q310 106 302 66 Z" fill="#f7b5a0"/>' +
    '<path d="M200 96 Q300 96 320 200 Q336 300 200 340 Q64 300 80 200 Q100 96 200 96 Z" fill="#e2852f"/>' +
    '<path d="M200 140 Q176 150 168 200 Q150 250 140 300 Q170 336 200 340 Q230 336 260 300 Q250 250 232 200 Q224 150 200 140 Z" fill="#fff6ea"/>' +
    '<circle cx="152" cy="198" r="15" fill="#2a1a0c"/><circle cx="248" cy="198" r="15" fill="#2a1a0c"/><circle cx="157" cy="193" r="5" fill="#fff"/><circle cx="253" cy="193" r="5" fill="#fff"/>' +
    '<ellipse cx="200" cy="262" rx="26" ry="18" fill="#2a1a0c"/><path d="M190 256 Q196 252 204 254" stroke="#fff" stroke-width="4" opacity=".5" fill="none" stroke-linecap="round"/>' +
    '<path d="M200 280 L200 296 M200 296 Q182 312 166 300 M200 296 Q218 312 234 300" stroke="#2a1a0c" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<path d="M186 306 Q200 346 214 306 Z" fill="#ff7a8a"/>' +
    '<g fill="#d06a1c" opacity=".35"><circle cx="128" cy="250" r="5"/><circle cx="116" cy="236" r="4"/><circle cx="272" cy="250" r="5"/><circle cx="284" cy="236" r="4"/></g>');

  add('cat', 'Cat', 'pets cat kitten meow', '400 420',
    '<path d="M300 380 Q384 360 366 280 Q356 240 330 250 Q352 270 350 300 Q346 346 290 356 Z" fill="#2d2d33"/>' +
    '<path d="M120 400 Q100 300 140 236 L260 236 Q300 300 280 400 Z" fill="#2d2d33"/>' +
    '<path d="M108 60 L156 120 L128 150 Z" fill="#2d2d33"/><path d="M292 60 L244 120 L272 150 Z" fill="#2d2d33"/><path d="M118 82 L146 120 L130 136 Z" fill="#f2a5b5"/><path d="M282 82 L254 120 L270 136 Z" fill="#f2a5b5"/>' +
    '<ellipse cx="200" cy="170" rx="100" ry="86" fill="#2d2d33"/>' +
    '<ellipse cx="160" cy="170" rx="20" ry="24" fill="#f6d34a"/><ellipse cx="240" cy="170" rx="20" ry="24" fill="#f6d34a"/><ellipse cx="160" cy="172" rx="6" ry="18" fill="#1a1a1a"/><ellipse cx="240" cy="172" rx="6" ry="18" fill="#1a1a1a"/>' +
    '<path d="M190 206 L210 206 L200 218 Z" fill="#f2a5b5"/><path d="M200 218 Q188 232 176 224 M200 218 Q212 232 224 224" stroke="#8a8a92" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    '<g stroke="#bdbdc6" stroke-width="2.5" stroke-linecap="round"><path d="M150 214 L96 206 M150 222 L98 230 M250 214 L304 206 M250 222 L302 230"/></g>' +
    '<path d="M150 252 Q200 270 250 252 L246 268 Q200 284 154 268 Z" fill="#e2386a"/><circle cx="200" cy="284" r="11" fill="#f6d34a"/>');

  add('paw', 'Paw print', 'pets paw dog cat print', '400 400',
    '<g fill="#3d2a1e"><ellipse cx="200" cy="262" rx="92" ry="78"/><ellipse cx="96" cy="168" rx="36" ry="46" transform="rotate(-20 96 168)"/><ellipse cx="160" cy="98" rx="38" ry="50" transform="rotate(-6 160 98)"/><ellipse cx="240" cy="98" rx="38" ry="50" transform="rotate(6 240 98)"/><ellipse cx="304" cy="168" rx="36" ry="46" transform="rotate(20 304 168)"/></g>');

  add('bone', 'Dog bone', 'pets dog bone treat', '400 200',
    '<path d="M90 70 Q60 20 30 50 Q0 80 40 100 Q0 120 30 150 Q60 180 90 130 L310 130 Q340 180 370 150 Q400 120 360 100 Q400 80 370 50 Q340 20 310 70 Z" fill="#fbf2e2" stroke="#e3d2b6" stroke-width="6"/>');

  /* ---------------- FAMILY ---------------- */
  add('house', 'Family home', 'family home house sweet', '400 400',
    '<rect x="80" y="180" width="240" height="190" fill="#f6e3c4"/><rect x="80" y="180" width="240" height="12" fill="#e4c99e"/>' +
    '<path d="M50 196 L200 60 L350 196 Z" fill="#c4512b"/><path d="M200 60 L350 196 L326 196 L200 82 Z" fill="#9e3d1e"/>' +
    '<rect x="262" y="84" width="34" height="66" fill="#8a3b22"/><rect x="256" y="76" width="46" height="14" fill="#6e2d18"/>' +
    '<g fill="#ffffff" opacity=".7"><circle cx="279" cy="56" r="10"/><circle cx="292" cy="36" r="13"/><circle cx="276" cy="16" r="9"/></g>' +
    '<rect x="172" y="260" width="58" height="110" rx="29" fill="#2f6e5a"/><circle cx="216" cy="318" r="5" fill="#f3c34c"/>' +
    '<rect x="102" y="228" width="50" height="50" fill="#9fd6ef" stroke="#fff" stroke-width="6"/><path d="M127 228 V278 M102 253 H152" stroke="#fff" stroke-width="5"/>' +
    '<rect x="250" y="228" width="50" height="50" fill="#9fd6ef" stroke="#fff" stroke-width="6"/><path d="M275 228 V278 M250 253 H300" stroke="#fff" stroke-width="5"/>' +
    '<path d="M186 150 C178 144 170 138 170 128 C170 120 176 116 182 116 C186 116 188 118 190 122 C192 118 194 116 198 116 C204 116 210 120 210 128 C210 138 202 144 194 150 Z" fill="#e2386a" transform="translate(10 0)"/>' +
    '<rect x="40" y="368" width="320" height="12" rx="6" fill="#5c9b4a"/>' +
    '<circle cx="54" cy="330" r="30" fill="#5c9b4a"/><circle cx="346" cy="336" r="26" fill="#6fb05a"/>');

  add('tree', 'Family tree', 'family tree roots heart generations', '400 420',
    '<path d="M186 410 Q192 330 176 270 Q150 240 118 236 M190 300 Q214 250 260 236 M186 270 Q194 220 200 170" stroke="#7a4a26" stroke-width="22" fill="none" stroke-linecap="round"/>' +
    '<path d="M150 410 Q190 390 250 410 Z" fill="#7a4a26"/>' +
    '<g fill="#5fa036"><circle cx="200" cy="140" r="90"/><circle cx="110" cy="200" r="70"/><circle cx="290" cy="196" r="74"/><circle cx="150" cy="96" r="60"/><circle cx="256" cy="98" r="62"/></g>' +
    '<g fill="#4f8a2a" opacity=".6"><circle cx="230" cy="190" r="50"/><circle cx="130" cy="160" r="40"/></g>' +
    '<g fill="#e2386a"><path d="M150 140 c-8 -6 -14 -10 -14 -18 c0 -6 4 -10 9 -10 c3 0 5 2 5 4 c0 -2 2 -4 5 -4 c5 0 9 4 9 10 c0 8 -6 12 -14 18z"/><path d="M250 120 c-8 -6 -14 -10 -14 -18 c0 -6 4 -10 9 -10 c3 0 5 2 5 4 c0 -2 2 -4 5 -4 c5 0 9 4 9 10 c0 8 -6 12 -14 18z"/><path d="M110 220 c-8 -6 -14 -10 -14 -18 c0 -6 4 -10 9 -10 c3 0 5 2 5 4 c0 -2 2 -4 5 -4 c5 0 9 4 9 10 c0 8 -6 12 -14 18z"/><path d="M300 210 c-8 -6 -14 -10 -14 -18 c0 -6 4 -10 9 -10 c3 0 5 2 5 4 c0 -2 2 -4 5 -4 c5 0 9 4 9 10 c0 8 -6 12 -14 18z"/><path d="M204 70 c-8 -6 -14 -10 -14 -18 c0 -6 4 -10 9 -10 c3 0 5 2 5 4 c0 -2 2 -4 5 -4 c5 0 9 4 9 10 c0 8 -6 12 -14 18z"/><path d="M200 200 c-8 -6 -14 -10 -14 -18 c0 -6 4 -10 9 -10 c3 0 5 2 5 4 c0 -2 2 -4 5 -4 c5 0 9 4 9 10 c0 8 -6 12 -14 18z"/></g>');

  /* ---------------- YEAR ---------------- */
  add('calendar', 'Calendar', 'year calendar 365 days dates memories', '400 400',
    '<rect x="50" y="70" width="300" height="300" rx="26" fill="#ffffff"/><path d="M50 96 Q50 70 76 70 L324 70 Q350 70 350 96 L350 150 L50 150 Z" fill="#e5383b"/>' +
    '<g fill="#3d3d3d"><rect x="110" y="40" width="20" height="64" rx="10"/><rect x="270" y="40" width="20" height="64" rx="10"/></g>' +
    '<g fill="#e9e4dc"><rect x="80" y="176" width="36" height="30" rx="6"/><rect x="128" y="176" width="36" height="30" rx="6"/><rect x="176" y="176" width="36" height="30" rx="6"/><rect x="224" y="176" width="36" height="30" rx="6"/><rect x="272" y="176" width="36" height="30" rx="6"/>' +
    '<rect x="80" y="220" width="36" height="30" rx="6"/><rect x="128" y="220" width="36" height="30" rx="6"/><rect x="176" y="220" width="36" height="30" rx="6"/><rect x="272" y="220" width="36" height="30" rx="6"/>' +
    '<rect x="80" y="264" width="36" height="30" rx="6"/><rect x="128" y="264" width="36" height="30" rx="6"/><rect x="176" y="264" width="36" height="30" rx="6"/><rect x="224" y="264" width="36" height="30" rx="6"/><rect x="272" y="264" width="36" height="30" rx="6"/>' +
    '<rect x="80" y="308" width="36" height="30" rx="6"/><rect x="128" y="308" width="36" height="30" rx="6"/><rect x="224" y="308" width="36" height="30" rx="6"/><rect x="272" y="308" width="36" height="30" rx="6"/></g>' +
    '<path d="M242 246 c-12 -9 -20 -15 -20 -26 c0 -8 6 -13 12 -13 c4 0 7 2 8 5 c1 -3 4 -5 8 -5 c6 0 12 5 12 13 c0 11 -8 17 -20 26z" fill="#e5383b"/>' +
    '<circle cx="194" cy="323" r="24" fill="none" stroke="#2f80ed" stroke-width="5"/>' +
    '<g fill="#fff" opacity=".9"><rect x="140" y="102" width="120" height="16" rx="8"/></g>');

  add('firework', 'Fireworks', 'year new year celebrate fireworks party night', '400 400',
    '<g stroke-linecap="round" stroke-width="9"><g stroke="#ffd25e"><path d="M200 200 L200 40 M200 200 L200 360 M200 200 L40 200 M200 200 L360 200"/></g>' +
    '<g stroke="#ff5a8a"><path d="M200 200 L87 87 M200 200 L313 313 M200 200 L313 87 M200 200 L87 313"/></g>' +
    '<g stroke="#5bd1e8" stroke-width="7"><path d="M200 200 L139 52 M200 200 L261 348 M200 200 L348 139 M200 200 L52 261 M200 200 L261 52 M200 200 L139 348 M200 200 L348 261 M200 200 L52 139"/></g></g>' +
    '<circle cx="200" cy="200" r="70" fill="currentColor" opacity="0"/><circle cx="200" cy="200" r="54" fill="#fff6d6"/><circle cx="200" cy="200" r="30" fill="#ffd25e"/>' +
    '<g fill="#fff"><circle cx="200" cy="24" r="10"/><circle cx="376" cy="200" r="10"/><circle cx="200" cy="376" r="10"/><circle cx="24" cy="200" r="10"/></g>');

  add('sun', 'Sun', 'sun summer sunshine year bright', '400 400',
    '<defs><radialGradient id="sn1" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ffb21e"/></radialGradient></defs>' +
    '<g fill="#ffb21e"><path d="M200 10 L216 70 L184 70 Z"/><path d="M200 390 L216 330 L184 330 Z"/><path d="M10 200 L70 184 L70 216 Z"/><path d="M390 200 L330 184 L330 216 Z"/><path d="M66 66 L118 98 L98 118 Z"/><path d="M334 334 L282 302 L302 282 Z"/><path d="M334 66 L302 118 L282 98 Z"/><path d="M66 334 L98 282 L118 302 Z"/></g>' +
    '<circle cx="200" cy="200" r="110" fill="url(#sn1)"/>');

  /* ---------------- SOMEONE ---------------- */
  add('tulips', 'Tulip bouquet', 'someone mum mother flowers tulips bouquet love', '400 440',
    '<path d="M200 430 L198 240 M200 430 Q170 330 132 246 M200 430 Q234 330 270 246" stroke="#3f8a3a" stroke-width="9" fill="none" stroke-linecap="round"/>' +
    '<path d="M196 330 Q150 280 160 230 Q190 270 198 320 Z" fill="#5fae4a"/><path d="M204 330 Q256 290 252 240 Q214 270 204 320 Z" fill="#5fae4a"/>' +
    '<g><path d="M110 250 Q96 196 110 150 L128 176 L140 146 L154 176 L170 150 Q180 200 158 250 Q134 266 110 250 Z" fill="#ff5a7a"/><path d="M128 176 L140 146 L154 176 Q148 232 134 258 Q126 220 128 176 Z" fill="#e2386a"/></g>' +
    '<g><path d="M176 240 Q160 176 176 120 L194 150 L204 114 L216 150 L234 120 Q246 180 222 240 Q198 256 176 240 Z" fill="#ffb21e"/><path d="M194 150 L204 114 L216 150 Q210 214 200 248 Q190 210 194 150 Z" fill="#f08a10"/></g>' +
    '<g><path d="M244 250 Q230 196 244 150 L262 176 L274 146 L288 176 L304 150 Q314 200 292 250 Q268 266 244 250 Z" fill="#c26be0"/><path d="M262 176 L274 146 L288 176 Q282 232 268 258 Q260 220 262 176 Z" fill="#9d47c2"/></g>' +
    '<path d="M130 300 L270 300 L232 430 L168 430 Z" fill="#f3e3c8"/><path d="M130 300 L200 360 L270 300" stroke="#e1c99f" stroke-width="5" fill="none"/>' +
    '<path d="M168 372 Q200 390 232 372 L228 392 Q200 404 172 392 Z" fill="#e2386a"/><path d="M200 384 Q176 410 168 436 M200 384 Q224 410 232 436" stroke="#e2386a" stroke-width="6" fill="none" stroke-linecap="round"/>');

  add('gift', 'Gift box', 'someone gift present birthday for you surprise', '400 400',
    '<rect x="70" y="170" width="260" height="200" rx="8" fill="#2f80ed"/><rect x="56" y="134" width="288" height="56" rx="8" fill="#5aa0ff"/>' +
    '<rect x="180" y="134" width="40" height="236" fill="#ffd25e"/><rect x="70" y="190" width="260" height="10" fill="#1d63c4" opacity=".5"/>' +
    '<path d="M200 134 Q150 60 110 80 Q80 100 120 130 Q150 140 200 134 Z" fill="#ffd25e"/><path d="M200 134 Q250 60 290 80 Q320 100 280 130 Q250 140 200 134 Z" fill="#ffd25e"/>' +
    '<path d="M200 134 Q160 86 124 94" stroke="#e8b52e" stroke-width="5" fill="none"/><path d="M200 134 Q240 86 276 94" stroke="#e8b52e" stroke-width="5" fill="none"/><circle cx="200" cy="134" r="16" fill="#f0b81c"/>' +
    '<g fill="#fff" opacity=".9"><circle cx="110" cy="250" r="7"/><circle cx="150" cy="310" r="7"/><circle cx="270" cy="240" r="7"/><circle cx="296" cy="320" r="7"/><circle cx="110" cy="340" r="5"/><circle cx="260" cy="350" r="5"/></g>');

  add('tie', 'Bow tie', 'someone dad father gentleman tie', '400 240',
    '<path d="M200 120 L40 40 Q20 120 40 200 Z" fill="#1f3c74"/><path d="M200 120 L360 40 Q380 120 360 200 Z" fill="#1f3c74"/>' +
    '<path d="M200 120 L40 40 Q60 90 60 120 L200 120 Z" fill="#2a4f96"/><path d="M200 120 L360 40 Q340 90 340 120 Z" fill="#2a4f96"/>' +
    '<rect x="166" y="82" width="68" height="76" rx="16" fill="#163060"/>' +
    '<g fill="#fff" opacity=".85"><circle cx="90" cy="96" r="7"/><circle cx="120" cy="140" r="7"/><circle cx="74" cy="160" r="6"/><circle cx="310" cy="96" r="7"/><circle cx="280" cy="140" r="7"/><circle cx="326" cy="160" r="6"/><circle cx="200" cy="104" r="5"/><circle cx="188" cy="136" r="5"/><circle cx="214" cy="140" r="5"/></g>');

  add('camera', 'Camera', 'memories camera photo travel sticker', '400 320',
    '<rect x="30" y="80" width="340" height="220" rx="30" fill="#2d3340"/><rect x="30" y="140" width="340" height="110" fill="#e9c08a"/><path d="M130 80 L156 40 L244 40 L270 80 Z" fill="#2d3340"/>' +
    '<circle cx="200" cy="190" r="86" fill="#1c212b"/><circle cx="200" cy="190" r="64" fill="#3a4a66"/><circle cx="200" cy="190" r="40" fill="#1c212b"/><circle cx="182" cy="172" r="14" fill="#fff" opacity=".6"/>' +
    '<rect x="300" y="100" width="44" height="22" rx="6" fill="#f3c34c"/><circle cx="76" cy="110" r="12" fill="#e5383b"/>');

  /* ---------------- SMALL STICKERS ---------------- */
  add('plane', 'Plane', 'travel plane flight trip sticker', '400 400',
    '<path d="M60 250 L340 90 Q370 76 376 96 Q380 112 356 128 L120 300 Z" fill="#ffffff" stroke="#2d3340" stroke-width="10" stroke-linejoin="round"/><path d="M220 170 L170 70 L200 60 L290 140 Z" fill="#5aa0ff" stroke="#2d3340" stroke-width="8" stroke-linejoin="round"/><path d="M220 210 L230 330 L260 320 L280 180 Z" fill="#5aa0ff" stroke="#2d3340" stroke-width="8" stroke-linejoin="round"/><path d="M90 230 L60 170 L84 162 L130 210 Z" fill="#5aa0ff" stroke="#2d3340" stroke-width="8" stroke-linejoin="round"/>' +
    '<path d="M40 320 Q60 300 90 310" stroke="#2d3340" stroke-width="6" fill="none" stroke-dasharray="14 12" stroke-linecap="round"/>');
  add('palm', 'Palm tree', 'travel palm beach island tropical summer', '400 420',
    '<path d="M196 410 Q200 300 230 170" stroke="#8a5a2c" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M200 380 L220 384 M206 330 L228 334 M214 280 L236 284 M222 230 L244 234" stroke="#6b4320" stroke-width="5"/>' +
    '<g fill="#3f9a3a"><path d="M230 170 Q160 110 70 150 Q150 120 230 176 Z"/><path d="M230 170 Q300 90 380 130 Q300 112 232 178 Z"/><path d="M230 170 Q190 70 120 60 Q200 90 226 176 Z"/><path d="M230 170 Q270 60 330 50 Q270 96 236 176 Z"/><path d="M230 170 Q140 170 110 250 Q160 190 228 178 Z"/><path d="M230 170 Q320 180 340 250 Q300 194 234 180 Z"/></g>' +
    '<g fill="#7a4a1c"><circle cx="222" cy="186" r="12"/><circle cx="242" cy="190" r="12"/></g><path d="M100 410 Q200 380 300 410 Z" fill="#f2d49b"/>');
  add('star', 'Star', 'star sparkle sticker', '400 400', '<path d="M200 20 L250 140 L380 150 L280 236 L312 370 L200 300 L88 370 L120 236 L20 150 L150 140 Z" fill="#ffd25e" stroke="#f0a91c" stroke-width="8" stroke-linejoin="round"/>');
  add('sparkle', 'Sparkle', 'sparkle shine sticker magic', '400 400', '<path d="M200 10 Q216 184 390 200 Q216 216 200 390 Q184 216 10 200 Q184 184 200 10 Z" fill="#ffffff"/><path d="M330 40 Q336 94 390 100 Q336 106 330 160 Q324 106 270 100 Q324 94 330 40 Z" fill="#ffd25e"/>');
  add('flower', 'Daisy', 'flower daisy spring summer sticker', '400 400',
    '<g fill="#ffffff" stroke="#efe6d6" stroke-width="3">' + [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (a) { return '<ellipse cx="200" cy="96" rx="36" ry="86" transform="rotate(' + a + ' 200 200)"/>'; }).join('') + '</g><circle cx="200" cy="200" r="54" fill="#ffc52e"/><circle cx="200" cy="200" r="54" fill="none" stroke="#f0a91c" stroke-width="6"/>');
  add('pin', 'Map pin', 'travel location pin map place', '400 400', '<path d="M200 390 Q90 250 90 160 A110 110 0 0 1 310 160 Q310 250 200 390 Z" fill="#e5383b"/><circle cx="200" cy="160" r="46" fill="#fff"/>');
  add('wave', 'Wave', 'sea ocean beach wave coast', '400 300', '<path d="M10 240 Q60 120 160 110 Q250 104 260 170 Q230 140 200 160 Q180 190 220 220 Q300 260 390 200 L390 290 L10 290 Z" fill="#1d7fae"/><path d="M40 270 Q140 230 230 250 Q320 270 390 240" stroke="#9fe0f2" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M200 160 Q220 150 240 160" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>');
  add('moon', 'Moon', 'night moon stars dream', '400 400', '<path d="M260 40 A170 170 0 1 0 360 280 A140 140 0 1 1 260 40 Z" fill="#ffe27a"/><g fill="#fff"><path d="M300 90 L306 108 L324 114 L306 120 L300 138 L294 120 L276 114 L294 108 Z"/><circle cx="350" cy="170" r="6"/></g>');
  add('rainbow', 'Rainbow', 'rainbow happy kids baby colour', '400 260',
    '<g fill="none" stroke-width="26"><path d="M40 240 A160 160 0 0 1 360 240" stroke="#ff6b6b"/><path d="M66 240 A134 134 0 0 1 334 240" stroke="#ffb21e"/><path d="M92 240 A108 108 0 0 1 308 240" stroke="#ffe27a"/><path d="M118 240 A82 82 0 0 1 282 240" stroke="#7ad08a"/><path d="M144 240 A56 56 0 0 1 256 240" stroke="#5aa0ff"/></g>');
  add('leaf', 'Leaf', 'leaf nature green plant', '400 400', '<path d="M60 340 Q40 120 340 60 Q360 300 60 340 Z" fill="#5fa036"/><path d="M60 340 Q180 220 300 100" stroke="#3f7a22" stroke-width="8" fill="none"/><path d="M140 260 L130 200 M200 200 L190 140 M170 230 L230 240 M230 170 L280 180" stroke="#3f7a22" stroke-width="5" stroke-linecap="round"/>');
  add('note', 'Music note', 'music song dance party', '400 400', '<path d="M150 300 L150 80 L320 40 L320 260" stroke="#2d3340" stroke-width="18" fill="none" stroke-linejoin="round"/><path d="M150 80 L320 40 L320 90 L150 130 Z" fill="#2d3340"/><ellipse cx="110" cy="310" rx="54" ry="40" fill="#2d3340"/><ellipse cx="280" cy="270" rx="54" ry="40" fill="#2d3340"/>');
  add('lips', 'Kiss', 'love kiss lips couple', '400 260', '<path d="M20 120 Q90 20 160 50 Q200 66 240 50 Q310 20 380 120 Q310 230 200 230 Q90 230 20 120 Z" fill="#e3162f"/><path d="M20 120 Q110 136 200 116 Q290 136 380 120" stroke="#8a0a1a" stroke-width="10" fill="none"/><path d="M110 76 Q140 64 170 72" stroke="#fff" stroke-width="8" fill="none" opacity=".5" stroke-linecap="round"/>');


  /* ---------------- DECOR: tapes, doodles and travel bits ---------------- */
  function tape(id, n, c1, c2) { add(id, n, 'tape washi decor scrapbook ' + n.toLowerCase(), '400 120', '<path d="M8 14 L392 6 L384 30 L396 52 L386 78 L394 104 L10 114 L18 88 L6 62 L16 38 Z" fill="' + c1 + '" opacity=".88"/><g opacity=".55" fill="' + c2 + '">' + [30, 90, 150, 210, 270, 330].map(function (x) { return '<path d="M' + x + ' 10 l28 0 l-34 104 l-28 0z"/>'; }).join('') + '</g>'); }
  tape('tape-pink', 'Pink tape', '#ffb3c7', '#ffffff'); tape('tape-yellow', 'Yellow tape', '#ffe27a', '#ffffff'); tape('tape-mint', 'Mint tape', '#9ee6c9', '#ffffff'); tape('tape-kraft', 'Kraft tape', '#d8b98a', '#b8925a');
  add('underline', 'Underline', 'doodle underline scribble decor', '400 80', '<path d="M12 50 Q100 18 200 40 T388 30" stroke="#e5383b" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M40 66 Q160 46 300 58" stroke="#e5383b" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>');
  add('circle-doodle', 'Circle doodle', 'doodle circle scribble highlight decor', '400 300', '<path d="M210 30 C320 26 386 90 380 160 C372 240 280 286 180 280 C80 274 20 220 26 150 C32 80 110 36 230 40 C300 44 350 70 360 96" stroke="#e5383b" stroke-width="10" fill="none" stroke-linecap="round"/>');
  add('arrow-doodle', 'Arrow doodle', 'doodle arrow pointer decor', '400 220', '<path d="M20 170 C90 60 210 40 330 90" stroke="#1d1d1f" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M290 50 L340 92 L282 120" stroke="#1d1d1f" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
  add('sparkles', 'Sparkles', 'sparkle shine stars decor magic', '400 400', '<g fill="#ffd25e"><path d="M150 40 Q162 140 260 150 Q162 160 150 260 Q138 160 40 150 Q138 140 150 40Z"/><path d="M300 220 Q306 270 356 276 Q306 282 300 332 Q294 282 244 276 Q294 270 300 220Z"/><path d="M300 40 Q304 76 340 80 Q304 84 300 120 Q296 84 260 80 Q296 76 300 40Z"/></g>');
  add('cloud', 'Cloud', 'cloud sky weather decor', '400 240', '<path d="M90 200 Q30 200 30 150 Q30 104 82 100 Q92 40 160 40 Q214 40 236 86 Q258 66 290 70 Q350 76 356 130 Q392 140 390 172 Q386 204 346 204 Z" fill="#ffffff" stroke="#d6e4ee" stroke-width="6"/>');
  add('balloon-air', 'Hot-air balloon', 'travel balloon sky adventure', '400 480', '<path d="M200 20 C90 20 40 110 60 200 C76 270 150 320 170 360 L230 360 C250 320 324 270 340 200 C360 110 310 20 200 20Z" fill="#ff5a5a"/><path d="M200 20 C150 20 120 120 136 210 C146 270 170 330 178 360 L222 360 C230 330 254 270 264 210 C280 120 250 20 200 20Z" fill="#ffd25e"/><path d="M200 20 C186 20 176 120 182 210 C186 270 194 330 196 360 L204 360 C206 330 214 270 218 210 C224 120 214 20 200 20Z" fill="#5aa0ff"/><path d="M176 360 L170 400 M224 360 L230 400" stroke="#6b4320" stroke-width="5"/><rect x="164" y="398" width="72" height="56" rx="8" fill="#a86f3a"/><rect x="164" y="398" width="72" height="12" fill="#8a5a2c"/>');
  add('suitcase', 'Suitcase', 'travel suitcase luggage trip holiday', '400 400', '<rect x="150" y="60" width="100" height="60" rx="18" fill="none" stroke="#5c3a1e" stroke-width="16"/><rect x="60" y="110" width="280" height="250" rx="26" fill="#e9905e"/><rect x="60" y="110" width="280" height="250" rx="26" fill="none" stroke="#b5452a" stroke-width="6"/><rect x="120" y="110" width="22" height="250" fill="#b5452a"/><rect x="258" y="110" width="22" height="250" fill="#b5452a"/><circle cx="210" cy="230" r="34" fill="#fff4e0"/><path d="M196 230 L210 214 L224 230 L210 246Z" fill="#2f80ed"/><rect x="90" y="360" width="30" height="20" rx="6" fill="#3d2a1e"/><rect x="280" y="360" width="30" height="20" rx="6" fill="#3d2a1e"/>');
  add('ticket', 'Ticket', 'travel ticket boarding pass flight trip', '400 220', '<path d="M20 30 H380 V80 A30 30 0 0 0 380 140 V190 H20 V140 A30 30 0 0 0 20 80 Z" fill="#fff4e0" stroke="#e5383b" stroke-width="6"/><path d="M270 36 V184" stroke="#e5383b" stroke-width="4" stroke-dasharray="10 10"/><path d="M60 110 L200 110 M60 140 L160 140" stroke="#e5383b" stroke-width="10" stroke-linecap="round"/><path d="M290 96 L360 96 M290 124 L340 124" stroke="#1d1d1f" stroke-width="8" stroke-linecap="round"/><path d="M80 66 L120 76 L160 60 L172 66 L130 86 L170 96 L160 102 L120 92 L84 100 L80 92 L110 84Z" fill="#2f80ed"/>');
  add('compass', 'Compass', 'travel compass explore adventure map', '400 400', '<circle cx="200" cy="200" r="170" fill="#f4ecdf" stroke="#3d2a1e" stroke-width="14"/><circle cx="200" cy="200" r="140" fill="none" stroke="#c9b48e" stroke-width="4"/><path d="M200 60 L232 200 L200 340 L168 200Z" fill="#e5383b"/><path d="M200 200 L232 200 L200 340 L168 200Z" fill="#1d1d1f"/><circle cx="200" cy="200" r="14" fill="#ffd25e"/><g fill="#3d2a1e"><rect x="196" y="36" width="8" height="22"/><rect x="196" y="342" width="8" height="22"/><rect x="36" y="196" width="22" height="8"/><rect x="342" y="196" width="22" height="8"/></g>');
  add('ribbon', 'Ribbon banner', 'banner ribbon label title decor', '400 160', '<path d="M10 50 L70 50 L70 130 L10 130 L36 90Z" fill="#b5122a"/><path d="M390 50 L330 50 L330 130 L390 130 L364 90Z" fill="#b5122a"/><path d="M60 30 H340 V110 H60Z" fill="#e5383b"/><path d="M60 110 L80 130 L80 110Z M340 110 L320 130 L320 110Z" fill="#7d0716"/>');
  add('stamp', 'Postage stamp', 'stamp postcard travel mail decor', '400 480', '<path d="M20 20 H380 V460 H20Z" fill="#fff" stroke="#e6dccd" stroke-width="4"/>' + (function () { var h = ''; for (var x = 20; x <= 380; x += 30) { h += '<circle cx="' + x + '" cy="20" r="10" fill="#f3ede3"/><circle cx="' + x + '" cy="460" r="10" fill="#f3ede3"/>'; } for (var y = 20; y <= 460; y += 30) { h += '<circle cx="20" cy="' + y + '" r="10" fill="#f3ede3"/><circle cx="380" cy="' + y + '" r="10" fill="#f3ede3"/>'; } return h; })() + '<rect x="50" y="50" width="300" height="380" fill="#86d6e8"/><circle cx="270" cy="140" r="46" fill="#ffd25e"/><path d="M50 330 L150 220 L230 300 L280 250 L350 330 V430 H50Z" fill="#2f6e5a"/><path d="M50 380 Q200 340 350 380 V430 H50Z" fill="#1d7fae"/>');
  add('polaroid', 'Photo frame', 'frame polaroid photo instant decor', '400 470', '<rect x="10" y="10" width="380" height="450" rx="6" fill="#ffffff" stroke="#e6dccd" stroke-width="3"/><rect x="34" y="34" width="332" height="332" fill="#e9e4dc"/><path d="M34 300 L140 200 L220 280 L270 236 L366 320 V366 H34Z" fill="#cfd8dc"/><circle cx="290" cy="110" r="30" fill="#ffffff"/>');
  add('heart-outline', 'Heart outline', 'love heart outline doodle', '400 360', '<path d="M200 330 C120 270 36 214 36 136 C36 78 80 40 132 40 C164 40 186 58 200 80 C214 58 236 40 268 40 C320 40 364 78 364 136 C364 214 280 270 200 330Z" fill="none" stroke="#e5383b" stroke-width="16" stroke-linejoin="round"/>');
  add('mountain', 'Mountain', 'kilimanjaro mount kenya mountain hiking travel', '400 300', '<path d="M10 290 L160 50 L230 160 L270 110 L390 290Z" fill="#5a7a8c"/><path d="M160 50 L196 108 L176 100 L160 120 L146 100 L124 108Z" fill="#ffffff"/><path d="M270 110 L292 146 L276 140 L262 150 L252 140Z" fill="#ffffff"/><path d="M160 50 L230 160 L210 290 L160 290Z" fill="#4a6878" opacity=".6"/>');
  add('palm-sunset', 'Island sunset', 'island beach sunset palm holiday coast', '400 400', '<circle cx="200" cy="200" r="170" fill="#ffd25e"/><path d="M30 250 H370 A170 170 0 0 1 30 250Z" fill="#1d7fae"/><path d="M60 280 H340 M90 310 H310" stroke="#86d6e8" stroke-width="8" stroke-linecap="round"/><path d="M210 250 Q216 180 240 130" stroke="#3b2314" stroke-width="10" fill="none"/><g fill="#2f6e5a"><path d="M240 130 Q190 96 140 120 Q190 110 240 136Z"/><path d="M240 130 Q290 90 340 114 Q290 108 242 138Z"/><path d="M240 130 Q230 80 190 60 Q234 86 238 134Z"/><path d="M240 130 Q262 80 300 66 Q264 96 244 136Z"/></g>');

  function svg(id, opts) {
    var a = A[id]; if (!a) return '';
    var b = a.b.split(' ');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + a.b + '" width="' + b[0] + '" height="' + b[1] + '">' + a.s + '</svg>';
  }
  var API = { all: A, svg: svg, list: function () { return Object.keys(A).map(function (k) { return A[k]; }); } };
  if (typeof module === 'object' && module.exports) module.exports = API; else root.PBKArt = API;
})(typeof self !== 'undefined' ? self : this);
