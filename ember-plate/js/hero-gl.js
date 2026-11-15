/* ==========================================================================
   EMBER & PLATE — the opening scene
   One WebGL pass over a photograph:
   - living fire on the first photo: heat haze and a flame flicker, limited to
     the bright, warm pixels inside the flame area set in the config;
   - smoke rolling up through the scene in two drifting layers, and a slow camera push.
   Sparks are drawn on a second 2D canvas. Noise comes from a small tileable
   texture made once at start, so the shader stays light on phones.
   ========================================================================== */
(function () {
  'use strict';
  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform sampler2D uA,uN;uniform vec2 uRes,uSA,uPA;uniform vec4 uFl;',
    'uniform float uT,uIn,uZA,uSm;varying vec2 v;',
    'float n1(vec2 q){return texture2D(uN,q).r;}',
    'float fb(vec2 q){return texture2D(uN,q).g;}',
    'vec2 cover(vec2 uv,vec2 im,vec2 pos,float z){float rs=uRes.x/uRes.y,ri=im.x/im.y;vec2 s=rs>ri?vec2(1.,ri/rs):vec2(rs/ri,1.);s/=z;return (1.-s)*pos+uv*s;}',
    'void main(){',
    ' vec2 uv=v;float t=uT;float asp=uRes.x/uRes.y;',
    ' vec2 a=cover(uv,uSA,uPA,uZA);',
    /* flame area mask in image space (uFl = left, bottom, right, top in texture coords) */
    ' float rg=smoothstep(uFl.x-.06,uFl.x+.06,a.x)*(1.-smoothstep(uFl.z-.06,uFl.z+.06,a.x))*smoothstep(uFl.y-.06,uFl.y+.08,a.y)*(1.-smoothstep(uFl.w-.08,uFl.w+.04,a.y));',
    ' vec2 d=vec2(0.);',
    ' if(rg>.001){float h1=fb(vec2(a.x*2.2,a.y*1.1-t*.22));float h2=fb(vec2(a.x*1.7+.37,a.y*.9-t*.3));d=vec2(h1-.5,h2-.5)*vec2(.0045,.006)*rg;}',
    ' vec3 ca=texture2D(uA,a+d).rgb;',
    ' if(rg>.001){float l=dot(ca,vec3(.299,.587,.114));float w=clamp((ca.r-ca.b)*1.7,0.,1.)*smoothstep(.3,.8,l);float f=fb(vec2(a.x*1.1,a.y*.6-t*.33));ca*=1.+w*rg*(f-.47)*.62;}',
    ' ca*=1.+.022*sin(t*1.7)+.012*sin(t*4.1+1.3);',
    ' vec3 c=ca;',
    /* smoke rolling up through the scene: two layers drifting at different speeds, thinner near the top */
    ' vec2 q=vec2(uv.x*asp,uv.y);',
    ' float s1=smoothstep(.46,.9,fb(q*.5+vec2(t*.008,-t*.03)));',
    ' float s2=smoothstep(.52,.95,fb(q*1.15+vec2(-t*.013,-t*.05)+s1*.25));',
    ' float band=smoothstep(.02,.4,uv.y)*(1.-.45*smoothstep(.65,1.,uv.y));',
    ' vec3 sc=vec3(.44,.40,.36)*(.8+.4*fb(q*2.6+vec2(-t*.02,-t*.06)));',
    ' c=mix(c,sc,clamp((s1*.17+s2*.11)*band*uSm,0.,.42));',
    ' float vg=smoothstep(1.3,.25,length((uv-.5)*vec2(1.25,1.)));c*=mix(1.,vg,.6);',
    ' c*=uIn;',
    ' gl_FragColor=vec4(c,1.);',
    '}'].join('\n');

  /* tileable value noise: R = single octave, G = 5-octave fbm */
  function noiseTex(N) {
    var g = new Float32Array(N * N), out = new Uint8Array(N * N * 4), i, x, y;
    function grid(P) { var a = new Float32Array(P * P); for (i = 0; i < P * P; i++) a[i] = Math.random(); return a; }
    function sample(gr, P, u, w) {
      var fx = u * P, fy = w * P, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      var x1 = (x0 + 1) % P, y1 = (y0 + 1) % P; x0 %= P; y0 %= P;
      var a = gr[y0 * P + x0], b = gr[y0 * P + x1], c = gr[y1 * P + x0], d = gr[y1 * P + x1];
      return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
    }
    var octs = [8, 16, 32, 64, 128].map(function (P) { return { P: P, g: grid(P) }; });
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      var u = x / N, w = y / N, f = 0, amp = .5, tot = 0;
      for (var o = 0; o < octs.length; o++) { f += sample(octs[o].g, octs[o].P, u, w) * amp; tot += amp; amp *= .5; }
      var k = (y * N + x) * 4;
      out[k] = Math.round(sample(octs[1].g, octs[1].P, u, w) * 255);
      out[k + 1] = Math.round(Math.min(1, Math.max(0, (f / tot - .5) * 1.5 + .5)) * 255);
      out[k + 2] = 0; out[k + 3] = 255;
    }
    return out;
  }

  function load(src) { return new Promise(function (res, rej) { var im = new Image(); im.decoding = 'async'; im.onload = function () { res(im); }; im.onerror = rej; im.src = src; }); }

  function Hero(canvas, sparks, o) {
    this.c = canvas; this.sc = sparks; this.o = o; this.intro = 0; this.zoomA = 1;
    this.run = false; this.visible = true; this.t0 = performance.now(); this.parts = [];
  }
  Hero.prototype.init = function () {
    var self = this, o = this.o, gl = this.c.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return Promise.reject(new Error('no webgl'));
    this.gl = gl;
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return Promise.reject(new Error('link'));
    gl.useProgram(pr); this.pr = pr;
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {}; ['uA', 'uN', 'uRes', 'uSA', 'uPA', 'uFl', 'uT', 'uIn', 'uZA', 'uSm'].forEach(function (n) { self.u[n] = gl.getUniformLocation(pr, n); });
    var tex = function (unit, src, w, h, data, repeat) {
      var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !data);
      if (data) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data); else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      var wr = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
      return t;
    };
    tex(2, null, 256, 256, noiseTex(256), true);
    gl.uniform1i(this.u.uN, 2); gl.uniform1i(this.u.uA, 0);
    return load(o.a).then(function (im) {
      tex(0, im); self.sizeA = [im.naturalWidth, im.naturalHeight];
      self.resize(); return self;
    });
  };
  Hero.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), small = r.width < 760, cap = small ? 2 : 1.75, dpr = Math.min(window.devicePixelRatio || 1, cap);
    var maxPx = small ? 2.2e6 : 4.2e6; if (r.width * r.height * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (r.width * r.height));
    this.w = Math.max(2, Math.round(r.width * dpr)); this.h = Math.max(2, Math.round(r.height * dpr)); this.dpr = dpr; this.cw = r.width; this.ch = r.height;
    this.c.width = this.w; this.c.height = this.h;
    if (this.sc) { var sd = Math.min(window.devicePixelRatio || 1, 2); this.sc.width = Math.round(r.width * sd); this.sc.height = Math.round(r.height * sd); this.sd = sd; }
    this.portrait = window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches || r.width / r.height < .7;
    if (this.gl) this.gl.viewport(0, 0, this.w, this.h);
  };
  Hero.prototype.pos = function (which) {
    var p = (this.portrait ? this.o[which].portrait : this.o[which].wide) || '50% 50%', a = p.split(' ').map(parseFloat);
    return [a[0] / 100, 1 - a[1] / 100];
  };
  /* where a point of photo A (fractions, top-left origin) lands on screen, in CSS px */
  Hero.prototype.toScreen = function (fx, fy) {
    var im = this.sizeA, rs = this.cw / this.ch, ri = im[0] / im[1], sx, sy;
    if (rs > ri) { sx = 1; sy = ri / rs; } else { sx = rs / ri; sy = 1; }
    sx /= this.zoomA; sy /= this.zoomA;
    var pa = this.pos('posA'), ox = (1 - sx) * pa[0], oy = (1 - sy) * pa[1];
    var u = (fx - ox) / sx, vv = ((1 - fy) - oy) / sy;
    return [u * this.cw, (1 - vv) * this.ch];
  };
  Hero.prototype.frame = function (now) {
    var gl = this.gl, u = this.u, t = (now - this.t0) / 1000, fl = this.o.flames;
    this.zoomA = (this.portrait ? (this.o.zoomPortrait || 1) : (this.o.zoom || 1)) + .05 * Math.min(1, t / 9);
    gl.uniform2f(u.uRes, this.w, this.h); gl.uniform2f(u.uSA, this.sizeA[0], this.sizeA[1]);
    var pa = this.pos('posA'); gl.uniform2f(u.uPA, pa[0], pa[1]);
    gl.uniform4f(u.uFl, fl[0], 1 - fl[3], fl[2], 1 - fl[1]);
    gl.uniform1f(u.uT, t); gl.uniform1f(u.uIn, this.intro); gl.uniform1f(u.uZA, this.zoomA); gl.uniform1f(u.uSm, this.o.smoke == null ? 1 : this.o.smoke);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.sparks(t);
  };
  Hero.prototype.sparks = function (t) {
    if (!this.sc) return;
    var x = this.sc.getContext('2d'), sd = this.sd, W = this.sc.width, H = this.sc.height, fl = this.o.flames, self = this;
    var dt = Math.min(.05, t - (this.lt || t)); this.lt = t;
    x.clearRect(0, 0, W, H);
    var fade = this.intro;
    if (fade <= 0) { this.parts.length = 0; return; }
    var max = this.cw < 760 ? 22 : 40;
    while (this.parts.length < max) {
      var fx = fl[0] + Math.random() * (fl[2] - fl[0]), fy = fl[1] + (fl[3] - fl[1]) * (.35 + Math.random() * .65);
      this.parts.push({ fx: fx, fy: fy, age: -Math.random() * 3, life: 1.4 + Math.random() * 2.2, vy: 30 + Math.random() * 70, sway: .6 + Math.random() * 1.6, ph: Math.random() * 6.3, r: .6 + Math.random() * 1.5, dx: 0, dy: 0 });
    }
    x.globalCompositeOperation = 'lighter';
    this.parts.forEach(function (p, i) {
      p.age += dt; if (p.age < 0) return;
      if (p.age > p.life) { self.parts.splice(i, 1); return; }
      p.dy -= p.vy * dt; p.dx += Math.sin(p.age * p.sway * 3 + p.ph) * 12 * dt;
      var s = self.toScreen(p.fx, p.fy), px = (s[0] + p.dx) * sd, py = (s[1] + p.dy) * sd;
      var k = p.age / p.life, a = (k < .15 ? k / .15 : 1 - (k - .15) / .85) * fade, r = p.r * sd * (1 - k * .5);
      var g = x.createRadialGradient(px, py, 0, px, py, r * 4);
      g.addColorStop(0, 'rgba(255,214,150,' + (a * .95).toFixed(3) + ')'); g.addColorStop(.35, 'rgba(255,140,50,' + (a * .45).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,90,20,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, r * 4, 0, 6.283); x.fill();
    });
    x.globalCompositeOperation = 'source-over';
  };
  Hero.prototype.start = function () {
    if (this.run) return; this.run = true; var self = this;
    var loop = function (now) { if (!self.run) return; if (self.visible && !document.hidden) self.frame(now); self.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  };
  Hero.prototype.stop = function () { this.run = false; cancelAnimationFrame(this.raf); };

  window.EP = window.EP || {};
  EP.HeroGL = Hero;
})();
