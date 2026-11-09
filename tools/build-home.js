#!/usr/bin/env node
/* Pre-renders the homepage template cards into index.html so they appear
   with the HTML itself instead of waiting for scripts.
   Run after changing data/templates.js:   node tools/build-home.js
   (If you forget, the homepage still redraws the cards in the browser
   when their data no longer matches the pre-rendered signature.) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const ctx = { console };
ctx.window = ctx; ctx.self = ctx;
ctx.matchMedia = () => ({ matches: false });
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/templates.js'), 'utf8'), ctx);
// same helpers as assets/js/site.js
vm.runInContext("CIEL.fmt=function(n){return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');};CIEL.esc=function(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});};", ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/tplcards.js'), 'utf8'), ctx);
const feats = vm.runInContext('CIEL.homeTemplates()', ctx);
ctx.__f = feats;
const html = vm.runInContext('CIEL.tplCardsHTML(__f,{more:true})', ctx);
const sig = vm.runInContext('CIEL.tplSig(__f)', ctx);
const file = path.join(ROOT, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const re = /<div class="htpl" id="homeTpl"[^>]*>[\s\S]*?<!--\/homeTpl--><\/div>|<div class="htpl" id="homeTpl"><\/div>/;
if (!re.test(s)) throw new Error('homeTpl container not found in index.html');
s = s.replace(re, '<div class="htpl" id="homeTpl" data-sig="' + sig + '">' + html + '<!--/homeTpl--></div>');
fs.writeFileSync(file, s);
console.log('homepage cards: ' + feats.length + ' templates, signature ' + sig);
