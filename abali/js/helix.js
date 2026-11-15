/* ==========================================================================
   ABALI — the living helix in the opening scene.
   A translucent double helix of tissue-like particles, drawn with WebGL.
   Every particle is placed on the graphics card from a few fixed numbers,
   so the page does no per-frame work beyond one draw call. It assembles on
   load, drifts slowly, leans toward the pointer and dissolves as you scroll.
   Settings come from EB.config.hero.helix (colours, density, placement).
   ========================================================================== */
(function () {
  'use strict';

  var VS = [
    'precision highp float;',
    'attribute vec4 a;            // x: place along the helix, y: kind, z: place across a rung, w: random',
    'attribute vec3 b;            // a random offset (roughly normal)',
    'uniform float uT, uIntro, uScroll, uAsp, uScale, uDpr, uSize, uRot;',
    'uniform vec2 uOff, uTilt;',
    'uniform vec3 cDeep, cLeaf, cLight, cGlow;',
    'varying vec3 vC; varying float vA;',
    'vec3 flow(vec3 p, float t) {',
    '  return vec3(sin(p.y * 1.7 + t * 0.61 + p.z * 1.3) + 0.5 * sin(p.z * 3.1 - t * 0.37),',
    '              sin(p.z * 1.9 - t * 0.47 + p.x * 1.1) + 0.5 * sin(p.x * 2.7 + t * 0.29),',
    '              sin(p.x * 1.5 + t * 0.43 + p.y * 0.9) + 0.5 * sin(p.y * 2.3 - t * 0.33));',
    '}',
    'mat3 rx(float q) { float c = cos(q), s = sin(q); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }',
    'mat3 ry(float q) { float c = cos(q), s = sin(q); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }',
    'mat3 rz(float q) { float c = cos(q), s = sin(q); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }',
    'void main() {',
    '  float L = 7.6, s = (a.x - 0.5) * L, k = a.y;',
    '  float tw = s * 1.08 + uT * 0.16;',
    '  float R = 0.66 + 0.1 * sin(s * 0.63 + uT * 0.27);',
    '  vec3 pA = vec3(R * cos(tw), s, R * sin(tw));',
    '  vec3 pB = vec3(R * cos(tw + 3.14159), s, R * sin(tw + 3.14159));',
    '  vec3 p; float al; vec3 col;',
    '  float g = 0.5 + 0.5 * sin(s * 0.9 + a.w * 2.0 + uT * 0.2);',
    '  float th = 0.08 + 0.07 * (0.5 + 0.5 * sin(s * 2.3 + a.w * 0.0 + uT * 0.21)) + 0.04 * sin(s * 5.1);',
    '  if (k < 0.5) { p = pA + b * th; col = mix(cDeep, cLeaf, g); al = 0.85; }',
    '  else if (k < 1.5) { p = pB + b * th; col = mix(cLeaf, cDeep, g); al = 0.85; }',
    '  else if (k < 2.5) { p = mix(pA, pB, a.z) + b * 0.04; col = mix(cLeaf, cLight, 0.15 + 0.35 * a.w); al = 0.8; }',
    '  else if (k < 3.5) { p = vec3(cos(tw) * 0.2, s, sin(tw) * 0.2) + b * vec3(0.62, 0.2, 0.62); col = mix(cLight, cLeaf, 0.25 + 0.4 * a.w); al = 0.26; }',
    '  else if (k < 4.5) { p = mix(pA, pB, a.z) + b * 0.5; col = cGlow; al = 0.75; }',
    '  else { /* fibres: fine tendrils that grow out of the strands, like tissue under a microscope */',
    '    float sd = a.w * 173.0; vec3 dir = normalize(vec3(sin(sd * 1.7), cos(sd * 2.3) * 0.6, sin(sd * 3.1 + 1.0)));',
    '    vec3 base = mod(sd, 2.0) < 1.0 ? pA : pB; float tt = a.z;',
    '    vec3 bend = vec3(sin(sd * 5.3), cos(sd * 4.1), sin(sd * 6.7)) * 0.55;',
    '    p = base + dir * tt * (0.8 + 0.9 * fract(sd)) + bend * tt * tt + b * 0.018 * (1.0 + tt);',
    '    col = mix(cDeep, cLeaf, tt); al = 0.9 * (1.0 - tt * 0.55); }',
    '  p += flow(p * 1.25 + (k > 4.5 ? 0.0 : a.w * 6.0), uT * 0.55) * (k > 4.5 ? 0.06 : (k > 2.5 ? 0.14 : 0.045));',
    '  /* arriving: from a loose cloud into the helix */',
    '  float e = 1.0 - pow(1.0 - clamp(uIntro * 1.15 - a.w * 0.15, 0.0, 1.0), 3.0);',
    '  p = mix(p + b * 2.2 + flow(p * 0.6, 1.7) * 0.9, p, e);',
    '  /* leaving: it loosens and lifts as the page scrolls */',
    '  p += (b * 0.9 + vec3(0.0, 0.6, 0.0)) * uScroll * uScroll * 1.6;',
    '  p = rz(uRot) * rx(0.32 + uTilt.y * 0.12) * ry(uT * 0.05 + uTilt.x * 0.22) * p;',
    '  float cam = 6.2, f = 2.3 / (cam - p.z), persp = cam / (cam - p.z);',
    '  vec2 q = p.xy * f * uScale;',
    '  gl_Position = vec4(q.x / uAsp + uOff.x, q.y + uOff.y, 0.0, 1.0);',
    '  float depth = clamp((p.z + 1.6) / 3.2, 0.0, 1.0);',
    '  vC = mix(col, cLight, (1.0 - depth) * 0.35);',
    '  vA = al * (0.55 + 0.45 * depth) * e * (1.0 - uScroll * 0.65);',
    '  gl_PointSize = uSize * uDpr * persp * (k > 4.5 ? 1.15 : (k > 3.5 ? 2.0 : (k > 2.5 ? 1.3 : 1.0))) * (0.5 + a.w * 1.2) * uScale;',
    '}'].join('\n');
  var FS = [
    'precision mediump float;',
    'varying vec3 vC; varying float vA;',
    'void main() {',
    '  vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0;',
    '  float al = vA * exp(-r * 2.6) * step(r, 1.0);',
    '  gl_FragColor = vec4(vC * al, al);',
    '}'].join('\n');

  function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function Helix(canvas, o) {
    this.c = canvas; this.o = o || {};
    this.run = false; this.visible = true; this.intro = 0; this.scroll = 0; this.tilt = [0, 0]; this.want = [0, 0];
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  Helix.prototype.init = function () {
    var gl = this.c.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' }) || this.c.getContext('experimental-webgl');
    if (!gl) return false;
    this.gl = gl;
    var sh = function (t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr); this.pr = pr;
    /* the particles: two strands, the rungs between them, a soft sheath of haze and a few bright motes */
    var small = Math.min(window.innerWidth, window.innerHeight) < 700, dens = this.o.density || 1;
    var nS = Math.round((small ? 16000 : 30000) * dens), nR = Math.round((small ? 7000 : 13000) * dens), nH = Math.round((small ? 5000 : 10000) * dens), nG = Math.round((small ? 120 : 220) * dens), nF = small ? 90 : 170, fP = 70;
    var N = nS * 2 + nR + nH + nG + nF * fP, A = new Float32Array(N * 4), B = new Float32Array(N * 3), i = 0;
    var put = function (x, k, z, w) { A[i * 4] = x; A[i * 4 + 1] = k; A[i * 4 + 2] = z; A[i * 4 + 3] = w; B[i * 3] = gauss(); B[i * 3 + 1] = gauss(); B[i * 3 + 2] = gauss(); i++; };
    for (var s = 0; s < 2; s++) for (var j = 0; j < nS; j++) put(Math.random(), s, 0, Math.random());
    var rungs = 34;
    for (j = 0; j < nR; j++) { var r = Math.floor(Math.random() * rungs); put((r + 0.5) / rungs + (Math.random() - 0.5) * 0.006, 2, Math.random(), Math.random()); }
    for (j = 0; j < nH; j++) put(Math.random(), 3, 0, Math.random());
    for (j = 0; j < nG; j++) put(Math.random(), 4, Math.random(), Math.random());
    for (j = 0; j < nF; j++) { var fx = Math.random(), fs = Math.random(); for (var q = 0; q < fP; q++) put(fx, 5, Math.pow(Math.random(), 1.3), fs); }
    this.N = N;
    var buf = function (data, name, size) { var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); var l = gl.getAttribLocation(pr, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0); };
    buf(A, 'a', 4); buf(B, 'b', 3);
    var U = this.U = {}; ['uT', 'uIntro', 'uScroll', 'uAsp', 'uScale', 'uDpr', 'uSize', 'uRot', 'uOff', 'uTilt', 'cDeep', 'cLeaf', 'cLight', 'cGlow'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    var col = this.o.colors || {};
    gl.uniform3fv(U.cDeep, hex(col.deep || '#0B3F33')); gl.uniform3fv(U.cLeaf, hex(col.leaf || '#3F8F3E'));
    gl.uniform3fv(U.cLight, hex(col.light || '#8FC27F')); gl.uniform3fv(U.cGlow, hex(col.glow || '#E3F09A'));
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
    this.resize(); var self = this; window.addEventListener('resize', function () { self.resize(); });
    return true;
  };
  Helix.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, r.width < 700 ? 2 : 1.6);
    this.c.width = Math.max(1, Math.round(r.width * dpr)); this.c.height = Math.max(1, Math.round(r.height * dpr));
    this.dpr = dpr; this.w = r.width; this.h = r.height;
    if (this.gl) this.gl.viewport(0, 0, this.c.width, this.c.height);
    if (!this.run && this.gl) this.frame(this.lastT || 0);
  };
  /* where the helix sits: on wide screens to the right of the words, on phones above them */
  Helix.prototype.place = function () {
    var wide = this.w / this.h > 1.05, p = this.o.place || {};
    var c = wide ? (p.wide || { x: 0.42, y: 0.0, scale: 1.0, rot: -0.58 }) : (p.tall || { x: 0, y: 0.5, scale: 0.62, rot: -1.2 });
    c.wide = wide; return c;
  };
  Helix.prototype.frame = function (now) {
    var gl = this.gl, U = this.U; if (!gl) return;
    var t = (now || 0) / 1000; this.lastT = now;
    if (this.reduced) { this.intro = 1; t = 12; } else { if (this.t0 == null) this.t0 = now; this.intro = Math.min(1, (now - this.t0) / 2800); }   // assembles over 2.8 s, whatever the frame rate
    this.tilt[0] += (this.want[0] - this.tilt[0]) * 0.04; this.tilt[1] += (this.want[1] - this.tilt[1]) * 0.04;
    var pl = this.place(), sc = pl.wide ? pl.scale * Math.min(1.25, Math.max(0.62, this.h / 820)) : pl.scale;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uT, t); gl.uniform1f(U.uIntro, this.intro); gl.uniform1f(U.uScroll, this.scroll);
    gl.uniform1f(U.uAsp, this.w / this.h); gl.uniform1f(U.uScale, sc); gl.uniform1f(U.uRot, pl.rot == null ? -0.58 : pl.rot); gl.uniform1f(U.uDpr, this.dpr);
    gl.uniform1f(U.uSize, (this.o.size || 2.6) * (pl.wide ? (this.h / 820 < 0.8 ? 0.85 : 1) : 1.4));
    gl.uniform2f(U.uOff, pl.x, pl.y); gl.uniform2f(U.uTilt, this.tilt[0], this.tilt[1]);
    gl.drawArrays(gl.POINTS, 0, this.N);
  };
  Helix.prototype.start = function () {
    if (this.reduced) { this.frame(0); return; }
    if (this.run) return; this.run = true; var self = this;
    var loop = function (now) { if (!self.run) return; if (self.visible && !document.hidden) self.frame(now); self.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  };
  Helix.prototype.stop = function () { this.run = false; cancelAnimationFrame(this.raf); };
  Helix.prototype.pointer = function (x, y) { this.want = [x, y]; };

  window.AbaliHelix = Helix;
})();
