/* ============================================================
   CIEL AFRICA — keep the silent product mockups moving on every phone.
   Load this FIRST (top of <body>), before any script that calls play().

   Some phones refuse to play video until the visitor taps: iPhone in
   Low Power Mode, and the in-app browsers of WhatsApp, Instagram,
   Facebook and others. They show a frozen frame with a play button.

   1. Every mockup video is marked muted + inline (what mobile browsers
      need to autoplay) and never shows native controls.
   2. If the phone still refuses (play() fails with NotAllowedError), the
      video is swapped for an animated WebP of the same clip from
      /assets/img/anim/. Animated images are never blocked, so the mockup
      keeps moving with no tap. Browsers that play video never download it.
   3. A video without an animated copy starts on the visitor's first tap.
   ============================================================ */
(function () {
  'use strict';
  var proto = window.HTMLMediaElement && HTMLMediaElement.prototype;
  if (!proto || proto.__cielAutoplay) return;
  proto.__cielAutoplay = true;

  var V = '20261026a';
  // Animated copies that exist in /assets/img/anim/ (folder--name.webp).
  var ANIM = ['apex-motion--reel', 'ciel-shop--reel', 'njia--reel', 'orbit--reel', 'home--cledger-full', 'home--cledger-live', 'home--hero-mobile', 'home--meridian-live', 'home--reside-full', 'home--reside-live', 'home--transit-live', 'home--transit-phone-live'];
  var nativePlay = proto.play, waiting = [], armed = false;

  function prep(v) {
    if (v.__cielPrepped || v.tagName !== 'VIDEO') return;
    v.__cielPrepped = true;
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.removeAttribute('controls'); v.controls = false;
    try { v.disablePictureInPicture = true; v.disableRemotePlayback = true; } catch (e) { /* older browsers */ }
  }

  function animFor(v) {
    var src = v.currentSrc || v.getAttribute('src') || '';
    if (!src) { var s = v.querySelector('source[src]'); if (s) src = s.getAttribute('src'); }
    var m = String(src).match(/assets\/img\/(.+?)\.(?:mp4|webm)/);
    if (!m) return null;
    var key = m[1].replace(/\//g, '--');
    return ANIM.indexOf(key) >= 0 ? '/assets/img/anim/' + key + '.webp?v=' + V : null;
  }

  // Replace a refused video with its animated image, keeping classes and size so the layout is unchanged.
  function swap(v) {
    if (v.__cielSwapped || !v.parentNode) return false;
    var url = animFor(v);
    if (!url) return false;
    v.__cielSwapped = true;
    var img = document.createElement('img');
    img.className = (v.getAttribute('class') || '') + ' vfb';
    ['width', 'height', 'style'].forEach(function (a) { if (v.hasAttribute(a)) img.setAttribute(a, v.getAttribute(a)); });
    var label = v.getAttribute('aria-label');
    if (label) img.alt = label; else { img.alt = ''; img.setAttribute('aria-hidden', 'true'); }
    img.decoding = 'async';
    var poster = v.getAttribute('poster');
    if (poster) img.style.backgroundImage = 'url("' + poster + '")';
    img.style.backgroundSize = 'cover';
    img.src = url;
    try { v.pause(); } catch (e) { /* */ }
    v.parentNode.replaceChild(img, v);
    return true;
  }

  function refused(v) {
    if (swap(v)) return;
    if (waiting.indexOf(v) < 0) waiting.push(v);
    arm();
  }

  proto.play = function () {
    if (this.tagName !== 'VIDEO') return nativePlay.apply(this, arguments);
    prep(this);
    this.__cielWanted = true;
    var v = this, p;
    try { p = nativePlay.apply(this, arguments); } catch (e) { p = null; }
    if (p && typeof p.catch === 'function') {
      return p.catch(function (err) {
        if (err && err.name === 'NotAllowedError') refused(v);
        throw err; // callers that catch still see the rejection
      });
    }
    return p;
  };
  var nativePause = proto.pause;
  proto.pause = function () { if (this.tagName === 'VIDEO') this.__cielWanted = false; return nativePause.apply(this, arguments); };

  // Tap fallback for videos without an animated copy.
  function unlock() {
    ['touchend', 'click', 'keydown'].forEach(function (t) { document.removeEventListener(t, unlock, true); });
    armed = false;
    var list = waiting.splice(0);
    list.forEach(function (v) { if (v.isConnected && v.__cielWanted !== false) { var p = nativePlay.call(v); if (p && p.catch) p.catch(function () {}); } });
  }
  function arm() {
    if (armed) return;
    armed = true;
    ['touchend', 'click', 'keydown'].forEach(function (t) { document.addEventListener(t, unlock, { capture: true, passive: true }); });
  }

  // Videos that rely on the autoplay attribute: ask explicitly so a refusal is noticed.
  function sweep() {
    var vs = document.querySelectorAll('video');
    for (var i = 0; i < vs.length; i++) {
      var v = vs[i]; prep(v);
      if (v.hasAttribute('autoplay') && v.paused && !v.__cielSwapped) {
        var p = v.play(); if (p && p.catch) p.catch(function () { /* handled in play() */ });
      }
    }
  }

  function start() {
    sweep();
    if ('MutationObserver' in window) {
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
          var n = ms[i].addedNodes[j];
          if (n.nodeType !== 1) continue;
          if (n.tagName === 'VIDEO') prep(n);
          else if (n.querySelectorAll) { var vs = n.querySelectorAll('video'); for (var k = 0; k < vs.length; k++) prep(vs[k]); }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
    setTimeout(sweep, 1500);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) sweep(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
